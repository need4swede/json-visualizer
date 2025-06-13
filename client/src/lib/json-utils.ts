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
  
  // Split the query into words
  const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 0);
  
  // For each query word, check if it appears anywhere in the text (not just word boundaries)
  return queryWords.every(word => normalizedText.includes(word));
}

// Generate a 9-digit random number ID
export function generateShortId(): string {
  // Generate a random number between 100000000 and 999999999 (9 digits)
  const min = 100000000;
  const max = 999999999;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
}

// Store JSON data with a short ID
export function storeJsonData(data: any): string {
  const id = generateShortId();
  const jsonString = JSON.stringify(data);
  localStorage.setItem(`json-data-${id}`, jsonString);
  
  // Clean up old entries (keep only last 20)
  const keys = Object.keys(localStorage).filter(key => key.startsWith('json-data-'));
  if (keys.length > 20) {
    keys.sort((a, b) => {
      const aTime = localStorage.getItem(`${a}-timestamp`) || '0';
      const bTime = localStorage.getItem(`${b}-timestamp`) || '0';
      return parseInt(aTime) - parseInt(bTime);
    });
    keys.slice(0, keys.length - 20).forEach(key => {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}-timestamp`);
    });
  }
  
  localStorage.setItem(`json-data-${id}-timestamp`, Date.now().toString());
  return id;
}

// Retrieve JSON data by short ID
export function retrieveJsonData(id: string): any | null {
  const jsonString = localStorage.getItem(`json-data-${id}`);
  if (!jsonString) return null;
  
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to parse stored JSON:', error);
    return null;
  }
}

// URL utilities for sharing JSON data
export function encodeJsonForUrl(data: any): string {
  return storeJsonData(data);
}

export function decodeJsonFromUrl(id: string): any {
  return retrieveJsonData(id);
}

export function createSectionId(path: string): string {
  return `section-${path.replace(/[\[\]\.]/g, '-')}`;
}

export function scrollToSection(sectionId: string, highlight: boolean = true): void {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (highlight) {
      element.classList.add('highlight-section');
      setTimeout(() => {
        element.classList.remove('highlight-section');
      }, 2000);
    }
  }
}
