"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChainTokenSelector } from "./chain-token-selector"
import { ChainAddressInput } from "./chain-address-input"
import { OrderSummary } from "./order-summary"
import { ArrowUpDown, Settings, Info, AlertCircle } from "lucide-react"
import { enhancedWallet } from "@/lib/enhanced-wallet"
import { toast } from "sonner"
import { CHAIN_CONFIG, CHAIN_TYPES } from "@/lib/security/validation-schemas"

interface MultiChainSwapInterfaceProps {
    onOrderCreated: (orderId: string) => void
}

interface Token {
    symbol: string
    name: string
    balance: string
    price?: number
    value?: number
    chain?: string
    networks?: string[]
    networkCount?: number
    isFavorite?: boolean
}

interface Network {
    id: string
    name: string
    icon: string
    chainId: number
    type: 'simple' | 'smart_contract'
}

interface SwapQuote {
    fromToken: string
    toToken: string
    fromAmount: string
    toAmount: string
    rate: number
    priceImpact: number
    gasEstimate: string
    gasCost: number
    source: string
}

interface NetworkFee {
    gasPrice: number
    gasLimit: number
    totalFee: number
    feeInUSD: number
    priority: 'slow' | 'standard' | 'fast'
    estimatedTime: string
}

// Predefined chain pairs for tabs
const CHAIN_PAIRS = [
    { id: 'btc-eth', fromChain: 'BTC', toChain: 'ETH', label: 'Bitcoin ↔ Ethereum' },
    { id: 'tron-eth', fromChain: 'TRON', toChain: 'ETH', label: 'Tron ↔ Ethereum' },
    { id: 'ada-eth', fromChain: 'ADA', toChain: 'ETH', label: 'Cardano ↔ Ethereum' },
    { id: 'sol-eth', fromChain: 'SOL', toChain: 'ETH', label: 'Solana ↔ Ethereum' },
    { id: 'doge-eth', fromChain: 'DOGE', toChain: 'ETH', label: 'Dogecoin ↔ Ethereum' },
    { id: 'btc-tron', fromChain: 'BTC', toChain: 'TRON', label: 'Bitcoin ↔ Tron' },
    { id: 'eth-tron', fromChain: 'ETH', toChain: 'TRON', label: 'Ethereum ↔ Tron' },
    { id: 'custom', fromChain: 'ETH', toChain: 'BTC', label: 'Custom Pair' }
]

// Token lists for different chains
const CHAIN_TOKENS = {
    BTC: [{ symbol: "BTC", name: "Bitcoin", balance: "0.00" }],
    DOGE: [{ symbol: "DOGE", name: "Dogecoin", balance: "0.00" }],
    LTC: [{ symbol: "LTC", name: "Litecoin", balance: "0.00" }],
    BCH: [{ symbol: "BCH", name: "Bitcoin Cash", balance: "0.00" }],
    ETH: [
        { symbol: "ETH", name: "Ethereum", balance: "0.00" },
        { symbol: "USDC", name: "USD Coin", balance: "0.00" },
        { symbol: "USDT", name: "Tether USD", balance: "0.00" },
        { symbol: "WETH", name: "Wrapped Ethereum", balance: "0.00" },
        { symbol: "WBTC", name: "Wrapped Bitcoin", balance: "0.00" },
        { symbol: "DAI", name: "Dai Stablecoin", balance: "0.00" },
        { symbol: "UNI", name: "Uniswap", balance: "0.00" },
        { symbol: "LINK", name: "Chainlink", balance: "0.00" },
        { symbol: "AAVE", name: "Aave", balance: "0.00" },
        { symbol: "MATIC", name: "Polygon", balance: "0.00" }
    ],
    TRON: [
        { symbol: "TRX", name: "Tron", balance: "0.00" },
        { symbol: "USDT", name: "Tether USD", balance: "0.00" },
        { symbol: "USDC", name: "USD Coin", balance: "0.00" },
        { symbol: "BTT", name: "BitTorrent", balance: "0.00" },
        { symbol: "JST", name: "JUST", balance: "0.00" },
        { symbol: "WIN", name: "WINk", balance: "0.00" }
    ],
    ADA: [
        { symbol: "ADA", name: "Cardano", balance: "0.00" },
        { symbol: "AGIX", name: "SingularityNET", balance: "0.00" },
        { symbol: "MIN", name: "Minswap", balance: "0.00" }
    ],
    SOL: [
        { symbol: "SOL", name: "Solana", balance: "0.00" },
        { symbol: "USDC", name: "USD Coin", balance: "0.00" },
        { symbol: "USDT", name: "Tether USD", balance: "0.00" },
        { symbol: "RAY", name: "Raydium", balance: "0.00" },
        { symbol: "SRM", name: "Serum", balance: "0.00" }
    ],
    MATIC: [
        { symbol: "MATIC", name: "Polygon", balance: "0.00" },
        { symbol: "USDC", name: "USD Coin", balance: "0.00" },
        { symbol: "USDT", name: "Tether USD", balance: "0.00" },
        { symbol: "WETH", name: "Wrapped Ethereum", balance: "0.00" }
    ],
    BSC: [
        { symbol: "BNB", name: "Binance Coin", balance: "0.00" },
        { symbol: "USDC", name: "USD Coin", balance: "0.00" },
        { symbol: "USDT", name: "Tether USD", balance: "0.00" },
        { symbol: "CAKE", name: "PancakeSwap", balance: "0.00" }
    ]
}

