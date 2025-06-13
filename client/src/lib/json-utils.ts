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
  // Split the search query by spaces/underscores and create individual word patterns
  const words = searchQuery.trim().split(/[\s_]+/).filter(word => word.length > 0);
  if (words.length === 0) return new RegExp('', 'gi');
  
  // Create pattern that matches each word individually for highlighting
  const wordPatterns = words.map(word => escapeRegex(word));
  const pattern = wordPatterns.join('|');
  return new RegExp(`(${pattern})`, 'gi');
}

export function getSearchHighlights(text: string, searchQuery: string): {start: number, end: number, word: string}[] {
  if (!searchQuery) return [];
  
  const words = searchQuery.trim().split(/[\s_]+/).filter(word => word.length > 0);
  if (words.length === 0) return [];
  
  const highlights: {start: number, end: number, word: string}[] = [];
  
  // Find all matches for each search word
  words.forEach(word => {
    const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      highlights.push({
        start: match.index,
        end: match.index + match[0].length,
        word: match[0]
      });
    }
  });
  
  // Sort highlights by position and remove overlaps
  highlights.sort((a, b) => a.start - b.start);
  
  return highlights;
}

export function matchesSearchQuery(text: string, searchQuery: string): boolean {
  if (!searchQuery) return true;
  
  const normalizedText = normalizeSearchText(text);
  const normalizedQuery = normalizeSearchText(searchQuery);
  
  // If the query contains spaces, split into words and check each word
  const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 0);
  
  if (queryWords.length > 1) {
    // For multi-word queries, check if all words appear in the text (can be partial matches)
    return queryWords.every(word => {
      // Split the text into words and check if any word starts with the search word
      const textWords = normalizedText.split(/\s+/);
      return textWords.some(textWord => textWord.startsWith(word));
    });
  } else {
    // For single word queries, check if it appears anywhere in the text
    return normalizedText.includes(normalizedQuery);
  }
}
