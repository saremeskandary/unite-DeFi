# Security Implementation Guide

This document outlines the comprehensive security features implemented in the Unite DeFi application.

## 🔒 Security Overview

The application implements a multi-layered security approach with the following components:

1. **Input Validation** - Comprehensive validation using Zod schemas
2. **Rate Limiting** - Configurable rate limiting per endpoint type
3. **CSRF Protection** - Double submit cookie pattern
4. **Error Handling** - Structured error responses with proper logging
5. **Input Sanitization** - XSS and injection attack prevention
6. **Security Headers** - CSP, XSS protection, and other security headers

## 📁 Security Architecture

```
src/lib/security/
├── validation-schemas.ts    # Zod validation schemas
├── rate-limiter.ts         # Rate limiting implementation
├── csrf-protection.ts      # CSRF protection system
├── error-handler.ts        # Error handling and logging
├── input-sanitizer.ts      # Input sanitization utilities
└── security-middleware.ts  # Combined security middleware
```

## 🛡️ Security Features

### 1. Input Validation

#### Validation Schemas

All API endpoints use comprehensive Zod validation schemas:

```typescript
// Example: Swap Quote Schema
export const swapQuoteSchema = z.object({
  fromToken: z.string().min(1, 'From token is required'),
  toToken: z.string().min(1, 'To token is required'),
  amount: amountSchema,
  fromAddress: z.union([addressSchema, ethereumAddressSchema]),
  chainId: chainIdSchema,
  slippage: slippageSchema
});
```

#### Supported Schemas

- **Swap Operations**: `swapQuoteSchema`, `swapExecuteSchema`
- **Order Management**: `orderCreateSchema`, `orderUpdateSchema`, `orderCancelSchema`
- **Portfolio Queries**: `portfolioQuerySchema`
- **Bitcoin Operations**: `bitcoinKeySchema`, `bitcoinTransactionSchema`
- **WebSocket**: `websocketSubscriptionSchema`

### 2. Rate Limiting

#### Configuration

Rate limiting is configured per endpoint type with different limits:

```typescript
export const createRateLimiters = () => ({
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts'
  }),
  api: new RateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
    message: 'Too many API requests'
  }),
  swap: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Too many swap requests'
  })
});
```

#### Rate Limit Headers

Responses include rate limit headers:
- `X-RateLimit-Limit`: Maximum requests per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets
- `Retry-After`: Seconds to wait before retrying (when limit exceeded)

### 3. CSRF Protection

#### Implementation

CSRF protection uses the double submit cookie pattern:

```typescript
class CSRFProtection {
  private generateToken(): string {
    return randomBytes(this.config.tokenLength).toString('hex');
  }

  private createHmacToken(token: string): string {
    return createHmac('sha256', this.config.secret)
      .update(token)
      .digest('hex');
  }
}
```

#### Token Management

- **Token Generation**: Cryptographically secure random tokens
- **HMAC Verification**: Server-side token validation
- **Cookie Storage**: Secure, httpOnly cookies for HMAC tokens
- **Header Transmission**: Client-side tokens sent via headers

#### Security Features

- Tokens expire after 24 hours
- Secure cookie settings (httpOnly, secure, sameSite)
- Automatic token refresh on validation failure

### 4. Error Handling

#### Error Classes

Structured error classes for different error types:

```typescript
export class ValidationError extends Error implements AppError {
  code = ErrorCode.VALIDATION_ERROR;
  statusCode = 400;
  retryable = false;
  userMessage = 'Please check your input and try again';
}

export class BusinessLogicError extends Error implements AppError {
  code: ErrorCode;
  statusCode = 400;
  retryable = false;
}
```

#### Error Response Format

All errors return structured responses:

```json
{
  "error": "User-friendly error message",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "amount",
    "message": "Amount must be positive"
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "req_123456789"
}
```

#### Error Logging

- Development: Console logging with full error details
- Production: Structured logging for error reporting services
- Request correlation via request IDs

### 5. Input Sanitization

#### Sanitization Methods

```typescript
export class InputSanitizer {
  static sanitizeString(input: string, options?: SanitizationOptions): string
  static sanitizeNumber(input: string | number, options?: NumberOptions): number
  static sanitizeEmail(input: string): string
  static sanitizeUrl(input: string, options?: UrlOptions): string
  static sanitizeBitcoinAddress(input: string): string
  static sanitizeEthereumAddress(input: string): string
  static removeDangerousContent(input: string): string
}
```

#### XSS Prevention

