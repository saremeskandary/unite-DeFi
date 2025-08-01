'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { OneInchSwapWidget } from '@/components/1inch/1inch-swap-widget'
import { SwapInterface } from '@/components/swap/swap-interface'
import { ArrowRight, Zap, Shield, TrendingUp } from 'lucide-react'

export default function OneInchDemoPage() {
    const [activeTab, setActiveTab] = useState('1inch')
    const [swapHistory, setSwapHistory] = useState<string[]>([])

    const handleSwapComplete = (txHash: string) => {
        console.log('Swap completed:', txHash)
        setSwapHistory(prev => [txHash, ...prev.slice(0, 4)]) // Keep last 5 transactions
    }

    const handleError = (error: Error) => {
        console.error('Swap error:', error)
    }

    const features = [
        {
            icon: Zap,
            title: 'Lightning Fast',
            description: 'Best execution times with MEV protection'
        },
        {
            icon: Shield,
            title: 'Secure',
            description: 'Audited smart contracts and zero user gas costs'
        },
        {
            icon: TrendingUp,
            title: 'Best Rates',
            description: 'Aggregated from 100+ DEXs across all chains'
        }
    ]

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-4">1inch Integration Demo</h1>
                    <p className="text-xl text-muted-foreground mb-6">
                        Compare our custom swap interface with the professional 1inch widget
                    </p>

                    {/* Features */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {features.map((feature, index) => (
                            <Card key={index} className="text-center">
                                <CardContent className="pt-6">
                                    <feature.icon className="w-12 h-12 mx-auto mb-4 text-primary" />
                                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
                        <TabsTrigger value="1inch" className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded text-white text-xs flex items-center justify-center font-bold">
                                1
                            </div>
                            1inch Widget
                        </TabsTrigger>
                        <TabsTrigger value="1inch-sdk">1inch SDK</TabsTrigger>
                        <TabsTrigger value="custom">Custom</TabsTrigger>
                    </TabsList>

                    <TabsContent value="1inch" className="space-y-6">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-semibold mb-2">1inch Professional Widget</h2>
                            <p className="text-muted-foreground">
                                Embedded 1inch swap interface with full Fusion protocol support
                            </p>
                        </div>

                        <OneInchSwapWidget
                            onSwapComplete={handleSwapComplete}
                            onError={handleError}
                            defaultFromToken="USDC"
                            defaultToToken="ETH"
                            theme="dark"
                        />
                    </TabsContent>

                    <TabsContent value="1inch-sdk" className="space-y-6">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-semibold mb-2">1inch SDK Integration</h2>
                            <p className="text-muted-foreground">
                                Direct SDK integration for maximum customization
                            </p>
                        </div>

                        <Card className="w-full max-w-2xl mx-auto">
                            <CardHeader>
                                <CardTitle>SDK Integration Coming Soon</CardTitle>
                                <CardDescription>
                                    Advanced SDK integration with custom UI components
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                        <ArrowRight className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <p className="text-muted-foreground">
                                        This will show a custom implementation using the 1inch SDK directly
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="custom" className="space-y-6">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-semibold mb-2">Custom Implementation</h2>
                            <p className="text-muted-foreground">
                                Our current swap interface for comparison
                            </p>
                        </div>

                        <SwapInterface onOrderCreated={handleSwapComplete} />
                    </TabsContent>
                </Tabs>

                {/* Swap History */}
                {swapHistory.length > 0 && (
                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle>Recent Swaps</CardTitle>
                            <CardDescription>
                                Transaction history from your swaps
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {swapHistory.map((txHash, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Badge variant="secondary">#{index + 1}</Badge>
                                            <code className="text-sm">
                                                {txHash.slice(0, 10)}...{txHash.slice(-8)}
                                            </code>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => window.open(`https://etherscan.io/tx/${txHash}`, '_blank')}
                                        >
                                            View
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Comparison Table */}
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>Feature Comparison</CardTitle>
                        <CardDescription>
                            Compare the different swap implementations
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4">Feature</th>
                                        <th className="text-center py-3 px-4">1inch Widget</th>
                                        <th className="text-center py-3 px-4">1inch SDK</th>
                                        <th className="text-center py-3 px-4">Custom</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b">
                                        <td className="py-3 px-4 font-medium">Setup Complexity</td>
                                        <td className="text-center py-3 px-4">
                                            <Badge variant="secondary">Easy</Badge>
                                        </td>
                                        <td className="text-center py-3 px-4">
                                            <Badge variant="outline">Medium</Badge>
                                        </td>
                                        <td className="text-center py-3 px-4">
                                            <Badge variant="outline">Hard</Badge>
                                        </td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-3 px-4 font-medium">Customization</td>
                                        <td className="text-center py-3 px-4">
                                            <Badge variant="outline">Limited</Badge>
                                        </td>
                                        <td className="text-center py-3 px-4">
                                            <Badge variant="secondary">Full</Badge>
                                        </td>
                                        <td className="text-center py-3 px-4">
                                            <Badge variant="secondary">Full</Badge>
                                        </td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-3 px-4 font-medium">Maintenance</td>
                                        <td className="text-center py-3 px-4">
                                            <Badge variant="secondary">None</Badge>
                                        </td>
                                        <td className="text-center py-3 px-4">
                                            <Badge variant="outline">Low</Badge>
                                        </td>
                                        <td className="text-center py-3 px-4">
                                            <Badge variant="outline">High</Badge>
                                        </td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-3 px-4 font-medium">Features</td>
                                        <td className="text-center py-3 px-4">
                                            <Badge variant="secondary">Complete</Badge>
                                        </td>
                                        <td className="text-center py-3 px-4">
                                            <Badge variant="secondary">Complete</Badge>
                                        </td>
                                        <td className="text-center py-3 px-4">
                                            <Badge variant="outline">Basic</Badge>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 px-4 font-medium">Recommended Use</td>
                                        <td className="text-center py-3 px-4 text-xs text-muted-foreground">
                                            Quick integration, production ready
                                        </td>
                                        <td className="text-center py-3 px-4 text-xs text-muted-foreground">
                                            Custom UI, full control
                                        </td>
                                        <td className="text-center py-3 px-4 text-xs text-muted-foreground">
                                            Learning, specific requirements
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
} 