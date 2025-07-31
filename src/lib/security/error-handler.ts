import { NextRequest, NextResponse } from 'next/server';
import { errorResponseSchema, successResponseSchema } from './validation-schemas';

export enum ErrorCode {
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

  // Rate limiting errors
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // CSRF errors
  CSRF_TOKEN_MISSING = 'CSRF_TOKEN_MISSING',
  CSRF_TOKEN_INVALID = 'CSRF_TOKEN_INVALID',

  // Business logic errors
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  UNSUPPORTED_TOKEN = 'UNSUPPORTED_TOKEN',
  UNSUPPORTED_CHAIN = 'UNSUPPORTED_CHAIN',
  SWAP_FAILED = 'SWAP_FAILED',
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  ORDER_EXPIRED = 'ORDER_EXPIRED',
  ORDER_ALREADY_EXECUTED = 'ORDER_ALREADY_EXECUTED',

  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // Blockchain errors
  BLOCKCHAIN_ERROR = 'BLOCKCHAIN_ERROR',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  INSUFFICIENT_GAS = 'INSUFFICIENT_GAS',
  INVALID_ADDRESS = 'INVALID_ADDRESS',

  // Internal errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

export interface AppError extends Error {
  code: ErrorCode;
  statusCode: number;
  details?: Record<string, any>;
  retryable?: boolean;
  userMessage?: string;
}

export class ValidationError extends Error implements AppError {
  code = ErrorCode.VALIDATION_ERROR;
  statusCode = 400;
  retryable = false;
  userMessage?: string;

  constructor(message: string, public details?: Record<string, any>) {
    super(message);
    this.name = 'ValidationError';
    this.userMessage = 'Please check your input and try again';
  }
}

export class AuthenticationError extends Error implements AppError {
  code = ErrorCode.UNAUTHORIZED;
  statusCode = 401;
  retryable = false;
  userMessage?: string;

  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
    this.userMessage = 'Please log in to continue';
  }
}

export class AuthorizationError extends Error implements AppError {
  code = ErrorCode.FORBIDDEN;
  statusCode = 403;
  retryable = false;
  userMessage?: string;

  constructor(message: string = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
    this.userMessage = 'You do not have permission to perform this action';
  }
}

export class RateLimitError extends Error implements AppError {
  code = ErrorCode.RATE_LIMIT_EXCEEDED;
  statusCode = 429;
  retryable = true;
  userMessage?: string;

  constructor(message: string = 'Rate limit exceeded', public retryAfter?: number) {
    super(message);
    this.name = 'RateLimitError';
    this.userMessage = 'Too many requests. Please try again later';
  }
}

export class BusinessLogicError extends Error implements AppError {
  code: ErrorCode;
  statusCode = 400;
  retryable = false;
  userMessage?: string;

  constructor(code: ErrorCode, message: string, public details?: Record<string, any>) {
    super(message);
    this.name = 'BusinessLogicError';
    this.code = code;
    this.userMessage = this.getUserMessage(code);
  }

