import { NextRequest, NextResponse } from 'next/server';
import { rateLimitConfigSchema } from './validation-schemas';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
  standardHeaders: boolean;
  legacyHeaders: boolean;
}

class RateLimiter {
  private store: RateLimitStore = {};
  public config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = rateLimitConfigSchema.parse(config);
  }

  private getKey(request: NextRequest): string {
    // Use IP address from headers as primary key
    const ip = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      'unknown';

    // Add user agent for additional uniqueness
    const userAgent = request.headers.get('user-agent') || '';

    // Add route path for per-endpoint limiting
    const path = request.nextUrl?.pathname || '';

    return `${ip}:${userAgent}:${path}`;
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  async checkLimit(request: NextRequest): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    this.cleanup();

    const key = this.getKey(request);
    const now = Date.now();

    if (!this.store[key]) {
      this.store[key] = {
        count: 0,
        resetTime: now + this.config.windowMs
      };
    }

    const record = this.store[key];

    // Reset if window has passed
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + this.config.windowMs;
    }

    // Check if limit exceeded
    if (record.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      };
    }

    // Increment count
    record.count++;

    return {
      allowed: true,
      remaining: this.config.maxRequests - record.count,
      resetTime: record.resetTime
    };
  }

  createMiddleware() {
    return async (request: NextRequest) => {
      const result = await this.checkLimit(request);

      if (!result.allowed) {
        const response = NextResponse.json(
          {
            error: this.config.message,
            retryAfter: result.retryAfter
          },
          { status: 429 }
        );

        // Add rate limit headers
        if (this.config.standardHeaders) {
          response.headers.set('X-RateLimit-Limit', this.config.maxRequests.toString());
          response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
          response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
        }

        if (this.config.legacyHeaders) {
          response.headers.set('X-RateLimit-Limit', this.config.maxRequests.toString());
          response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
          response.headers.set('X-RateLimit-Reset', Math.floor(result.resetTime / 1000).toString());
        }

        if (result.retryAfter) {
          response.headers.set('Retry-After', result.retryAfter.toString());
        }

        return response;
      }

      return null; // Continue to next middleware/handler
    };
  }
}

// Pre-configured rate limiters for different endpoints
export const createRateLimiters = () => ({
  // Strict rate limiting for authentication endpoints
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later'
  }),

  // Moderate rate limiting for API endpoints
  api: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many API requests, please try again later'
  }),

  // Loose rate limiting for public endpoints
  public: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
    message: 'Too many requests, please try again later'
  }),

  // Strict rate limiting for swap execution
  swap: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Too many swap requests, please try again later'
  }),

  // Rate limiting for WebSocket connections
  websocket: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: 'Too many WebSocket connection attempts'
  })
});

// Global rate limiter instance
export const rateLimiters = createRateLimiters();

// Helper function to apply rate limiting to API routes
export const withRateLimit = (
  handler: (request: NextRequest) => Promise<NextResponse>,
  limiter: RateLimiter = rateLimiters.api
) => {
  return async (request: NextRequest): Promise<NextResponse> => {
    const rateLimitResponse = await limiter.checkLimit(request);

    if (!rateLimitResponse.allowed) {
      const response = NextResponse.json(
        {
          error: limiter.config.message,
          retryAfter: rateLimitResponse.retryAfter
        },
        { status: 429 }
      );

      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', limiter.config.maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimitResponse.remaining.toString());
      response.headers.set('X-RateLimit-Reset', rateLimitResponse.resetTime.toString());

      if (rateLimitResponse.retryAfter) {
        response.headers.set('Retry-After', rateLimitResponse.retryAfter.toString());
      }

      return response;
    }

    // Add rate limit headers to successful responses
    const response = await handler(request);
    response.headers.set('X-RateLimit-Limit', limiter.config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResponse.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResponse.resetTime.toString());

    return response;
  };
}; 