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
  // Safari requires user interaction for clipboard access
  if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
    return navigator.clipboard.writeText(text).catch((error) => {
      console.warn('Clipboard API failed, using fallback:', error);
      return fallbackCopyToClipboard(text);
    });
  } else {
    return fallbackCopyToClipboard(text);
  }
}

function fallbackCopyToClipboard(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.left = '-9999px';
    textArea.style.opacity = '0';
    textArea.setAttribute('readonly', '');
    
    document.body.appendChild(textArea);
    
    // For Safari/iOS, we need to handle selection differently
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      const range = document.createRange();
      range.selectNodeContents(textArea);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      textArea.setSelectionRange(0, textArea.value.length);
    } else {
      textArea.select();
      textArea.setSelectionRange(0, textArea.value.length);
    }
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        resolve();
      } else {
        reject(new Error('Copy command failed'));
      }
    } catch (error) {
      reject(error);
    } finally {
      document.body.removeChild(textArea);
    }
  });
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

// Check if Web Crypto API is available (Safari has specific requirements)
function isCryptoAvailable(): boolean {
  const hasCrypto = typeof crypto !== 'undefined';
  const hasSubtle = crypto && crypto.subtle !== undefined;
  const isSecure = window.isSecureContext;
  
  // Safari-specific checks
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  if (isSafari) {
    console.log('Safari detected - checking crypto availability...');
    console.log('Crypto:', hasCrypto, 'Subtle:', hasSubtle, 'Secure:', isSecure);
    console.log('Location origin:', window.location.origin);
    console.log('Is localhost:', window.location.hostname === 'localhost');
    
    // Safari blocks crypto in certain contexts
    if (!isSecure) {
      console.log('Safari: Not secure context - crypto blocked');
      return false;
    }
    
    if (!hasSubtle) {
      console.log('Safari: No subtle crypto API');
      return false;
    }
    
    // Safari sometimes has crypto available but restricted
    try {
      // Test if we can actually use the crypto API
      if (hasSubtle && isSecure) {
        console.log('Safari: Basic crypto checks passed');
        return true;
      }
    } catch (error) {
      console.warn('Safari crypto test failed:', error);
      return false;
    }
  }
  
  return hasCrypto && hasSubtle && isSecure;
}

