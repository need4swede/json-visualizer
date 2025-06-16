import { useState } from "react";
import { Copy, ExternalLink, Mail, Phone, MapPin, Calendar, User, Building2, Globe, Tag, Hash, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { copyToClipboard, normalizeSearchText, createSearchRegex, matchesSearchQuery, getSearchHighlights, createSectionId, createAnchorUrl } from "@/lib/json-utils";
import { useToast } from "@/hooks/use-toast";

interface WebPageRendererProps {
  data: any;
  searchQuery?: string;
}

interface DataCardProps {
  title: string;
  data: any;
  searchQuery?: string;
  icon?: React.ReactNode;
  path?: string;
}

function DataCard({ title, data, searchQuery, icon, path }: DataCardProps) {
  const { toast } = useToast();
  
  const handleCopyValue = async (val: any) => {
    try {
      await copyToClipboard(typeof val === 'string' ? val : JSON.stringify(val));
      toast({
        title: "Copied to clipboard",
        description: "Value has been copied",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy value",
        variant: "destructive",
      });
    }
  };

  const highlightText = (text: string) => {
    if (!searchQuery) return text;
    
    const highlights = getSearchHighlights(text, searchQuery);
    if (highlights.length === 0) return text;
    
    const parts: React.ReactNode[] = [];
    let currentPos = 0;
    
    highlights.forEach((highlight, i) => {
      // Add text before highlight
      if (highlight.start > currentPos) {
        parts.push(text.slice(currentPos, highlight.start));
      }
      
      // Add highlighted text
      parts.push(
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {highlight.word}
        </mark>
      );
      
      currentPos = highlight.end;
    });
    
    // Add remaining text
    if (currentPos < text.length) {
      parts.push(text.slice(currentPos));
    }
    
    return parts;
  };

  const matchesSearch = (obj: any, key?: string): boolean => {
    if (!searchQuery) return true;
    
    // Check if key matches (treating spaces and underscores as equivalent)
    if (key && matchesSearchQuery(key, searchQuery)) {
      return true;
    }
    
    // Check if value matches (for primitive values)
    if (typeof obj === 'string' || typeof obj === 'number') {
      return matchesSearchQuery(String(obj), searchQuery);
    }
    
    // For objects and arrays, recursively check all nested values and keys
    if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        return obj.some(item => matchesSearch(item));
      } else {
        return Object.entries(obj).some(([nestedKey, nestedValue]) => 
          matchesSearch(nestedValue, nestedKey)
        );
      }
    }
    
    return false;
  };

  const renderValue = (value: any, key?: string) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">Not specified</span>;
    }
    
    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? "default" : "secondary"} className="font-normal">
          {value ? 'Yes' : 'No'}
        </Badge>
      );
    }
    
    if (typeof value === 'number') {
      if (key && (key.toLowerCase().includes('price') || key.toLowerCase().includes('cost') || key.toLowerCase().includes('amount'))) {
        return (
          <div className="flex items-center space-x-1">
            <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="font-medium text-green-700 dark:text-green-300">
              {value.toLocaleString()}
            </span>
          </div>
        );
      }
      return (
        <span className="font-mono text-orange-600 dark:text-orange-400 font-medium">
          {value.toLocaleString()}
        </span>
      );
    }
    
    if (typeof value === 'string') {
      const isUrl = value.startsWith('http://') || value.startsWith('https://');
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      const isPhone = /^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''));
      const isDate = !isNaN(Date.parse(value)) && value.match(/^\d{4}-\d{2}-\d{2}/) || value.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
      
      if (isUrl) {
        return (
          <div className="flex items-center space-x-2 group">
            <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <a 
              href={value} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {highlightText(value)}
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyValue(value)}
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        );
      }
      
      if (isEmail) {
        return (
          <div className="flex items-center space-x-2 group">
            <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <a 
              href={`mailto:${value}`}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {highlightText(value)}
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyValue(value)}
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        );
      }
      
      if (isPhone) {
        return (
          <div className="flex items-center space-x-2 group">
            <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
            <a 
              href={`tel:${value}`}
              className="text-green-600 dark:text-green-400 hover:underline"
            >
              {highlightText(value)}
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyValue(value)}
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        );
      }
      
      if (isDate) {
        return (
          <div className="flex items-center space-x-2 group">
            <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-purple-700 dark:text-purple-300">
              {highlightText(new Date(value).toLocaleDateString())}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyValue(value)}
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        );
      }
      
      return (
        <div className="flex items-center space-x-2 group">
          <span className="text-foreground">
            {highlightText(value)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopyValue(value)}
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      );
    }
    
    if (Array.isArray(value)) {
      return (
        <div className="space-y-4">
          <Badge variant="outline" className="text-xs mb-3">
            {value.length} items
          </Badge>
          <div className="space-y-4">
            {value.filter((item) => matchesSearch(item)).map((item, index) => (
              <div key={index} className="p-4 bg-white/50 dark:bg-black/20 rounded-xl border border-white/30 dark:border-white/10">
                {typeof item === 'object' && item !== null ? (
                  <div className="space-y-3">
                    <div className="font-medium text-purple-700 dark:text-purple-300 mb-3">
                      Item {index + 1}
                    </div>
                    {Object.entries(item).filter(([k, v]) => matchesSearch(v, k)).map(([k, v]) => (
                      <div key={k} className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground capitalize block">
                          {highlightText(k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' '))}
                        </label>
                        <div className="text-sm pl-2">{renderValue(v, k)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="font-medium text-purple-700 dark:text-purple-300 mb-2">
                      Item {index + 1}
                    </div>
                    {renderValue(item)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return <span>{String(value)}</span>;
  };

  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    const entries = Object.entries(data);
    
    const sectionId = path ? createSectionId(path) : undefined;
    
    return (
      <Card 
        id={sectionId}
        className="glass-panel border-white/20 dark:border-white/10 w-full group"
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            {icon}
            <span>{title}</span>
            {path && (
              <button
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.hash = sectionId || '';
                  navigator.clipboard.writeText(url.toString());
                  toast({
                    title: "Link copied",
                    description: "Shareable link to this section copied to clipboard",
                  });
                }}
                className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
                title="Copy link to this section"
              >
                <Hash className="w-4 h-4" />
              </button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {entries.filter(([key, value]) => matchesSearch(value, key)).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground capitalize block">
                {highlightText(key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' '))}
              </label>
              <div className="pl-2">
                {renderValue(value, key)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const sectionId = path ? createSectionId(path) : undefined;
  
  return (
    <Card 
      id={sectionId}
      className="glass-panel border-white/20 dark:border-white/10 w-full"
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg">
          {icon}
          <span>{title}</span>
          {path && (
            <button
              onClick={() => {
                const url = createAnchorUrl(sectionId || '');
                navigator.clipboard.writeText(url);
                toast({
                  title: "Link copied",
                  description: "Shareable link to this section copied to clipboard",
                });
              }}
              className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
              title="Copy link to this section"
            >
              <Hash className="w-4 h-4" />
            </button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renderValue(data)}
      </CardContent>
    </Card>
  );
}

function renderCompleteData(data: any, searchQuery?: string, level: number = 0, path: string = "", onCopy?: (val: any) => void, onToast?: (title: string, description: string) => void): React.ReactNode {
  const handleCopyValue = onCopy || (() => {});
  const handleToast = onToast || (() => {});

  const highlightText = (text: string) => {
    if (!searchQuery) return text;
    
    const highlights = getSearchHighlights(text, searchQuery);
    if (highlights.length === 0) return text;
    
    const parts: React.ReactNode[] = [];
    let currentPos = 0;
    
    highlights.forEach((highlight, i) => {
      // Add text before highlight
      if (highlight.start > currentPos) {
        parts.push(text.slice(currentPos, highlight.start));
      }
      
      // Add highlighted text
      parts.push(
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {highlight.word}
        </mark>
      );
      
      currentPos = highlight.end;
    });
    
    // Add remaining text
    if (currentPos < text.length) {
      parts.push(text.slice(currentPos));
    }
    
    return parts;
  };

  const matchesSearchData = (obj: any, key?: string): boolean => {
    if (!searchQuery) return true;
    
    // Check if key matches (treating spaces and underscores as equivalent)
    if (key && matchesSearchQuery(key, searchQuery)) {
      return true;
    }
    
    // Check if value matches (for primitive values)
    if (typeof obj === 'string' || typeof obj === 'number') {
      return matchesSearchQuery(String(obj), searchQuery);
    }
    
    // For objects and arrays, recursively check all nested values and keys
    if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        return obj.some(item => matchesSearchData(item));
      } else {
        return Object.entries(obj).some(([nestedKey, nestedValue]) => 
          matchesSearchData(nestedValue, nestedKey)
        );
      }
    }
    
    return false;
  };

  const renderPrimitive = (value: any, key?: string) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">Not specified</span>;
    }
    
    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? "default" : "secondary"} className="font-normal">
          {value ? 'Yes' : 'No'}
        </Badge>
      );
    }
    
    if (typeof value === 'number') {
      if (key && (key.toLowerCase().includes('price') || key.toLowerCase().includes('cost') || key.toLowerCase().includes('amount'))) {
        return (
          <div className="flex items-center space-x-1">
            <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="font-medium text-green-700 dark:text-green-300">
              {value.toLocaleString()}
            </span>
          </div>
        );
      }
      return (
        <span className="font-mono text-orange-600 dark:text-orange-400 font-medium">
          {value.toLocaleString()}
        </span>
      );
    }
    
    if (typeof value === 'string') {
      const isUrl = value.startsWith('http://') || value.startsWith('https://');
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      const isPhone = /^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''));
      const isDate = !isNaN(Date.parse(value)) && (value.match(/^\d{4}-\d{2}-\d{2}/) || value.match(/\d{1,2}\/\d{1,2}\/\d{4}/));
      
      if (isUrl) {
        return (
          <div className="flex items-center space-x-2 group">
            <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <a 
              href={value} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {highlightText(value)}
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyValue(value)}
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        );
      }
      
      if (isEmail) {
        return (
          <div className="flex items-center space-x-2 group">
            <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <a 
              href={`mailto:${value}`}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {highlightText(value)}
            </a>
          </div>
        );
      }
      
      if (isPhone) {
        return (
          <div className="flex items-center space-x-2 group">
            <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
            <a 
              href={`tel:${value}`}
              className="text-green-600 dark:text-green-400 hover:underline"
            >
              {highlightText(value)}
            </a>
          </div>
        );
      }
      
      if (isDate) {
        return (
          <div className="flex items-center space-x-2 group">
            <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-purple-700 dark:text-purple-300">
              {highlightText(new Date(value).toLocaleDateString())}
            </span>
          </div>
        );
      }
      
      return (
        <div className="flex items-center space-x-2 group">
          <span className="text-foreground">
            {highlightText(value)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopyValue(value)}
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      );
    }
    
    return <span>{String(value)}</span>;
  };

  if (data === null || data === undefined) {
    return null;
  }

  // Handle primitive values
  if (typeof data !== 'object') {
    return renderPrimitive(data);
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return (
      <div className="space-y-6">
        {data.filter((item) => matchesSearchData(item)).map((item, index) => {
          const itemPath = path ? `${path}[${index}]` : `[${index}]`;
          return (
            <div 
              key={index} 
              id={`section-${itemPath.replace(/[\[\]\.]/g, '-')}`}
              className="apple-card group relative p-8"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-lg backdrop-blur-sm">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white/95 mb-1 tracking-tight">
                      Item {index + 1}
                    </h3>
                    {typeof item === 'object' && Object.keys(item).length > 0 && (
                      <p className="text-sm text-white/60 font-medium">
                        {Object.keys(item).length} properties
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Copy and Anchor buttons for array items */}
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (onCopy) {
                        onCopy(item);
                      }
                    }}
                    className="h-6 w-6 p-0 hover:bg-white/20 dark:hover:bg-black/20"
                    title="Copy value"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const sectionId = createSectionId(itemPath);
                      const url = createAnchorUrl(sectionId);
                      navigator.clipboard.writeText(url);
                      handleToast("Anchor link copied", "Direct link to this item copied to clipboard");
                    }}
                    className="h-6 w-6 p-0 hover:bg-white/20 dark:hover:bg-black/20"
                    title="Copy anchor link"
                  >
                    <Hash className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              {renderCompleteData(item, searchQuery, level + 1, itemPath, onCopy, handleToast)}
            </div>
          );
        })}
      </div>
    );
  }

  // Handle objects
  const entries = Object.entries(data);
  return (
    <div className="space-y-3">
      {entries.filter(([key, value]) => matchesSearchData(value, key)).map(([key, value]) => {
        const fieldPath = path ? `${path}.${key}` : key;
        const isObject = typeof value === 'object' && value !== null;
        const isArray = Array.isArray(value);
        const isPrimitive = !isObject;
        
        // Determine color scheme with level-based rotation for visual hierarchy
        type ColorScheme = 'id' | 'name' | 'text' | 'date' | 'link' | 'email' | 'number' | 'array' | 'object' | 'default';
        const lowerKey = key.toLowerCase();
        
        // Create a color rotation array for different nesting levels
        const colorRotation: ColorScheme[] = [
          'id', 'name', 'text', 'date', 'link', 'email', 'number', 'array', 'object'
        ];
        
        let baseColorScheme: ColorScheme = 'default';
        
        // Determine base color from key content
        if (lowerKey.includes('id') || lowerKey.includes('key')) baseColorScheme = 'id';
        else if (lowerKey.includes('name') || lowerKey.includes('title')) baseColorScheme = 'name';
        else if (lowerKey.includes('description') || lowerKey.includes('content') || lowerKey.includes('text')) baseColorScheme = 'text';
        else if (lowerKey.includes('date') || lowerKey.includes('time')) baseColorScheme = 'date';
        else if (lowerKey.includes('url') || lowerKey.includes('link')) baseColorScheme = 'link';
        else if (lowerKey.includes('email')) baseColorScheme = 'email';
        else if (lowerKey.includes('phone') || lowerKey.includes('number')) baseColorScheme = 'number';
        else if (isArray) baseColorScheme = 'array';
        else if (isObject) baseColorScheme = 'object';
        
        // Apply level-based color rotation to create visual hierarchy
        const baseIndex = colorRotation.indexOf(baseColorScheme);
        const rotatedIndex = baseIndex >= 0 ? (baseIndex + level * 2) % colorRotation.length : level % colorRotation.length;
        const colorScheme = colorRotation[rotatedIndex];
        
        const colorClasses: Record<ColorScheme, string> = {
          id: 'from-blue-400 to-cyan-400 bg-blue-500/15 border-blue-400/30',
          name: 'from-violet-400 to-purple-400 bg-violet-500/15 border-violet-400/30',
          text: 'from-green-400 to-emerald-400 bg-green-500/15 border-green-400/30',
          date: 'from-orange-400 to-amber-400 bg-orange-500/15 border-orange-400/30',
          link: 'from-indigo-400 to-blue-400 bg-indigo-500/15 border-indigo-400/30',
          email: 'from-pink-400 to-rose-400 bg-pink-500/15 border-pink-400/30',
          number: 'from-teal-400 to-cyan-400 bg-teal-500/15 border-teal-400/30',
          array: 'from-purple-400 to-fuchsia-400 bg-purple-500/15 border-purple-400/30',
          object: 'from-slate-400 to-gray-400 bg-slate-500/15 border-slate-400/30',
          default: 'from-gray-400 to-slate-400 bg-gray-500/15 border-gray-400/30'
        };
        
        const currentColorClass = colorClasses[colorScheme];
        const colorParts = currentColorClass.split(' ');
        
        // Determine if this is a leaf node (contains primitive data) or parent container
        const isLeafNode = isPrimitive || (isArray && value.every((item: any) => typeof item !== 'object'));
        const cardClass = isLeafNode ? "apple-card data-leaf" : "apple-card data-parent";
        
        return (
          <div 
            key={key} 
            id={`section-${fieldPath.replace(/[\[\]\.]/g, '-')}`}
            className={cn(
              cardClass,
              "group relative p-6 mb-6 border-l-4 transition-all duration-500",
              // Different background opacity based on nesting level for better hierarchy
              level === 0 && colorParts[2], // Full opacity for top level
              level === 1 && colorParts[2].replace('/15', '/12'), // Slightly less for level 1
              level === 2 && colorParts[2].replace('/15', '/10'), // Even less for level 2
              level >= 3 && colorParts[2].replace('/15', '/8'), // Minimal for deeper levels
              colorParts[3] // border color
            )}
            style={{
              animationDelay: `${(level * 100)}ms`,
              '--color-scheme': colorScheme
            } as React.CSSProperties & { '--color-scheme': string }}
            onMouseEnter={(e) => {
              e.stopPropagation();
              const target = e.currentTarget;
              
              // Remove direct-hover from all other cards first
              document.querySelectorAll('.apple-card.direct-hover').forEach(el => {
                if (el !== target) {
                  el.classList.remove('direct-hover');
                }
              });
              
              target.classList.add('direct-hover');
            }}
            onMouseLeave={(e) => {
              e.stopPropagation();
              const target = e.currentTarget;
              target.classList.remove('direct-hover');
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <div className={cn(
                  "w-5 h-5 rounded-full bg-gradient-to-br shadow-lg flex-shrink-0 animate-color-pulse border-2 border-white/20",
                  colorParts.slice(0, 2).join(' ')
                )}></div>
                <div className="flex flex-col lg:flex-row lg:items-center space-y-2 lg:space-y-0 lg:space-x-4 flex-1 min-w-0">
                  <h4 className={cn(
                    "font-bold tracking-tight capitalize break-words text-left",
                    isLeafNode ? "text-lg text-white/95" : "text-xl text-white/100",
                    "bg-gradient-to-r from-white via-white/95 to-white/80 bg-clip-text text-transparent drop-shadow-sm"
                  )}>
                    {highlightText(key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' '))}
                  </h4>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {isArray && (
                      <span className={cn(
                        "text-xs px-3 py-1.5 rounded-full font-bold border-2 animate-gentle-bounce shadow-lg text-white",
                        `bg-gradient-to-r ${colorParts.slice(0, 2).join(' ')} ${colorParts[3]}`
                      )}>
                        📋 {value.length} items
                      </span>
                    )}
                    {isObject && !isArray && (
                      <span className={cn(
                        "text-xs px-3 py-1.5 rounded-full font-bold border-2 animate-color-pulse shadow-lg text-white",
                        `bg-gradient-to-r ${colorParts.slice(0, 2).join(' ')} ${colorParts[3]}`
                      )}>
                        🏗️ {Object.keys(value).length} fields
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Copy and Anchor buttons */}
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (onCopy) {
                      onCopy(value);
                    }
                  }}
                  className="h-7 w-7 p-0 hover:bg-white/15 rounded-lg transition-colors"
                  title="Copy value"
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const sectionId = createSectionId(fieldPath);
                    const url = createAnchorUrl(sectionId);
                    navigator.clipboard.writeText(url);
                    handleToast("Anchor link copied", "Direct link to this section copied to clipboard");
                  }}
                  className="h-7 w-7 p-0 hover:bg-white/15 rounded-lg transition-colors"
                  title="Copy anchor link"
                >
                  <Hash className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            
            {!isPrimitive && (
              <div className={cn(
                "relative mt-3",
                "pl-5 border-l border-white/10",
                level === 0 && "pl-6"
              )}>
                {renderCompleteData(value, searchQuery, level + 1, fieldPath, onCopy, handleToast)}
              </div>
            )}
            {isPrimitive && (
              <div className="mt-2 pl-6">
                {renderPrimitive(value, key)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function WebPageRenderer({ data, searchQuery }: WebPageRendererProps) {
  const { toast } = useToast();

  const handleCopyValue = async (val: any) => {
    try {
      await copyToClipboard(typeof val === 'string' ? val : JSON.stringify(val));
      toast({
        title: "Copied to clipboard",
        description: "Value has been copied",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy value",
        variant: "destructive",
      });
    }
  };

  if (data === null || data === undefined) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-white/70">
        <div className="text-xl font-semibold mb-3 text-white">No Data</div>
        <p className="text-sm text-white/60">Enter valid JSON to see the rendered output</p>
      </div>
    );
  }

  // Try to determine the type of data for appropriate title
  const getDataTitle = () => {
    if (Array.isArray(data)) {
      return `Data Collection (${data.length} items)`;
    }
    if (typeof data === 'object') {
      const keys = Object.keys(data);
      if (keys.some(k => k.toLowerCase().includes('user') || k.toLowerCase().includes('person'))) {
        return 'User Information';
      }
      if (keys.some(k => k.toLowerCase().includes('product') || k.toLowerCase().includes('item'))) {
        return 'Product Information';
      }
      if (keys.some(k => k.toLowerCase().includes('order') || k.toLowerCase().includes('transaction'))) {
        return 'Transaction Details';
      }
      return `Data Overview (${keys.length} sections)`;
    }
    return 'Data Value';
  };

  return (
    <div className="min-h-screen w-full p-6 lg:p-8 space-y-8">
      {/* Header without background */}
      <div className="text-center mb-12">
        <div className="p-8 mb-6 max-w-2xl mx-auto">
          <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-white/95 to-white/90 bg-clip-text text-transparent mb-4 tracking-tight">
            {getDataTitle()}
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full mx-auto opacity-80"></div>
        </div>
      </div>
      
      {/* Content with enhanced spacing and typography */}
      <div className="w-full max-w-7xl mx-auto space-y-6 px-4">
        {renderCompleteData(data, searchQuery, 0, "", handleCopyValue, (title: string, description: string) => {
          toast({
            title,
            description,
          });
        })}
      </div>
    </div>
  );
}