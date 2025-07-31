// Comprehensive error handling utilities for the DeFi application

export enum ErrorType {
  NETWORK = 'NETWORK',
  BLOCKCHAIN = 'BLOCKCHAIN',
  WALLET = 'WALLET',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  RATE_LIMIT = 'RATE_LIMIT',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface AppError {
  type: ErrorType
  severity: ErrorSeverity
  message: string
  userMessage: string
  code?: string
  details?: any
  retryable: boolean
  timestamp: Date
  context?: Record<string, any>
}

export interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  retryableErrors?: ErrorType[]
}

export class ErrorHandler {
  private static instance: ErrorHandler
  private errorQueue: AppError[] = []
  private isReporting = false

  private constructor() { }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  createError(
    type: ErrorType,
    message: string,
    userMessage?: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    retryable: boolean = false,
    details?: any,
    context?: Record<string, any>
  ): AppError {
    return {
      type,
      severity,
      message,
      userMessage: userMessage || this.getDefaultUserMessage(type),
      retryable,
      timestamp: new Date(),
      details,
      context
    }
  }

  private getDefaultUserMessage(type: ErrorType): string {
    const messages = {
      [ErrorType.NETWORK]: 'Network connection issue. Please check your internet connection.',
      [ErrorType.BLOCKCHAIN]: 'Blockchain transaction failed. Please try again.',
      [ErrorType.WALLET]: 'Wallet connection issue. Please reconnect your wallet.',
      [ErrorType.VALIDATION]: 'Invalid input. Please check your data and try again.',
      [ErrorType.AUTHENTICATION]: 'Authentication failed. Please log in again.',
      [ErrorType.AUTHORIZATION]: 'You don\'t have permission to perform this action.',
      [ErrorType.RATE_LIMIT]: 'Too many requests. Please wait a moment and try again.',
      [ErrorType.TIMEOUT]: 'Request timed out. Please try again.',
      [ErrorType.UNKNOWN]: 'An unexpected error occurred. Please try again.'
    }
    return messages[type] || messages[ErrorType.UNKNOWN]
  }

  async retry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const defaultConfig: RetryConfig = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryableErrors: [ErrorType.NETWORK, ErrorType.TIMEOUT, ErrorType.RATE_LIMIT]
    }

    const finalConfig = { ...defaultConfig, ...config }
    let lastError: Error

    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error

        // Check if error is retryable
        const appError = this.parseError(error)
        if (!appError.retryable || !finalConfig.retryableErrors?.includes(appError.type)) {
          throw error
        }

        // Don't wait on last attempt
        if (attempt === finalConfig.maxAttempts) {
          throw error
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          finalConfig.baseDelay * Math.pow(finalConfig.backoffMultiplier, attempt - 1),
          finalConfig.maxDelay
        )

        await this.delay(delay)
      }
    }

    throw lastError!
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  parseError(error: any): AppError {
    if (error instanceof Error) {
      // Network errors
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return this.createError(
          ErrorType.NETWORK,
          error.message,
          undefined,
          ErrorSeverity.MEDIUM,
          true
        )
      }

      // Timeout errors
      if (error.message.includes('timeout') || error.name === 'TimeoutError') {
        return this.createError(
          ErrorType.TIMEOUT,
          error.message,
          undefined,
          ErrorSeverity.MEDIUM,
          true
        )
      }

      // Rate limit errors
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        return this.createError(
          ErrorType.RATE_LIMIT,
          error.message,
          undefined,
          ErrorSeverity.MEDIUM,
          true
        )
      }

      // Wallet errors
      if (error.message.includes('wallet') || error.message.includes('metamask')) {
        return this.createError(
          ErrorType.WALLET,
          error.message,
          undefined,
          ErrorSeverity.HIGH,
          false
        )
      }

      // Blockchain errors
      if (error.message.includes('transaction') || error.message.includes('gas')) {
        return this.createError(
          ErrorType.BLOCKCHAIN,
          error.message,
          undefined,
          ErrorSeverity.HIGH,
          true
        )
      }
    }

    // Default unknown error
    return this.createError(
      ErrorType.UNKNOWN,
      error?.message || 'Unknown error occurred',
      undefined,
      ErrorSeverity.MEDIUM,
      false
    )
  }

  async reportError(error: AppError): Promise<void> {
    // Add to queue for batch reporting
    this.errorQueue.push(error)

    // Report immediately for critical errors
    if (error.severity === ErrorSeverity.CRITICAL) {
      await this.flushErrorQueue()
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error reported:', error)
    }
  }

  private async flushErrorQueue(): Promise<void> {
    if (this.isReporting || this.errorQueue.length === 0) {
      return
    }

    this.isReporting = true

    try {
      const errors = [...this.errorQueue]
      this.errorQueue = []

      // Send to error reporting service (e.g., Sentry, LogRocket)
      if (process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT) {
        await fetch(process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            errors,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
          }),
        })
      }
    } catch (error) {
      console.error('Failed to report errors:', error)
    } finally {
      this.isReporting = false
    }
  }

  // Flush queue periodically
  startPeriodicReporting(intervalMs: number = 30000): void {
    setInterval(() => {
      this.flushErrorQueue()
    }, intervalMs)
  }
}

// Convenience functions
export const errorHandler = ErrorHandler.getInstance()

export function createError(
  type: ErrorType,
  message: string,
  userMessage?: string,
  severity?: ErrorSeverity,
  retryable?: boolean,
  details?: any,
  context?: Record<string, any>
): AppError {
  return errorHandler.createError(type, message, userMessage, severity, retryable, details, context)
}

export function parseError(error: any): AppError {
  return errorHandler.parseError(error)
}

export async function retry<T>(
  operation: () => Promise<T>,
  config?: Partial<RetryConfig>
): Promise<T> {
  return errorHandler.retry(operation, config)
}

export async function reportError(error: AppError): Promise<void> {
  return errorHandler.reportError(error)
} 