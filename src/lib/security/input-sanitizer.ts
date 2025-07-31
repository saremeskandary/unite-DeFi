import DOMPurify from 'isomorphic-dompurify';

export interface SanitizationOptions {
  allowHTML?: boolean;
  allowScripts?: boolean;
  allowStyles?: boolean;
  allowDataAttributes?: boolean;
  allowComments?: boolean;
  maxLength?: number;
  trim?: boolean;
  lowercase?: boolean;
  removeSpecialChars?: boolean;
}

export class InputSanitizer {
  private static defaultOptions: SanitizationOptions = {
    allowHTML: false,
    allowScripts: false,
    allowStyles: false,
    allowDataAttributes: false,
    allowComments: false,
    maxLength: 1000,
    trim: true,
    lowercase: false,
    removeSpecialChars: false
  };

  /**
   * Sanitize a string input
   */
  static sanitizeString(input: string, options: Partial<SanitizationOptions> = {}): string {
    const opts = { ...this.defaultOptions, ...options };

    if (!input || typeof input !== 'string') {
      return '';
    }

    let sanitized = input;

    // Trim whitespace
    if (opts.trim) {
      sanitized = sanitized.trim();
    }

    // Convert to lowercase
    if (opts.lowercase) {
      sanitized = sanitized.toLowerCase();
    }

    // Remove special characters
    if (opts.removeSpecialChars) {
      sanitized = sanitized.replace(/[^\w\s\-\.]/g, '');
    }

    // Limit length
    if (opts.maxLength && sanitized.length > opts.maxLength) {
      sanitized = sanitized.substring(0, opts.maxLength);
    }

    // HTML sanitization
    if (!opts.allowHTML) {
      sanitized = DOMPurify.sanitize(sanitized, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true
      });
    } else {
      // Allow specific HTML tags and attributes
      const allowedTags = ['b', 'i', 'em', 'strong', 'a', 'br', 'p'];
      const allowedAttributes = ['href', 'target'];

      sanitized = DOMPurify.sanitize(sanitized, {
        ALLOWED_TAGS: opts.allowScripts ? undefined : allowedTags,
        ALLOWED_ATTR: opts.allowScripts ? undefined : allowedAttributes,
        ALLOW_DATA_ATTR: opts.allowDataAttributes,
        ALLOW_UNKNOWN_PROTOCOLS: false,
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
      });
    }

