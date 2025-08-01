"use client"

import { useTonAddress, useTonWallet, useTonConnectUI, useIsConnectionRestored } from '@tonconnect/ui-react'
import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"

export function TONTestPageClient() {
    const [isMounted, setIsMounted] = useState(false)
    const [copied, setCopied] = useState(false)

    // Always call TON Connect hooks to maintain hook order
    const address = useTonAddress()
    const wallet = useTonWallet()
    const [tonConnectUI] = useTonConnectUI()
    const isConnectionRestored = useIsConnectionRestored()

    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Use safe fallbacks when not mounted or provider not ready
    const safeAddress = isMounted ? address : null
    const safeWallet = isMounted ? wallet : null
    const safeTonConnectUI = isMounted ? tonConnectUI : null
    const safeIsConnectionRestored = isMounted ? isConnectionRestored : false
    const isConnected = isMounted && safeAddress && safeWallet ? true : false

    const copyAddress = async () => {
        if (safeAddress) {
            await navigator.clipboard.writeText(safeAddress)
            setCopied(true)
            toast.success("Address copied to clipboard!")
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const openExplorer = () => {
        if (safeAddress) {
            window.open(`https://tonviewer.com/${safeAddress}`, '_blank')
        }
    }

    if (!isMounted) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card>
                    <CardHeader>
                        <CardTitle>TON Wallet Test</CardTitle>
                        <CardDescription>Loading...</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    if (!safeIsConnectionRestored) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card>
                    <CardHeader>
                        <CardTitle>TON Wallet Test</CardTitle>
                        <CardDescription>Initializing TON Connect...</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <Card>
                <CardHeader>
                    <CardTitle>TON Wallet Test</CardTitle>
                    <CardDescription>Test your TON wallet connection and functionality</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Connection Status */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Connection Status</h3>
                            <p className="text-sm text-muted-foreground">
                                {isConnected ? "Connected to TON wallet" : "Not connected"}
                            </p>
                        </div>
                        <Badge variant={isConnected ? "default" : "secondary"}>
                            {isConnected ? "Connected" : "Disconnected"}
                        </Badge>
                    </div>

                    {/* Wallet Info */}
                    {isConnected && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Wallet Information</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Address:</span>
                                        <div className="flex items-center space-x-2">
                                            <code className="text-xs bg-muted px-2 py-1 rounded">
                                                {safeAddress?.slice(0, 8)}...{safeAddress?.slice(-8)}
                                            </code>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={copyAddress}
                                                className="h-8 w-8 p-0"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Wallet Name:</span>
                                        <span className="text-sm">{safeWallet?.name || "Unknown"}</span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Version:</span>
                                        <span className="text-sm">{safeWallet?.version || "Unknown"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-2">
                                <Button
                                    onClick={openExplorer}
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    View on Explorer
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => safeTonConnectUI?.disconnect()}
                                    className="w-full"
                                >
                                    Disconnect
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Connect Button */}
                    {!isConnected && (
                        <div className="space-y-4">
                            <Button
                                onClick={() => safeTonConnectUI?.openModal()}
                                className="w-full"
                            >
                                Connect TON Wallet
                            </Button>
                        </div>
                    )}

                    {/* Proof Information */}
                    {isConnected && safeWallet?.connectItems?.tonProof && (
                        <div>
                            <h3 className="text-lg font-semibold mb-2">TON Proof</h3>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Proof Available:</span>
                                    <Badge variant="outline">
                                        {safeWallet?.connectItems?.tonProof && 'proof' in safeWallet.connectItems.tonProof && (
                                            safeWallet.connectItems.tonProof.proof ? "Yes" : "No"
                                        )}
                                    </Badge>
                                </div>
                                {safeWallet?.connectItems?.tonProof && 'proof' in safeWallet.connectItems.tonProof && safeWallet.connectItems.tonProof.proof && (
                                    <div className="text-xs bg-muted p-2 rounded">
                                        <code>{JSON.stringify(safeWallet.connectItems.tonProof.proof, null, 2)}</code>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
} 