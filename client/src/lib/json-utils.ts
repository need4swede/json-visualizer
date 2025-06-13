export interface JsonStats {
  lines: number;
  size: number;
  objects: number;
}

export function validateJson(input: string): { isValid: boolean; data: any; error?: string } {
  try {
    const trimmed = input.trim();
    if (!trimmed) {
      return { isValid: false, data: null, error: "Empty input" };
    }
    
    const data = JSON.parse(trimmed);
    return { isValid: true, data };
  } catch (error) {
    return { 
      isValid: false, 
      data: null, 
      error: error instanceof Error ? error.message : "Invalid JSON" 
    };
  }
}

export function formatJson(data: any): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch (error) {
    throw new Error("Failed to format JSON");
  }
}

export function calculateStats(jsonString: string, data: any): JsonStats {
  const lines = jsonString.split('\n').length;
  const size = new Blob([jsonString]).size;
  const objects = countObjects(data);
  
  return { lines, size, objects };
}

function countObjects(obj: any, count = 0): number {
  if (typeof obj === 'object' && obj !== null) {
    count++;
    if (Array.isArray(obj)) {
      return obj.reduce((acc: number, item) => countObjects(item, acc), count);
    } else {
      return Object.values(obj).reduce((acc: number, item) => countObjects(item, acc), count);
    }
  }
  return count;
}

export function downloadJson(data: any, filename: string = 'parsed.json') {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return Promise.resolve();
  }
}

// Search utility functions for handling spaces and underscores
export function normalizeSearchText(text: string): string {
  return text.replace(/[\s_]+/g, ' ').toLowerCase().trim();
}

export function createSearchRegex(searchQuery: string): RegExp {
  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = escapeRegex(searchQuery).replace(/[\s_]+/g, '[\\s_]+');
  return new RegExp(`(${pattern})`, 'gi');
}

export function matchesSearchQuery(text: string, searchQuery: string): boolean {
  if (!searchQuery) return true;
  return normalizeSearchText(text).includes(normalizeSearchText(searchQuery));
}
