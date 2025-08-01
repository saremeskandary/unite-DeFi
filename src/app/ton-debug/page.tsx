"use client"

import { useTonAddress, useTonWallet, useTonConnectUI, useIsConnectionRestored } from '@tonconnect/ui-react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TONConnectButton } from "@/components/wallet/ton-connect-button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle, Info, RefreshCw } from "lucide-react"
import { useTONConnectError } from "@/hooks/use-ton-connect-error"

export default function TONDebugPage() {
    const [isMounted, setIsMounted] = useState(false)
    const [debugInfo, setDebugInfo] = useState<any>({})
    const { errors, isChecking, clearErrors, getLatestError } = useTONConnectError()

    // TON Connect hooks
    const address = useTonAddress()
    const wallet = useTonWallet()
    const [tonConnectUI] = useTonConnectUI()
    const isConnectionRestored = useIsConnectionRestored()

    useEffect(() => {
        setIsMounted(true)

        // Collect debug information
        const info = {
            userAgent: navigator.userAgent,
            location: window.location.href,
            timestamp: new Date().toISOString(),
            isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
            manifestUrl: window.location.hostname === 'localhost' ? '/tonconnect-manifest-dev.json' : '/tonconnect-manifest.json',
            tonConnectVersion: '2.2.0', // Update this based on your package.json
            browser: {
                name: navigator.userAgent.includes('Chrome') ? 'Chrome' :
                    navigator.userAgent.includes('Firefox') ? 'Firefox' :
                        navigator.userAgent.includes('Safari') ? 'Safari' : 'Unknown',
                version: navigator.userAgent.match(/(Chrome|Firefox|Safari)\/(\d+)/)?.[2] || 'Unknown'
            }
        }

        setDebugInfo(info)
    }, [])

    if (!isMounted) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card>
                    <CardHeader>
                        <CardTitle>TON Connect Debug</CardTitle>
                        <CardDescription>Loading...</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    const isConnected = address && wallet
    const connectionStatus = isConnectionRestored ? 'Ready' : 'Initializing'
    const latestError = getLatestError()

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Info className="w-5 h-5" />
                        TON Connect Debug Information
                    </CardTitle>
                    <CardDescription>
                        Debug information for TON Connect integration
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Connection Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h3 className="font-semibold">Connection Status</h3>
                            <div className="flex items-center gap-2">
                                <Badge variant={isConnected ? "default" : "secondary"}>
                                    {isConnected ? "Connected" : "Disconnected"}
                                </Badge>
                                <Badge variant="outline">
                                    {connectionStatus}
                                </Badge>
                                {isChecking && (
                                    <Badge variant="outline" className="animate-pulse">
                                        Checking...
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-semibold">Environment</h3>
                            <div className="flex items-center gap-2">
                                <Badge variant={debugInfo.isLocalhost ? "secondary" : "default"}>
                                    {debugInfo.isLocalhost ? "Development" : "Production"}
                                </Badge>
                                <Badge variant="outline">
                                    {debugInfo.browser.name} {debugInfo.browser.version}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Error Information */}
                    {errors.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">Errors ({errors.length})</h3>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearErrors}
                                    className="text-xs"
                                >
                                    Clear
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {errors.map((error, index) => (
                                    <Alert key={index} variant="destructive">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertDescription>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-xs">
                                                        {error.type}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {error.timestamp.toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm">{error.message}</p>
                                                {error.details && (
                                                    <details className="text-xs">
                                                        <summary className="cursor-pointer">Error Details</summary>
                                                        <pre className="mt-1 whitespace-pre-wrap text-xs">
                                                            {JSON.stringify(error.details, null, 2)}
                                                        </pre>
                                                    </details>
                                                )}
                                            </div>
                                        </AlertDescription>
                                    </Alert>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Wallet Information */}
                    {isConnected && (
                        <div className="space-y-2">
                            <h3 className="font-semibold">Wallet Information</h3>
                            <div className="bg-muted p-3 rounded-md">
                                <p className="text-sm font-mono break-all">{address}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Wallet: {(wallet as any)?.name || 'Unknown'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Version: {(wallet as any)?.version || 'Unknown'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Debug Information */}
                    <div className="space-y-2">
                        <h3 className="font-semibold">Debug Information</h3>
                        <div className="bg-muted p-3 rounded-md text-sm">
                            <pre className="whitespace-pre-wrap text-xs">
                                {JSON.stringify(debugInfo, null, 2)}
                            </pre>
                        </div>
                    </div>

                    {/* Connection Button */}
                    <div className="space-y-2">
                        <h3 className="font-semibold">Connect Wallet</h3>
                        <TONConnectButton />
                    </div>

                    {/* Troubleshooting Tips */}
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Troubleshooting Tips:</strong>
                            <ul className="mt-2 space-y-1 text-sm">
                                <li>• Make sure you have Tonkeeper or another TON wallet installed</li>
                                <li>• Check that the manifest file is accessible at {debugInfo.manifestUrl}</li>
                                <li>• Try refreshing the page if connection fails</li>
                                <li>• Check browser console for any error messages</li>
                                <li>• Ensure you're using a supported browser (Chrome, Firefox, Safari)</li>
                                <li>• Try disabling browser extensions that might interfere</li>
                            </ul>
                        </AlertDescription>
                    </Alert>

                    {/* Quick Actions */}
                    <div className="space-y-2">
                        <h3 className="font-semibold">Quick Actions</h3>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.location.reload()}
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Refresh Page
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(debugInfo.manifestUrl, '_blank')}
                            >
                                Check Manifest
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
} 