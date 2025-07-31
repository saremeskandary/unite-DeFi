'use client'

import { useCallback, useRef } from 'react'
import { useToast } from './use-toast'
import {
  ErrorType,
  ErrorSeverity,
  AppError,
  createError,
  parseError,
  retry,
  reportError,
  RetryConfig
} from '@/lib/error-handling'

export interface UseErrorHandlerOptions {
  showToast?: boolean
  autoReport?: boolean
  defaultRetryConfig?: Partial<RetryConfig>
}

export interface UseErrorHandlerReturn {
  handleError: (error: any, options?: HandleErrorOptions) => void
  handleAsyncError: <T>(
    operation: () => Promise<T>,
    options?: HandleAsyncErrorOptions
  ) => Promise<T | null>
  showErrorToast: (error: AppError) => void
  reportError: (error: AppError) => Promise<void>
  retry: <T>(operation: () => Promise<T>, config?: Partial<RetryConfig>) => Promise<T>
}

export interface HandleErrorOptions {
  showToast?: boolean
  autoReport?: boolean
  userMessage?: string
  severity?: ErrorSeverity
  context?: Record<string, any>
}

export interface HandleAsyncErrorOptions extends HandleErrorOptions {
  retryConfig?: Partial<RetryConfig>
  fallbackValue?: any
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn {
  const { toast } = useToast()
  const {
    showToast = true,
    autoReport = true,
    defaultRetryConfig = {}
  } = options

  const errorCountRef = useRef<Map<string, number>>(new Map())

  const showErrorToast = useCallback((error: AppError) => {
    const { toast } = useToast()

    // Determine toast variant based on severity
    let variant: 'default' | 'destructive' = 'default'
    if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
      variant = 'destructive'
    }

    toast({
      title: getErrorTitle(error.type),
      description: error.userMessage,
      variant,
      duration: getErrorDuration(error.severity),
    })
  }, [])

  const getErrorTitle = (type: ErrorType): string => {
    const titles = {
      [ErrorType.NETWORK]: 'Connection Error',
      [ErrorType.BLOCKCHAIN]: 'Transaction Error',
      [ErrorType.WALLET]: 'Wallet Error',
      [ErrorType.VALIDATION]: 'Validation Error',
      [ErrorType.AUTHENTICATION]: 'Authentication Error',
      [ErrorType.AUTHORIZATION]: 'Authorization Error',
      [ErrorType.RATE_LIMIT]: 'Rate Limit Exceeded',
      [ErrorType.TIMEOUT]: 'Request Timeout',
      [ErrorType.UNKNOWN]: 'Error'
    }
    return titles[type] || titles[ErrorType.UNKNOWN]
  }

  const getErrorDuration = (severity: ErrorSeverity): number => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 10000 // 10 seconds
      case ErrorSeverity.HIGH:
        return 8000 // 8 seconds
      case ErrorSeverity.MEDIUM:
        return 5000 // 5 seconds
      case ErrorSeverity.LOW:
        return 3000 // 3 seconds
      default:
        return 5000
    }
  }

  const handleError = useCallback(async (
    error: any,
    options: HandleErrorOptions = {}
  ) => {
    const {
      showToast: shouldShowToast = showToast,
      autoReport: shouldAutoReport = autoReport,
      userMessage,
      severity,
      context
    } = options

    // Parse the error
    const appError = parseError(error)

    // Override with custom options
    if (userMessage) appError.userMessage = userMessage
    if (severity) appError.severity = severity
    if (context) appError.context = { ...appError.context, ...context }

    // Show toast if enabled
    if (shouldShowToast) {
      showErrorToast(appError)
    }

    // Auto-report if enabled
    if (shouldAutoReport) {
      await reportError(appError)
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error handled:', appError)
    }
  }, [showToast, autoReport, showErrorToast])

  const handleAsyncError = useCallback(async <T>(
    operation: () => Promise<T>,
    options: HandleAsyncErrorOptions = {}
  ): Promise<T | null> => {
    const {
      retryConfig = defaultRetryConfig,
      fallbackValue = null,
      ...errorOptions
    } = options

    try {
      // If retry config is provided, use retry mechanism
      if (retryConfig && Object.keys(retryConfig).length > 0) {
        return await retry(operation, retryConfig)
      }

      // Otherwise, just execute the operation
      return await operation()
    } catch (error) {
      await handleError(error, errorOptions)
      return fallbackValue
    }
  }, [defaultRetryConfig, handleError])

  const reportErrorWithHook = useCallback(async (error: AppError) => {
    await reportError(error)
  }, [])

  const retryWithHook = useCallback(<T>(
    operation: () => Promise<T>,
    config?: Partial<RetryConfig>
  ): Promise<T> => {
    return retry(operation, config)
  }, [])

  return {
    handleError,
    handleAsyncError,
    showErrorToast,
    reportError: reportErrorWithHook,
    retry: retryWithHook
  }
}

// Specialized error handlers for common scenarios
export function useNetworkErrorHandler() {
  const { handleError, handleAsyncError } = useErrorHandler({
    showToast: true,
    autoReport: true
  })

  const handleNetworkError = useCallback(async <T>(
    operation: () => Promise<T>,
    fallbackValue?: T
  ): Promise<T | null> => {
    return handleAsyncError(operation, {
      retryConfig: {
        maxAttempts: 3,
        baseDelay: 1000,
        backoffMultiplier: 2
      },
      fallbackValue,
      userMessage: 'Network connection issue. Please check your internet connection.'
    })
  }, [handleAsyncError])

  return { handleNetworkError }
}

export function useBlockchainErrorHandler() {
  const { handleError, handleAsyncError } = useErrorHandler({
    showToast: true,
    autoReport: true
  })

  const handleBlockchainError = useCallback(async <T>(
    operation: () => Promise<T>,
    fallbackValue?: T
  ): Promise<T | null> => {
    return handleAsyncError(operation, {
      retryConfig: {
        maxAttempts: 2,
        baseDelay: 2000,
        backoffMultiplier: 1.5
      },
      fallbackValue,
      userMessage: 'Blockchain transaction failed. Please try again.'
    })
  }, [handleAsyncError])

  return { handleBlockchainError }
}

export function useWalletErrorHandler() {
  const { handleError } = useErrorHandler({
    showToast: true,
    autoReport: true
  })

  const handleWalletError = useCallback((error: any) => {
    handleError(error, {
      userMessage: 'Wallet connection issue. Please reconnect your wallet.',
      severity: ErrorSeverity.HIGH
    })
  }, [handleError])

  return { handleWalletError }
} 