// Jest globals are available in test environment without explicit import
import { swapQuoteSchema } from '@/lib/security/validation-schemas';
import { createValidationError, createBusinessError, ErrorCode } from '@/lib/security/error-handler';
import { InputSanitizer } from '@/lib/security/input-sanitizer';

describe('Security Features', () => {
  describe('Input Sanitization', () => {
    it('should sanitize string inputs', () => {
      const input = '<script>alert("xss")</script>Hello World';
      const sanitized = InputSanitizer.sanitizeString(input);
      expect(sanitized).toBe('Hello World');
    });

    it('should sanitize number inputs', () => {
      const input = '123.45abc';
      const sanitized = InputSanitizer.sanitizeNumber(input);
      expect(sanitized).toBe(123.45);
    });

    it('should sanitize Bitcoin addresses', () => {
      const validAddress = '2N1LGaGg836aiSQGSK7gyc1Bxid3n5ofgw';
      const invalidAddress = 'invalid-address';

      expect(InputSanitizer.sanitizeBitcoinAddress(validAddress)).toBe(validAddress);
      expect(InputSanitizer.sanitizeBitcoinAddress(invalidAddress)).toBe('');
    });

    it('should sanitize Ethereum addresses', () => {
      const validAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
      const invalidAddress = 'invalid-address';

      expect(InputSanitizer.sanitizeEthereumAddress(validAddress)).toBe(validAddress.toLowerCase());
      expect(InputSanitizer.sanitizeEthereumAddress(invalidAddress)).toBe('');
    });

    it('should remove dangerous content', () => {
      const input = '<script>alert("xss")</script><img src="javascript:alert(1)">';
      const sanitized = InputSanitizer.removeDangerousContent(input);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('javascript:');
    });
  });

  describe('Validation Schemas', () => {
    it('should validate swap quote schema', () => {
      const validData = {
        fromToken: 'BTC',
        toToken: 'ETH',
        amount: '1.5',
        fromAddress: '2N1LGaGg836aiSQGSK7gyc1Bxid3n5ofgw',
        chainId: 1,
        slippage: 0.5
      };

      const result = swapQuoteSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid swap quote data', () => {
      const invalidData = {
        fromToken: '',
        toToken: 'ETH',
        amount: '-1',
        fromAddress: 'invalid-address',
        chainId: 999,
        slippage: 100
      };

      const result = swapQuoteSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Error Handling', () => {
    it('should create validation errors', () => {
      const error = createValidationError('Invalid input', { field: 'test' });
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.statusCode).toBe(400);
    });

    it('should create business logic errors', () => {
      const error = createBusinessError(ErrorCode.INSUFFICIENT_BALANCE, 'Not enough funds');
      expect(error.code).toBe(ErrorCode.INSUFFICIENT_BALANCE);
      expect(error.statusCode).toBe(400);
    });
  });

  describe('Input Sanitization Methods', () => {
    it('should sanitize email addresses', () => {
      const validEmail = 'test@example.com';
      const invalidEmail = 'invalid-email';

      expect(InputSanitizer.sanitizeEmail(validEmail)).toBe(validEmail);
      expect(InputSanitizer.sanitizeEmail(invalidEmail)).toBe('');
    });

    it('should sanitize URLs', () => {
      const validUrl = 'https://example.com';
      const invalidUrl = 'javascript:alert(1)';

      expect(InputSanitizer.sanitizeUrl(validUrl)).toBe(validUrl + '/');
      expect(InputSanitizer.sanitizeUrl(invalidUrl)).toBe('');
    });

    it('should sanitize form data', () => {
      const formData = {
        name: '<script>alert("xss")</script>John',
        email: 'test@example.com',
        amount: '123.45abc'
      };

      const sanitized = InputSanitizer.sanitizeFormData(formData);
      expect(sanitized.name).not.toContain('<script>');
      expect(sanitized.email).toBe('test@example.com');
      expect(sanitized.amount).toBe('123.45abc'); // String sanitization doesn't convert to number
    });
  });

  describe('Validation Helpers', () => {
    it('should validate and sanitize data', () => {
      const data = {
        fromToken: 'BTC',
        toToken: 'ETH',
        amount: '1.5',
        fromAddress: '2N1LGaGg836aiSQGSK7gyc1Bxid3n5ofgw',
        chainId: 1,
        slippage: 0.5
      };

      const result = swapQuoteSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should handle validation errors gracefully', () => {
      const invalidData = {
        fromToken: '',
        amount: '-1'
      };

      const result = swapQuoteSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0);
      }
    });
  });
}); 