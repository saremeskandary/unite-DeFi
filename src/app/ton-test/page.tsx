'use client'

import { useTonConnectUI } from '@tonconnect/ui-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wallet, Copy, CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { TonConnectDebug } from '@/components/debug/ton-connect-debug'
import { SwapInterface } from '@/components/ton/TonSwapInterface'

export default function TonTestPage() {
    const [tonConnectUI] = useTonConnectUI()
    const connected = tonConnectUI?.connected
    const account = tonConnectUI?.account
    const wallet = tonConnectUI?.wallet
    const [copied, setCopied] = useState(false)
    const [showSwapInterface, setShowSwapInterface] = useState(false)

    const copyAddress = async () => {
        if (account?.address) {
            await navigator.clipboard.writeText(account.address)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleOrderCreated = (orderId: string) => {
        console.log('TON swap order created:', orderId)
        // You can add toast notification or other feedback here
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-2">TON Connect Test</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Test page for TON Connect functionality and TON swaps
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wallet className="h-5 w-5" />
                            Connection Status
                        </CardTitle>
                        <CardDescription>
                            Current TON Connect status and wallet information
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Status:</span>
                            <Badge variant={connected ? "default" : "secondary"}>
                                {connected ? (
                                    <>
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Connected
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Disconnected
                                    </>
                                )}
                            </Badge>
                        </div>

                        {connected && account && (
                            <>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Wallet:</span>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {(wallet as any)?.name || 'Unknown'}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    <span className="text-sm font-medium">Address:</span>
                                    <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                        <code className="text-xs flex-1 break-all">
                                            {account.address}
                                        </code>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={copyAddress}
                                            className="h-6 w-6 p-0"
                                        >
                                            {copied ? (
                                                <CheckCircle className="h-3 w-3" />
                                            ) : (
                                                <Copy className="h-3 w-3" />
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Network:</span>
                                    <Badge variant="outline">
                                        {(account.chain as any) === -3 ? 'Testnet' : 'Mainnet'}
                                    </Badge>
                                </div>
                            </>
                        )}

                        <div className="pt-4 space-y-2">
                            {connected ? (
                                <>
                                    <Button
                                        onClick={() => tonConnectUI?.disconnect()}
                                        variant="destructive"
                                        className="w-full"
                                    >
                                        Disconnect Wallet
                                    </Button>
                                    <Button
                                        onClick={() => setShowSwapInterface(!showSwapInterface)}
                                        variant="outline"
                                        className="w-full"
                                    >
                                        {showSwapInterface ? 'Hide' : 'Show'} TON Swap Interface
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    onClick={() => tonConnectUI?.connectWallet()}
                                    className="w-full"
                                >
                                    Connect Wallet
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* TON Swap Interface */}
                {showSwapInterface && connected && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wallet className="h-5 w-5" />
                                TON Swap Interface
                            </CardTitle>
                            <CardDescription>
                                Test TON swaps with your connected wallet
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SwapInterface
                                onOrderCreated={handleOrderCreated}
                                tonWalletAddress={account?.address || null}
                                tonWalletConnected={connected || false}
                            />
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Debug Information</CardTitle>
                        <CardDescription>
                            Technical details for debugging
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>User Agent:</span>
                                <span className="text-gray-600 dark:text-gray-400">
                                    {typeof window !== 'undefined' ? window.navigator.userAgent.substring(0, 50) + '...' : 'SSR'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Environment:</span>
                                <span className="text-gray-600 dark:text-gray-400">
                                    {process.env.NODE_ENV}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Hostname:</span>
                                <span className="text-gray-600 dark:text-gray-400">
                                    {typeof window !== 'undefined' ? window.location.hostname : 'SSR'}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <TonConnectDebug />
            </div>
        </div>
    )
} 