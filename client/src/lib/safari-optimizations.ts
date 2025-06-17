// Safari-specific optimizations and compatibility fixes

export function isSafari(): boolean {
  if (typeof window === 'undefined') return false;
  
  const ua = window.navigator.userAgent;
  const isSafariUA = /^((?!chrome|android).)*safari/i.test(ua);
  const isWebKit = /webkit/i.test(ua) && !/chrome/i.test(ua);
  
  return isSafariUA || isWebKit;
}

export function isIOSSafari(): boolean {
  if (typeof window === 'undefined') return false;
  
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && /Safari/.test(ua);
}

export function getSafariVersion(): number {
  if (typeof window === 'undefined') return 0;
  
  const ua = window.navigator.userAgent;
  const match = ua.match(/Version\/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export function applySafariOptimizations(): void {
  if (!isSafari()) return;

  // Reduce animations on older Safari versions
  const safariVersion = getSafariVersion();
  if (safariVersion < 14) {
    document.documentElement.style.setProperty('--animation-speed', '0.5');
    
    // Disable complex animations on older Safari
    const style = document.createElement('style');
    style.textContent = `
      .apple-card {
        animation: none !important;
      }
      .apple-card::before {
        animation: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  // iOS Safari specific optimizations
  if (isIOSSafari()) {
    // Prevent viewport zooming on input focus
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      viewportMeta.setAttribute('content', 
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
      );
    }

    // Add touch-action optimizations
    document.body.style.touchAction = 'manipulation';
  }

  // Memory management for Safari
  optimizeMemoryUsage();
}

function optimizeMemoryUsage(): void {
  // Debounce scroll events for Safari
  let scrollTimeout: NodeJS.Timeout;
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (type === 'scroll' && isSafari()) {
      const debouncedListener = function(this: any, event: Event) {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          if (typeof listener === 'function') {
            listener.call(this, event);
          } else if (listener && typeof listener.handleEvent === 'function') {
            listener.handleEvent(event);
          }
        }, 16); // 60fps
      };
      
      return originalAddEventListener.call(this, type, debouncedListener, options);
    }
    
    return originalAddEventListener.call(this, type, listener, options);
  };
}

export function optimizeClipboardForSafari(): boolean {
  if (!isSafari()) return false;
  
  // Safari has stricter clipboard requirements
  return window.isSecureContext && 
         typeof navigator.clipboard !== 'undefined' && 
         typeof navigator.clipboard.writeText !== 'undefined';
}

export function detectSafariIssues(): string[] {
  const issues: string[] = [];
  
  if (!isSafari()) return issues;
  
  const safariVersion = getSafariVersion();
  
  if (safariVersion < 13) {
    issues.push('Older Safari version detected - some features may be limited');
  }
  
  if (!window.crypto?.subtle) {
    issues.push('Web Crypto API not available - encryption features disabled');
  }
  
  if (!optimizeClipboardForSafari()) {
    issues.push('Clipboard access limited - using fallback copy method');
  }
  
  if (isIOSSafari()) {
    issues.push('iOS Safari detected - touch optimizations applied');
  }
  
  return issues;
}

// Auto-apply optimizations when the module loads
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applySafariOptimizations);
  } else {
    applySafariOptimizations();
  }
}