import { useState } from "react";
import { Copy, ExternalLink, Mail, Phone, MapPin, Calendar, User, Building2, Globe, Tag, Hash, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { copyToClipboard, normalizeSearchText, createSearchRegex, matchesSearchQuery, getSearchHighlights, createSectionId } from "@/lib/json-utils";
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
      <CardContent>
        {renderValue(data)}
      </CardContent>
    </Card>
  );
}

function renderCompleteData(data: any, searchQuery?: string, level: number = 0, path: string = "", onCopy?: (val: any) => void): React.ReactNode {
  const handleCopyValue = onCopy || (() => {});

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
              className={cn(
                "group relative p-6 rounded-2xl border transition-all duration-500 hover:shadow-lg",
                level === 0 ? "bg-gradient-to-br from-indigo-50/80 via-purple-50/60 to-pink-50/80 dark:from-indigo-900/30 dark:via-purple-900/20 dark:to-pink-900/30 border-indigo-200/60 dark:border-indigo-700/50" : 
                level === 1 ? "bg-gradient-to-br from-emerald-50/80 via-teal-50/60 to-cyan-50/80 dark:from-emerald-900/30 dark:via-teal-900/20 dark:to-cyan-900/30 border-emerald-200/60 dark:border-emerald-700/50" :
                level === 2 ? "bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-red-50/80 dark:from-amber-900/30 dark:via-orange-900/20 dark:to-red-900/30 border-amber-200/60 dark:border-amber-700/50" :
                "bg-gradient-to-br from-slate-50/80 to-gray-50/80 dark:from-slate-800/30 dark:to-gray-800/30 border-slate-200/60 dark:border-slate-700/50"
              )}
            >
              <div className="flex items-center space-x-3 mb-5">
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-lg",
                  level === 0 ? "bg-gradient-to-r from-indigo-500 to-purple-600" :
                  level === 1 ? "bg-gradient-to-r from-emerald-500 to-teal-600" :
                  level === 2 ? "bg-gradient-to-r from-amber-500 to-orange-600" :
                  "bg-gradient-to-r from-slate-500 to-gray-600"
                )}>
                  {index + 1}
                </div>
                <div>
                  <h3 className={cn(
                    "font-bold",
                    level === 0 ? "text-lg text-indigo-700 dark:text-indigo-300" :
                    level === 1 ? "text-base text-emerald-700 dark:text-emerald-300" :
                    "text-sm text-amber-700 dark:text-amber-300"
                  )}>
                    Item {index + 1}
                  </h3>
                  {typeof item === 'object' && Object.keys(item).length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {Object.keys(item).length} properties
                    </p>
                  )}
                </div>
              </div>
              {renderCompleteData(item, searchQuery, level + 1, itemPath, onCopy)}
            </div>
          );
        })}
      </div>
    );
  }

  // Handle objects
  const entries = Object.entries(data);
  return (
    <div className="space-y-4">
      {entries.filter(([key, value]) => matchesSearchData(value, key)).map(([key, value]) => {
        const fieldPath = path ? `${path}.${key}` : key;
        const isObject = typeof value === 'object' && value !== null;
        const isArray = Array.isArray(value);
        const isPrimitive = !isObject;
        
        // Determine color scheme based on key type
        type ColorScheme = 'id' | 'name' | 'text' | 'date' | 'link' | 'email' | 'number' | 'array' | 'object' | 'default';
        let colorScheme: ColorScheme = 'default';
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('id') || lowerKey.includes('key')) colorScheme = 'id';
        else if (lowerKey.includes('name') || lowerKey.includes('title')) colorScheme = 'name';
        else if (lowerKey.includes('description') || lowerKey.includes('content') || lowerKey.includes('text')) colorScheme = 'text';
        else if (lowerKey.includes('date') || lowerKey.includes('time')) colorScheme = 'date';
        else if (lowerKey.includes('url') || lowerKey.includes('link')) colorScheme = 'link';
        else if (lowerKey.includes('email')) colorScheme = 'email';
        else if (lowerKey.includes('phone') || lowerKey.includes('number')) colorScheme = 'number';
        else if (isArray) colorScheme = 'array';
        else if (isObject) colorScheme = 'object';
        
        const colorClasses: Record<ColorScheme, string> = {
          id: 'from-blue-500 to-cyan-500 text-blue-700 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-900/20 border-blue-200/50 dark:border-blue-700/50',
          name: 'from-violet-500 to-purple-500 text-violet-700 dark:text-violet-300 bg-violet-50/50 dark:bg-violet-900/20 border-violet-200/50 dark:border-violet-700/50',
          text: 'from-green-500 to-emerald-500 text-green-700 dark:text-green-300 bg-green-50/50 dark:bg-green-900/20 border-green-200/50 dark:border-green-700/50',
          date: 'from-orange-500 to-amber-500 text-orange-700 dark:text-orange-300 bg-orange-50/50 dark:bg-orange-900/20 border-orange-200/50 dark:border-orange-700/50',
          link: 'from-indigo-500 to-blue-500 text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-200/50 dark:border-indigo-700/50',
          email: 'from-pink-500 to-rose-500 text-pink-700 dark:text-pink-300 bg-pink-50/50 dark:bg-pink-900/20 border-pink-200/50 dark:border-pink-700/50',
          number: 'from-teal-500 to-cyan-500 text-teal-700 dark:text-teal-300 bg-teal-50/50 dark:bg-teal-900/20 border-teal-200/50 dark:border-teal-700/50',
          array: 'from-purple-500 to-fuchsia-500 text-purple-700 dark:text-purple-300 bg-purple-50/50 dark:bg-purple-900/20 border-purple-200/50 dark:border-purple-700/50',
          object: 'from-slate-500 to-gray-500 text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/20 border-slate-200/50 dark:border-slate-700/50',
          default: 'from-gray-500 to-slate-500 text-gray-700 dark:text-gray-300 bg-gray-50/50 dark:bg-gray-900/20 border-gray-200/50 dark:border-gray-700/50'
        };
        
        const currentColorClass = colorClasses[colorScheme];
        const colorParts = currentColorClass.split(' ');
        
        return (
          <div 
            key={key} 
            id={`section-${fieldPath.replace(/[\[\]\.]/g, '-')}`}
            className={cn(
              "group relative rounded-xl border transition-all duration-300 hover:shadow-md",
              colorParts.slice(2).join(' ')
            )}
          >
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className={cn(
                  "w-3 h-3 rounded-full bg-gradient-to-r shadow-sm",
                  colorParts.slice(0, 2).join(' ')
                )}></div>
                <h4 className={cn(
                  "font-semibold text-sm uppercase tracking-wide",
                  colorParts[2], 
                  colorParts[3]
                )}>
                  {highlightText(key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' '))}
                </h4>
                {isArray && (
                  <span className="text-xs px-2 py-1 rounded-full bg-white/60 dark:bg-black/40 text-muted-foreground">
                    {value.length} items
                  </span>
                )}
                {isObject && !isArray && (
                  <span className="text-xs px-2 py-1 rounded-full bg-white/60 dark:bg-black/40 text-muted-foreground">
                    {Object.keys(value).length} fields
                  </span>
                )}
              </div>
              
              <div className={cn(
                "relative",
                !isPrimitive && "pl-4 border-l-2",
                !isPrimitive && colorParts.slice(-2).join(' ')
              )}>
                {renderCompleteData(value, searchQuery, level + 1, fieldPath, onCopy)}
              </div>
            </div>
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
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <div className="text-lg font-medium mb-2">No Data</div>
        <p className="text-sm">Enter valid JSON to see the rendered output</p>
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
    <div className="min-h-screen w-full p-8 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">{getDataTitle()}</h1>
        <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-purple-700 rounded-full mx-auto"></div>
      </div>
      
      <div className="w-full space-y-6">
        {renderCompleteData(data, searchQuery, 0, "", handleCopyValue)}
      </div>
    </div>
  );
}