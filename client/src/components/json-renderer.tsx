import { useState } from "react";
import { ChevronRight, ChevronDown, Copy, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { copyToClipboard } from "@/lib/json-utils";
import { useToast } from "@/hooks/use-toast";

interface JsonRendererProps {
  data: any;
  searchQuery?: string;
}

interface JsonPropertyProps {
  label: string;
  value: any;
  level: number;
  path: string;
  searchQuery?: string;
}

function JsonProperty({ label, value, level, path, searchQuery }: JsonPropertyProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const { toast } = useToast();
  
  const isObject = typeof value === 'object' && value !== null && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isExpandable = (isObject || isArray) && Object.keys(value).length > 0;
  const isUrl = typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'));
  const isEmail = typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  
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

  const renderValue = () => {
    if (value === null) {
      return <span className="text-muted-foreground italic">null</span>;
    }
    
    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? "default" : "secondary"} className="font-mono">
          {value.toString()}
        </Badge>
      );
    }
    
    if (typeof value === 'number') {
      return (
        <span className="font-mono text-orange-600 dark:text-orange-400 font-medium">
          {value.toLocaleString()}
        </span>
      );
    }
    
    if (typeof value === 'string') {
      if (isUrl) {
        return (
          <div className="flex items-center space-x-2">
            <a 
              href={value} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
            >
              <span>{highlightText(value)}</span>
              <ExternalLink className="w-3 h-3" />
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
          <div className="flex items-center space-x-2">
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
      
      return (
        <div className="flex items-center space-x-2 group">
          <span className="text-green-700 dark:text-green-400">
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
    
    if (isArray) {
      return (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              Array ({value.length} items)
            </Badge>
          </div>
          {isExpanded && (
            <div className="ml-4 space-y-3 border-l-2 border-blue-200 dark:border-blue-800 pl-4">
              {value.map((item, index) => (
                <JsonProperty
                  key={index}
                  label={`[${index}]`}
                  value={item}
                  level={level + 1}
                  path={`${path}[${index}]`}
                  searchQuery={searchQuery}
                />
              ))}
            </div>
          )}
        </div>
      );
    }
    
    if (isObject) {
      const entries = Object.entries(value);
      return (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              Object ({entries.length} properties)
            </Badge>
          </div>
          {isExpanded && (
            <div className="ml-4 space-y-3 border-l-2 border-purple-200 dark:border-purple-800 pl-4">
              {entries.map(([key, val]) => (
                <JsonProperty
                  key={key}
                  label={key}
                  value={val}
                  level={level + 1}
                  path={`${path}.${key}`}
                  searchQuery={searchQuery}
                />
              ))}
            </div>
          )}
        </div>
      );
    }
    
    return <span>{String(value)}</span>;
  };

  return (
    <div className="group">
      <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          {isExpandable && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-shrink-0 p-1 hover:bg-white/20 dark:hover:bg-white/10 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          )}
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-3 mb-1">
              <h3 className="font-medium text-blue-700 dark:text-blue-300 truncate">
                {highlightText(label)}
              </h3>
              {typeof value === 'string' && value.length > 50 && (
                <Badge variant="secondary" className="text-xs">
                  {value.length} chars
                </Badge>
              )}
            </div>
            <div className="text-sm">
              {renderValue()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function JsonRenderer({ data, searchQuery }: JsonRendererProps) {
  if (data === null || data === undefined) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <div className="text-lg font-medium mb-2">No Data</div>
        <p className="text-sm">Enter valid JSON to see the rendered output</p>
      </div>
    );
  }

  // Handle primitive values at root level
  if (typeof data !== 'object') {
    return (
      <div className="p-6">
        <JsonProperty
          label="Root Value"
          value={data}
          level={0}
          path="root"
          searchQuery={searchQuery}
        />
      </div>
    );
  }

  // Handle arrays at root level
  if (Array.isArray(data)) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center space-x-3 mb-6">
          <h2 className="text-xl font-semibold text-foreground">Array Data</h2>
          <Badge variant="outline">
            {data.length} items
          </Badge>
        </div>
        <div className="space-y-3">
          {data.map((item, index) => (
            <JsonProperty
              key={index}
              label={`Item ${index + 1}`}
              value={item}
              level={0}
              path={`[${index}]`}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      </div>
    );
  }

  // Handle objects at root level
  const entries = Object.entries(data);
  
  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <h2 className="text-xl font-semibold text-foreground">JSON Data</h2>
        <Badge variant="outline">
          {entries.length} properties
        </Badge>
      </div>
      
      <div className="space-y-4">
        {entries.map(([key, value]) => (
          <JsonProperty
            key={key}
            label={key}
            value={value}
            level={0}
            path={key}
            searchQuery={searchQuery}
          />
        ))}
      </div>
    </div>
  );
}