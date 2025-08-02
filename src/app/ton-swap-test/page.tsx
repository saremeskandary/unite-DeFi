"use client"

import { useState } from "react"
import { SwapInterface } from "@/components/ton/TonSwapInterface"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wallet, Coins } from "lucide-react"

export default function TonSwapTestPage() {
    const [tonWalletConnected, setTonWalletConnected] = useState(false)
    const [tonWalletAddress, setTonWalletAddress] = useState<string | null>(null)
    const [orderId, setOrderId] = useState<string | null>(null)

    const handleConnectTonWallet = () => {
        // Mock TON wallet connection
        const mockAddress = "EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t"
        setTonWalletAddress(mockAddress)
        setTonWalletConnected(true)
    }

    const handleDisconnectTonWallet = () => {
        setTonWalletAddress(null)
        setTonWalletConnected(false)
    }

    const handleOrderCreated = (orderId: string) => {
        setOrderId(orderId)
        console.log("Order created:", orderId)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-3xl font-bold text-gray-900">TON Swap Interface Test</h1>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        This page demonstrates the enhanced TON swap interface with TON wallet integration,
                        cross-chain swaps, and TON-specific features.
                    </p>
                </div>

                {/* TON Wallet Connection */}
                <Card className="bg-white/80 backdrop-blur-sm border-gray-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Coins className="w-5 h-5 text-blue-600" />
                            TON Wallet Connection
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!tonWalletConnected ? (
                            <div className="text-center space-y-4">
                                <p className="text-gray-600">Connect your TON wallet to enable TON swaps</p>
                                <Button
                                    onClick={handleConnectTonWallet}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    <Wallet className="w-4 h-4 mr-2" />
                                    Connect Mock TON Wallet
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                            <Wallet className="w-3 h-3 mr-1" />
                                            Connected
                                        </Badge>
                                        <span className="text-sm text-gray-600">
                                            {tonWalletAddress?.slice(0, 6)}...{tonWalletAddress?.slice(-4)}
                                        </span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={handleDisconnectTonWallet}
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                    >
                                        Disconnect
                                    </Button>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-sm text-blue-800">
                                        <strong>Mock TON Wallet Info:</strong>
                                    </p>
                                    <p className="text-xs text-blue-700 mt-1">
                                        Balance: 100.000000000 TON
                                    </p>
                                    <p className="text-xs text-blue-700">
                                        Network: TON Testnet
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Swap Interface */}
                <Card className="bg-white/80 backdrop-blur-sm border-gray-200">
                    <CardHeader>
                        <CardTitle>TON Swap Interface</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SwapInterface
                            onOrderCreated={handleOrderCreated}
                            tonWalletAddress={tonWalletAddress}
                            tonWalletConnected={tonWalletConnected}
                        />
                    </CardContent>
                </Card>

                {/* Order Status */}
                {orderId && (
                    <Card className="bg-white/80 backdrop-blur-sm border-gray-200">
                        <CardHeader>
                            <CardTitle>Latest Order</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <p className="text-sm text-gray-600">
                                    <strong>Order ID:</strong> {orderId}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>Status:</strong> Created
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>Timestamp:</strong> {new Date().toLocaleString()}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Features List */}
                <Card className="bg-white/80 backdrop-blur-sm border-gray-200">
                    <CardHeader>
                        <CardTitle>TON Swap Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <h4 className="font-semibold text-gray-900">TON Integration</h4>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    <li>• TON wallet connection and balance display</li>
                                    <li>• TON-specific swap quotes and fees</li>
                                    <li>• TON network information</li>
                                    <li>• TON transaction execution</li>
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-semibold text-gray-900">Cross-Chain Support</h4>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    <li>• TON ↔ Ethereum swaps</li>
                                    <li>• TON ↔ Bitcoin swaps</li>
                                    <li>• Cross-chain fee estimation</li>
                                    <li>• Multi-network token selection</li>
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-semibold text-gray-900">Enhanced UI</h4>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    <li>• TON wallet status indicator</li>
                                    <li>• TON-specific price information</li>
                                    <li>• Network-specific fee display</li>
                                    <li>• Real-time quote updates</li>
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-semibold text-gray-900">API Integration</h4>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    <li>• TON swap API endpoint</li>
                                    <li>• TON integration service</li>
                                    <li>• Fallback mechanisms</li>
                                    <li>• Error handling</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
} 