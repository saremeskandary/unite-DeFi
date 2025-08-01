'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, ExternalLink, Settings } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface OneInchSwapWidgetProps {
    onSwapComplete?: (txHash: string) => void
    onError?: (error: Error) => void
    defaultFromToken?: string
    defaultToToken?: string
    theme?: 'light' | 'dark'
    className?: string
}

export function OneInchSwapWidget({
    onSwapComplete,
    onError,
    defaultFromToken = 'USDC',
    defaultToToken = 'ETH',
    theme = 'dark',
    className = ''
}: OneInchSwapWidgetProps) {
    const widgetRef = useRef<HTMLDivElement>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isWidgetReady, setIsWidgetReady] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        const loadWidget = async () => {
            try {
                setIsLoading(true)

                // Check if 1inch widget script is already loaded
                if (window.OneInchWidget) {
                    initializeWidget()
                    return
                }

                // Load 1inch widget script
                const script = document.createElement('script')
                script.src = 'https://widget.1inch.io/widget.js'
                script.async = true

                script.onload = () => {
                    if (window.OneInchWidget && widgetRef.current) {
                        initializeWidget()
                    } else {
                        throw new Error('Failed to load 1inch widget')
                    }
                }

                script.onerror = () => {
                    throw new Error('Failed to load 1inch widget script')
                }

                document.head.appendChild(script)

                return () => {
                    // Cleanup script if component unmounts before loading
                    if (script.parentNode) {
                        document.head.removeChild(script)
                    }
                }
            } catch (error) {
                console.error('Error loading 1inch widget:', error)
                toast({
                    title: 'Error',
                    description: 'Failed to load swap widget. Please try again.',
                    variant: 'destructive'
                })
                onError?.(error as Error)
            } finally {
                setIsLoading(false)
            }
        }

        const initializeWidget = () => {
            if (!window.OneInchWidget || !widgetRef.current) return

            try {
                window.OneInchWidget.init({
                    element: widgetRef.current,
                    theme: theme,
                    defaultFromToken: defaultFromToken,
                    defaultToToken: defaultToToken,
                    onSwapComplete: (txHash: string) => {
                        toast({
                            title: 'Swap Completed!',
                            description: `Transaction: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`,
                        })
                        onSwapComplete?.(txHash)
                    },
                    onError: (error: any) => {
                        console.error('1inch widget error:', error)
                        toast({
                            title: 'Swap Error',
                            description: error.message || 'An error occurred during the swap',
                            variant: 'destructive'
                        })
                        onError?.(error)
                    },
                    onQuoteUpdate: (quote: any) => {
                        // Handle quote updates if needed
                        console.log('Quote updated:', quote)
                    },
                    // Additional configuration options
                    slippage: 0.5,
                    gasPrice: 'auto',
                    enableFusion: true,
                    enableCrossChain: true,
                    enableLimitOrders: false,
                    // Styling
                    width: '100%',
                    height: '500px',
                    borderRadius: '12px'
                })

                setIsWidgetReady(true)
            } catch (error) {
                console.error('Error initializing 1inch widget:', error)
                toast({
                    title: 'Error',
                    description: 'Failed to initialize swap widget',
                    variant: 'destructive'
                })
                onError?.(error as Error)
            }
        }

        loadWidget()
    }, [theme, defaultFromToken, defaultToToken, onSwapComplete, onError, toast])

    const openInNewTab = () => {
        window.open('https://app.1inch.io/', '_blank')
    }

    return (
        <Card className={`w-full max-w-2xl mx-auto ${className}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">1</span>
                    </div>
                    <div>
                        <CardTitle className="text-lg">1inch Swap</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                                Powered by Fusion
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                                Best Rates
                            </Badge>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={openInNewTab}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Open in 1inch
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading && (
                    <div className="flex items-center justify-center h-96">
                        <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground">Loading swap widget...</p>
                        </div>
                    </div>
                )}

                {!isLoading && !isWidgetReady && (
                    <div className="flex items-center justify-center h-96">
                        <div className="text-center">
                            <p className="text-muted-foreground mb-4">Failed to load swap widget</p>
                            <Button
                                onClick={() => window.location.reload()}
                                variant="outline"
                            >
                                Retry
                            </Button>
                        </div>
                    </div>
                )}

                <div
                    ref={widgetRef}
                    className={`min-h-[500px] ${!isWidgetReady ? 'hidden' : ''}`}
                />

                {isWidgetReady && (
                    <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Powered by 1inch Fusion Protocol</span>
                            <span>Best rates across all DEXs</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// TypeScript declarations
declare global {
    interface Window {
        OneInchWidget: {
            init: (config: {
                element: HTMLElement
                theme: 'light' | 'dark'
                defaultFromToken?: string
                defaultToToken?: string
                onSwapComplete?: (txHash: string) => void
                onError?: (error: any) => void
                onQuoteUpdate?: (quote: any) => void
                slippage?: number
                gasPrice?: 'auto' | 'fast' | 'slow'
                enableFusion?: boolean
                enableCrossChain?: boolean
                enableLimitOrders?: boolean
                width?: string
                height?: string
                borderRadius?: string
            }) => void
        }
    }
} 