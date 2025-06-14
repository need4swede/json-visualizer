import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { WebPageRenderer } from "@/components/web-page-renderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Download, Search, X, FileCode, ChevronDown, Hash, List, User, Building2, Mail, MapPin, Navigation, ArrowUp, ChevronRight, Menu, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard, downloadJson, formatJson, decodeJsonFromUrl, createSectionId, scrollToSection } from "@/lib/json-utils";
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
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const { toast } = useToast();
  const navRef = useRef<HTMLDivElement>(null);
  const isNavigatingRef = useRef(false);
  
  // Extract URL parameters - get ID from path (/:id format)
  const pathSegments = window.location.pathname.split('/');
  const shortId = pathSegments[1]; // /:id format

  // Handle click outside to close expanded navigation
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if we're in the middle of a navigation action
      if (isNavigatingRef.current) return;
      
      // Add a small delay to ensure the click event has been processed
      setTimeout(() => {
        if (navRef.current && !navRef.current.contains(event.target as Node) && isNavExpanded) {
          setIsNavExpanded(false);
        }
      }, 50);
    };

    if (isNavExpanded) {
      // Use click instead of mousedown to avoid interference with navigation clicks
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isNavExpanded]);

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

  const scrollToNavigationSection = (path: string, event?: React.MouseEvent) => {
    // Prevent event bubbling to avoid triggering click-outside handler
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Set navigation flag to prevent closing during navigation
    isNavigatingRef.current = true;
    
    // Use the same ID generation as in web-page-renderer
    const sectionId = createSectionId(path);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add stronger highlighting with animation
      element.classList.add('highlight-section');
      setTimeout(() => {
        element.classList.remove('highlight-section');
      }, 3000);
    } else {
      console.warn('Section not found:', sectionId, 'for path:', path);
    }
    
    // Clear navigation flag after a longer delay to ensure click-outside doesn't interfere
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 300);
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
  const NavigationTree = ({ items, onItemClick }: { items: any[], onItemClick: (path: string, event?: React.MouseEvent) => void }) => {
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
                onClick={(e) => onItemClick(item.path, e)}
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
    const loadData = async () => {
      // Check if we have a 9-digit ID in the URL
      const isValidId = /^\d{9}$/.test(shortId);
      
      if (isValidId) {
        try {
          const parsedData = await decodeJsonFromUrl(shortId);
          if (parsedData) {
            setJsonData(parsedData);
          } else {
            console.error("No JSON data found for ID:", shortId);
            // Fallback to sessionStorage
            const storedData = sessionStorage.getItem('fullscreen-json-data');
            if (storedData) {
              try {
                setJsonData(JSON.parse(storedData));
              } catch (storageError) {
                console.error("Failed to parse JSON from storage:", storageError);
              }
            }
          }
        } catch (error) {
          console.error("Failed to retrieve JSON data:", error);
        }
      } else if (shortId !== 'fullscreen') {
        // If it's not a valid ID and not 'fullscreen', redirect to home
        setLocation('/');
      } else {
        // For /fullscreen route, try sessionStorage
        const storedData = sessionStorage.getItem('fullscreen-json-data');
        if (storedData) {
          try {
            setJsonData(JSON.parse(storedData));
          } catch (error) {
            console.error("Failed to parse JSON from storage:", error);
          }
        }
      }
      
      // Set loading to false after data attempt
      setIsLoading(false);
    };

    loadData();
  }, [shortId, setLocation]);

  // Handle hash navigation for anchor links
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash && jsonData) {
        // Scroll to the section with highlighting
        scrollToSection(hash, true);
      }
    };

    // Handle initial hash on load
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [jsonData]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h1 className="text-lg font-medium text-white mb-2">Loading JSON Data</h1>
          <p className="text-gray-400">Please wait...</p>
        </div>
      </div>
    );
  }

  if (!jsonData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 to-black flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-black">
      {/* Main Content */}
      <main className="animate-fade-in">
        <WebPageRenderer 
          data={jsonData} 
          searchQuery={searchQuery}
        />
      </main>

      {/* Floating Navigation */}
      {completeNavStructure.length > 0 && (
        <div ref={navRef} className="fixed bottom-8 right-8 z-50 animate-slide-in">
          {!isNavExpanded ? (
            <div className="glass-panel px-6 py-4 shadow-2xl border border-white/20 dark:border-white/10 min-w-[500px]" style={{borderRadius: '10rem'}}>
              <div className="flex items-center justify-between space-x-4">
                {/* Left Section - Search */}
                <div className="flex items-center space-x-3 flex-1">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search JSON data..."
                    className="flex-1 h-8 bg-white/20 dark:bg-black/20 backdrop-blur-sm border border-white/30 dark:border-white/10 text-sm"
                    style={{borderRadius: '10rem'}}
                  />
                </div>
                
                {/* Right Section - Action Buttons */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="glass-button hover:scale-105 transition-transform"
                    style={{borderRadius: '10rem'}}
                    title="Copy JSON"
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
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="glass-button hover:scale-105 transition-transform"
                    style={{borderRadius: '10rem'}}
                    title="Exit fullscreen"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  
                  <div className="w-px h-6 bg-white/20 dark:bg-white/10"></div>
                  
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      isNavigatingRef.current = true;
                      setIsNavExpanded(true);
                      setTimeout(() => {
                        isNavigatingRef.current = false;
                      }, 300);
                    }}
                    className="glass-button hover:scale-105 transition-all duration-300"
                    style={{borderRadius: '10rem'}}
                    title="Expand navigation"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    <span className="text-sm">Navigate</span>
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel border border-white/20 dark:border-white/10 p-4 min-w-[380px] max-w-[450px] max-h-[600px] overflow-hidden" style={{borderRadius: '1.75rem'}}>
              <div className="flex justify-center space-x-2 mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    scrollToTop();
                  }}
                  className="glass-button"
                  style={{borderRadius: '10rem'}}
                  title="Scroll to top"
                >
                  <ArrowUp className="w-4 h-4 mr-2" />
                  Scroll to Top
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsNavExpanded(false);
                  }}
                  className="glass-button"
                  style={{borderRadius: '10rem'}}
                  title="Minimize navigation"
                >
                  <ArrowDown className="w-4 h-4 mr-2" />
                  Minimize
                </Button>
              </div>

              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search data..."
                    className="w-full pl-9 bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-white/30 dark:border-white/10 text-sm"
                    style={{borderRadius: '10rem'}}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCopy();
                  }}
                  className="glass-button flex-1 text-xs"
                  style={{borderRadius: '10rem'}}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDownload();
                  }}
                  className="glass-button flex-1 text-xs"
                  style={{borderRadius: '10rem'}}
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleClose();
                  }}
                  className="glass-button flex-1 text-xs"
                  style={{borderRadius: '10rem'}}
                >
                  <X className="w-3 h-3 mr-1" />
                  Exit
                </Button>
              </div>
              
              <div className="border-t border-white/20 dark:border-white/10 pt-3">
                <div className="overflow-y-auto max-h-[400px] custom-scrollbar">
                  <NavigationTree
                    items={completeNavStructure}
                    onItemClick={(path: string, event?: React.MouseEvent) => {
                      scrollToNavigationSection(path, event);
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}