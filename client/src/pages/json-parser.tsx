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
  Share2,
  Shield,
  Info
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
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

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
      const result = await storeJsonData(parsedData, parseInt(expirationHours));

      // Extract ID and key from result
      const { id, key } = result;
      
      // Create shareable URL with encryption key in fragment
      const shareableUrl = `${window.location.origin}/${id}#key=${key}`;

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
      console.log('=== SHARE BUTTON CLICKED ===');
      console.log('Starting encryption process...');
      
      // Use the original encryption system
      const { storeJsonData } = await import("@/lib/json-utils");
      console.log('Imported storeJsonData function');
      
      const result = await storeJsonData(parsedData, 48);
      console.log('Encryption result:', result);
      console.log('Result type:', typeof result);
      console.log('Result keys:', Object.keys(result || {}));
      
      if (!result || !result.id || !result.key) {
        throw new Error('Invalid encryption result');
      }

      const shareableUrl = `${window.location.origin}/${result.id}#key=${result.key}`;
      console.log('Generated URL:', shareableUrl);
      console.log('URL length:', shareableUrl.length);
      
      await navigator.clipboard.writeText(shareableUrl);
      console.log('URL copied to clipboard successfully');
      
      toast({
        title: "URL copied to clipboard!",
        description: "Encrypted shareable URL created (expires in 48 hours)",
      });
      
    } catch (error) {
      console.error('Share error:', error);
      // Fallback to sessionStorage
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

        {/* Footer Links */}
        <div className="max-w-4xl mx-auto mt-6">
          <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
            <Dialog open={isAboutModalOpen} onOpenChange={setIsAboutModalOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Info className="w-4 h-4 mr-2" />
                  About
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Info className="w-5 h-5 text-blue-500" />
                    <span>About JSON Parser</span>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <p>
                    A sophisticated JSON visualization and security platform that transforms complex data structures into an intuitive, interactive web interface with advanced debugging and dynamic navigation capabilities.
                  </p>
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div>
                      <h4 className="font-semibold mb-2">Key Features</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Real-time JSON validation</li>
                        <li>• Interactive data visualization</li>
                        <li>• Secure encrypted sharing</li>
                        <li>• Advanced search capabilities</li>
                        <li>• Keyboard shortcuts</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Technology</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• React.js with TypeScript</li>
                        <li>• Web Crypto API encryption</li>
                        <li>• Tailwind CSS styling</li>
                        <li>• Framer Motion animations</li>
                        <li>• Zero-knowledge architecture</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <div className="w-px h-4 bg-border"></div>

            <Dialog open={isSecurityModalOpen} onOpenChange={setIsSecurityModalOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Security
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-green-500" />
                    <span>Security & Privacy</span>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 text-sm">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Shield className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-green-800 dark:text-green-200">Zero-Knowledge Architecture</span>
                    </div>
                    <p className="text-green-700 dark:text-green-300">
                      Your data is encrypted on your device before being sent to our servers. We never see your unencrypted data.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2 flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>Client-Side Encryption</span>
                        </h3>
                        <ul className="space-y-1 text-muted-foreground ml-4">
                          <li>• AES-256-GCM encryption standard</li>
                          <li>• Keys generated in your browser</li>
                          <li>• Encryption happens before transmission</li>
                          <li>• Keys stored in URL fragments (never sent to server)</li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2 flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span>Content Security</span>
                        </h3>
                        <ul className="space-y-1 text-muted-foreground ml-4">
                          <li>• Automatic malicious content filtering</li>
                          <li>• XSS attack prevention</li>
                          <li>• Script injection blocking</li>
                          <li>• Safe URL validation</li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2 flex items-center space-x-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span>Data Expiration</span>
                        </h3>
                        <ul className="space-y-1 text-muted-foreground ml-4">
                          <li>• Automatic data deletion</li>
                          <li>• Configurable expiration (24h - 7 days)</li>
                          <li>• No permanent storage</li>
                          <li>• Regular cleanup processes</li>
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2 flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span>Server Security</span>
                        </h3>
                        <ul className="space-y-1 text-muted-foreground ml-4">
                          <li>• HTTPS-only connections</li>
                          <li>• Strict security headers</li>
                          <li>• Content Security Policy</li>
                          <li>• Anti-clickjacking protection</li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2 flex items-center space-x-2">
                          <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                          <span>Privacy Protection</span>
                        </h3>
                        <ul className="space-y-1 text-muted-foreground ml-4">
                          <li>• No user tracking or analytics</li>
                          <li>• No data collection or profiling</li>
                          <li>• No third-party integrations</li>
                          <li>• Minimal server logging</li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2 flex items-center space-x-2">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                          <span>Audit & Monitoring</span>
                        </h3>
                        <ul className="space-y-1 text-muted-foreground ml-4">
                          <li>• Security event logging</li>
                          <li>• Threat pattern detection</li>
                          <li>• Automated vulnerability scanning</li>
                          <li>• Regular security assessments</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">How Encryption Works</h3>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <ol className="space-y-2 text-muted-foreground">
                        <li><strong>1.</strong> Your JSON data is encrypted using AES-256-GCM in your browser</li>
                        <li><strong>2.</strong> Only the encrypted payload is sent to our servers</li>
                        <li><strong>3.</strong> The decryption key stays in your URL fragment (#key=...)</li>
                        <li><strong>4.</strong> URL fragments are never transmitted to servers</li>
                        <li><strong>5.</strong> Data is decrypted in the recipient's browser</li>
                        <li><strong>6.</strong> Encrypted data expires and is automatically deleted</li>
                      </ol>
                    </div>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                      <div>
                        <span className="font-semibold text-amber-800 dark:text-amber-200">Important Security Note</span>
                        <p className="text-amber-700 dark:text-amber-300 mt-1">
                          While we implement industry-standard security measures, please avoid sharing extremely sensitive data. 
                          Always verify the recipient before sharing encrypted URLs.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
