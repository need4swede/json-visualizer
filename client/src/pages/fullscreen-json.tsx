import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { JsonRenderer } from "@/components/json-renderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Download, Search, X, FileCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard, downloadJson, formatJson } from "@/lib/json-utils";
import { cn } from "@/lib/utils";

export default function FullscreenJson() {
  const [, setLocation] = useLocation();
  const [jsonData, setJsonData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // Get JSON data from URL hash or sessionStorage
    const hash = window.location.hash.substring(1);
    if (hash) {
      try {
        const decodedData = decodeURIComponent(hash);
        const parsedData = JSON.parse(decodedData);
        setJsonData(parsedData);
      } catch (error) {
        console.error("Failed to parse JSON from URL:", error);
      }
    } else {
      // Try to get from sessionStorage as fallback
      const storedData = sessionStorage.getItem('fullscreen-json-data');
      if (storedData) {
        try {
          setJsonData(JSON.parse(storedData));
        } catch (error) {
          console.error("Failed to parse JSON from storage:", error);
        }
      }
    }
  }, []);

  const handleCopy = async () => {
    if (!jsonData) return;
    
    try {
      const textToCopy = formatJson(jsonData);
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
    if (!jsonData) return;
    
    downloadJson(jsonData, 'rendered-json.json');
    toast({
      title: "File downloaded",
      description: "JSON file has been downloaded",
    });
  };

  const handleClose = () => {
    // Clean up and go back
    sessionStorage.removeItem('fullscreen-json-data');
    setLocation('/');
  };

  if (!jsonData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FileCode className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-foreground mb-2">No JSON Data Found</h1>
          <p className="text-muted-foreground mb-6">Unable to load JSON data for rendering</p>
          <Button onClick={handleClose} variant="outline">
            Return to Parser
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="glass-panel sticky top-0 z-50 border-b border-white/20 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center">
                <FileCode className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Rendered JSON</h1>
                <p className="text-sm text-muted-foreground">Full-screen view</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-64 pl-9 bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-white/30 dark:border-white/10"
                />
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="glass-button"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="glass-button"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="glass-button rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="glass-panel rounded-2xl overflow-hidden animate-fade-in">
          <div className="h-[calc(100vh-200px)] overflow-auto custom-scrollbar">
            <JsonRenderer 
              data={jsonData} 
              searchQuery={searchQuery}
            />
          </div>
        </div>
      </main>
    </div>
  );
}