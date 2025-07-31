'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    useErrorHandler,
    useNetworkErrorHandler,
    useBlockchainErrorHandler,
    useWalletErrorHandler
} from '@/hooks/use-error-handler'
import {
    ErrorBoundaryWithFallback,
    NetworkErrorBoundary,
    WalletErrorBoundary,
    BlockchainErrorBoundary
} from '@/components/error-boundary-with-fallback'
import {
    NetworkErrorState,
    WalletErrorState,
    BlockchainErrorState,
    LoadingErrorState
} from '@/components/ui/error-states'
import { ErrorSeverity, ErrorType, createError } from '@/lib/error-handling'

// Example component that demonstrates error handling
export function ErrorHandlingExample() {
    const [activeTab, setActiveTab] = useState('hooks')
    const [simulatedError, setSimulatedError] = useState<string | null>(null)

    return (
        <div className="container mx-auto p-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Error Handling Examples</CardTitle>
                    <CardDescription>
                        Demonstrates comprehensive error handling with retry mechanisms, user-friendly messages, and fallback states.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="hooks">Error Hooks</TabsTrigger>
                            <TabsTrigger value="boundaries">Error Boundaries</TabsTrigger>
                            <TabsTrigger value="states">Error States</TabsTrigger>
                            <TabsTrigger value="simulation">Error Simulation</TabsTrigger>
                        </TabsList>

                        <TabsContent value="hooks" className="space-y-4">
                            <ErrorHooksExample />
                        </TabsContent>

                        <TabsContent value="boundaries" className="space-y-4">
                            <ErrorBoundariesExample />
                        </TabsContent>

                        <TabsContent value="states" className="space-y-4">
                            <ErrorStatesExample />
                        </TabsContent>

                        <TabsContent value="simulation" className="space-y-4">
                            <ErrorSimulationExample />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}

// Example using error handling hooks
function ErrorHooksExample() {
    const { handleError, handleAsyncError } = useErrorHandler()
    const { handleNetworkError } = useNetworkErrorHandler()
    const { handleBlockchainError } = useBlockchainErrorHandler()
    const { handleWalletError } = useWalletErrorHandler()

    const simulateNetworkError = async () => {
        await handleNetworkError(async () => {
            // Simulate network error
            throw new Error('fetch failed: Network error')
        }, 'Fallback data')
    }

    const simulateBlockchainError = async () => {
        await handleBlockchainError(async () => {
            // Simulate blockchain error
            throw new Error('transaction failed: insufficient gas')
        }, null)
    }

    const simulateWalletError = () => {
        handleWalletError(new Error('wallet connection failed'))
    }

    const simulateAsyncError = async () => {
        await handleAsyncError(async () => {
            // Simulate async operation with retry
            throw new Error('API request failed')
        }, {
            retryConfig: {
                maxAttempts: 3,
                baseDelay: 1000
            },
            userMessage: 'Failed to load data. Please try again.'
        })
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Error Handling Hooks</h3>
            <div className="grid grid-cols-2 gap-4">
                <Button onClick={simulateNetworkError} variant="outline">
                    Simulate Network Error
                </Button>
                <Button onClick={simulateBlockchainError} variant="outline">
                    Simulate Blockchain Error
                </Button>
                <Button onClick={simulateWalletError} variant="outline">
                    Simulate Wallet Error
                </Button>
                <Button onClick={simulateAsyncError} variant="outline">
                    Simulate Async Error with Retry
                </Button>
            </div>
        </div>
    )
}

// Example using error boundaries
function ErrorBoundariesExample() {
    const [shouldThrow, setShouldThrow] = useState(false)

    if (shouldThrow) {
        throw new Error('This is a simulated error for the error boundary')
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Error Boundaries</h3>

            <ErrorBoundaryWithFallback>
                <Card>
                    <CardHeader>
                        <CardTitle>General Error Boundary</CardTitle>
                        <CardDescription>
                            This component is wrapped in an error boundary with fallback state.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => setShouldThrow(true)} variant="destructive">
                            Throw Error
                        </Button>
                    </CardContent>
                </Card>
            </ErrorBoundaryWithFallback>

            <div className="grid grid-cols-3 gap-4">
                <NetworkErrorBoundary>
                    <Card>
                        <CardHeader>
                            <CardTitle>Network Error Boundary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={() => {
                                    throw new Error('fetch failed: Network error')
                                }}
                                variant="outline"
                            >
                                Simulate Network Error
                            </Button>
                        </CardContent>
                    </Card>
                </NetworkErrorBoundary>

                <WalletErrorBoundary>
                    <Card>
                        <CardHeader>
                            <CardTitle>Wallet Error Boundary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={() => {
                                    throw new Error('wallet connection failed')
                                }}
                                variant="outline"
                            >
                                Simulate Wallet Error
                            </Button>
                        </CardContent>
                    </Card>
                </WalletErrorBoundary>

                <BlockchainErrorBoundary>
                    <Card>
                        <CardHeader>
                            <CardTitle>Blockchain Error Boundary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={() => {
                                    throw new Error('transaction failed: insufficient gas')
                                }}
                                variant="outline"
                            >
                                Simulate Blockchain Error
                            </Button>
                        </CardContent>
                    </Card>
                </BlockchainErrorBoundary>
            </div>
        </div>
    )
}

