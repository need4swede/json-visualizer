import { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload,
  Download,
  Copy,
  Trash2,
  Code,
  TreePine,
  Search,
  Check,
  X,
  AlertCircle,
  FileCode,
  Activity,
  Maximize2,
  ExternalLink,
  Clock,
  Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import { useToast } from "@/hooks/use-toast";
import { JsonTree } from "@/components/json-tree";
import { JsonRenderer } from "@/components/json-renderer";
import {
  validateJson,
  formatJson,
  calculateStats,
  downloadJson,
  copyToClipboard,
  encodeJsonForUrl,
  type JsonStats
} from "@/lib/json-utils";
import { cn } from "@/lib/utils";

type ViewMode = "rendered" | "tree" | "raw";

export default function JsonParser() {
  const [jsonInput, setJsonInput] = useState("");
  const [parsedData, setParsedData] = useState<any>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("rendered");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<JsonStats>({ lines: 0, size: 0, objects: 0 });
  const [isDragOver, setIsDragOver] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [expirationHours, setExpirationHours] = useState("24");
  const [isSharing, setIsSharing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateAndParse = useCallback((input: string) => {
    const result = validateJson(input);

    if (result.isValid) {
      setParsedData(result.data);
      setIsValid(true);
      setErrorMessage("");

      const newStats = calculateStats(input, result.data);
      setStats(newStats);
    } else {
      setParsedData(null);
      setIsValid(false);
      setErrorMessage(result.error || "Invalid JSON");
      setStats({ lines: 0, size: 0, objects: 0 });
    }
  }, []);

  useEffect(() => {
    if (jsonInput.trim()) {
      validateAndParse(jsonInput);
    } else {
      setParsedData(null);
      setIsValid(null);
      setErrorMessage("");
      setStats({ lines: 0, size: 0, objects: 0 });
    }
  }, [jsonInput, validateAndParse]);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonInput(content);
      toast({
        title: "File uploaded successfully",
        description: `Loaded ${file.name}`,
      });
    };
    reader.onerror = () => {
      toast({
        title: "Upload failed",
        description: "Could not read the file",
        variant: "destructive",
      });
    };
    reader.readAsText(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const jsonFile = files.find(file =>
      file.type === "application/json" || file.name.endsWith(".json")
    );

    if (jsonFile) {
      handleFileUpload(jsonFile);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a JSON file",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleClear = () => {
    setJsonInput("");
    toast({
      title: "Input cleared",
      description: "JSON input has been cleared",
    });
  };

  const handleFormat = () => {
    if (parsedData) {
      try {
        const formatted = formatJson(parsedData);
        setJsonInput(formatted);
        toast({
          title: "JSON formatted",
          description: "Your JSON has been formatted",
        });
      } catch (error) {
        toast({
          title: "Format failed",
          description: "Could not format the JSON",
          variant: "destructive",
        });
      }
    }
  };

  const handleCopy = async () => {
    try {
      const textToCopy = (viewMode === "raw" || viewMode === "rendered") && parsedData
        ? formatJson(parsedData)
        : jsonInput;

      await copyToClipboard(textToCopy);
      toast({
        title: "Copied to clipboard",
        description: "JSON has been copied to your clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (parsedData) {
      downloadJson(parsedData);
      toast({
        title: "File downloaded",
        description: "JSON file has been downloaded",
      });
    }
  };

  const handleShare = async () => {
    if (!parsedData) return;

    setIsSharing(true);

    try {
      // Use storeJsonData with expiration
      const { storeJsonData } = await import("@/lib/json-utils");
      const shortId = await storeJsonData(parsedData, parseInt(expirationHours));

      // Create shareable URL with short ID
      const shareableUrl = `${window.location.origin}/${shortId}`;

      // Copy URL to clipboard
      await copyToClipboard(shareableUrl);

      // Open in new tab
      window.open(shareableUrl, '_blank');

      const expirationText = expirationHours === "24" ? "24 hours" :
                           expirationHours === "48" ? "48 hours" :
                           expirationHours === "168" ? "7 days" : `${expirationHours} hours`;

      toast({
        title: "Shareable link created",
        description: `URL copied to clipboard. Expires in ${expirationText}.`,
      });

      setIsShareDialogOpen(false);
    } catch (error) {
      console.error('Error creating shareable link:', error);

      // Fallback to sessionStorage for very large JSON
      sessionStorage.setItem('fullscreen-json-data', JSON.stringify(parsedData));
      const fullscreenUrl = `${window.location.origin}/fullscreen`;
      window.open(fullscreenUrl, '_blank');

      toast({
        title: "Opened in new tab",
        description: "JSON is now displayed in full-screen mode (local storage fallback)",
      });

      setIsShareDialogOpen(false);
    } finally {
      setIsSharing(false);
    }
  };

  const handleQuickShare = async () => {
    if (!parsedData) return;

    try {
      // Quick share with client-side encryption and 48-hour expiration
      const { storeJsonData, createShareableUrl } = await import("@/lib/json-utils");
      const { id, key } = await storeJsonData(parsedData, 48);

      // Create shareable URL with encryption key in fragment
      const shareableUrl = createShareableUrl(id, key);
      window.open(shareableUrl, '_blank');

      toast({
        title: "Opened in new tab",
        description: `Encrypted shareable URL created (expires in 48 hours)`,
      });
    } catch (error) {
      // Fallback to sessionStorage for very large JSON
      sessionStorage.setItem('fullscreen-json-data', JSON.stringify(parsedData));
      const fullscreenUrl = `${window.location.origin}/fullscreen`;
      window.open(fullscreenUrl, '_blank');

      toast({
        title: "Opened in new tab",
        description: "JSON is now displayed in full-screen mode",
      });
    }
  };

  const getValidationIcon = () => {
    if (isValid === null) {
      return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
    return isValid ?
      <Check className="w-4 h-4 text-green-500" /> :
      <X className="w-4 h-4 text-red-500" />;
  };

  const getValidationStatus = () => {
    if (isValid === null) return "Enter JSON to validate";
    return isValid ? "Valid JSON" : errorMessage;
  };

  const getValidationColor = () => {
    if (isValid === null) return "text-muted-foreground";
    return isValid ? "text-green-500" : "text-red-500";
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'f':
          case 'F':
            e.preventDefault();
            handleFormat();
            break;
          case 'c':
          case 'C':
            if (document.activeElement?.tagName !== 'TEXTAREA') {
              e.preventDefault();
              handleCopy();
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [parsedData, jsonInput, viewMode]);

  return (
    <div className="min-h-screen">
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* JSON Input Panel - Full Width */}
        <div className="max-w-4xl mx-auto mt-8">
          <div className="glass-panel rounded-2xl p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">JSON Input</h2>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="glass-button"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFormat}
                  className="glass-button text-purple-600 dark:text-purple-400"
                  disabled={!parsedData}
                >
                  <Code className="w-4 h-4 mr-2" />
                  Format
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div
                className="relative h-96"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <Textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Enter your JSON here or upload a file..."
                  className="w-full h-full p-4 bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-white/30 dark:border-white/10 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 custom-scrollbar font-mono text-sm"
                />

                {isDragOver && (
                  <div className="absolute inset-0 border-2 border-dashed border-purple-500/50 rounded-xl bg-purple-500/5 flex items-center justify-center">
                    <div className="text-center">
                      <Upload className="w-12 h-12 text-purple-500 mx-auto mb-2" />
                      <p className="text-purple-500 font-medium">Drop JSON file here</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="glass-button"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  {getValidationIcon()}
                  <span className={cn("text-sm", getValidationColor())}>
                    {getValidationStatus()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Action Bar with Stats - appears when JSON is valid */}
        {isValid && parsedData && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-expand-horizontal">
            <div className="glass-panel px-6 py-4 shadow-2xl border border-white/20 dark:border-white/10 min-w-[1200px]" style={{borderRadius: '10rem'}}>
              <div className="flex items-center justify-between space-x-6">
                {/* Left Section - Status and Stats */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse-gentle"></div>
                    <span className="text-green-400 font-medium">Valid JSON</span>
                  </div>

                  <div className="w-px h-5 bg-white/20 dark:bg-white/10"></div>

                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Activity className="w-4 h-4" />
                      <span>Lines: {stats.lines}</span>
                    </div>
                    <div>Size: {stats.size}b</div>
                    <div>Objects: {stats.objects}</div>
                  </div>

                  <div className="w-px h-5 bg-white/20 dark:bg-white/10"></div>

                  <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <kbd className="px-1.5 py-0.5 bg-black/20 rounded text-xs">⌘</kbd>
                      <kbd className="px-1.5 py-0.5 bg-black/20 rounded text-xs">F</kbd>
                      <span>Format</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <kbd className="px-1.5 py-0.5 bg-black/20 rounded text-xs">⌘</kbd>
                      <kbd className="px-1.5 py-0.5 bg-black/20 rounded text-xs">C</kbd>
                      <span>Copy</span>
                    </div>
                  </div>
                </div>

                {/* Right Section - Actions */}
                <div className="flex items-center space-x-2">
                  <Select value={expirationHours} onValueChange={setExpirationHours}>
                    <SelectTrigger className="w-32 h-8 text-xs glass-button border-white/20 dark:border-white/10" style={{borderRadius: '10rem'}}>
                      <Clock className="w-3 h-3 mr-1" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">24 hours</SelectItem>
                      <SelectItem value="48">48 hours</SelectItem>
                      <SelectItem value="168">7 days</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    className="glass-button text-purple-600 dark:text-purple-400 hover:scale-105 transition-transform"
                    style={{borderRadius: '10rem'}}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Rendered JSON
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="glass-button hover:scale-105 transition-transform"
                    style={{borderRadius: '10rem'}}
                    title="Copy JSON (⌘C)"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownload}
                    className="glass-button hover:scale-105 transition-transform"
                    style={{borderRadius: '10rem'}}
                    title="Download JSON"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
