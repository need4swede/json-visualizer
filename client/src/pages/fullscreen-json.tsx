import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { WebPageRenderer } from "@/components/web-page-renderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Download, Search, X, FileCode, ChevronDown, Hash, List, User, Building2, Mail, MapPin, Navigation, ArrowUp, ChevronRight, Menu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard, downloadJson, formatJson } from "@/lib/json-utils";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function FullscreenJson() {
  const [, setLocation] = useLocation();
  const [jsonData, setJsonData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const { toast } = useToast();

  // Extract navigation structure from JSON data
  const getNavigationStructure = (data: any, path: string = ""): any[] => {
    if (!data || typeof data !== 'object') return [];
    
    const items: any[] = [];
    
    if (Array.isArray(data)) {
      items.push({
        label: `Items (${data.length})`,
        path: path,
        type: 'array',
        icon: <List className="w-4 h-4" />
      });
      data.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          const subPath = `${path}[${index}]`;
          items.push({
            label: `Item ${index + 1}`,
            path: subPath,
            type: 'object',
            icon: <Hash className="w-4 h-4" />,
            children: getNavigationStructure(item, subPath)
          });
        }
      });
    } else {
      Object.entries(data).forEach(([key, value]) => {
        const subPath = path ? `${path}.${key}` : key;
        const lowerKey = key.toLowerCase();
        
        let icon = <Hash className="w-4 h-4" />;
        if (lowerKey.includes('user') || lowerKey.includes('person')) {
          icon = <User className="w-4 h-4" />;
        } else if (lowerKey.includes('company') || lowerKey.includes('organization')) {
          icon = <Building2 className="w-4 h-4" />;
        } else if (lowerKey.includes('contact') || lowerKey.includes('email')) {
          icon = <Mail className="w-4 h-4" />;
        } else if (lowerKey.includes('address') || lowerKey.includes('location')) {
          icon = <MapPin className="w-4 h-4" />;
        }
        
        items.push({
          label: key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          path: subPath,
          type: typeof value === 'object' ? (Array.isArray(value) ? 'array' : 'object') : 'primitive',
          icon,
          children: typeof value === 'object' ? getNavigationStructure(value, subPath) : []
        });
      });
    }
    
    return items;
  };

  const navigationItems = jsonData ? getNavigationStructure(jsonData) : [];

  const scrollToSection = (path: string) => {
    const element = document.getElementById(`section-${path.replace(/[\[\]\.]/g, '-')}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Highlight the section briefly
      element.style.backgroundColor = 'rgba(147, 51, 234, 0.1)';
      setTimeout(() => {
        element.style.backgroundColor = '';
      }, 1000);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get complete navigation structure recursively
  const getCompleteNavStructure = (data: any, path: string = "", level: number = 0): any[] => {
    if (!data || typeof data !== 'object') return [];
    
    const sections: any[] = [];
    
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          const itemPath = path ? `${path}[${index}]` : `[${index}]`;
          sections.push({
            label: `Item ${index + 1}`,
            path: itemPath,
            icon: <Hash className="w-4 h-4" />,
            level,
            children: getCompleteNavStructure(item, itemPath, level + 1)
          });
        }
      });
    } else {
      Object.entries(data).forEach(([key, value]) => {
        const fieldPath = path ? `${path}.${key}` : key;
        const lowerKey = key.toLowerCase();
        
        let icon = <Hash className="w-4 h-4" />;
        if (lowerKey.includes('user') || lowerKey.includes('person')) {
          icon = <User className="w-4 h-4" />;
        } else if (lowerKey.includes('company') || lowerKey.includes('organization')) {
          icon = <Building2 className="w-4 h-4" />;
        } else if (lowerKey.includes('contact') || lowerKey.includes('email')) {
          icon = <Mail className="w-4 h-4" />;
        } else if (lowerKey.includes('address') || lowerKey.includes('location')) {
          icon = <MapPin className="w-4 h-4" />;
        } else if (lowerKey.includes('list') || lowerKey.includes('entry') || lowerKey.includes('item')) {
          icon = <List className="w-4 h-4" />;
        } else if (lowerKey.includes('div') || lowerKey.includes('section')) {
          icon = <Building2 className="w-4 h-4" />;
        } else if (lowerKey.includes('def') || lowerKey.includes('definition')) {
          icon = <FileCode className="w-4 h-4" />;
        }
        
        const children = typeof value === 'object' ? getCompleteNavStructure(value, fieldPath, level + 1) : [];
        
        sections.push({
          label: key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          path: fieldPath,
          icon,
          level,
          children,
          hasChildren: children.length > 0
        });
      });
    }
    
    return sections;
  };

  const completeNavStructure = jsonData ? getCompleteNavStructure(jsonData) : [];

  // NavigationTree Component with expandable hierarchy
  const NavigationTree = ({ items, onItemClick }: { items: any[], onItemClick: (path: string) => void }) => {
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    const toggleExpanded = (path: string) => {
      const newExpanded = new Set(expandedItems);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      setExpandedItems(newExpanded);
    };

    const renderItem = (item: any, level: number = 0): React.ReactNode => {
      const isExpanded = expandedItems.has(item.path);
      const hasChildren = item.children && item.children.length > 0;

      return (
        <div key={item.path}>
          <div
            className={cn(
              "flex items-center py-1.5 px-2 rounded-lg hover:bg-white/10 dark:hover:bg-black/10 cursor-pointer transition-colors group",
              level > 0 && "ml-4"
            )}
            style={{ paddingLeft: `${8 + level * 16}px` }}
          >
            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleExpanded(item.path)}
                className="p-0 h-4 w-4 mr-2 hover:bg-white/20 dark:hover:bg-black/20"
              >
                <ChevronRight 
                  className={cn(
                    "w-3 h-3 transition-transform duration-200",
                    isExpanded && "rotate-90"
                  )} 
                />
              </Button>
            ) : (
              <div className="w-4 h-4 mr-2" />
            )}
            
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <div className="flex-shrink-0">
                {item.icon}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onItemClick(item.path)}
                className="p-0 h-auto text-left justify-start flex-1 min-w-0 hover:bg-transparent"
              >
                <span className={cn(
                  "truncate",
                  level === 0 ? "text-sm font-medium" : "text-xs",
                  hasChildren && "font-medium"
                )}>
                  {item.label}
                </span>
              </Button>
              {hasChildren && (
                <span className="text-xs text-muted-foreground opacity-60">
                  →
                </span>
              )}
            </div>
          </div>
          
          {isExpanded && hasChildren && (
            <div className="animate-fade-in">
              {item.children.map((child: any) => renderItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-0.5">
        {items.map((item) => renderItem(item))}
      </div>
    );
  };

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex flex-col">
      {/* Header */}
      <header className="glass-panel sticky top-0 z-50 border-b border-white/20 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center">
                <FileCode className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Data View</h1>
                <p className="text-sm text-muted-foreground">Web page format</p>
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

      {/* Navigation Bar */}
      {navigationItems.length > 0 && (
        <nav className="glass-panel border-b border-white/20 dark:border-white/10 sticky top-[72px] z-40">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center space-x-6 overflow-x-auto">
              {navigationItems.slice(0, 8).map((item, index) => (
                <DropdownMenu key={index}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="glass-button flex items-center space-x-2 whitespace-nowrap"
                    >
                      {item.icon}
                      <span>{item.label}</span>
                      {item.children.length > 0 && <ChevronDown className="w-3 h-3" />}
                    </Button>
                  </DropdownMenuTrigger>
                  {item.children.length > 0 && (
                    <DropdownMenuContent className="w-56 glass-panel border-white/20 dark:border-white/10">
                      <DropdownMenuItem
                        onClick={() => scrollToSection(item.path)}
                        className="flex items-center space-x-2"
                      >
                        {item.icon}
                        <span>Go to {item.label}</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/20 dark:bg-white/10" />
                      {item.children.slice(0, 10).map((child: any, childIndex: number) => (
                        <DropdownMenuItem
                          key={childIndex}
                          onClick={() => scrollToSection(child.path)}
                          className="flex items-center space-x-2 text-sm"
                        >
                          {child.icon}
                          <span>{child.label}</span>
                        </DropdownMenuItem>
                      ))}
                      {item.children.length > 10 && (
                        <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                          +{item.children.length - 10} more items...
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  )}
                </DropdownMenu>
              ))}
              {navigationItems.length > 8 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="glass-button flex items-center space-x-2"
                    >
                      <Hash className="w-4 h-4" />
                      <span>More</span>
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 glass-panel border-white/20 dark:border-white/10">
                    {navigationItems.slice(8).map((item, index) => (
                      <DropdownMenuItem
                        key={index}
                        onClick={() => scrollToSection(item.path)}
                        className="flex items-center space-x-2"
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="flex-1 animate-fade-in">
        <WebPageRenderer 
          data={jsonData} 
          searchQuery={searchQuery}
        />
      </main>

      {/* Floating Navigation */}
      {completeNavStructure.length > 0 && (
        <div className="fixed bottom-8 right-8 z-50 animate-slide-in">
          {!isNavExpanded ? (
            <Button
              onClick={() => setIsNavExpanded(true)}
              className="glass-panel rounded-full w-14 h-14 p-0 border border-white/20 dark:border-white/10 hover:scale-105 transition-all duration-300"
            >
              <Menu className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </Button>
          ) : (
            <div className="glass-panel rounded-2xl border border-white/20 dark:border-white/10 p-4 min-w-[320px] max-w-[400px] max-h-[500px] overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Navigation className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-foreground">Navigation</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={scrollToTop}
                    className="glass-button p-1 h-6 w-6"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsNavExpanded(false)}
                    className="glass-button p-1 h-6 w-6"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              <div className="overflow-y-auto max-h-[400px] custom-scrollbar">
                <NavigationTree
                  items={completeNavStructure}
                  onItemClick={(path: string) => {
                    scrollToSection(path);
                    setIsNavExpanded(false);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}