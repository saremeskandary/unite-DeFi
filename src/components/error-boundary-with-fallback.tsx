'use client'

import React from 'react'
import { ErrorBoundary } from './error-boundary'
import { ErrorState } from './ui/error-states'
import { AppError, parseError } from '@/lib/error-handling'

interface ErrorBoundaryWithFallbackProps {
    children: React.ReactNode
    fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
    onError?: (error: AppError) => void
    showDetails?: boolean
    className?: string
}

interface ErrorFallbackProps {
    error: Error
    resetError: () => void
    onError?: (error: AppError) => void
    showDetails?: boolean
    className?: string
}

function ErrorFallback({
    error,
    resetError,
    onError,
    showDetails = false,
    className = ''
}: ErrorFallbackProps) {
    const appError = parseError(error)

    React.useEffect(() => {
        if (onError) {
            onError(appError)
        }
    }, [appError, onError])

    const handleRetry = () => {
        resetError()
    }

    const handleGoBack = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            window.history.back()
        } else {
            window.location.href = '/'
        }
    }

    const handleGoHome = () => {
        window.location.href = '/'
    }

    return (
        <ErrorState
            error={appError}
            onRetry={appError.retryable ? handleRetry : undefined}
            onGoBack={handleGoBack}
            onGoHome={handleGoHome}
            showDetails={showDetails}
            className={className}
        />
    )
}

export function ErrorBoundaryWithFallback({
    children,
    fallback,
    onError,
    showDetails = false,
    className = ''
}: ErrorBoundaryWithFallbackProps) {
    const customFallback = fallback || ((props: { error: Error; resetError: () => void }) => (
        <ErrorFallback
            {...props}
            onError={onError}
            showDetails={showDetails}
            className={className}
        />
    ))

    return (
        <ErrorBoundary fallback={customFallback}>
            {children}
        </ErrorBoundary>
    )
}

// Specialized error boundaries for different contexts
export function NetworkErrorBoundary({
    children,
    onError,
    className = ''
}: Omit<ErrorBoundaryWithFallbackProps, 'fallback'>) {
    return (
        <ErrorBoundaryWithFallback
            onError={onError}
            className={className}
            fallback={({ error, resetError }) => (
                <ErrorFallback
                    error={error}
                    resetError={resetError}
                    onError={onError}
                    className={className}
                />
            )}
        >
            {children}
        </ErrorBoundaryWithFallback>
    )
}

export function WalletErrorBoundary({
    children,
    onError,
    className = ''
}: Omit<ErrorBoundaryWithFallbackProps, 'fallback'>) {
    return (
        <ErrorBoundaryWithFallback
            onError={onError}
            className={className}
            fallback={({ error, resetError }) => (
                <ErrorFallback
                    error={error}
                    resetError={resetError}
                    onError={onError}
                    className={className}
                />
            )}
        >
            {children}
        </ErrorBoundaryWithFallback>
    )
}

export function BlockchainErrorBoundary({
    children,
    onError,
    className = ''
}: Omit<ErrorBoundaryWithFallbackProps, 'fallback'>) {
    return (
        <ErrorBoundaryWithFallback
            onError={onError}
            className={className}
            fallback={({ error, resetError }) => (
                <ErrorFallback
                    error={error}
                    resetError={resetError}
                    onError={onError}
                    className={className}
                />
            )}
        >
            {children}
        </ErrorBoundaryWithFallback>
    )
} 