import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeSearchText, createSearchRegex, matchesSearchQuery, getSearchHighlights } from "@/lib/json-utils";

interface JsonTreeProps {
  data: any;
  searchQuery?: string;
  onNodeClick?: (path: string, value: any) => void;
}

interface JsonNodeProps {
  name: string;
  value: any;
  level: number;
  path: string;
  searchQuery?: string;
  onNodeClick?: (path: string, value: any) => void;
}

function JsonNode({ name, value, level, path, searchQuery, onNodeClick }: JsonNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  
  const isObject = typeof value === 'object' && value !== null && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isExpandable = isObject || isArray;
  const isEmpty = isExpandable && Object.keys(value).length === 0;
  
  const handleToggle = () => {
    if (isExpandable && !isEmpty) {
      setIsExpanded(!isExpanded);
    }
  };
  
  const handleClick = () => {
    onNodeClick?.(path, value);
  };
  
  const getValueDisplay = () => {
    if (value === null) return <span className="json-null">null</span>;
    if (typeof value === 'string') return <span className="json-string">"{value}"</span>;
    if (typeof value === 'number') return <span className="json-number">{value}</span>;
    if (typeof value === 'boolean') return <span className="json-boolean">{value.toString()}</span>;
    if (isArray) return <span className="text-muted-foreground">[{value.length}]</span>;
    if (isObject) return <span className="text-muted-foreground">{`{${Object.keys(value).length}}`}</span>;
    return <span>{String(value)}</span>;
  };
  
  const highlightText = (text: string) => {
    if (!searchQuery) return text;
    
    const highlights = getSearchHighlights(text, searchQuery);
    if (highlights.length === 0) return text;
    
    const parts: React.ReactNode[] = [];
    let currentPos = 0;
    
    highlights.forEach((highlight, i) => {
      if (highlight.start > currentPos) {
        parts.push(text.slice(currentPos, highlight.start));
      }
      
      parts.push(
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800">
          {highlight.word}
        </mark>
      );
      
      currentPos = highlight.end;
    });
    
    if (currentPos < text.length) {
      parts.push(text.slice(currentPos));
    }
    
    return parts;
  };

  return (
    <div className="font-mono text-sm">
      <div 
        className={cn(
          "flex items-center space-x-2 py-1 px-2 rounded cursor-pointer transition-colors",
          "hover:bg-white/10 dark:hover:bg-white/5",
          level > 0 && "ml-4"
        )}
        onClick={handleClick}
      >
        <div className="w-3 h-3 flex items-center justify-center">
          {isExpandable && !isEmpty && (
            <button onClick={(e) => { e.stopPropagation(); handleToggle(); }}>
              {isExpanded ? 
                <ChevronDown className="w-3 h-3 text-muted-foreground" /> : 
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
              }
            </button>
          )}
        </div>
        
        <span className="json-key">
          {highlightText(`"${name}"`)}
        </span>
        <span className="text-muted-foreground">:</span>
        {getValueDisplay()}
      </div>
      
      {isExpandable && !isEmpty && isExpanded && (
        <div className="ml-4">
          {isArray ? 
            value.map((item: any, index: number) => (
              <JsonNode
                key={index}
                name={`[${index}]`}
                value={item}
                level={level + 1}
                path={`${path}[${index}]`}
                searchQuery={searchQuery}
                onNodeClick={onNodeClick}
              />
            )) :
            Object.entries(value).map(([key, val]) => (
              <JsonNode
                key={key}
                name={key}
                value={val}
                level={level + 1}
                path={`${path}.${key}`}
                searchQuery={searchQuery}
                onNodeClick={onNodeClick}
              />
            ))
          }
        </div>
      )}
    </div>
  );
}

export function JsonTree({ data, searchQuery, onNodeClick }: JsonTreeProps) {
  if (data === null || data === undefined) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No JSON data to display
      </div>
    );
  }

  if (typeof data === 'object') {
    return (
      <div className="h-full overflow-auto custom-scrollbar">
        {Array.isArray(data) ? 
          data.map((item, index) => (
            <JsonNode
              key={index}
              name={`[${index}]`}
              value={item}
              level={0}
              path={`[${index}]`}
              searchQuery={searchQuery}
              onNodeClick={onNodeClick}
            />
          )) :
          Object.entries(data).map(([key, value]) => (
            <JsonNode
              key={key}
              name={key}
              value={value}
              level={0}
              path={key}
              searchQuery={searchQuery}
              onNodeClick={onNodeClick}
            />
          ))
        }
      </div>
    );
  }

  return (
    <div className="font-mono text-sm p-4">
      <JsonNode
        name="root"
        value={data}
        level={0}
        path="root"
        searchQuery={searchQuery}
        onNodeClick={onNodeClick}
      />
    </div>
  );
}
