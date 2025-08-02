'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to console for debugging
        console.error('Global error caught:', error)
    }, [error])

    return (
        <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
            <div className="max-w-md w-full mx-auto p-6">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                        <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>

                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Something went wrong!
                    </h2>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                        {error.message || 'An unexpected error occurred. Please try again.'}
                    </p>

                    <div className="space-y-3">
                        <Button
                            onClick={() => reset()}
                            className="w-full"
                            variant="default"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try again
                        </Button>

                        <Button
                            onClick={() => window.location.href = '/'}
                            className="w-full"
                            variant="outline"
                        >
                            Go to homepage
                        </Button>
                    </div>

                    {process.env.NODE_ENV === 'development' && (
                        <details className="mt-6 text-left">
                            <summary className="text-sm text-gray-500 cursor-pointer">
                                Error details (development only)
                            </summary>
                            <pre className="mt-2 text-xs text-gray-600 bg-base-100 dark:bg-gray-800 p-3 rounded overflow-auto">
                                {error.stack}
                            </pre>
                        </details>
                    )}
                </div>
            </div>
        </div>
    )
} 