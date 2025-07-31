import { z } from 'zod';

// Base schemas for common validation patterns
export const addressSchema = z.string().regex(/^[2mn][1-9A-HJ-NP-Za-km-z]{25,34}$/, {
  message: 'Invalid Bitcoin address format'
});

export const ethereumAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, {
  message: 'Invalid Ethereum address format'
});

export const amountSchema = z.string().refine(
  (val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0 && num <= Number.MAX_SAFE_INTEGER;
  },
  { message: 'Amount must be a positive number' }
);

export const slippageSchema = z.number().min(0.1).max(50).default(0.5);

export const chainIdSchema = z.number().int().refine(
  (val) => [1, 137, 56, 42161].includes(val), // Ethereum, Polygon, BSC, Arbitrum
  { message: 'Unsupported chain ID' }
);

export const feePrioritySchema = z.enum(['slow', 'standard', 'fast']).default('standard');

// Swap-related schemas
export const swapQuoteSchema = z.object({
  fromToken: z.string().min(1, 'From token is required'),
  toToken: z.string().min(1, 'To token is required'),
  amount: amountSchema,
  fromAddress: z.union([addressSchema, ethereumAddressSchema]),
  chainId: chainIdSchema,
  slippage: slippageSchema
});

export const swapExecuteSchema = z.object({
  fromToken: z.string().min(1, 'From token is required'),
  toToken: z.string().min(1, 'To token is required'),
  fromAmount: amountSchema,
  toAddress: z.union([addressSchema, ethereumAddressSchema]),
  slippage: slippageSchema,
  feePriority: feePrioritySchema,
  chainId: chainIdSchema,
  quoteId: z.string().optional()
});

// Order-related schemas
export const orderCreateSchema = z.object({
  fromToken: z.string().min(1, 'From token is required'),
  toToken: z.string().min(1, 'To token is required'),
  fromAmount: amountSchema,
  toAmount: amountSchema,
  fromAddress: z.union([addressSchema, ethereumAddressSchema]),
  toAddress: z.union([addressSchema, ethereumAddressSchema]),
  chainId: chainIdSchema,
  slippage: slippageSchema,
  feePriority: feePrioritySchema,
  partialFill: z.boolean().default(false),
  expirationTime: z.number().int().positive().optional()
});

export const orderUpdateSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  fromAmount: amountSchema.optional(),
  toAmount: amountSchema.optional(),
  slippage: slippageSchema.optional(),
  feePriority: feePrioritySchema.optional()
});

export const orderCancelSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  reason: z.string().max(500).optional()
});

// Portfolio-related schemas
export const portfolioQuerySchema = z.object({
  address: z.union([addressSchema, ethereumAddressSchema]),
  chainId: chainIdSchema.optional(),
  includeTokens: z.boolean().default(true),
  includeTransactions: z.boolean().default(false),
  limit: z.number().int().min(1).max(100).default(20)
});

// Bitcoin-specific schemas
export const bitcoinKeySchema = z.object({
  privateKey: z.string().regex(/^[5KL][1-9A-HJ-NP-Za-km-z]{50,51}$/, {
    message: 'Invalid Bitcoin private key format'
  }),
  network: z.enum(['mainnet', 'testnet']).default('mainnet')
});

export const bitcoinTransactionSchema = z.object({
  txid: z.string().regex(/^[a-fA-F0-9]{64}$/, {
    message: 'Invalid transaction ID format'
  }),
  network: z.enum(['mainnet', 'testnet']).default('mainnet')
});

// WebSocket subscription schemas
export const websocketSubscriptionSchema = z.object({
  type: z.enum(['prices', 'orders', 'portfolio', 'transactions']),
  address: z.union([addressSchema, ethereumAddressSchema]).optional(),
  chainId: chainIdSchema.optional(),
  tokens: z.array(z.string()).optional()
});

// Rate limiting schemas
export const rateLimitConfigSchema = z.object({
  windowMs: z.number().int().positive().default(15 * 60 * 1000), // 15 minutes
  maxRequests: z.number().int().positive().default(100),
  message: z.string().default('Too many requests, please try again later'),
  standardHeaders: z.boolean().default(true),
  legacyHeaders: z.boolean().default(false)
});

// Error response schema
export const errorResponseSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.record(z.any()).optional(),
  timestamp: z.string().datetime(),
  requestId: z.string().optional()
});

// Success response schema
export const successResponseSchema = z.object({
  success: z.boolean(),
  data: z.any(),
  timestamp: z.string().datetime(),
  requestId: z.string().optional()
});

// Input sanitization helpers
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const sanitizeNumber = (input: string | number): number => {
  const num = typeof input === 'string' ? parseFloat(input) : input;
  return isNaN(num) ? 0 : Math.max(0, num);
};

export const sanitizeAddress = (input: string): string => {
  return input.trim().toLowerCase();
};

// Validation helpers
export const validateAndSanitize = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  return schema.parse(data);
};

export const safeValidate = <T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; errors?: string[] } => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}; 