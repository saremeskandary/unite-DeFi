import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  validateAndSanitize,
  safeValidate,
  sanitizeString,
  sanitizeNumber,
  sanitizeAddress
} from './validation-schemas';
import { withRateLimit, rateLimiters } from './rate-limiter';
import { withCSRFProtection, needsCSRFProtection } from './csrf-protection';
import { withErrorHandling, ErrorHandler, createValidationError } from './error-handler';
import { InputSanitizer } from './input-sanitizer';

export interface SecurityConfig {
  enableRateLimit?: boolean;
  enableCSRF?: boolean;
  enableValidation?: boolean;
  enableSanitization?: boolean;
  rateLimiter?: 'auth' | 'api' | 'public' | 'swap' | 'websocket';
  validationSchema?: z.ZodSchema<any>;
  sanitizationSchema?: Record<string, any>;
  skipCSRFFor?: string[];
}

export class SecurityMiddleware {
  private config: SecurityConfig;

  constructor(config: SecurityConfig = {}) {
    this.config = {
      enableRateLimit: true,
      enableCSRF: true,
      enableValidation: true,
      enableSanitization: true,
      rateLimiter: 'api',
      skipCSRFFor: ['GET'],
      ...config
    };
  }

  /**
   * Apply all security measures to a request handler
   */
  apply(handler: (request: NextRequest) => Promise<NextResponse>): (request: NextRequest) => Promise<NextResponse> {
    let securedHandler = handler;

    // Apply error handling (always first)
    securedHandler = withErrorHandling(securedHandler);

    // Apply input sanitization
    if (this.config.enableSanitization) {
      securedHandler = this.withSanitization(securedHandler);
    }

    // Apply validation
    if (this.config.enableValidation && this.config.validationSchema) {
      securedHandler = this.withValidation(securedHandler);
    }

    // Apply CSRF protection
    if (this.config.enableCSRF) {
      securedHandler = this.withCSRFProtection(securedHandler);
    }

    // Apply rate limiting
    if (this.config.enableRateLimit) {
      const limiter = rateLimiters[this.config.rateLimiter!];
      securedHandler = withRateLimit(securedHandler, limiter);
    }

    return securedHandler;
  }

  /**
 * Apply input sanitization
 */
  private withSanitization(handler: (request: NextRequest) => Promise<NextResponse>) {
    return async (request: NextRequest): Promise<NextResponse> => {
      // Sanitize URL parameters
      const url = new URL(request.url);
      const sanitizedParams = new URLSearchParams();

      for (const [key, value] of url.searchParams.entries()) {
        sanitizedParams.set(key, InputSanitizer.sanitizeString(value));
      }

      // Create new URL with sanitized parameters
      const sanitizedUrl = new URL(url.pathname + '?' + sanitizedParams.toString(), url.origin);

      // Sanitize headers
      const sanitizedHeaders = new Headers();
      for (const [key, value] of request.headers.entries()) {
        if (key.toLowerCase() === 'content-type') {
          sanitizedHeaders.set(key, value);
        } else {
          sanitizedHeaders.set(key, InputSanitizer.sanitizeString(value));
        }
      }

      // Sanitize body for POST/PUT/PATCH requests
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const body = await request.json();
          const sanitizedBody = InputSanitizer.sanitizeFormData(body);

          // Create new request with sanitized body, headers, and URL
          const newRequest = new NextRequest(sanitizedUrl.toString(), {
            method: request.method,
            headers: sanitizedHeaders,
            body: JSON.stringify(sanitizedBody)
          });

          return handler(newRequest);
        } catch {
          // If body is not JSON, create new request with sanitized headers and URL
          const newRequest = new NextRequest(sanitizedUrl.toString(), {
            method: request.method,
            headers: sanitizedHeaders
          });

          return handler(newRequest);
        }
      }

      // For GET/DELETE requests, create new request with sanitized headers and URL
      const newRequest = new NextRequest(sanitizedUrl.toString(), {
        method: request.method,
        headers: sanitizedHeaders
      });

