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
        <div className="space-y-2">
          <Badge variant="outline" className="text-xs mb-2">
            {value.length} items
          </Badge>
          <div className="grid gap-2">
            {value.map((item, index) => (
              <div key={index} className="p-3 bg-white/50 dark:bg-black/20 rounded-lg border border-white/30 dark:border-white/10">
                {typeof item === 'object' ? (
                  <div className="grid gap-2">
                    {Object.entries(item).map(([k, v]) => (
                      <div key={k} className="flex justify-between items-start">
                        <span className="text-sm font-medium text-muted-foreground capitalize">
                          {k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}:
                        </span>
                        <div className="text-sm">{renderValue(v, k)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  renderValue(item)
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
      <Card className="glass-panel border-white/20 dark:border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            {icon}
            <span>{title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {entries.map(([key, value]) => (
            <div key={key} className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground capitalize">
                {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
              </label>
              <div className="text-sm">
                {renderValue(value, key)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-panel border-white/20 dark:border-white/10">
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

export function WebPageRenderer({ data, searchQuery }: WebPageRendererProps) {
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
      <div className="p-6 max-w-2xl mx-auto">
        <DataCard
          title="Value"
          data={data}
          searchQuery={searchQuery}
          icon={<Hash className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
        />
      </div>
    );
  }

  // Handle arrays at root level
  if (Array.isArray(data)) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Data Collection</h1>
          <Badge variant="outline" className="text-sm">
            {data.length} items
          </Badge>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.map((item, index) => (
            <DataCard
              key={index}
              title={`Item ${index + 1}`}
              data={item}
              searchQuery={searchQuery}
              icon={<Tag className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
            />
          ))}
        </div>
      </div>
    );
  }

  // Handle objects at root level
  const entries = Object.entries(data);
  
  // Try to determine content type for better icons
  const getIcon = (key: string) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('user') || lowerKey.includes('person') || lowerKey.includes('profile')) {
      return <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
    }
    if (lowerKey.includes('company') || lowerKey.includes('organization') || lowerKey.includes('business')) {
      return <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
    }
    if (lowerKey.includes('address') || lowerKey.includes('location')) {
      return <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
    }
    if (lowerKey.includes('contact') || lowerKey.includes('email') || lowerKey.includes('phone')) {
      return <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
    }
    return <Tag className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Data Overview</h1>
        <Badge variant="outline" className="text-sm">
          {entries.length} sections
        </Badge>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        {entries.map(([key, value]) => (
          <DataCard
            key={key}
            title={key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            data={value}
            searchQuery={searchQuery}
            icon={getIcon(key)}
          />
        ))}
      </div>
    </div>
  );
}