// Encryption utilities using Web Crypto API
async function generateEncryptionKey(): Promise<CryptoKey> {
  // Safari requires HTTPS for Web Crypto API
  if (!isCryptoAvailable()) {
    throw new Error('Web Crypto API requires HTTPS. Encryption not available on HTTP.');
  }
  
  try {
    console.log('Safari: Attempting to generate AES-GCM key...');
    console.log('Safari: Crypto subtle object:', crypto.subtle);
    console.log('Safari: generateKey method exists:', typeof crypto.subtle.generateKey);
    
    const key = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    );
    
    console.log('Safari: Successfully generated encryption key');
    console.log('Safari: Key type:', key.type);
    console.log('Safari: Key algorithm:', key.algorithm);
    return key;
  } catch (error) {
    console.error('Safari: Crypto generation failed');
    console.error('Safari: Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Safari: Error message:', error instanceof Error ? error.message : String(error));
    console.error('Safari: Full error:', error);
    
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Safari encryption blocked: ${message}`);
  }
}

async function exportKey(key: CryptoKey): Promise<string> {
  try {
    const exported = await crypto.subtle.exportKey('raw', key);
    const uint8Array = new Uint8Array(exported);
    let binaryString = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binaryString += String.fromCharCode(uint8Array[i]);
    }
    const base64Key = btoa(binaryString);
    console.log('Exported key length:', base64Key.length);
    return base64Key;
  } catch (error) {
    console.error('Error exporting key:', error);
    throw error;
  }
}

async function importKey(keyString: string): Promise<CryptoKey> {
  const keyData = new Uint8Array(
    atob(keyString).split('').map(char => char.charCodeAt(0))
  );
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
}

async function encryptData(data: any, key: CryptoKey): Promise<{ encryptedData: string; iv: string }> {
  const jsonString = JSON.stringify(data);
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(jsonString);
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedData
  );
  
  const encryptedArray = new Uint8Array(encrypted);
  const ivArray = new Uint8Array(iv);
  
  let encryptedString = '';
  for (let i = 0; i < encryptedArray.length; i++) {
    encryptedString += String.fromCharCode(encryptedArray[i]);
  }
  
  let ivString = '';
  for (let i = 0; i < ivArray.length; i++) {
    ivString += String.fromCharCode(ivArray[i]);
  }
  
  return {
    encryptedData: btoa(encryptedString),
    iv: btoa(ivString)
  };
}

async function decryptData(encryptedData: string, iv: string, key: CryptoKey): Promise<any> {
  const encryptedBytes = new Uint8Array(
    atob(encryptedData).split('').map(char => char.charCodeAt(0))
  );
  const ivBytes = new Uint8Array(
    atob(iv).split('').map(char => char.charCodeAt(0))
  );
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes },
    key,
    encryptedBytes
  );
  
  const decoder = new TextDecoder();
  const jsonString = decoder.decode(decrypted);
  return JSON.parse(jsonString);
}

// Store JSON data with client-side encryption (if available)
export async function storeJsonData(data: any, expirationHours: number = 48): Promise<{ id: string; key: string }> {
  const id = generateShortId();
  const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);

  console.log('Generated ID:', id, 'Type:', typeof id);

  // Check if encryption is available (Safari requires HTTPS)
  if (!isCryptoAvailable()) {
    console.warn('Encryption not available - falling back to unencrypted storage');
    
    // Store unencrypted data with warning
    const response = await fetch('/api/json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        id, 
        data: { 
          unencryptedData: data,
          warning: 'Data stored without encryption - HTTPS required for encryption'
        },
        expiresAt 
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to store JSON data');
    }

    console.log('SAFARI FALLBACK: Using unencrypted storage');
    return { id, key: 'no-encryption' };
  }

  try {
    // Generate encryption key and encrypt data client-side
    const encryptionKey = await generateEncryptionKey();
    const keyString = await exportKey(encryptionKey);
    
    console.log('Generated key string:', keyString, 'Type:', typeof keyString);
    console.log('Key string length:', keyString.length);
    
    const { encryptedData, iv } = await encryptData(data, encryptionKey);

    // Store only encrypted data on server
    const response = await fetch('/api/json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        id, 
        data: { encryptedData, iv }, // Server never sees original data
        expiresAt 
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to store JSON data');
    }

    const result = { id, key: keyString };
    console.log('Final result:', result);
    console.log('Result type:', typeof result);
    console.log('Result keys:', Object.keys(result));
    
    return result;
  } catch (error) {
    console.error('Error storing JSON data:', error);
    // Fallback to localStorage with encryption
    const encryptionKey = await generateEncryptionKey();
    const keyString = await exportKey(encryptionKey);
    const { encryptedData, iv } = await encryptData(data, encryptionKey);
    
    localStorage.setItem(`json-data-${id}`, JSON.stringify({ encryptedData, iv }));
    localStorage.setItem(`json-data-${id}-timestamp`, Date.now().toString());
    localStorage.setItem(`json-data-${id}-expires`, expiresAt.toISOString());
    localStorage.setItem(`json-data-${id}-key`, keyString);
    
    return { id, key: keyString };
  }
}

// Retrieve and decrypt JSON data by ID and key
export async function retrieveJsonData(id: string, key?: string): Promise<any | null> {
  console.log('SAFARI RETRIEVE DEBUG:');
  console.log('Fetching ID:', id);
  console.log('With key:', key ? 'YES' : 'NO');
  console.log('Key value:', key);
  
  try {
    const response = await fetch(`/api/json/${id}`);
    console.log('Server response status:', response.status);

    if (!response.ok) {
      console.log('Server request failed, trying localStorage');
      if (response.status === 404) {
        // Try localStorage fallback with decryption
        return await getFromLocalStorageWithExpiration(id, key);
      }
      return null;
    }

    const result = await response.json();
    console.log('Server response:', result);
    const encryptedPayload = result.data;
    console.log('Encrypted payload:', encryptedPayload);
    
    // If no key provided or data is not encrypted, return just the data content (backward compatibility)
    if (!key || !encryptedPayload.encryptedData || !encryptedPayload.iv) {
      // For unencrypted data, return just the data content, not the server metadata
      return encryptedPayload;
    }
    
    // Decrypt the data using the provided key
    const decryptionKey = await importKey(key);
    const decryptedData = await decryptData(
      encryptedPayload.encryptedData,
      encryptedPayload.iv,
      decryptionKey
    );
    
    return decryptedData;
  } catch (error) {
    console.error('Error retrieving JSON data:', error);
    // Fallback to localStorage with decryption
    return await getFromLocalStorageWithExpiration(id, key);
  }
}

// Helper function to get data from localStorage with expiration check and decryption
async function getFromLocalStorageWithExpiration(id: string, key?: string): Promise<any | null> {
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
      const encryptedPayload = JSON.parse(jsonString);
      const storedKey = localStorage.getItem(`json-data-${id}-key`);
      
      // If no key available or data is not encrypted, return as-is
      const decryptionKey = key || (storedKey ?? undefined);
      if (!decryptionKey || !encryptedPayload.encryptedData || !encryptedPayload.iv) {
        return encryptedPayload;
      }
      
      // Decrypt the data
      const cryptoKey = await importKey(decryptionKey);
      const decryptedData = await decryptData(
        encryptedPayload.encryptedData,
        encryptedPayload.iv,
        cryptoKey
      );
      
      return decryptedData;
    } catch (parseError) {
      console.error('Failed to parse/decrypt localStorage JSON:', parseError);
      // Clean up corrupted data
      localStorage.removeItem(`json-data-${id}`);
      localStorage.removeItem(`json-data-${id}-timestamp`);
      localStorage.removeItem(`json-data-${id}-expires`);
      localStorage.removeItem(`json-data-${id}-key`);
    }
  }

  return null;
}

// URL utilities for sharing encrypted JSON data
export async function encodeJsonForUrl(data: any): Promise<string> {
  const { id, key } = await storeJsonData(data);
  return `${id}#key=${key}`;
}

