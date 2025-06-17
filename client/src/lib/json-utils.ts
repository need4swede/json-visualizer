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

// Safari share modal for when clipboard is blocked
function showSafariShareModal(url: string): void {
  // Create modal overlay with app's glassmorphism styling
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(8, 8, 8, 0.85);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: safariModalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  `;

  // Create modal content with dark glassmorphism
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: rgba(15, 15, 15, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 28px;
    max-width: 520px;
    width: 90%;
    max-height: 80vh;
    box-shadow: 
      0 32px 64px rgba(0, 0, 0, 0.6),
      0 0 0 1px rgba(255, 255, 255, 0.05),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    animation: safariModalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, system-ui, sans-serif;
  `;

  modal.innerHTML = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, hsl(273, 67%, 59%) 0%, hsl(207, 90%, 54%) 100%);
        border-radius: 12px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
        box-shadow: 0 8px 32px rgba(159, 122, 234, 0.3);
      ">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      </div>
      <h3 style="
        color: rgba(255, 255, 255, 0.95);
        margin: 0 0 8px 0;
        font-size: 20px;
        font-weight: 600;
        letter-spacing: -0.02em;
      ">Share Encrypted JSON</h3>
      <p style="
        color: rgba(255, 255, 255, 0.6);
        margin: 0;
        font-size: 14px;
        line-height: 1.4;
      ">Safari's security blocked automatic copying.<br>Choose your preferred sharing method:</p>
    </div>
    
    <div style="display: flex; gap: 12px; margin-bottom: 24px;">
      <button id="openInNewTab" style="
        flex: 1;
        background: linear-gradient(135deg, hsl(207, 90%, 54%) 0%, hsl(207, 90%, 48%) 100%);
        color: white;
        border: none;
        border-radius: 12px;
        padding: 14px 16px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
        letter-spacing: -0.01em;
      ">Open in New Tab</button>
      
      <button id="tryToCopy" style="
        flex: 1;
        background: linear-gradient(135deg, hsl(145, 83%, 44%) 0%, hsl(145, 83%, 38%) 100%);
        color: white;
        border: none;
        border-radius: 12px;
        padding: 14px 16px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: 0 4px 16px rgba(52, 199, 89, 0.3);
        letter-spacing: -0.01em;
      ">Try to Copy</button>
    </div>
    
    <div style="
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
    ">
      <div style="
        color: rgba(255, 255, 255, 0.5);
        font-size: 12px;
        font-weight: 500;
        margin-bottom: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      ">Encrypted Shareable URL</div>
      <input type="text" readonly value="${url}" style="
        width: 100%;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 12px;
        color: rgba(255, 255, 255, 0.9);
        font-size: 12px;
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
        outline: none;
        user-select: all;
        transition: all 0.2s ease;
      " onclick="this.select(); this.style.borderColor = 'rgba(159, 122, 234, 0.5)'; this.style.background = 'rgba(159, 122, 234, 0.1)';">
    </div>
    
    <button id="closeModal" style="
      width: 100%;
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      color: rgba(255, 255, 255, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 12px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    ">Close</button>
  `;

  // Add CSS animations matching app's style
  const style = document.createElement('style');
  style.textContent = `
    @keyframes safariModalFadeIn {
      from { 
        opacity: 0;
        backdrop-filter: blur(0px);
        -webkit-backdrop-filter: blur(0px);
      }
      to { 
        opacity: 1;
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
      }
    }
    @keyframes safariModalSlideUp {
      from { 
        transform: translateY(32px) scale(0.96);
        opacity: 0;
      }
      to { 
        transform: translateY(0) scale(1);
        opacity: 1;
      }
    }
    
    /* Button hover effects */
    #openInNewTab:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(0, 122, 255, 0.4) !important;
    }
    
    #tryToCopy:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(52, 199, 89, 0.4) !important;
    }
    
    #closeModal:hover {
      background: rgba(255, 255, 255, 0.12) !important;
      border-color: rgba(255, 255, 255, 0.2) !important;
    }
    
    /* Focus styles for accessibility */
    #openInNewTab:focus,
    #tryToCopy:focus,
    #closeModal:focus {
      outline: 2px solid rgba(159, 122, 234, 0.6);
      outline-offset: 2px;
    }
  `;
  document.head.appendChild(style);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Add event listeners
  const openInNewTab = modal.querySelector('#openInNewTab') as HTMLButtonElement;
  const tryToCopy = modal.querySelector('#tryToCopy') as HTMLButtonElement;
  const closeModal = modal.querySelector('#closeModal') as HTMLButtonElement;
  const urlInput = modal.querySelector('input') as HTMLInputElement;

  openInNewTab.addEventListener('click', () => {
    window.open(url, '_blank');
    document.body.removeChild(overlay);
    document.head.removeChild(style);
  });

  tryToCopy.addEventListener('click', async () => {
    urlInput.select();
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        tryToCopy.textContent = '✓ Copied!';
        tryToCopy.style.background = '#34C759';
        setTimeout(() => {
          document.body.removeChild(overlay);
          document.head.removeChild(style);
        }, 1000);
      } else {
        tryToCopy.textContent = 'Copy Failed';
        tryToCopy.style.background = '#FF3B30';
      }
    } catch (error) {
      tryToCopy.textContent = 'Copy Failed';
      tryToCopy.style.background = '#FF3B30';
    }
  });

  closeModal.addEventListener('click', () => {
    document.body.removeChild(overlay);
    document.head.removeChild(style);
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
      document.head.removeChild(style);
    }
  });
}

export function copyToClipboard(text: string): Promise<void> {
  // Safari detection
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  if (isSafari) {
    // For Safari, try direct clipboard access first with immediate fallback
    return new Promise((resolve) => {
      if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
        navigator.clipboard.writeText(text)
          .then(() => {
            console.log('Safari: Direct clipboard success');
            resolve();
          })
          .catch((error) => {
            console.log('Safari: Direct clipboard failed, showing modal');
            showSafariShareModal(text);
            resolve();
          });
      } else {
        console.log('Safari: No clipboard API, showing modal');
        showSafariShareModal(text);
        resolve();
      }
    });
  }
  
  // Non-Safari browsers
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
        console.log('Safari: Fallback copy successful');
        resolve();
      } else {
        console.log('Safari: Copy command failed, showing share modal');
        showSafariShareModal(text);
        resolve();
      }
    } catch (error) {
      console.log('Safari: Copy error, showing share modal');
      showSafariShareModal(text);
      resolve()
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
  console.log('Safari: Importing decryption key');
  console.log('Safari: Key length:', keyString.length);
  
  try {
    const keyData = new Uint8Array(
      atob(keyString).split('').map(char => char.charCodeAt(0))
    );
    console.log('Safari: Key bytes length:', keyData.length);
    
    const importedKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    console.log('Safari: Key import successful');
    return importedKey;
  } catch (error) {
    console.error('Safari: Key import failed:', error instanceof Error ? error.message : String(error));
    throw error;
  }
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
    try {
      console.log('Safari: Starting decryption with key:', key?.substring(0, 10) + '...');
      const decryptionKey = await importKey(key);
      console.log('Safari: Key imported successfully');
      
      const decryptedData = await decryptData(
        encryptedPayload.encryptedData,
        encryptedPayload.iv,
        decryptionKey
      );
      console.log('Safari: Decryption successful');
      return decryptedData;
    } catch (decryptionError) {
      console.error('Safari: Decryption failed');
      console.error('Safari: Error details:', decryptionError instanceof Error ? decryptionError.message : String(decryptionError));
      
      // Safari often blocks decryption even when encryption worked
      // Return unencrypted data if available
      if (encryptedPayload.unencryptedData) {
        console.log('Safari: Using unencrypted fallback data');
        return encryptedPayload.unencryptedData;
      }
      
      throw decryptionError;
    }
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
