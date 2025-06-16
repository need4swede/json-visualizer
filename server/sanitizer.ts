import { Request, Response, NextFunction } from "express";

// Maximum allowed JSON size (10MB)
const MAX_JSON_SIZE = 10 * 1024 * 1024; // 10MB in bytes

// Dangerous patterns to detect and sanitize
const DANGEROUS_PATTERNS = [
  // Script tags and JavaScript
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /onload\s*=/gi,
  /onerror\s*=/gi,
  /onclick\s*=/gi,
  /onmouseover\s*=/gi,
  /onfocus\s*=/gi,
  /onblur\s*=/gi,
  /onchange\s*=/gi,
  /onsubmit\s*=/gi,
  
  // Data URLs that could contain scripts
  /data:text\/html/gi,
  /data:application\/javascript/gi,
  
  // Dangerous HTML entities
  /&#x[0-9a-f]+;/gi,
  /&#[0-9]+;/gi,
  
  // Potential SQL injection patterns
  /union\s+select/gi,
  /drop\s+table/gi,
  /delete\s+from/gi,
  /insert\s+into/gi,
  /update\s+set/gi,
  
  // Command injection patterns
  /\|\s*[a-z]/gi,
  /;\s*[a-z]/gi,
  /`[^`]*`/g,
  /\$\([^)]*\)/g,
];

// URLs that should be blocked
const BLOCKED_URL_PATTERNS = [
  /^javascript:/i,
  /^vbscript:/i,
  /^data:text\/html/i,
  /^data:application\/javascript/i,
  /^file:/i,
  /^ftp:/i,
];

// Suspicious Unicode characters that could be used for attacks
const SUSPICIOUS_UNICODE = [
  /[\u200B-\u200D\uFEFF]/g, // Zero-width characters
  /[\u2028\u2029]/g, // Line/paragraph separators
  /[\uFFF9-\uFFFB]/g, // Interlinear annotation characters
];

export interface SanitizationResult {
  isValid: boolean;
  sanitizedData?: any;
  errors: string[];
  warnings: string[];
  stats: {
    originalSize: number;
    sanitizedSize: number;
    itemsModified: number;
    dangerousContentRemoved: number;
  };
}

export class JSONSanitizer {
  private errors: string[] = [];
  private warnings: string[] = [];
  private itemsModified = 0;
  private dangerousContentRemoved = 0;
  private originalSize = 0;
  private sanitizedSize = 0;

  sanitize(data: any): SanitizationResult {
    this.reset();
    
    // Calculate original size
    this.originalSize = JSON.stringify(data).length;
    
    // Check size limits
    if (this.originalSize > MAX_JSON_SIZE) {
      this.errors.push(`JSON size (${this.formatBytes(this.originalSize)}) exceeds maximum allowed size (${this.formatBytes(MAX_JSON_SIZE)})`);
      return this.getResult(false);
    }
    
    // Sanitize the data
    const sanitizedData = this.sanitizeValue(data);
    
    // Calculate sanitized size
    this.sanitizedSize = JSON.stringify(sanitizedData).length;
    
    // Validate structure integrity
    if (!this.validateStructure(sanitizedData)) {
      this.errors.push("Data structure integrity check failed after sanitization");
      return this.getResult(false, sanitizedData);
    }
    
    return this.getResult(true, sanitizedData);
  }

  private reset(): void {
    this.errors = [];
    this.warnings = [];
    this.itemsModified = 0;
    this.dangerousContentRemoved = 0;
    this.originalSize = 0;
    this.sanitizedSize = 0;
  }

  private sanitizeValue(value: any, path: string = "root"): any {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === "string") {
      return this.sanitizeString(value, path);
    }

    if (typeof value === "number") {
      return this.sanitizeNumber(value, path);
    }

    if (typeof value === "boolean") {
      return value;
    }

    if (Array.isArray(value)) {
      return this.sanitizeArray(value, path);
    }

    if (typeof value === "object") {
      return this.sanitizeObject(value, path);
    }

    // For any other type, convert to string and sanitize
    this.warnings.push(`Unexpected data type at ${path}, converting to string`);
    return this.sanitizeString(String(value), path);
  }

  private sanitizeString(str: string, path: string): string {
    let sanitized = str;
    let originalLength = str.length;

    // Remove dangerous patterns
    for (const pattern of DANGEROUS_PATTERNS) {
      const matches = sanitized.match(pattern);
      if (matches) {
        sanitized = sanitized.replace(pattern, "[REMOVED]");
        this.dangerousContentRemoved += matches.length;
        this.warnings.push(`Removed ${matches.length} dangerous pattern(s) at ${path}`);
      }
    }

    // Remove suspicious Unicode characters
    for (const pattern of SUSPICIOUS_UNICODE) {
      const matches = sanitized.match(pattern);
      if (matches) {
        sanitized = sanitized.replace(pattern, "");
        this.warnings.push(`Removed ${matches.length} suspicious Unicode character(s) at ${path}`);
      }
    }

    // Validate and sanitize URLs
    if (this.isURL(sanitized)) {
      sanitized = this.sanitizeURL(sanitized, path);
    }

    // Check for excessive length (potential DoS)
    if (sanitized.length > 100000) { // 100KB per string
      sanitized = sanitized.substring(0, 100000) + "...[TRUNCATED]";
      this.warnings.push(`String truncated at ${path} due to excessive length`);
    }

    // Remove control characters except common whitespace
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

    if (sanitized !== str) {
      this.itemsModified++;
    }

    return sanitized;
  }

  private sanitizeNumber(num: number, path: string): number {
    // Check for NaN or Infinity
    if (!Number.isFinite(num)) {
      this.warnings.push(`Invalid number at ${path}, converted to 0`);
      this.itemsModified++;
      return 0;
    }

    // Check for extremely large numbers that could cause issues
    if (Math.abs(num) > Number.MAX_SAFE_INTEGER) {
      this.warnings.push(`Number at ${path} exceeds safe integer range`);
      this.itemsModified++;
      return Math.sign(num) * Number.MAX_SAFE_INTEGER;
    }

    return num;
  }

  private sanitizeArray(arr: any[], path: string): any[] {
    // Limit array size to prevent DoS
    if (arr.length > 10000) {
      this.warnings.push(`Array at ${path} truncated from ${arr.length} to 10000 items`);
      arr = arr.slice(0, 10000);
      this.itemsModified++;
    }

    return arr.map((item, index) => 
      this.sanitizeValue(item, `${path}[${index}]`)
    );
  }

  private sanitizeObject(obj: any, path: string): any {
    const sanitized: any = {};
    const keys = Object.keys(obj);

    // Limit object size to prevent DoS
    if (keys.length > 1000) {
      this.warnings.push(`Object at ${path} truncated from ${keys.length} to 1000 properties`);
      keys.splice(1000);
      this.itemsModified++;
    }

    for (const key of keys) {
      // Sanitize the key itself
      const sanitizedKey = this.sanitizeString(key, `${path}.${key}`);
      
      // Skip properties with dangerous keys
      if (this.isDangerousKey(sanitizedKey)) {
        this.warnings.push(`Skipped dangerous property key: ${key} at ${path}`);
        this.dangerousContentRemoved++;
        continue;
      }

      // Sanitize the value
      sanitized[sanitizedKey] = this.sanitizeValue(obj[key], `${path}.${key}`);
    }

    return sanitized;
  }

  private sanitizeURL(url: string, path: string): string {
    try {
      const urlObj = new URL(url);
      
      // Check against blocked patterns
      for (const pattern of BLOCKED_URL_PATTERNS) {
        if (pattern.test(url)) {
          this.warnings.push(`Blocked dangerous URL at ${path}: ${url}`);
          this.dangerousContentRemoved++;
          return "[BLOCKED_URL]";
        }
      }

      // Only allow HTTP and HTTPS
      if (!["http:", "https:"].includes(urlObj.protocol)) {
        this.warnings.push(`Blocked non-HTTP URL at ${path}: ${url}`);
        this.dangerousContentRemoved++;
        return "[BLOCKED_URL]";
      }

      return url;
    } catch (e) {
      // Invalid URL, return as sanitized string
      return url;
    }
  }

  private isURL(str: string): boolean {
    try {
      new URL(str);
      return true;
    } catch {
      return str.startsWith("http://") || str.startsWith("https://");
    }
  }

  private isDangerousKey(key: string): boolean {
    const dangerousKeys = [
      "__proto__",
      "constructor",
      "prototype",
      "eval",
      "function",
      "script",
      "innerHTML",
      "outerHTML",
    ];
    
    return dangerousKeys.some(dangerous => 
      key.toLowerCase().includes(dangerous.toLowerCase())
    );
  }

  private validateStructure(data: any): boolean {
    try {
      // Try to serialize and parse to ensure structure integrity
      JSON.parse(JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  private getResult(isValid: boolean, sanitizedData?: any): SanitizationResult {
    return {
      isValid,
      sanitizedData,
      errors: this.errors,
      warnings: this.warnings,
      stats: {
        originalSize: this.originalSize,
        sanitizedSize: this.sanitizedSize,
        itemsModified: this.itemsModified,
        dangerousContentRemoved: this.dangerousContentRemoved,
      },
    };
  }
}

// Express middleware for JSON sanitization
export const sanitizeJSON = (req: Request, res: Response, next: NextFunction) => {
  // Only sanitize POST requests with JSON data
  if (req.method !== "POST" || !req.body || !req.body.data) {
    return next();
  }

  const sanitizer = new JSONSanitizer();
  const result = sanitizer.sanitize(req.body.data);

  if (!result.isValid) {
    return res.status(400).json({
      error: "JSON validation failed",
      details: result.errors,
      warnings: result.warnings,
    });
  }

  // Log sanitization results
  if (result.warnings.length > 0 || result.stats.dangerousContentRemoved > 0) {
    console.warn("[SANITIZER] Content sanitized:", {
      originalSize: result.stats.originalSize,
      sanitizedSize: result.stats.sanitizedSize,
      itemsModified: result.stats.itemsModified,
      dangerousContentRemoved: result.stats.dangerousContentRemoved,
      warnings: result.warnings,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
  }

  // Replace the request body with sanitized data
  req.body.data = result.sanitizedData;
  
  // Add sanitization metadata to request for logging
  (req as any).sanitizationResult = result;

  next();
};

export default {
  JSONSanitizer,
  sanitizeJSON,
  MAX_JSON_SIZE,
  DANGEROUS_PATTERNS,
  BLOCKED_URL_PATTERNS,
};