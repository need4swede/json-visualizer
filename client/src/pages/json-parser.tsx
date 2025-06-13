import { useState, useRef, useCallback, useEffect } from "react";
import { 
  Upload, 
  Download, 
  Copy, 
  Trash2, 
  Code, 
  TreePine, 
  Search, 
  Sun, 
  Moon,
  Check,
  X,
  AlertCircle,
  FileCode,
  Activity,
  Maximize2,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { JsonTree } from "@/components/json-tree";
import { JsonRenderer } from "@/components/json-renderer";
import { 
  validateJson, 
  formatJson, 
  calculateStats, 
  downloadJson, 
  copyToClipboard,
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useTheme();
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

  const handleFullscreen = () => {
    if (!parsedData) return;
    
    // Store JSON data in sessionStorage for the fullscreen view
    sessionStorage.setItem('fullscreen-json-data', JSON.stringify(parsedData));
    
    // Open fullscreen view in new tab
    const fullscreenUrl = `${window.location.origin}/fullscreen`;
    window.open(fullscreenUrl, '_blank');
    
    toast({
      title: "Opened in new tab",
      description: "JSON is now displayed in full-screen mode",
    });
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
      {/* Header */}
      <header className="glass-panel sticky top-0 z-50 border-b border-white/20 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FileCode className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">JSON Parser</h1>
                <p className="text-sm text-muted-foreground">Beautiful JSON visualization</p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="glass-button rounded-full"
            >
              {theme === "light" ? 
                <Moon className="w-5 h-5" /> : 
                <Sun className="w-5 h-5" />
              }
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 min-h-[calc(100vh-200px)]">
          {/* JSON Input Panel */}
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
            
            <div className="space-y-4 h-full">
              <div 
                className="relative h-80"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <Textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Enter your JSON here or upload a file..."
                  className="w-full h-full p-4 bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-white/30 dark:border-white/10 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 custom-scrollbar font-mono text-sm"
                />
                
                {isDragOver && (
                  <div className="absolute inset-0 border-2 border-dashed border-blue-500/50 rounded-xl bg-blue-500/5 flex items-center justify-center">
                    <div className="text-center">
                      <Upload className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                      <p className="text-blue-500 font-medium">Drop JSON file here</p>
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
                    Upload
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

          {/* JSON Output Panel */}
          <div className="glass-panel rounded-2xl p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-foreground">JSON Output</h2>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode("rendered")}
                    className={cn(
                      "glass-button",
                      viewMode === "rendered" ? "text-purple-600 dark:text-purple-400 border-purple-500/30" : ""
                    )}
                  >
                    <FileCode className="w-4 h-4 mr-2" />
                    Rendered
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode("tree")}
                    className={cn(
                      "glass-button",
                      viewMode === "tree" ? "text-purple-600 dark:text-purple-400 border-purple-500/30" : ""
                    )}
                  >
                    <TreePine className="w-4 h-4 mr-2" />
                    Tree
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode("raw")}
                    className={cn(
                      "glass-button",
                      viewMode === "raw" ? "text-purple-600 dark:text-purple-400 border-purple-500/30" : ""
                    )}
                  >
                    <Code className="w-4 h-4 mr-2" />
                    Raw
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-32 pl-9 bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-white/30 dark:border-white/10 focus:w-48 transition-all duration-300"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFullscreen}
                  className="glass-button text-purple-600 dark:text-purple-400"
                  disabled={!parsedData}
                  title="Open in full-screen"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="glass-button"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="glass-button"
                  disabled={!parsedData}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="h-96 overflow-auto custom-scrollbar bg-white/30 dark:bg-black/10 backdrop-blur-sm rounded-xl border border-white/20 dark:border-white/10">
              {viewMode === "rendered" ? (
                <JsonRenderer 
                  data={parsedData} 
                  searchQuery={searchQuery}
                />
              ) : viewMode === "tree" ? (
                <div className="p-4">
                  <JsonTree 
                    data={parsedData} 
                    searchQuery={searchQuery}
                    onNodeClick={(path, value) => {
                      console.log("Clicked:", path, value);
                    }}
                  />
                </div>
              ) : (
                <div className="p-4 font-mono text-sm">
                  {parsedData ? (
                    <pre className="text-foreground whitespace-pre-wrap">
                      <code dangerouslySetInnerHTML={{
                        __html: formatJson(parsedData)
                          .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
                          .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
                          .replace(/: (\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
                          .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
                          .replace(/: null/g, ': <span class="json-null">null</span>')
                      }} />
                    </pre>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No JSON data to display
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-8">
          <div className="glass-panel rounded-2xl p-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse-gentle"></div>
                  <span>Ready</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Activity className="w-4 h-4" />
                  <span>Lines: {stats.lines}</span>
                </div>
                <div>Size: {stats.size} bytes</div>
                <div>Objects: {stats.objects}</div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <kbd className="px-2 py-1 bg-white/20 dark:bg-black/20 rounded text-xs">⌘</kbd>
                  <kbd className="px-2 py-1 bg-white/20 dark:bg-black/20 rounded text-xs">F</kbd>
                  <span>Format</span>
                </div>
                <div className="flex items-center space-x-1">
                  <kbd className="px-2 py-1 bg-white/20 dark:bg-black/20 rounded text-xs">⌘</kbd>
                  <kbd className="px-2 py-1 bg-white/20 dark:bg-black/20 rounded text-xs">C</kbd>
                  <span>Copy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