  private getUserMessage(code: ErrorCode): string {
    const messages: Record<ErrorCode, string> = {
      [ErrorCode.INSUFFICIENT_BALANCE]: 'Insufficient balance for this transaction',
      [ErrorCode.INVALID_AMOUNT]: 'Invalid amount specified',
      [ErrorCode.UNSUPPORTED_TOKEN]: 'This token is not supported',
      [ErrorCode.UNSUPPORTED_CHAIN]: 'This blockchain is not supported',
      [ErrorCode.SWAP_FAILED]: 'Swap operation failed',
      [ErrorCode.ORDER_NOT_FOUND]: 'Order not found',
      [ErrorCode.ORDER_EXPIRED]: 'Order has expired',
      [ErrorCode.ORDER_ALREADY_EXECUTED]: 'Order has already been executed',
      [ErrorCode.NETWORK_ERROR]: 'Network error occurred',
      [ErrorCode.TIMEOUT]: 'Request timed out',
      [ErrorCode.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
      [ErrorCode.BLOCKCHAIN_ERROR]: 'Blockchain operation failed',
      [ErrorCode.TRANSACTION_FAILED]: 'Transaction failed',
      [ErrorCode.INSUFFICIENT_GAS]: 'Insufficient gas for transaction',
      [ErrorCode.INVALID_ADDRESS]: 'Invalid address provided',
      [ErrorCode.INTERNAL_ERROR]: 'Internal server error',
      [ErrorCode.DATABASE_ERROR]: 'Database operation failed',
      [ErrorCode.CONFIGURATION_ERROR]: 'Configuration error',
      [ErrorCode.VALIDATION_ERROR]: 'Validation error',
      [ErrorCode.INVALID_INPUT]: 'Invalid input provided',
      [ErrorCode.MISSING_REQUIRED_FIELD]: 'Required field missing',
      [ErrorCode.UNAUTHORIZED]: 'Authentication required',
      [ErrorCode.FORBIDDEN]: 'Access denied',
      [ErrorCode.INVALID_CREDENTIALS]: 'Invalid credentials',
      [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
      [ErrorCode.CSRF_TOKEN_MISSING]: 'CSRF token missing',
      [ErrorCode.CSRF_TOKEN_INVALID]: 'CSRF token invalid'
    };
    return messages[code] || 'An error occurred';
  }
}

export class NetworkError extends Error implements AppError {
  code = ErrorCode.NETWORK_ERROR;
  statusCode = 503;
  retryable = true;
  userMessage?: string;

  constructor(message: string = 'Network error', public details?: Record<string, any>) {
    super(message);
    this.name = 'NetworkError';
    this.userMessage = 'Network error occurred. Please try again';
  }
}

export class InternalError extends Error implements AppError {
  code = ErrorCode.INTERNAL_ERROR;
  statusCode = 500;
  retryable = false;
  userMessage?: string;

  constructor(message: string = 'Internal server error', public details?: Record<string, any>) {
    super(message);
    this.name = 'InternalError';
    this.userMessage = 'An unexpected error occurred. Please try again later';
  }
}

// Error handler class
export class ErrorHandler {
  private static logError(error: AppError, request?: NextRequest): void {
    const logData = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        stack: error.stack,
        details: error.details
      },
      request: request ? {
        method: request.method,
        url: request.url,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      } : undefined
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error occurred:', logData);
    }

    // In production, you might want to send this to an error reporting service
    // Example: Sentry.captureException(error, { extra: logData });
  }

  static handle(error: unknown, request?: NextRequest): NextResponse {
    let appError: AppError;

    // Convert unknown errors to AppError
    if (error instanceof ValidationError ||
      error instanceof AuthenticationError ||
      error instanceof AuthorizationError ||
      error instanceof RateLimitError ||
      error instanceof BusinessLogicError ||
      error instanceof NetworkError ||
      error instanceof InternalError) {
      appError = error;
    } else if (error instanceof Error) {
      appError = new InternalError(error.message, { originalError: error.name });
    } else {
      appError = new InternalError('Unknown error occurred');
    }

    // Log the error
    this.logError(appError, request);

    // Create error response
    const errorResponse = {
      error: appError.userMessage || appError.message,
      code: appError.code,
      details: appError.details,
      timestamp: new Date().toISOString(),
      requestId: request?.headers.get('x-request-id') || undefined
    };

    // Validate error response
    const validatedResponse = errorResponseSchema.parse(errorResponse);

    const response = NextResponse.json(validatedResponse, {
      status: appError.statusCode
    });

    // Add retry headers if applicable
    if (appError.retryable) {
      response.headers.set('Retry-After', '30');
    }

    // Add request ID header
    if (errorResponse.requestId) {
      response.headers.set('X-Request-ID', errorResponse.requestId);
    }

    return response;
  }

  static createSuccessResponse(data: any, request?: NextRequest): NextResponse {
    const successResponse = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      requestId: request?.headers.get('x-request-id') || undefined
    };

    const validatedResponse = successResponseSchema.parse(successResponse);
    const response = NextResponse.json(validatedResponse);

    // Add request ID header
    if (successResponse.requestId) {
      response.headers.set('X-Request-ID', successResponse.requestId);
    }

    return response;
  }
}

// Middleware wrapper for error handling
export const withErrorHandling = (
  handler: (request: NextRequest) => Promise<NextResponse>
) => {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(request);
    } catch (error) {
      return ErrorHandler.handle(error, request);
    }
  };
};

// Utility functions for creating specific errors
export const createValidationError = (message: string, details?: Record<string, any>): ValidationError => {
  return new ValidationError(message, details);
};

export const createBusinessError = (code: ErrorCode, message: string, details?: Record<string, any>): BusinessLogicError => {
  return new BusinessLogicError(code, message, details);
};

export const createNetworkError = (message: string, details?: Record<string, any>): NetworkError => {
  return new NetworkError(message, details);
};

export const createInternalError = (message: string, details?: Record<string, any>): InternalError => {
  return new InternalError(message, details);
}; 