export async function decodeJsonFromUrl(id: string): Promise<any> {
  console.log('SAFARI DECRYPTION DEBUG:');
  console.log('URL:', window.location.href);
  console.log('Hash:', window.location.hash);
  console.log('ID:', id);
  
  const key = extractKeyFromUrl();
  console.log('Extracted key:', key);
  console.log('Key length:', key?.length);
  
  if (!key) {
    console.log('No key found in URL - trying unencrypted data');
  }
  
  const result = await retrieveJsonData(id, key || undefined);
  console.log('Decryption result:', result ? 'SUCCESS' : 'FAILED');
  return result;
}

// Extract encryption key from URL fragment
export function extractKeyFromUrl(): string | null {
  const hash = window.location.hash;
  if (!hash) return null;
  
  const match = hash.match(/key=([^&]+)/);
  return match ? match[1] : null;
}

// Extract section from URL fragment
export function extractSectionFromUrl(): string | null {
  const hash = window.location.hash;
  if (!hash) return null;
  
  const sectionMatch = hash.match(/section=([^&]+)/);
  if (sectionMatch) {
    return sectionMatch[1];
  }
  
  // If no section parameter, check if the entire hash is a section ID
  const hashWithoutHash = hash.substring(1);
  if (hashWithoutHash.startsWith('section-')) {
    return hashWithoutHash;
  }
  
  return null;
}

// Create shareable URL with encrypted data and key in fragment
export function createShareableUrl(id: string, key: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/${id}#key=${key}`;
}

export function createSectionId(path: string): string {
  return `section-${path.replace(/[\[\]\.]/g, '-')}`;
}

// Create anchor URL with encryption key preserved
export function createAnchorUrl(sectionId: string): string {
  const url = new URL(window.location.href);
  const currentHash = url.hash;
  
  // Extract existing key from current URL
  const keyMatch = currentHash.match(/key=([^&]+)/);
  const key = keyMatch ? keyMatch[1] : null;
  
  // Create new hash with both key and section
  if (key) {
    url.hash = `key=${key}&section=${sectionId}`;
  } else {
    url.hash = sectionId;
  }
  
  return url.toString();
}

export function scrollToSection(sectionId: string, highlight: boolean = true): void {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (highlight) {
      setTimeout(() => {
        const mainContainer = document.querySelector('.w-full.max-w-6xl.mx-auto.space-y-8') ||
          document.querySelector('.space-y-8') ||
          document.querySelector('.space-y-6') ||
          element.parentElement;

        if (mainContainer) {
          const targetCard = element.closest('.apple-card') as HTMLElement;
          
          if (targetCard) {
            const allCards = Array.from(mainContainer.querySelectorAll('.apple-card')) as HTMLElement[];
            
            // Clear any existing animations
            allCards.forEach(card => {
              card.classList.remove('fade-siblings', 'focus-highlight', 'animation-target');
              card.style.removeProperty('opacity');
              card.style.removeProperty('transition');
              card.removeAttribute('data-target-protected');
            });

            // Mark target with special class that prevents any opacity changes
            targetCard.classList.add('focus-highlight', 'animation-target');
            targetCard.setAttribute('data-target-protected', 'true');
            
            // Use CSS custom property approach for cleaner animation
            (mainContainer as HTMLElement).style.setProperty('--animation-active', '1');
            
            // Apply animation classes
            setTimeout(() => {
              allCards.forEach(card => {
                if (card !== targetCard) {
                  card.classList.add('fade-siblings');
                } else {
                  // Ensure target always stays visible with multiple protection layers
                  card.style.setProperty('opacity', '1', 'important');
                  card.style.setProperty('visibility', 'visible', 'important');
                  card.style.setProperty('z-index', '999', 'important');
                }
              });
            }, 100);

            // Cleanup after animation
            setTimeout(() => {
              allCards.forEach(card => {
                card.classList.remove('fade-siblings', 'focus-highlight', 'animation-target');
                card.style.removeProperty('opacity');
                card.style.removeProperty('visibility');
                card.style.removeProperty('z-index');
                card.removeAttribute('data-target-protected');
              });
              (mainContainer as HTMLElement).style.removeProperty('--animation-active');
            }, 2500);
          }
        }
      }, 200);
    }
  }
}