      return handler(newRequest);
    };
  }

  /**
   * Apply validation
   */
  private withValidation(handler: (request: NextRequest) => Promise<NextResponse>) {
    return async (request: NextRequest): Promise<NextResponse> => {
      if (!this.config.validationSchema) {
        return handler(request);
      }

      try {
        let data: any;

        // Validate based on request method
        if (['GET', 'DELETE'].includes(request.method)) {
          // Validate query parameters
          const params = Object.fromEntries(request.nextUrl.searchParams.entries());
          data = validateAndSanitize(this.config.validationSchema!, params);
        } else {
          // Validate request body
          const body = await request.json();
          data = validateAndSanitize(this.config.validationSchema!, body);
        }

        // Add validated data to request for handler to use
        (request as any).validatedData = data;

        return handler(request);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw createValidationError('Validation failed', {
            errors: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message,
              code: e.code
            }))
          });
        }
        throw error;
      }
    };
  }

  /**
   * Apply CSRF protection with custom logic
   */
  private withCSRFProtection(handler: (request: NextRequest) => Promise<NextResponse>) {
    return async (request: NextRequest): Promise<NextResponse> => {
      // Skip CSRF for specified methods
      if (this.config.skipCSRFFor?.includes(request.method)) {
        return handler(request);
      }

      // Skip CSRF for public endpoints
      const publicEndpoints = ['/api/prices', '/api/tokens'];
      if (publicEndpoints.some(endpoint => request.nextUrl.pathname.startsWith(endpoint))) {
        return handler(request);
      }

      return withCSRFProtection(handler)(request);
    };
  }

  /**
   * Create a pre-configured security middleware for different endpoint types
   */
  static createForEndpoint(type: 'auth' | 'api' | 'public' | 'swap' | 'websocket', schema?: z.ZodSchema<any>): SecurityMiddleware {
    const configs = {
      auth: {
        enableRateLimit: true,
        enableCSRF: true,
        enableValidation: true,
        enableSanitization: true,
        rateLimiter: 'auth' as const,
        skipCSRFFor: ['GET']
      },
      api: {
        enableRateLimit: true,
        enableCSRF: true,
        enableValidation: true,
        enableSanitization: true,
        rateLimiter: 'api' as const,
        skipCSRFFor: ['GET']
      },
      public: {
        enableRateLimit: true,
        enableCSRF: false,
        enableValidation: true,
        enableSanitization: true,
        rateLimiter: 'public' as const,
        skipCSRFFor: ['GET', 'POST']
      },
      swap: {
        enableRateLimit: true,
        enableCSRF: true,
        enableValidation: true,
        enableSanitization: true,
        rateLimiter: 'swap' as const,
        skipCSRFFor: ['GET']
      },
      websocket: {
        enableRateLimit: true,
        enableCSRF: false,
        enableValidation: true,
        enableSanitization: true,
        rateLimiter: 'websocket' as const,
        skipCSRFFor: ['GET', 'POST']
      }
    };

    return new SecurityMiddleware({
      ...configs[type],
      validationSchema: schema
    });
  }
}

// Pre-configured security middleware instances
export const securityMiddleware = {
  auth: SecurityMiddleware.createForEndpoint('auth'),
  api: SecurityMiddleware.createForEndpoint('api'),
  public: SecurityMiddleware.createForEndpoint('public'),
  swap: SecurityMiddleware.createForEndpoint('swap'),
  websocket: SecurityMiddleware.createForEndpoint('websocket')
};

// Helper function to secure API routes
export const secureRoute = (
  handler: (request: NextRequest) => Promise<NextResponse>,
  type: 'auth' | 'api' | 'public' | 'swap' | 'websocket' = 'api',
  schema?: z.ZodSchema<any>
) => {
  const middleware = SecurityMiddleware.createForEndpoint(type, schema);
  return middleware.apply(handler);
};

// Helper function to add security headers
export const addSecurityHeaders = (response: NextResponse): NextResponse => {
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https: wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  return response;
};

// Helper function to create a secure response
export const createSecureResponse = (data: any, request?: NextRequest): NextResponse => {
  const response = ErrorHandler.createSuccessResponse(data, request);
  return addSecurityHeaders(response);
};

// Helper function to create a secure error response
export const createSecureErrorResponse = (error: unknown, request?: NextRequest): NextResponse => {
  const response = ErrorHandler.handle(error, request);
  return addSecurityHeaders(response);
}; 