- HTML sanitization using DOMPurify
- Script tag removal
- Event handler removal
- Dangerous protocol filtering

#### Address Validation

- Bitcoin address format validation
- Ethereum address checksum validation
- Length and character set validation

### 6. Security Headers

#### Implemented Headers

```typescript
response.headers.set('X-Content-Type-Options', 'nosniff');
response.headers.set('X-Frame-Options', 'DENY');
response.headers.set('X-XSS-Protection', '1; mode=block');
response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
```

#### Content Security Policy

```typescript
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
```

## 🔧 Usage Examples

### Securing API Routes

```typescript
import { secureRoute } from '@/lib/security/security-middleware';
import { swapQuoteSchema } from '@/lib/security/validation-schemas';

async function getSwapQuote(request: NextRequest) {
  const validatedData = (request as any).validatedData;
  // ... business logic
  return createSecureResponse(response, request);
}

export const GET = secureRoute(getSwapQuote, 'api', swapQuoteSchema);
```

### Frontend Security Hook

```typescript
import { useSecurity } from '@/hooks/useSecurity';

function SwapComponent() {
  const { secureApiCall, isLoading, error } = useSecurity({
    enableCSRF: true,
    enableRateLimit: true
  });

  const handleSwap = async () => {
    try {
      const result = await secureApiCall('/api/swap/execute', {
        method: 'POST',
        body: JSON.stringify(swapData)
      });
    } catch (error) {
      // Error handling
    }
  };
}
```

### Custom Validation

```typescript
import { validateAndSanitize, safeValidate } from '@/lib/security/validation-schemas';

// Strict validation
const data = validateAndSanitize(swapQuoteSchema, inputData);

// Safe validation with error handling
const result = safeValidate(swapQuoteSchema, inputData);
if (!result.success) {
  console.log('Validation errors:', result.errors);
}
```

## 🧪 Testing

### Security Test Coverage

```typescript
describe('SecurityMiddleware', () => {
  describe('Input Sanitization', () => {
    it('should sanitize XSS attempts', () => {
      const input = '<script>alert("xss")</script>Hello';
      const sanitized = InputSanitizer.sanitizeString(input);
      expect(sanitized).toBe('Hello');
    });
  });

  describe('Rate Limiting', () => {
    it('should limit requests per window', async () => {
      // Test rate limiting behavior
    });
  });

  describe('CSRF Protection', () => {
    it('should validate CSRF tokens', async () => {
      // Test CSRF validation
    });
  });
});
```

### Running Security Tests

```bash
# Run all security tests
pnpm test:security

# Run specific security test
pnpm test tests/unit/security/security-middleware.test.ts
```

## 🔐 Security Best Practices

### 1. Environment Variables

```bash
# Required security environment variables
CSRF_SECRET=your-secret-key-here
NODE_ENV=production
```

### 2. Production Configuration

- Enable all security features
- Use HTTPS in production
- Configure proper CORS settings
- Set up error monitoring (Sentry, etc.)

### 3. Regular Security Audits

- Run security tests regularly
- Update dependencies for security patches
- Monitor for new vulnerabilities
- Review and update security configurations

## 🚨 Security Incident Response

### 1. Rate Limit Exceeded

- Check rate limit headers
- Implement exponential backoff
- Consider increasing limits if legitimate

### 2. CSRF Token Issues

- Refresh CSRF token
- Check cookie settings
- Verify token generation

### 3. Validation Errors

- Review input data
- Check validation schemas
- Update schemas if needed

### 4. Security Headers Missing

- Verify middleware configuration
- Check response headers
- Ensure proper CSP configuration

## 📊 Security Metrics

### Monitoring Points

- Rate limit violations
- CSRF token failures
- Validation error rates
- Security header compliance
- Error response patterns

### Logging

- All security events are logged
- Request IDs for correlation
- Error details for debugging
- Performance metrics

## 🔄 Security Updates

### Version History

- **v1.0.0**: Initial security implementation
- **v1.1.0**: Enhanced CSRF protection
- **v1.2.0**: Improved rate limiting
- **v1.3.0**: Added comprehensive testing

### Future Enhancements

- [ ] OAuth 2.0 integration
- [ ] Two-factor authentication
- [ ] Advanced threat detection
- [ ] Security analytics dashboard
- [ ] Automated security scanning

## 📞 Security Support

For security-related issues or questions:

1. Check the security test suite
2. Review error logs
3. Consult this documentation
4. Contact the development team

---

**Note**: This security implementation follows industry best practices and is regularly updated to address new threats and vulnerabilities. 