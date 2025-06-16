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

export function getSearchHighlights(text: string, searchQuery: string): { start: number, end: number, word: string }[] {
  if (!searchQuery) return [];

  const words = searchQuery.trim().split(/[\s_]+/).filter(word => word.length > 0);
  if (words.length === 0) return [];

  const highlights: { start: number, end: number, word: string }[] = [];

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

// Store JSON data with a short ID using backend API
export async function storeJsonData(data: any, expirationHours: number = 48): Promise<string> {
  const id = generateShortId();
  const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);

  try {
    const response = await fetch('/api/json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, data, expiresAt }),
    });

    if (!response.ok) {
      throw new Error('Failed to store JSON data');
    }

    return id;
  } catch (error) {
    console.error('Error storing JSON data:', error);
    // Fallback to localStorage for offline functionality
    const jsonString = JSON.stringify(data);
    localStorage.setItem(`json-data-${id}`, jsonString);
    localStorage.setItem(`json-data-${id}-timestamp`, Date.now().toString());
    localStorage.setItem(`json-data-${id}-expires`, expiresAt.toISOString());
    return id;
  }
}

// Retrieve JSON data by short ID from backend API
export async function retrieveJsonData(id: string): Promise<any | null> {
  try {
    const response = await fetch(`/api/json/${id}`);

    if (!response.ok) {
      if (response.status === 404) {
        // Try localStorage fallback
        return getFromLocalStorageWithExpiration(id);
      }
      return null;
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error retrieving JSON data:', error);
    // Fallback to localStorage
    return getFromLocalStorageWithExpiration(id);
  }
}

// Helper function to get data from localStorage with expiration check
function getFromLocalStorageWithExpiration(id: string): any | null {
  const jsonString = localStorage.getItem(`json-data-${id}`);
  const expiresString = localStorage.getItem(`json-data-${id}-expires`);

  if (jsonString) {
    // Check if expiration data exists and if data has expired
    if (expiresString) {
      const expiresAt = new Date(expiresString);
      if (new Date() > expiresAt) {
        // Data has expired, clean it up
        localStorage.removeItem(`json-data-${id}`);
        localStorage.removeItem(`json-data-${id}-timestamp`);
        localStorage.removeItem(`json-data-${id}-expires`);
        return null;
      }
    }

    try {
      return JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse localStorage JSON:', parseError);
      // Clean up corrupted data
      localStorage.removeItem(`json-data-${id}`);
      localStorage.removeItem(`json-data-${id}-timestamp`);
      localStorage.removeItem(`json-data-${id}-expires`);
    }
  }

  return null;
}

// URL utilities for sharing JSON data
export async function encodeJsonForUrl(data: any): Promise<string> {
  return await storeJsonData(data);
}

export async function decodeJsonFromUrl(id: string): Promise<any> {
  return await retrieveJsonData(id);
}

export function createSectionId(path: string): string {
  return `section-${path.replace(/[\[\]\.]/g, '-')}`;
}

export function scrollToSection(sectionId: string, highlight: boolean = true): void {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (highlight) {
      // Wait a bit to ensure scrolling is complete and elements are positioned
      setTimeout(() => {
        // Find the main content container
        const mainContainer = document.querySelector('.w-full.max-w-6xl.mx-auto.space-y-8') ||
          document.querySelector('.space-y-8') ||
          document.querySelector('.space-y-6') ||
          element.parentElement;

        if (mainContainer) {
          // Get all apple-card elements in the main container
          const allCards = Array.from(mainContainer.querySelectorAll('.apple-card'));
          const targetCard = element.closest('.apple-card');

          if (targetCard && allCards.length > 0) {
            // Clear any existing animations first
            allCards.forEach(card => {
              (card as HTMLElement).classList.remove('fade-siblings', 'focus-highlight');
            });

            // Force a reflow to ensure classes are cleared
            void (targetCard as HTMLElement).offsetHeight;

            // Add shiny border to target card FIRST with explicit opacity protection
            targetCard.classList.add('focus-highlight');
            (targetCard as HTMLElement).style.opacity = '1';

            // Then fade all other cards (with delay to ensure target is fully protected)
            setTimeout(() => {
              allCards.forEach(card => {
                if (card !== targetCard) {
                  // Double-check target isn't getting faded
                  if (!card.classList.contains('focus-highlight')) {
                    (card as HTMLElement).classList.add('fade-siblings');
                  }
                }
              });
            }, 100);

            // After 2.5 seconds, restore everything
            setTimeout(() => {
              allCards.forEach(card => {
                (card as HTMLElement).classList.remove('fade-siblings');
                (card as HTMLElement).style.opacity = '';
              });
              targetCard.classList.remove('focus-highlight');
              (targetCard as HTMLElement).style.opacity = '';
            }, 2500);
          }
        }
      }, 200);
    }
  }
}