export function MultiChainSwapInterface({ onOrderCreated }: MultiChainSwapInterfaceProps) {
    const [activeTab, setActiveTab] = useState('btc-eth')
    const [fromChain, setFromChain] = useState('BTC')
    const [toChain, setToChain] = useState('ETH')
    const [fromToken, setFromToken] = useState<Token>({ symbol: "BTC", name: "Bitcoin", balance: "0.00" })
    const [toToken, setToToken] = useState<Token>({ symbol: "ETH", name: "Ethereum", balance: "0.00" })
    const [fromNetwork, setFromNetwork] = useState<Network>({ id: 'bitcoin', name: 'Bitcoin', icon: 'btc', chainId: 0, type: 'simple' })
    const [toNetwork, setToNetwork] = useState<Network>({ id: 'ethereum', name: 'Ethereum', icon: 'eth', chainId: 1, type: 'smart_contract' })
    const [fromAmount, setFromAmount] = useState("")
    const [toAmount, setToAmount] = useState("")
    const [toAddress, setToAddress] = useState("")
    const [slippage, setSlippage] = useState("0.5")
    const [isLoading, setIsLoading] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isQuoteLoading, setIsQuoteLoading] = useState(false)
    const [currentQuote, setCurrentQuote] = useState<SwapQuote | null>(null)
    const [networkFees, setNetworkFees] = useState<{ slow: NetworkFee; standard: NetworkFee; fast: NetworkFee } | null>(null)
    const [selectedFeePriority, setSelectedFeePriority] = useState<'slow' | 'standard' | 'fast'>('standard')
    const [walletConnected, setWalletConnected] = useState(false)
    const [walletAddress, setWalletAddress] = useState<string | null>(null)

    // Update chain pair when tab changes
    useEffect(() => {
        const selectedPair = CHAIN_PAIRS.find(pair => pair.id === activeTab)
        if (selectedPair) {
            setFromChain(selectedPair.fromChain)
            setToChain(selectedPair.toChain)

            // Set appropriate tokens based on chain type
            const fromChainConfig = CHAIN_CONFIG[selectedPair.fromChain as keyof typeof CHAIN_CONFIG]
            const toChainConfig = CHAIN_CONFIG[selectedPair.toChain as keyof typeof CHAIN_CONFIG]

            if (fromChainConfig) {
                const fromTokens = CHAIN_TOKENS[selectedPair.fromChain as keyof typeof CHAIN_TOKENS] || []
                setFromToken(fromTokens[0] || { symbol: fromChainConfig.nativeToken, name: fromChainConfig.name, balance: "0.00" })
            }

            if (toChainConfig) {
                const toTokens = CHAIN_TOKENS[selectedPair.toChain as keyof typeof CHAIN_TOKENS] || []
                setToToken(toTokens[0] || { symbol: toChainConfig.nativeToken, name: toChainConfig.name, balance: "0.00" })
            }

            // Clear amounts and quote when changing chains
            setFromAmount("")
            setToAmount("")
            setCurrentQuote(null)
        }
    }, [activeTab])

    // Load token balances
    const loadTokenBalances = useCallback(async () => {
        if (!enhancedWallet.isConnected()) return

        try {
            const walletInfo = await enhancedWallet.getWalletInfo()
            if (!walletInfo) return

            // Update token balances based on current chains
            const fromTokens = CHAIN_TOKENS[fromChain as keyof typeof CHAIN_TOKENS] || []
            const toTokens = CHAIN_TOKENS[toChain as keyof typeof CHAIN_TOKENS] || []

            // Update from token balance
            const fromTokenBalance = walletInfo.tokens.find(t => t.symbol === fromToken.symbol)
            if (fromTokenBalance) {
                setFromToken(prev => ({
                    ...prev,
                    balance: fromTokenBalance.balance,
                    price: fromTokenBalance.price,
                    value: fromTokenBalance.value
                }))
            }

            // Update to token balance
            const toTokenBalance = walletInfo.tokens.find(t => t.symbol === toToken.symbol)
            if (toTokenBalance) {
                setToToken(prev => ({
                    ...prev,
                    balance: toTokenBalance.balance,
                    price: toTokenBalance.price,
                    value: toTokenBalance.value
                }))
            }
        } catch (error) {
            console.error('Error loading token balances:', error)
        }
    }, [fromChain, toChain, fromToken.symbol, toToken.symbol])

    // Initialize wallet connection
    useEffect(() => {
        const initializeWallet = async () => {
            if (enhancedWallet.isConnected()) {
                setWalletConnected(true)
                setWalletAddress(enhancedWallet.getCurrentAddress())
                await loadTokenBalances()
            }
        }

        initializeWallet()

        const handleAccountChange = (address: string) => {
            setWalletAddress(address)
            loadTokenBalances()
        }

        const handleChainChange = (chainId: number) => {
            loadTokenBalances()
        }

        enhancedWallet.onAccountChange(handleAccountChange)
        enhancedWallet.onChainChange(handleChainChange)

        // Cleanup listeners
        return () => {
            // Note: enhancedWallet should have cleanup methods, but for now we'll rely on the component unmounting
        }
    }, [loadTokenBalances])

    // Get swap quote
    const getSwapQuote = useCallback(async (amount: string) => {
        if (!amount || parseFloat(amount) <= 0 || !walletAddress) {
            setToAmount("")
            setCurrentQuote(null)
            return
        }

        setIsQuoteLoading(true)
        try {
            const response = await fetch(
                `/api/swap/quote?fromChain=${fromNetwork.id}&toChain=${toNetwork.id}&fromToken=${fromToken.symbol}&toToken=${toToken.symbol}&amount=${amount}&fromAddress=${walletAddress}`
            )

            if (response.ok) {
                const data = await response.json()
                setCurrentQuote(data.quote)
                setToAmount(data.quote.toAmount)
                setNetworkFees(data.fees)
            } else {
                console.error('Failed to get swap quote')
                setToAmount("")
                setCurrentQuote(null)
            }
        } catch (error) {
            console.error('Error getting swap quote:', error)
            setToAmount("")
            setCurrentQuote(null)
        } finally {
            setIsQuoteLoading(false)
        }
    }, [fromChain, toChain, fromToken.symbol, toToken.symbol, walletAddress])

    const handleSwapTokens = () => {
        const temp = fromToken
        setFromToken(toToken)
        setToToken(temp)
        setFromAmount(toAmount)
        setToAmount(fromAmount)
        setCurrentQuote(null)
    }

    const handleAmountChange = (value: string) => {
        setFromAmount(value)
        getSwapQuote(value)
    }

    const handleMaxAmount = () => {
        const maxBalance = parseFloat(fromToken.balance.replace(/,/g, ""))
        setFromAmount(maxBalance.toString())
        getSwapQuote(maxBalance.toString())
    }

    const handleSlippageChange = (value: number[]) => {
        setSlippage(value[0].toString())
    }

    const handleCreateOrder = async () => {
        if (!walletConnected) {
            toast.error("Please connect your wallet first")
            return
        }

        if (!currentQuote) {
            toast.error("Please enter a valid amount to get a quote")
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch('/api/swap/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fromChain: fromNetwork.id,
                    toChain: toNetwork.id,
                    fromToken: fromToken.symbol,
                    toToken: toToken.symbol,
                    fromAmount: fromAmount,
                    toAddress: toAddress || walletAddress,
                    slippage: parseFloat(slippage),
                    feePriority: selectedFeePriority
                })
            })

            const result = await response.json()

            if (result.success) {
                toast.success("Swap order created successfully!")
                onOrderCreated(result.order.id)
            } else {
                toast.error(result.error || "Failed to create swap order")
            }
        } catch (error) {
            console.error('Error creating swap order:', error)
            toast.error("Failed to create swap order")
        } finally {
            setIsLoading(false)
        }
    }

    const isValidSwap = fromAmount && toAmount && (toAddress || walletAddress) &&
        Number.parseFloat(fromAmount) > 0 && walletConnected && currentQuote

    return (
        <Card className="bg-card/50 border-border backdrop-blur-sm w-full max-w-md mx-auto">
            <CardHeader className="pb-4 px-4 sm:px-6">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground text-lg sm:text-xl">Multi-Chain Swap</CardTitle>
                    <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 text-xs sm:text-sm">
                            Cross-Chain
                        </Badge>
                        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground p-2">
                                    <Settings className="w-4 h-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-card border-border w-[90vw] max-w-sm mx-auto">
                                <DialogHeader>
                                    <DialogTitle className="text-foreground">Swap Settings</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">Slippage Tolerance</Label>
                                        <div className="space-y-2">
                                            <Slider
                                                value={[parseFloat(slippage)]}
                                                onValueChange={handleSlippageChange}
                                                max={5}
                                                min={0.1}
                                                step={0.1}
                                                className="w-full"
                                            />
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">0.1%</span>
                                                <span className="text-foreground font-medium">{slippage}%</span>
                                                <span className="text-muted-foreground">5%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSlippage("0.5")}
                                            className="flex-1 border-border text-muted-foreground hover:bg-accent text-xs"
                                        >
                                            0.5%
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSlippage("1.0")}
                                            className="flex-1 border-border text-muted-foreground hover:bg-accent text-xs"
                                        >
                                            1.0%
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSlippage("2.0")}
                                            className="flex-1 border-border text-muted-foreground hover:bg-accent text-xs"
                                        >
                                            2.0%
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4 px-4 sm:px-6">
                {/* Chain Pair Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                        {CHAIN_PAIRS.slice(0, 4).map((pair) => (
                            <TabsTrigger key={pair.id} value={pair.id} className="text-xs">
                                {pair.label.split('↔')[0].trim()}
                                <br />
                                {pair.label.split('↔')[1].trim()}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {/* Additional tabs for mobile */}
                    <div className="mt-2">
                        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                            {CHAIN_PAIRS.slice(4).map((pair) => (
                                <TabsTrigger key={pair.id} value={pair.id} className="text-xs">
                                    {pair.label.split('↔')[0].trim()}
                                    <br />
                                    {pair.label.split('↔')[1].trim()}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>
                </Tabs>

                {/* Chain Type Info */}
                <div className="flex items-center space-x-2 text-xs text-muted-foreground bg-muted/20 rounded-lg p-2">
                    <AlertCircle className="w-3 h-3" />
                    <span>
                        {fromNetwork.type === 'simple' ? 'Native token only' : 'Multiple tokens available'}
                        {' → '}
                        {toNetwork.type === 'simple' ? 'Native token only' : 'Multiple tokens available'}
                    </span>
                </div>

                {/* From Token */}
                <div className="space-y-2">
                    <Label className="text-muted-foreground text-sm">From ({fromNetwork.name})</Label>
                    <div className="relative">
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={fromAmount}
                            onChange={(e) => handleAmountChange(e.target.value)}
                            className="bg-muted/50 border-border text-foreground text-lg sm:text-xl h-14 sm:h-16 pr-28 sm:pr-32"
                        />
                        <div className="absolute right-2 top-2">
                            <ChainTokenSelector
                                selectedToken={fromToken}
                                selectedNetwork={fromNetwork}
                                onSelect={(token, network) => {
                                    setFromToken(token)
                                    setFromNetwork(network)
                                }}
                                type="from"
                            />
                        </div>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">
                            Balance: {fromToken.balance} {fromToken.symbol}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary/80 h-auto p-0 text-xs"
                            onClick={handleMaxAmount}
                        >
                            Max
                        </Button>
                    </div>
                </div>

                {/* Swap Button */}
                <div className="flex justify-center">
                    <Button
                        onClick={handleSwapTokens}
                        variant="ghost"
                        size="sm"
                        className="rounded-full bg-muted hover:bg-accent text-foreground p-2"
                    >
                        <ArrowUpDown className="w-4 h-4" />
                    </Button>
                </div>

                {/* To Token */}
                <div className="space-y-2">
                    <Label className="text-muted-foreground text-sm">To ({toNetwork.name})</Label>
                    <div className="relative">
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={isQuoteLoading ? "Loading..." : toAmount}
                            readOnly
                            className="bg-muted/50 border-border text-foreground text-lg sm:text-xl h-14 sm:h-16 pr-28 sm:pr-32"
                        />
                        <div className="absolute right-2 top-2">
                            <ChainTokenSelector
                                selectedToken={toToken}
                                selectedNetwork={toNetwork}
                                onSelect={(token, network) => {
                                    setToToken(token)
                                    setToNetwork(network)
                                }}
                                type="to"
                            />
                        </div>
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                        Balance: {toToken.balance} {toToken.symbol}
                    </div>
                </div>

                {/* Chain Address Input */}
                <ChainAddressInput
                    chain={toNetwork.id}
                    value={toAddress}
                    onChange={setToAddress}
                    placeholder={`Enter ${toNetwork.name} address`}
                />

                {/* Price Info */}
                {currentQuote && (
                    <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between text-xs sm:text-sm">
                            <span className="text-muted-foreground">Rate</span>
                            <span className="text-foreground text-right">
                                1 {fromToken.symbol} = {currentQuote.rate.toFixed(8)} {toToken.symbol}
                            </span>
                        </div>
                        <div className="flex justify-between text-xs sm:text-sm">
                            <span className="text-muted-foreground">Price Impact</span>
                            <span className={`text-right ${Math.abs(currentQuote.priceImpact) > 1 ? 'text-red-500' : 'text-foreground'}`}>
                                {currentQuote.priceImpact.toFixed(2)}%
                            </span>
                        </div>
                        <div className="flex justify-between text-xs sm:text-sm">
                            <span className="text-muted-foreground">Slippage Tolerance</span>
                            <span className="text-foreground">{slippage}%</span>
                        </div>
                        <div className="flex justify-between text-xs sm:text-sm">
                            <span className="text-muted-foreground">Network Fee</span>
                            <span className="text-foreground">
                                ~${networkFees?.[selectedFeePriority]?.feeInUSD?.toFixed(2) || '2.50'}
                            </span>
                        </div>
                        <div className="flex justify-between text-xs sm:text-sm">
                            <span className="text-muted-foreground">Source</span>
                            <span className="text-foreground">{currentQuote.source}</span>
                        </div>
                    </div>
                )}

                {/* Order Summary */}
                {isValidSwap && (
                    <OrderSummary
                        fromToken={fromToken}
                        toToken={toToken}
                        fromAmount={fromAmount}
                        toAmount={toAmount}
                        bitcoinAddress={toAddress}
                    />
                )}

                {/* Swap Button */}
                <Button
                    onClick={handleCreateOrder}
                    disabled={!isValidSwap || isLoading}
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm sm:text-base"
                >
                    {isLoading ? (
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                            <span className="text-xs sm:text-sm">Creating Order...</span>
                        </div>
                    ) : !walletConnected ? (
                        "Connect Wallet to Swap"
                    ) : (
                        "Create Cross-Chain Swap"
                    )}
                </Button>

                {/* Info */}
                <div className="flex items-start space-x-2 text-xs text-muted-foreground bg-muted/20 rounded-lg p-3">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p className="text-xs leading-relaxed">
                        This cross-chain swap uses atomic swap technology to ensure trustless execution between different blockchains.
                        Simple chains (Bitcoin, Dogecoin) only support native tokens, while smart contract chains support multiple tokens.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
} 