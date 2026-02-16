/**
 * Security utilities for input sanitization and validation
 */

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHTML(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Escape special characters in HTML
 */
export function escapeHTML(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  return text.replace(/[&<>"'/]/g, (char) => map[char] || char);
}

/**
 * Validate file path to prevent directory traversal
 */
export function validateFilePath(path: string): boolean {
  // Check for directory traversal attempts
  if (path.includes('..')) {
    console.warn('⚠️ Directory traversal attempt detected:', path);
    return false;
  }
  
  // Check for absolute paths (should be relative)
  if (path.startsWith('/') || /^[A-Za-z]:/.test(path)) {
    console.warn('⚠️ Absolute path detected:', path);
    return false;
  }
  
  // Check for null bytes
  if (path.includes('\0')) {
    console.warn('⚠️ Null byte detected in path:', path);
    return false;
  }
  
  return true;
}

/**
 * Sanitize file name to prevent injection
 */
export function sanitizeFileName(fileName: string): string {
  // Remove dangerous characters
  return fileName
    .replace(/[<>:"|?*\x00-\x1F]/g, '')
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 255); // Limit length
}

/**
 * Validate API key format
 */
export function validateAPIKey(key: string): boolean {
  // Check minimum length
  if (key.length < 20) {
    return false;
  }
  
  // Check for suspicious patterns
  if (key.includes(' ') || key.includes('\n')) {
    return false;
  }
  
  // Check for valid characters (alphanumeric + common special chars)
  if (!/^[A-Za-z0-9\-_\.]+$/.test(key)) {
    return false;
  }
  
  return true;
}

/**
 * Sanitize user input for AI prompts
 */
export function sanitizePrompt(prompt: string): string {
  // Remove control characters
  let sanitized = prompt.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Limit length
  const maxLength = 10000;
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
}

/**
 * Validate URL to prevent SSRF attacks
 */
export function validateURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    
    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      console.warn('⚠️ Invalid protocol:', parsed.protocol);
      return false;
    }
    
    // Block localhost and private IPs
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.')
    ) {
      console.warn('⚠️ Private IP or localhost detected:', hostname);
      return false;
    }
    
    return true;
  } catch (err) {
    console.warn('⚠️ Invalid URL:', url);
    return false;
  }
}

/**
 * Rate limiter for API calls
 */
export class RateLimiter {
  private calls: number[] = [];
  private maxCalls: number;
  private windowMs: number;
  
  constructor(maxCalls: number = 10, windowMs: number = 60000) {
    this.maxCalls = maxCalls;
    this.windowMs = windowMs;
  }
  
  /**
   * Check if action is allowed
   */
  isAllowed(): boolean {
    const now = Date.now();
    
    // Remove old calls outside the window
    this.calls = this.calls.filter(time => now - time < this.windowMs);
    
    // Check if limit exceeded
    if (this.calls.length >= this.maxCalls) {
      console.warn('⚠️ Rate limit exceeded');
      return false;
    }
    
    // Record this call
    this.calls.push(now);
    return true;
  }
  
  /**
   * Get remaining calls
   */
  getRemaining(): number {
    const now = Date.now();
    this.calls = this.calls.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxCalls - this.calls.length);
  }
  
  /**
   * Reset the limiter
   */
  reset(): void {
    this.calls = [];
  }
}

/**
 * Secure storage for sensitive data
 */
export class SecureStorage {
  private prefix = 'corex_secure_';
  
  /**
   * Store encrypted data
   */
  set(key: string, value: string): void {
    try {
      // Simple obfuscation (not true encryption, but better than plain text)
      const obfuscated = btoa(value);
      localStorage.setItem(this.prefix + key, obfuscated);
    } catch (err) {
      console.error('Failed to store secure data:', err);
    }
  }
  
  /**
   * Retrieve encrypted data
   */
  get(key: string): string | null {
    try {
      const obfuscated = localStorage.getItem(this.prefix + key);
      if (!obfuscated) return null;
      return atob(obfuscated);
    } catch (err) {
      console.error('Failed to retrieve secure data:', err);
      return null;
    }
  }
  
  /**
   * Remove data
   */
  remove(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }
  
  /**
   * Clear all secure data
   */
  clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }
}

/**
 * Content Security Policy helpers
 */
export const CSP = {
  /**
   * Check if inline script is allowed
   */
  isInlineScriptAllowed(): boolean {
    // In production, inline scripts should be blocked
    return process.env.NODE_ENV === 'development';
  },
  
  /**
   * Check if external resource is allowed
   */
  isExternalResourceAllowed(url: string): boolean {
    // Whitelist of allowed domains
    const allowedDomains = [
      'cdn.jsdelivr.net',
      'unpkg.com',
      'fonts.googleapis.com',
      'fonts.gstatic.com'
    ];
    
    try {
      const parsed = new URL(url);
      return allowedDomains.some(domain => parsed.hostname.endsWith(domain));
    } catch {
      return false;
    }
  }
};

// Export singleton instances
export const rateLimiter = new RateLimiter();
export const secureStorage = new SecureStorage();