// Example showing different error states
function ErrorStatesExample() {
    const [showErrorState, setShowErrorState] = useState<string | null>(null)

    const networkError = createError(
        ErrorType.NETWORK,
        'fetch failed: Network error',
        'Unable to connect to the server. Please check your internet connection.',
        ErrorSeverity.MEDIUM,
        true
    )

    const walletError = createError(
        ErrorType.WALLET,
        'wallet connection failed',
        'Your wallet connection has been lost. Please reconnect.',
        ErrorSeverity.HIGH,
        false
    )

    const blockchainError = createError(
        ErrorType.BLOCKCHAIN,
        'transaction failed: insufficient gas',
        'The transaction failed due to insufficient gas fees.',
        ErrorSeverity.HIGH,
        true
    )

    if (showErrorState === 'network') {
        return (
            <NetworkErrorState
                onRetry={() => setShowErrorState(null)}
                onGoBack={() => setShowErrorState(null)}
            />
        )
    }

    if (showErrorState === 'wallet') {
        return (
            <WalletErrorState
                onRetry={() => setShowErrorState(null)}
                onGoBack={() => setShowErrorState(null)}
            />
        )
    }

    if (showErrorState === 'blockchain') {
        return (
            <BlockchainErrorState
                onRetry={() => setShowErrorState(null)}
                onGoBack={() => setShowErrorState(null)}
            />
        )
    }

    if (showErrorState === 'loading') {
        return (
            <LoadingErrorState
                onRetry={() => setShowErrorState(null)}
                onGoBack={() => setShowErrorState(null)}
            />
        )
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Error States</h3>
            <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => setShowErrorState('network')} variant="outline">
                    Show Network Error State
                </Button>
                <Button onClick={() => setShowErrorState('wallet')} variant="outline">
                    Show Wallet Error State
                </Button>
                <Button onClick={() => setShowErrorState('blockchain')} variant="outline">
                    Show Blockchain Error State
                </Button>
                <Button onClick={() => setShowErrorState('loading')} variant="outline">
                    Show Loading Error State
                </Button>
            </div>
        </div>
    )
}

// Example for simulating different types of errors
function ErrorSimulationExample() {
    const { handleError } = useErrorHandler()

    const simulateErrors = {
        network: () => handleError(new Error('fetch failed: Network error')),
        timeout: () => handleError(new Error('Request timeout')),
        rateLimit: () => handleError(new Error('Rate limit exceeded')),
        validation: () => handleError(new Error('Invalid input data')),
        authentication: () => handleError(new Error('Authentication failed')),
        authorization: () => handleError(new Error('Access denied')),
        unknown: () => handleError(new Error('Unknown error occurred'))
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Error Simulation</h3>
            <div className="grid grid-cols-2 gap-4">
                {Object.entries(simulateErrors).map(([type, handler]) => (
                    <Button key={type} onClick={handler} variant="outline">
                        Simulate {type.charAt(0).toUpperCase() + type.slice(1)} Error
                    </Button>
                ))}
            </div>
        </div>
    )
} 