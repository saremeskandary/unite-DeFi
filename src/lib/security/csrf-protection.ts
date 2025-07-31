import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHmac } from 'crypto';

interface CSRFConfig {
  secret: string;
  cookieName: string;
  headerName: string;
  tokenLength: number;
  maxAge: number;
}

class CSRFProtection {
  private config: CSRFConfig;

  constructor(config: Partial<CSRFConfig> = {}) {
    this.config = {
      secret: config.secret || process.env.CSRF_SECRET || randomBytes(32).toString('hex'),
      cookieName: config.cookieName || 'csrf-token',
      headerName: config.headerName || 'x-csrf-token',
      tokenLength: config.tokenLength || 32,
      maxAge: config.maxAge || 24 * 60 * 60 * 1000 // 24 hours
    };
  }

  private generateToken(): string {
    return randomBytes(this.config.tokenLength).toString('hex');
  }

  private createHmacToken(token: string): string {
    return createHmac('sha256', this.config.secret)
      .update(token)
      .digest('hex');
  }

  verifyToken(token: string, hmacToken: string): boolean {
    const expectedHmac = this.createHmacToken(token);
    return hmacToken === expectedHmac;
  }

  generateTokenPair(): { token: string; hmacToken: string } {
    const token = this.generateToken();
    const hmacToken = this.createHmacToken(token);
    return { token, hmacToken };
  }

  setCSRFToken(response: NextResponse): NextResponse {
    const { token, hmacToken } = this.generateTokenPair();

    // Set the token in a secure, httpOnly cookie
    response.cookies.set(this.config.cookieName, hmacToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: this.config.maxAge / 1000,
      path: '/'
    });

    // Set the token in response headers for client-side access
    response.headers.set('X-CSRF-Token', token);

    return response;
  }

  validateRequest(request: NextRequest): { valid: boolean; error?: string } {
    // Skip CSRF validation for GET requests
    if (request.method === 'GET') {
      return { valid: true };
    }

    // Get token from header
    const headerToken = request.headers.get(this.config.headerName);
    if (!headerToken) {
      return { valid: false, error: 'CSRF token missing from header' };
    }

    // Get HMAC token from cookie
    const cookieToken = request.cookies.get(this.config.cookieName)?.value;
    if (!cookieToken) {
      return { valid: false, error: 'CSRF token missing from cookie' };
    }

    // Verify the token
    if (!this.verifyToken(headerToken, cookieToken)) {
      return { valid: false, error: 'CSRF token validation failed' };
    }

    return { valid: true };
  }

  createMiddleware() {
    return (request: NextRequest) => {
      const validation = this.validateRequest(request);

      if (!validation.valid) {
        return NextResponse.json(
          {
            error: 'CSRF validation failed',
            details: validation.error
          },
          { status: 403 }
        );
      }

      return null; // Continue to next middleware/handler
    };
  }
}

// Global CSRF protection instance
export const csrfProtection = new CSRFProtection();

// Helper function to apply CSRF protection to API routes
export const withCSRFProtection = (
  handler: (request: NextRequest) => Promise<NextResponse>
) => {
  return async (request: NextRequest): Promise<NextResponse> => {
    const validation = csrfProtection.validateRequest(request);

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'CSRF validation failed',
          details: validation.error
        },
        { status: 403 }
      );
    }

    return handler(request);
  };
};

// Helper function to generate CSRF token for forms
export const generateCSRFToken = (): { token: string; hmacToken: string } => {
  return csrfProtection.generateTokenPair();
};

// Helper function to validate CSRF token
export const validateCSRFToken = (token: string, hmacToken: string): boolean => {
  return csrfProtection.verifyToken(token, hmacToken);
};

// Middleware to add CSRF token to all responses
export const addCSRFToken = (response: NextResponse): NextResponse => {
  return csrfProtection.setCSRFToken(response);
};

// Utility to check if request needs CSRF protection
export const needsCSRFProtection = (request: NextRequest): boolean => {
  const method = request.method.toUpperCase();
  const contentType = request.headers.get('content-type') || '';

  // Protect state-changing methods
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return true;
  }

  // Protect requests with JSON content type
  if (contentType.includes('application/json')) {
    return true;
  }

  return false;
}; 