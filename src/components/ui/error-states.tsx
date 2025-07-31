'use client'

import React from 'react'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Alert, AlertDescription, AlertTitle } from './alert'
import {
    AlertTriangle,
    RefreshCw,
    Wifi,
    WifiOff,
    Wallet,
    Shield,
    Clock,
    Server,
    ArrowLeft,
    Home
} from 'lucide-react'
import { ErrorType, ErrorSeverity, AppError } from '@/lib/error-handling'

interface ErrorStateProps {
    error: AppError
    onRetry?: () => void
    onGoBack?: () => void
    onGoHome?: () => void
    showDetails?: boolean
    className?: string
}

interface NetworkErrorStateProps {
    onRetry?: () => void
    onGoBack?: () => void
    className?: string
}

interface WalletErrorStateProps {
    onRetry?: () => void
    onGoBack?: () => void
    className?: string
}

interface BlockchainErrorStateProps {
    onRetry?: () => void
    onGoBack?: () => void
    className?: string
}

interface LoadingErrorStateProps {
    onRetry?: () => void
    onGoBack?: () => void
    className?: string
}

export function ErrorState({
    error,
    onRetry,
    onGoBack,
    onGoHome,
    showDetails = false,
    className = ''
}: ErrorStateProps) {
    const getErrorIcon = () => {
        switch (error.type) {
            case ErrorType.NETWORK:
                return <WifiOff className="h-6 w-6" />
            case ErrorType.WALLET:
                return <Wallet className="h-6 w-6" />
            case ErrorType.BLOCKCHAIN:
                return <Server className="h-6 w-6" />
            case ErrorType.TIMEOUT:
                return <Clock className="h-6 w-6" />
            case ErrorType.AUTHENTICATION:
            case ErrorType.AUTHORIZATION:
                return <Shield className="h-6 w-6" />
            default:
                return <AlertTriangle className="h-6 w-6" />
        }
    }

    const getErrorColor = () => {
        switch (error.severity) {
            case ErrorSeverity.CRITICAL:
                return 'text-red-600 bg-red-100'
            case ErrorSeverity.HIGH:
                return 'text-orange-600 bg-orange-100'
            case ErrorSeverity.MEDIUM:
                return 'text-yellow-600 bg-yellow-100'
            case ErrorSeverity.LOW:
                return 'text-blue-600 bg-blue-100'
            default:
                return 'text-gray-600 bg-gray-100'
        }
    }

    return (
        <div className={`flex items-center justify-center p-4 ${className}`}>
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${getErrorColor()}`}>
                        {getErrorIcon()}
                    </div>
                    <CardTitle className="text-xl">
                        {error.type === ErrorType.UNKNOWN ? 'Something went wrong' : getErrorTitle(error.type)}
                    </CardTitle>
                    <CardDescription className="mt-2">
                        {error.userMessage}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {showDetails && process.env.NODE_ENV === 'development' && (
                        <details className="rounded-lg border p-3 text-sm">
                            <summary className="cursor-pointer font-medium">Error Details</summary>
                            <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                                {error.message}
                                {error.details && `\n\nDetails: ${JSON.stringify(error.details, null, 2)}`}
                            </pre>
                        </details>
                    )}

                    <div className="flex gap-2">
                        {onRetry && error.retryable && (
                            <Button onClick={onRetry} className="flex-1">
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Try Again
                            </Button>
                        )}
                        {onGoBack && (
                            <Button onClick={onGoBack} variant="outline" className="flex-1">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Go Back
                            </Button>
                        )}
                        {onGoHome && (
                            <Button onClick={onGoHome} variant="outline" className="flex-1">
                                <Home className="mr-2 h-4 w-4" />
                                Go Home
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export function NetworkErrorState({ onRetry, onGoBack, className = '' }: NetworkErrorStateProps) {
    return (
        <div className={`flex items-center justify-center p-4 ${className}`}>
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                        <WifiOff className="h-6 w-6 text-red-600" />
                    </div>
                    <CardTitle className="text-xl">Connection Lost</CardTitle>
                    <CardDescription>
                        Unable to connect to the network. Please check your internet connection and try again.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <Wifi className="h-4 w-4" />
                        <AlertTitle>Network Issue</AlertTitle>
                        <AlertDescription>
                            We're having trouble connecting to our servers. This might be due to:
                        </AlertDescription>
                        <ul className="mt-2 list-disc list-inside text-sm text-muted-foreground">
                            <li>Poor internet connection</li>
                            <li>Server maintenance</li>
                            <li>Firewall blocking the connection</li>
                        </ul>
                    </Alert>

                    <div className="flex gap-2">
                        {onRetry && (
                            <Button onClick={onRetry} className="flex-1">
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Retry Connection
                            </Button>
                        )}
                        {onGoBack && (
                            <Button onClick={onGoBack} variant="outline" className="flex-1">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Go Back
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export function WalletErrorState({ onRetry, onGoBack, className = '' }: WalletErrorStateProps) {
    return (
        <div className={`flex items-center justify-center p-4 ${className}`}>
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                        <Wallet className="h-6 w-6 text-orange-600" />
                    </div>
                    <CardTitle className="text-xl">Wallet Connection Issue</CardTitle>
                    <CardDescription>
                        There was a problem connecting to your wallet. Please try reconnecting.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <Shield className="h-4 w-4" />
                        <AlertTitle>Wallet Disconnected</AlertTitle>
                        <AlertDescription>
                            Your wallet connection has been lost. This could be due to:
                        </AlertDescription>
                        <ul className="mt-2 list-disc list-inside text-sm text-muted-foreground">
                            <li>Wallet extension was closed</li>
                            <li>Network changed in your wallet</li>
                            <li>Wallet permissions were revoked</li>
                        </ul>
                    </Alert>

                    <div className="flex gap-2">
                        {onRetry && (
                            <Button onClick={onRetry} className="flex-1">
                                <Wallet className="mr-2 h-4 w-4" />
                                Reconnect Wallet
                            </Button>
                        )}
                        {onGoBack && (
                            <Button onClick={onGoBack} variant="outline" className="flex-1">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Go Back
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export function BlockchainErrorState({ onRetry, onGoBack, className = '' }: BlockchainErrorStateProps) {
    return (
        <div className={`flex items-center justify-center p-4 ${className}`}>
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                        <Server className="h-6 w-6 text-red-600" />
                    </div>
                    <CardTitle className="text-xl">Transaction Failed</CardTitle>
                    <CardDescription>
                        The blockchain transaction could not be completed. Please try again.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Transaction Error</AlertTitle>
                        <AlertDescription>
                            The transaction failed on the blockchain. Common causes include:
                        </AlertDescription>
                        <ul className="mt-2 list-disc list-inside text-sm text-muted-foreground">
                            <li>Insufficient gas fees</li>
                            <li>Network congestion</li>
                            <li>Insufficient balance</li>
                            <li>Smart contract error</li>
                        </ul>
                    </Alert>

                    <div className="flex gap-2">
                        {onRetry && (
                            <Button onClick={onRetry} className="flex-1">
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Retry Transaction
                            </Button>
                        )}
                        {onGoBack && (
                            <Button onClick={onGoBack} variant="outline" className="flex-1">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Go Back
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export function LoadingErrorState({ onRetry, onGoBack, className = '' }: LoadingErrorStateProps) {
    return (
        <div className={`flex items-center justify-center p-4 ${className}`}>
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                        <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                    <CardTitle className="text-xl">Loading Failed</CardTitle>
                    <CardDescription>
                        We couldn't load the requested data. Please try again.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Data Loading Error</AlertTitle>
                        <AlertDescription>
                            The requested data could not be loaded. This might be temporary.
                        </AlertDescription>
                    </Alert>

                    <div className="flex gap-2">
                        {onRetry && (
                            <Button onClick={onRetry} className="flex-1">
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Try Again
                            </Button>
                        )}
                        {onGoBack && (
                            <Button onClick={onGoBack} variant="outline" className="flex-1">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Go Back
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// Utility function to get error title
function getErrorTitle(type: ErrorType): string {
    const titles = {
        [ErrorType.NETWORK]: 'Connection Error',
        [ErrorType.BLOCKCHAIN]: 'Transaction Error',
        [ErrorType.WALLET]: 'Wallet Error',
        [ErrorType.VALIDATION]: 'Validation Error',
        [ErrorType.AUTHENTICATION]: 'Authentication Error',
        [ErrorType.AUTHORIZATION]: 'Authorization Error',
        [ErrorType.RATE_LIMIT]: 'Rate Limit Exceeded',
        [ErrorType.TIMEOUT]: 'Request Timeout',
        [ErrorType.UNKNOWN]: 'Something went wrong'
    }
    return titles[type] || titles[ErrorType.UNKNOWN]
} 