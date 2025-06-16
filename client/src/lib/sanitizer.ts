// Client-side sanitization utilities for safe rendering

// HTML entities for escaping
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

// Dangerous patterns that should be highlighted or sanitized in display
const DISPLAY_WARNINGS = [
  { pattern: /<script/i, type: 'script', severity: 'high' },
  { pattern: /javascript:/i, type: 'javascript', severity: 'high' },
  { pattern: /on\w+\s*=/i, type: 'event-handler', severity: 'medium' },
  { pattern: /data:text\/html/i, type: 'data-url', severity: 'medium' },
  { pattern: /eval\s*\(/i, type: 'eval', severity: 'high' },
  { pattern: /document\./i, type: 'dom-access', severity: 'low' },
  { pattern: /window\./i, type: 'window-access', severity: 'low' },
];

export interface SanitizationWarning {
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  path: string;
}

export interface SafeRenderResult {
  sanitizedValue: string;
  warnings: SanitizationWarning[];
  isSafe: boolean;
}

/**
 * Escapes HTML entities to prevent XSS in display
 */
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"'\/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Sanitizes a value for safe display in the UI
 */
export function sanitizeForDisplay(value: any, path: string = ''): SafeRenderResult {
  const warnings: SanitizationWarning[] = [];
  let sanitizedValue: string;
  let isSafe = true;

  // Convert value to string
  if (typeof value === 'string') {
    sanitizedValue = value;
  } else if (value === null || value === undefined) {
    return {
      sanitizedValue: String(value),
      warnings: [],
      isSafe: true,
    };
  } else {
    sanitizedValue = JSON.stringify(value, null, 2);
  }

  // Check for dangerous patterns
  for (const warning of DISPLAY_WARNINGS) {
    if (warning.pattern.test(sanitizedValue)) {
      warnings.push({
        type: warning.type,
        severity: warning.severity,
        message: `Potentially dangerous ${warning.type} detected`,
        path,
      });
      
      if (warning.severity === 'high') {
        isSafe = false;
      }
    }
  }

  // Escape HTML entities for safe display
  sanitizedValue = escapeHtml(sanitizedValue);

  return {
    sanitizedValue,
    warnings,
    isSafe,
  };
}

/**
 * Validates if a URL is safe for display
 */
export function isSafeUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    
    // Only allow HTTP and HTTPS protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }
    
    // Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'vbscript:', 'data:', 'file:'];
    if (dangerousProtocols.some(protocol => url.toLowerCase().startsWith(protocol))) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes URLs for safe display and linking
 */
export function sanitizeUrl(url: string): string | null {
  if (!isSafeUrl(url)) {
    return null;
  }
  
  return url;
}

/**
 * Creates a safe display version of potentially dangerous content
 */
export function createSafeDisplayWrapper(
  originalValue: string,
  warnings: SanitizationWarning[]
): { display: string; hasWarnings: boolean } {
  const hasWarnings = warnings.length > 0;
  
  if (!hasWarnings) {
    return { display: originalValue, hasWarnings: false };
  }
  
  // Create a warning indicator for dangerous content
  const highSeverityWarnings = warnings.filter(w => w.severity === 'high');
  
  if (highSeverityWarnings.length > 0) {
    return {
      display: `⚠️ POTENTIALLY DANGEROUS CONTENT (${highSeverityWarnings.length} issues)`,
      hasWarnings: true,
    };
  }
  
  return {
    display: originalValue,
    hasWarnings: true,
  };
}

/**
 * Validates JSON structure and content for security issues
 */
export function validateJsonSecurity(data: any): {
  isSecure: boolean;
  issues: Array<{ path: string; issue: string; severity: 'low' | 'medium' | 'high' }>;
} {
  const issues: Array<{ path: string; issue: string; severity: 'low' | 'medium' | 'high' }> = [];
  
  function checkValue(value: any, path: string): void {
    if (typeof value === 'string') {
      const result = sanitizeForDisplay(value, path);
      result.warnings.forEach(warning => {
        issues.push({
          path,
          issue: warning.message,
          severity: warning.severity,
        });
      });
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        checkValue(item, `${path}[${index}]`);
      });
    } else if (typeof value === 'object' && value !== null) {
      Object.entries(value).forEach(([key, val]) => {
        // Check for dangerous property names
        const dangerousKeys = ['__proto__', 'constructor', 'prototype', 'eval'];
        if (dangerousKeys.includes(key.toLowerCase())) {
          issues.push({
            path: `${path}.${key}`,
            issue: 'Dangerous property name detected',
            severity: 'high',
          });
        }
        
        checkValue(val, path ? `${path}.${key}` : key);
      });
    }
  }
  
  checkValue(data, '');
  
  const highSeverityIssues = issues.filter(issue => issue.severity === 'high');
  
  return {
    isSecure: highSeverityIssues.length === 0,
    issues,
  };
}

/**
 * Creates a secure display component for potentially dangerous JSON values
 */
export function createSecureDisplayComponent(value: any, path: string) {
  const result = sanitizeForDisplay(value, path);
  
  return {
    value: result.sanitizedValue,
    warnings: result.warnings,
    className: result.isSafe ? '' : 'text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded',
    tooltip: result.warnings.length > 0 
      ? `Security warnings: ${result.warnings.map(w => w.message).join(', ')}`
      : undefined,
  };
}

export default {
  escapeHtml,
  sanitizeForDisplay,
  isSafeUrl,
  sanitizeUrl,
  createSafeDisplayWrapper,
  validateJsonSecurity,
  createSecureDisplayComponent,
};