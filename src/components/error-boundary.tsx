'use client'

import React from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
    errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
    children: React.ReactNode
    fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error, errorInfo: null }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        this.setState({
            error,
            errorInfo
        })

        // Log error to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('Error caught by boundary:', error, errorInfo)
        }

        // In production, you might want to send this to an error reporting service
        // Example: Sentry.captureException(error, { extra: errorInfo })
    }

    resetError = () => {
        this.setState({ hasError: false, error: null, errorInfo: null })
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                const FallbackComponent = this.props.fallback
                return <FallbackComponent error={this.state.error!} resetError={this.resetError} />
            }

            return <DefaultErrorFallback error={this.state.error!} resetError={this.resetError} />
        }

        return this.props.children
    }
}

function DefaultErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <CardTitle className="text-xl">Something went wrong</CardTitle>
                    <CardDescription>
                        An unexpected error occurred. Please try refreshing the page.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {process.env.NODE_ENV === 'development' && (
                        <details className="rounded-lg border p-3 text-sm">
                            <summary className="cursor-pointer font-medium">Error Details</summary>
                            <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                                {error.message}
                                {error.stack && `\n\n${error.stack}`}
                            </pre>
                        </details>
                    )}
                    <div className="flex gap-2">
                        <Button onClick={resetError} variant="outline" className="flex-1">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Try Again
                        </Button>
                        <Button onClick={() => window.location.reload()} className="flex-1">
                            Refresh Page
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// Hook for functional components to throw errors
export function useErrorHandler() {
    return React.useCallback((error: Error) => {
        throw error
    }, [])
} 