import { useState } from "react";
import { Copy, ExternalLink, Mail, Phone, MapPin, Calendar, User, Building2, Globe, Tag, Hash, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { copyToClipboard } from "@/lib/json-utils";
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
}

function DataCard({ title, data, searchQuery, icon }: DataCardProps) {
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
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchQuery.toLowerCase() ? 
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">{part}</mark> : part
    );
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
            {value.map((item, index) => (
              <div key={index} className="p-4 bg-white/50 dark:bg-black/20 rounded-xl border border-white/30 dark:border-white/10">
                {typeof item === 'object' && item !== null ? (
                  <div className="space-y-3">
                    <div className="font-medium text-purple-700 dark:text-purple-300 mb-3">
                      Item {index + 1}
                    </div>
                    {Object.entries(item).map(([k, v]) => (
                      <div key={k} className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground capitalize block">
                          {k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
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
    
    return (
      <Card className="glass-panel border-white/20 dark:border-white/10 w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            {icon}
            <span>{title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {entries.map(([key, value]) => (
            <div key={key} className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground capitalize block">
                {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
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

  return (
    <Card className="glass-panel border-white/20 dark:border-white/10 w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg">
          {icon}
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renderValue(data)}
      </CardContent>
    </Card>
  );
}

function renderCompleteData(data: any, searchQuery?: string, level: number = 0, path: string = ""): React.ReactNode {
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
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchQuery.toLowerCase() ? 
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">{part}</mark> : part
    );
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
      <div className="space-y-4">
        {data.map((item, index) => {
          const itemPath = path ? `${path}[${index}]` : `[${index}]`;
          return (
            <div 
              key={index} 
              id={`section-${itemPath.replace(/[\[\]\.]/g, '-')}`}
              className={cn(
                "p-5 rounded-xl border transition-all duration-300",
                level === 0 ? "bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200/50 dark:border-blue-800/50" : 
                level === 1 ? "bg-gradient-to-r from-green-50/50 to-teal-50/50 dark:from-green-900/20 dark:to-teal-900/20 border-green-200/50 dark:border-green-800/50" :
                "bg-white/40 dark:bg-black/10 border-white/30 dark:border-white/10"
              )}
            >
              <div className="font-semibold text-lg mb-4 flex items-center space-x-2">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white",
                  level === 0 ? "bg-gradient-to-r from-blue-500 to-purple-600" :
                  level === 1 ? "bg-gradient-to-r from-green-500 to-teal-600" :
                  "bg-gradient-to-r from-orange-500 to-red-600"
                )}>
                  {index + 1}
                </div>
                <span className="text-purple-700 dark:text-purple-300">
                  Item {index + 1}
                </span>
              </div>
              {renderCompleteData(item, searchQuery, level + 1, itemPath)}
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
      {entries.map(([key, value]) => {
        const fieldPath = path ? `${path}.${key}` : key;
        return (
          <div 
            key={key} 
            id={`section-${fieldPath.replace(/[\[\]\.]/g, '-')}`}
            className="space-y-3 p-4 rounded-lg bg-white/20 dark:bg-black/10 border border-white/20 dark:border-white/5"
          >
            <label className="text-sm font-semibold text-purple-600 dark:text-purple-400 capitalize block flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</span>
            </label>
            <div className={cn("pl-4 border-l-2 border-purple-200 dark:border-purple-800", level > 0 && "pl-3")}>
              {renderCompleteData(value, searchQuery, level + 1, fieldPath)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function WebPageRenderer({ data, searchQuery }: WebPageRendererProps) {
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
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">{getDataTitle()}</h1>
        <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-purple-700 rounded-full mx-auto"></div>
      </div>
      
      <div className="bg-white/40 dark:bg-black/20 backdrop-blur-sm rounded-2xl border border-white/30 dark:border-white/10 p-6">
        {renderCompleteData(data, searchQuery, 0, "")}
      </div>
    </div>
  );
}