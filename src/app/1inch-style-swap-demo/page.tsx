'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { OneInchStyleSwapInterface } from '@/components/swap/1inch-style-swap-interface'
import { ArrowLeft, ExternalLink, Github } from 'lucide-react'
import Link from 'next/link'

export default function OneInchStyleSwapDemo() {
    const [lastOrderId, setLastOrderId] = useState<string | null>(null)

    const handleOrderCreated = (orderId: string) => {
        setLastOrderId(orderId)
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <Link href="/">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold">1inch-Style Swap Interface</h1>
                            <p className="text-muted-foreground">
                                Advanced swap interface with Bitcoin functionality and multi-chain support
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Badge variant="secondary">Bitcoin Support</Badge>
                        <Badge variant="secondary">Multi-Chain</Badge>
                        <Badge variant="secondary">1inch UI</Badge>
                        <Badge variant="secondary">Wallet Connect</Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Swap Interface */}
                    <div className="lg:col-span-2">
                        <OneInchStyleSwapInterface onOrderCreated={handleOrderCreated} />
                    </div>

                    {/* Features and Info */}
                    <div className="space-y-6">
                        {/* Features Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Features</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                                    <span className="text-sm">1inch-style token selection</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                                    <span className="text-sm">Multi-network support</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                                    <span className="text-sm">Bitcoin swap integration</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                                    <span className="text-sm">Real-time price quotes</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                                    <span className="text-sm">Slippage protection</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                                    <span className="text-sm">Wallet connection</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                                    <span className="text-sm">Price impact warnings</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Bitcoin Features */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <span className="text-orange-500">₿</span>
                                    Bitcoin Features
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="text-sm text-muted-foreground">
                                    When Bitcoin is selected as either the source or destination token:
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                                        <span className="text-sm">Specialized Bitcoin swap flow</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                                        <span className="text-sm">Bitcoin address validation</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                                        <span className="text-sm">Transaction monitoring</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                                        <span className="text-sm">Cross-chain coordination</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Order */}
                        {lastOrderId && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Recent Order</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Order ID:</span>
                                            <span className="font-mono">{lastOrderId}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Status:</span>
                                            <Badge variant="default">Completed</Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Links */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Resources</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Link href="https://1inch.io" target="_blank">
                                    <Button variant="outline" className="w-full justify-start">
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        1inch Protocol
                                    </Button>
                                </Link>
                                <Link href="https://github.com/saremeskandary/unite-DeFi" target="_blank">
                                    <Button variant="outline" className="w-full justify-start">
                                        <Github className="w-4 h-4 mr-2" />
                                        GitHub Repository
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Implementation Details */}
                <div className="mt-12">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Implementation Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-semibold mb-2">UI Features</h3>
                                    <ul className="space-y-1 text-sm text-muted-foreground">
                                        <li>• Token selection with network filtering</li>
                                        <li>• Real-time price quotes and impact calculation</li>
                                        <li>• Slippage tolerance settings</li>
                                        <li>• Wallet connection with multiple options</li>
                                        <li>• High price impact warnings</li>
                                        <li>• Permit approval explanations</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Bitcoin Integration</h3>
                                    <ul className="space-y-1 text-sm text-muted-foreground">
                                        <li>• Automatic Bitcoin flow detection</li>
                                        <li>• Bitcoin address input and validation</li>
                                        <li>• Cross-chain swap coordination</li>
                                        <li>• Transaction monitoring and status</li>
                                        <li>• Partial fill support</li>
                                        <li>• Relayer and resolver services</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
} 