    return sanitized;
  }

  /**
   * Sanitize a number input
   */
  static sanitizeNumber(input: string | number, options: {
    min?: number;
    max?: number;
    precision?: number;
    allowNegative?: boolean;
  } = {}): number {
    const { min, max, precision = 0, allowNegative = false } = options;

    let num: number;

    if (typeof input === 'string') {
      // Remove non-numeric characters except decimal point and minus
      const cleaned = input.replace(/[^\d.-]/g, '');
      num = parseFloat(cleaned);
    } else {
      num = input;
    }

    if (isNaN(num)) {
      return 0;
    }

    // Handle negative numbers
    if (!allowNegative && num < 0) {
      num = Math.abs(num);
    }

    // Apply precision
    if (precision > 0) {
      num = parseFloat(num.toFixed(precision));
    }

    // Apply min/max constraints
    if (min !== undefined && num < min) {
      num = min;
    }
    if (max !== undefined && num > max) {
      num = max;
    }

    return num;
  }

  /**
   * Sanitize an email address
   */
  static sanitizeEmail(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    const sanitized = this.sanitizeString(input, {
      trim: true,
      lowercase: true,
      maxLength: 254 // RFC 5321 limit
    });

    // Basic email validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    return emailRegex.test(sanitized) ? sanitized : '';
  }

  /**
   * Sanitize a URL
   */
  static sanitizeUrl(input: string, options: {
    allowedProtocols?: string[];
    requireProtocol?: boolean;
  } = {}): string {
    const { allowedProtocols = ['http:', 'https:'], requireProtocol = true } = options;

    if (!input || typeof input !== 'string') {
      return '';
    }

    let sanitized = this.sanitizeString(input, {
      trim: true,
      maxLength: 2048
    });

    // Add protocol if required and missing
    if (requireProtocol && !sanitized.match(/^[a-zA-Z]+:/)) {
      sanitized = 'https://' + sanitized;
    }

    try {
      const url = new URL(sanitized);

      // Check if protocol is allowed
      if (!allowedProtocols.includes(url.protocol)) {
        return '';
      }

      // Remove potentially dangerous parts
      url.hash = '';
      url.search = '';

      return url.toString();
    } catch {
      return '';
    }
  }

  /**
   * Sanitize a Bitcoin address
   */
  static sanitizeBitcoinAddress(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    const sanitized = this.sanitizeString(input, {
      trim: true,
      maxLength: 100
    });

    // Bitcoin address validation regex
    const bitcoinAddressRegex = /^[2mn][1-9A-HJ-NP-Za-km-z]{25,34}$/;

    return bitcoinAddressRegex.test(sanitized) ? sanitized : '';
  }

  /**
   * Sanitize an Ethereum address
   */
  static sanitizeEthereumAddress(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    const sanitized = this.sanitizeString(input, {
      trim: true,
      lowercase: true,
      maxLength: 42
    });

    // Ethereum address validation regex
    const ethereumAddressRegex = /^0x[a-f0-9]{40}$/;

    return ethereumAddressRegex.test(sanitized) ? sanitized : '';
  }

  /**
   * Sanitize an object recursively
   */
  static sanitizeObject<T extends Record<string, any>>(
    obj: T,
    schema: Record<string, Partial<SanitizationOptions>>
  ): T {
    const sanitized = { ...obj } as T;

    for (const [key, options] of Object.entries(schema)) {
      if (key in sanitized) {
        const value = sanitized[key as keyof T];

        if (typeof value === 'string') {
          (sanitized as any)[key] = this.sanitizeString(value, options);
        } else if (typeof value === 'number') {
          (sanitized as any)[key] = this.sanitizeNumber(value, options as any);
        } else if (Array.isArray(value)) {
          (sanitized as any)[key] = value.map((item: any) =>
            typeof item === 'string' ? this.sanitizeString(item, options) : item
          );
        } else if (typeof value === 'object' && value !== null) {
          (sanitized as any)[key] = this.sanitizeObject(value, options as any);
        }
      }
    }

    return sanitized;
  }

  /**
   * Sanitize form data
   */
  static sanitizeFormData(data: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'number') {
        sanitized[key] = this.sanitizeNumber(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item =>
          typeof item === 'string' ? this.sanitizeString(item) : item
        );
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeFormData(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Remove potentially dangerous content
   */
  static removeDangerousContent(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Remove script tags and content
    let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove event handlers
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');

    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');

    // Remove data: protocol
    sanitized = sanitized.replace(/data:/gi, '');

    // Remove vbscript: protocol
    sanitized = sanitized.replace(/vbscript:/gi, '');

    // Remove expression() in CSS
    sanitized = sanitized.replace(/expression\s*\(/gi, '');

    // Remove eval() calls
    sanitized = sanitized.replace(/eval\s*\(/gi, '');

    return sanitized;
  }

  /**
   * Validate and sanitize JSON input
   */
  static sanitizeJson(input: string): any {
    if (!input || typeof input !== 'string') {
      return null;
    }

    try {
      const parsed = JSON.parse(input);
      return this.sanitizeFormData(parsed);
    } catch {
      return null;
    }
  }

  /**
   * Create a sanitization schema for specific use cases
   */
  static createSchema(options: Record<string, Partial<SanitizationOptions>>) {
    return options;
  }

  // Predefined schemas for common use cases
  static schemas = {
    userProfile: this.createSchema({
      name: { maxLength: 100, trim: true },
      email: { maxLength: 254, trim: true, lowercase: true },
      bio: { maxLength: 500, allowHTML: true },
      website: { maxLength: 2048, trim: true }
    }),

    swapRequest: this.createSchema({
      fromToken: { maxLength: 10, trim: true },
      toToken: { maxLength: 10, trim: true },
      fromAmount: { maxLength: 20, trim: true },
      toAddress: { maxLength: 100, trim: true },
      slippage: { maxLength: 10, trim: true }
    }),

    orderData: this.createSchema({
      orderId: { maxLength: 50, trim: true },
      description: { maxLength: 200, trim: true },
      notes: { maxLength: 1000, trim: true, allowHTML: true }
    })
  };
} 