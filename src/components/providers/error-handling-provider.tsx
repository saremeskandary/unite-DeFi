'use client'

import React, { createContext, useContext, useEffect } from 'react'
import { errorHandler, reportError, AppError } from '@/lib/error-handling'

interface ErrorHandlingContextType {
    reportError: (error: AppError) => Promise<void>
    startPeriodicReporting: (intervalMs?: number) => void
}

const ErrorHandlingContext = createContext<ErrorHandlingContextType | null>(null)

interface ErrorHandlingProviderProps {
    children: React.ReactNode
    enablePeriodicReporting?: boolean
    reportingInterval?: number
    onError?: (error: AppError) => void
}

export function ErrorHandlingProvider({
    children,
    enablePeriodicReporting = true,
    reportingInterval = 30000,
    onError
}: ErrorHandlingProviderProps) {
    useEffect(() => {
        // Start periodic error reporting
        if (enablePeriodicReporting) {
            errorHandler.startPeriodicReporting(reportingInterval)
        }

        // Set up global error handlers
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const error = event.reason
            const appError = errorHandler.parseError(error)

            if (onError) {
                onError(appError)
            }

            reportError(appError)
        }

        const handleError = (event: ErrorEvent) => {
            const error = event.error || new Error(event.message)
            const appError = errorHandler.parseError(error)

            if (onError) {
                onError(appError)
            }

            reportError(appError)
        }

        // Add global error listeners
        window.addEventListener('unhandledrejection', handleUnhandledRejection)
        window.addEventListener('error', handleError)

        // Cleanup function
        return () => {
            window.removeEventListener('unhandledrejection', handleUnhandledRejection)
            window.removeEventListener('error', handleError)
        }
    }, [enablePeriodicReporting, reportingInterval, onError])

    const contextValue: ErrorHandlingContextType = {
        reportError,
        startPeriodicReporting: (intervalMs?: number) => {
            errorHandler.startPeriodicReporting(intervalMs)
        }
    }

    return (
        <ErrorHandlingContext.Provider value={contextValue}>
            {children}
        </ErrorHandlingContext.Provider>
    )
}

export function useErrorHandling() {
    const context = useContext(ErrorHandlingContext)
    if (!context) {
        throw new Error('useErrorHandling must be used within an ErrorHandlingProvider')
    }
    return context
} 