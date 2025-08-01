'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import {
    ArrowUpDown,
    Settings,
    Info,
    ChevronDown,
    Search,
    ArrowLeft,
    Check,
    Network,
    Bitcoin,
    Wallet,
    ExternalLink,
    AlertTriangle,
    Shield,
    Clock,
    Zap
} from 'lucide-react'
import { enhancedWallet } from '@/lib/enhanced-wallet'
import { toast } from 'sonner'
import { BitcoinSwapFlowUI } from './bitcoin-swap-flow-ui'
import { BitcoinAddressInput } from './bitcoin-address-input'
import { OrderSummary } from './order-summary'

interface Token {
    symbol: string
    name: string
    balance: string
    price?: number
    value?: number
    networks: string[]
    networkCount: number
    isFavorite?: boolean
}

interface Network {
    id: string
    name: string
    icon: string
    color: string
    chainId: number
    type: 'smart_contract' | 'simple'
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
    minimumReceived: string
    slippage: number
}

interface NetworkFee {
    gasPrice: number
    gasLimit: number
    totalFee: number
    feeInUSD: number
    priority: 'slow' | 'standard' | 'fast'
    estimatedTime: string
}

// Supported networks
const SUPPORTED_NETWORKS: Network[] = [
    { id: 'ethereum', name: 'Ethereum', icon: 'eth', color: '#627EEA', chainId: 1, type: 'smart_contract' },
    { id: 'bitcoin', name: 'Bitcoin', icon: 'btc', color: '#F7931A', chainId: 0, type: 'simple' },
    { id: 'polygon', name: 'Polygon', icon: 'matic', color: '#8247E5', chainId: 137, type: 'smart_contract' },
    { id: 'bsc', name: 'BNB Chain', icon: 'bnb', color: '#F3BA2F', chainId: 56, type: 'smart_contract' },
    { id: 'arbitrum', name: 'Arbitrum', icon: 'arb', color: '#28A0F0', chainId: 42161, type: 'smart_contract' },
    { id: 'optimism', name: 'Optimism', icon: 'op', color: '#FF0420', chainId: 10, type: 'smart_contract' },
    { id: 'avalanche', name: 'Avalanche', icon: 'avax', color: '#E84142', chainId: 43114, type: 'smart_contract' },
    { id: 'solana', name: 'Solana', icon: 'sol', color: '#14F195', chainId: 101, type: 'smart_contract' },
    { id: 'tron', name: 'Tron', icon: 'trx', color: '#FF0000', chainId: 728126428, type: 'smart_contract' },
]

// Token data with network availability
const TOKENS_DATA: Token[] = [
    {
        symbol: "WBTC",
        name: "Wrapped BTC",
        balance: "0.00",
        networks: ["ethereum", "polygon", "arbitrum", "optimism", "avalanche", "bsc"],
        networkCount: 6,
        isFavorite: true
    },
    {
        symbol: "USDC",
        name: "USD Coin",
        balance: "0.00",
        networks: ["ethereum", "polygon", "arbitrum", "optimism", "avalanche", "bsc", "solana", "tron"],
        networkCount: 8,
        isFavorite: true
    },
    {
        symbol: "USDT",
        name: "Tether USD",
        balance: "0.00",
        networks: ["ethereum", "polygon", "arbitrum", "optimism", "avalanche", "bsc", "solana", "tron"],
        networkCount: 8,
        isFavorite: true
    },
    {
        symbol: "ETH",
        name: "Ethereum",
        balance: "0.00",
        networks: ["ethereum"],
        networkCount: 1,
        isFavorite: true
    },
    {
        symbol: "WETH",
        name: "Wrapped Ethereum",
        balance: "0.00",
        networks: ["ethereum", "polygon", "arbitrum", "optimism", "avalanche", "bsc"],
        networkCount: 6,
        isFavorite: true
    },
    {
        symbol: "UNI",
        name: "Uniswap",
        balance: "0.00",
        networks: ["ethereum", "polygon", "arbitrum", "optimism"],
        networkCount: 4,
        isFavorite: false
    },
    {
        symbol: "LINK",
        name: "ChainLink Token",
        balance: "0.00",
        networks: ["ethereum", "polygon", "arbitrum", "optimism", "avalanche", "bsc", "solana"],
        networkCount: 7,
        isFavorite: false
    },
    {
        symbol: "BTC",
        name: "Bitcoin",
        balance: "0.00",
        networks: ["bitcoin"],
        networkCount: 1,
        isFavorite: true
    },
    {
        symbol: "SOL",
        name: "Solana",
        balance: "0.00",
        networks: ["solana"],
        networkCount: 1,
        isFavorite: false
    },
    {
        symbol: "MATIC",
        name: "Polygon",
        balance: "0.00",
        networks: ["polygon", "ethereum"],
        networkCount: 2,
        isFavorite: false
    },
    {
        symbol: "BNB",
        name: "BNB",
        balance: "0.00",
        networks: ["bsc"],
        networkCount: 1,
        isFavorite: false
    },
    {
        symbol: "DAI",
        name: "Dai Stablecoin",
        balance: "0.00",
        networks: ["ethereum", "polygon", "bsc"],
        networkCount: 3,
        isFavorite: false
    },
]

interface OneInchStyleSwapInterfaceProps {
    onOrderCreated?: (orderId: string) => void
}

export function OneInchStyleSwapInterface({ onOrderCreated }: OneInchStyleSwapInterfaceProps) {
    // Token and network state
    const [fromToken, setFromToken] = useState<Token>(TOKENS_DATA.find(t => t.symbol === 'WETH')!)
    const [toToken, setToToken] = useState<Token>(TOKENS_DATA.find(t => t.symbol === 'USDC')!)
    const [fromNetwork, setFromNetwork] = useState<Network>(SUPPORTED_NETWORKS.find(n => n.id === 'ethereum')!)
    const [toNetwork, setToNetwork] = useState<Network>(SUPPORTED_NETWORKS.find(n => n.id === 'ethereum')!)

    // Amounts and UI state
    const [fromAmount, setFromAmount] = useState("")
    const [toAmount, setToAmount] = useState("")
    const [slippage, setSlippage] = useState("0.5")
    const [isLoading, setIsLoading] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isQuoteLoading, setIsQuoteLoading] = useState(false)

    // Token selection state
    const [isFromTokenSelectorOpen, setIsFromTokenSelectorOpen] = useState(false)
    const [isToTokenSelectorOpen, setIsToTokenSelectorOpen] = useState(false)
    const [selectedNetworkFilter, setSelectedNetworkFilter] = useState<string>('all')
    const [tokenSearch, setTokenSearch] = useState("")
    const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false)

    // Quote and swap state
    const [currentQuote, setCurrentQuote] = useState<SwapQuote | null>(null)
    const [networkFees, setNetworkFees] = useState<{ slow: NetworkFee; standard: NetworkFee; fast: NetworkFee } | null>(null)
    const [selectedFeePriority, setSelectedFeePriority] = useState<'slow' | 'standard' | 'fast'>('standard')
    const [priceImpact, setPriceImpact] = useState(0)
    const [showHighImpactWarning, setShowHighImpactWarning] = useState(false)

    // Wallet state
    const [walletConnected, setWalletConnected] = useState(false)
    const [walletAddress, setWalletAddress] = useState<string | null>(null)
    const [isWalletSelectorOpen, setIsWalletSelectorOpen] = useState(false)

    // Bitcoin specific state
    const [showBitcoinFlow, setShowBitcoinFlow] = useState(false)
    const [bitcoinAddress, setBitcoinAddress] = useState("")
    const [isBitcoinAddressValid, setIsBitcoinAddressValid] = useState<boolean | null>(null)

    // Refs for click outside handling
    const networkDropdownRef = useRef<HTMLDivElement>(null)

    // Initialize wallet connection and load token balances
    useEffect(() => {
        const initializeWallet = async () => {
            if (enhancedWallet.isConnected()) {
                setWalletConnected(true)
                setWalletAddress(enhancedWallet.getCurrentAddress())
                await loadTokenBalances()
            }
        }

        initializeWallet()

        // Listen for wallet changes
        enhancedWallet.onAccountChange((address) => {
            setWalletAddress(address)
            loadTokenBalances()
        })

        enhancedWallet.onChainChange((chainId) => {
            loadTokenBalances()
        })
    }, [])

    // Handle click outside network dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (networkDropdownRef.current && !networkDropdownRef.current.contains(event.target as Node)) {
                setIsNetworkDropdownOpen(false)
            }
        }

        if (isNetworkDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isNetworkDropdownOpen])

    // Load token balances from wallet
    const loadTokenBalances = useCallback(async () => {
        if (!enhancedWallet.isConnected()) return

        try {
            const walletInfo = await enhancedWallet.getWalletInfo()
            if (!walletInfo) return

            // Update token balances with real data
            const updatedTokens = TOKENS_DATA.map(token => {
                const walletToken = walletInfo.tokens.find((t: any) => t.symbol === token.symbol)
                return {
                    ...token,
                    balance: walletToken?.balance || '0.00',
                    price: walletToken?.price || 0,
                    value: walletToken?.value || 0
                }
            })

            // Update current tokens
            setFromToken(prev => updatedTokens.find(t => t.symbol === prev.symbol) || prev)
            setToToken(prev => updatedTokens.find(t => t.symbol === prev.symbol) || prev)
        } catch (error) {
            console.error('Error loading token balances:', error)
        }
    }, [])

    // Handle amount changes and get quotes
    useEffect(() => {
        if (fromAmount && fromToken && toToken) {
            getSwapQuote()
        } else {
            setCurrentQuote(null)
            setToAmount("")
        }
    }, [fromAmount, fromToken, toToken, fromNetwork, toNetwork])

    // Reset Bitcoin address when switching away from BTC
    useEffect(() => {
        if (toToken.symbol !== 'BTC') {
            setBitcoinAddress("")
            setIsBitcoinAddressValid(null)
        }
    }, [toToken.symbol])

    // Get swap quote
    const getSwapQuote = async () => {
        if (!fromAmount || !fromToken || !toToken) return

        setIsQuoteLoading(true)
        try {
            // Simulate API call for quote
            await new Promise(resolve => setTimeout(resolve, 1000))

            const amount = parseFloat(fromAmount)
            const rate = 0.95 // Simulated rate
            const toAmountValue = amount * rate
            const priceImpactValue = Math.random() * 30 // Simulated price impact

            const quote: SwapQuote = {
                fromToken: fromToken.symbol,
                toToken: toToken.symbol,
                fromAmount: fromAmount,
                toAmount: toAmountValue.toFixed(6),
                rate: rate,
                priceImpact: priceImpactValue,
                gasEstimate: "150,000",
                gasCost: 0.005,
                source: "1inch Fusion",
                minimumReceived: (toAmountValue * (1 - parseFloat(slippage) / 100)).toFixed(6),
                slippage: parseFloat(slippage)
            }

            setCurrentQuote(quote)
            setToAmount(quote.toAmount)
            setPriceImpact(priceImpactValue)
            setShowHighImpactWarning(priceImpactValue > 20)

            // Simulate network fees
            setNetworkFees({
                slow: { gasPrice: 15, gasLimit: 150000, totalFee: 0.00225, feeInUSD: 4.5, priority: 'slow', estimatedTime: '5-10 min' },
                standard: { gasPrice: 20, gasLimit: 150000, totalFee: 0.003, feeInUSD: 6, priority: 'standard', estimatedTime: '2-5 min' },
                fast: { gasPrice: 25, gasLimit: 150000, totalFee: 0.00375, feeInUSD: 7.5, priority: 'fast', estimatedTime: '30 sec' }
            })
        } catch (error) {
            console.error('Error getting quote:', error)
            toast.error('Failed to get swap quote')
        } finally {
            setIsQuoteLoading(false)
        }
    }

    // Handle swap tokens
    const handleSwapTokens = () => {
        const tempToken = fromToken
        const tempNetwork = fromNetwork
        const tempAmount = fromAmount

        setFromToken(toToken)
        setToToken(tempToken)
        setFromNetwork(toNetwork)
        setToNetwork(tempNetwork)
        setFromAmount(toAmount)
        setToAmount(tempAmount)
    }

    // Handle max amount
    const handleMaxAmount = () => {
        const balance = parseFloat(fromToken.balance)
        if (balance > 0) {
            // Reserve some for gas
            const maxAmount = balance * 0.99
            setFromAmount(maxAmount.toFixed(6))
        }
    }

    // Handle slippage change
    const handleSlippageChange = (value: number[]) => {
        setSlippage(value[0].toString())
    }

    // Handle swap
    const handleSwap = async () => {
        if (!walletConnected) {
            setIsWalletSelectorOpen(true)
            return
        }

        if (!fromAmount || !toAmount || !currentQuote) {
            toast.error('Please enter amounts and wait for quote')
            return
        }

        // Check if Bitcoin is involved
        if (fromToken.symbol === 'BTC' || toToken.symbol === 'BTC') {
            // Validate Bitcoin address if receiving BTC
            if (toToken.symbol === 'BTC' && !bitcoinAddress) {
                toast.error('Please enter a valid Bitcoin address')
                return
            }
            if (toToken.symbol === 'BTC' && isBitcoinAddressValid !== true) {
                toast.error('Please enter a valid Bitcoin address')
                return
            }
            setShowBitcoinFlow(true)
            return
        }

        setIsLoading(true)
        try {
            // Simulate swap execution
            await new Promise(resolve => setTimeout(resolve, 2000))

            const orderId = `order_${Date.now()}`
            toast.success('Swap executed successfully!')
            onOrderCreated?.(orderId)
        } catch (error) {
            console.error('Swap error:', error)
            toast.error('Swap failed. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    // Filter tokens based on search and network
    const filteredTokens = TOKENS_DATA.filter(token => {
        const matchesSearch = token.symbol.toLowerCase().includes(tokenSearch.toLowerCase()) ||
            token.name.toLowerCase().includes(tokenSearch.toLowerCase())
        const matchesNetwork = selectedNetworkFilter === 'all' ||
            token.networks.includes(selectedNetworkFilter)
        return matchesSearch && matchesNetwork
    })

    // Check if this is a Bitcoin swap
    const isBitcoinSwap = fromToken.symbol === "BTC" || toToken.symbol === "BTC"

    // Check if swap is valid
    const isValidSwap = fromAmount && toAmount && currentQuote && walletConnected &&
        (!isBitcoinSwap || (toToken.symbol === 'BTC' ? bitcoinAddress && isBitcoinAddressValid === true : true))

    // Render network icon
    const renderNetworkIcon = (networkId: string, size: number = 20) => {
        const network = SUPPORTED_NETWORKS.find(n => n.id === networkId)
        if (!network) return null

        return (
            <div
                className="rounded-full flex items-center justify-center"
                style={{
                    width: size,
                    height: size,
                    backgroundColor: network.color,
                    fontSize: size * 0.6
                }}
            >
                {network.icon.toUpperCase().slice(0, 2)}
            </div>
        )
    }

    // Render token icon
    const renderTokenIcon = (symbol: string, size: number = 24) => {
        if (symbol === 'BTC') {
            return <Bitcoin className="w-6 h-6 text-orange-500" />
        }
        return (
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {symbol.slice(0, 2)}
            </div>
        )
    }

    // Validate Bitcoin address
    const validateBitcoinAddress = (address: string): boolean => {
        if (!address) return false

        const patterns = [
            /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/, // Legacy
            /^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/, // P2SH
            /^bc1[a-z0-9]{39,59}$/, // Bech32
            /^bc1[a-z0-9]{25,39}$/, // Bech32m
        ]

        return patterns.some(pattern => pattern.test(address))
    }

    // Token Selector Component
    const TokenSelector = ({
        isOpen,
        onClose,
        onSelect,
        currentToken,
        currentNetwork,
        type
    }: {
        isOpen: boolean
        onClose: () => void
        onSelect: (token: Token, network: Network) => void
        currentToken: Token
        currentNetwork: Network
        type: 'from' | 'to'
    }) => {
        const handleClose = () => {
            setIsNetworkDropdownOpen(false)
            onClose()
        }
        if (!isOpen) return null

        return (
            <Dialog open={isOpen} onOpenChange={(open) => {
                if (!open) {
                    onClose()
                }
            }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-2 mb-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClose}
                                className="p-1"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                            <DialogTitle>Select {type === 'from' ? 'You Pay' : 'You Receive'}</DialogTitle>
                        </div>
                    </DialogHeader>

                    {/* Network Selection */}
                    <div className="mb-4">
                        <div className="relative" ref={networkDropdownRef}>
                            <Button
                                variant="outline"
                                className="w-full justify-between"
                                onClick={() => {
                                    setIsNetworkDropdownOpen(!isNetworkDropdownOpen)
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <Network className="w-4 h-4" />
                                    <span>{selectedNetworkFilter === 'all' ? 'All Networks' : SUPPORTED_NETWORKS.find(n => n.id === selectedNetworkFilter)?.name}</span>
                                </div>
                                <ChevronDown className={`w-4 h-4 transition-transform ${isNetworkDropdownOpen ? 'rotate-180' : ''}`} />
                            </Button>

                            {/* Network Dropdown */}
                            {isNetworkDropdownOpen && (
                                <div
                                    className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto"
                                >
                                    <div className="p-2">
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start"
                                            onClick={() => {
                                                setSelectedNetworkFilter('all')
                                                setIsNetworkDropdownOpen(false)
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Network className="w-4 h-4" />
                                                <span>All Networks</span>
                                                {selectedNetworkFilter === 'all' && <Check className="w-4 h-4 ml-auto" />}
                                            </div>
                                        </Button>
                                        {SUPPORTED_NETWORKS.map((network) => (
                                            <Button
                                                key={network.id}
                                                variant="ghost"
                                                className="w-full justify-start"
                                                onClick={() => {
                                                    setSelectedNetworkFilter(network.id)
                                                    setIsNetworkDropdownOpen(false)
                                                }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {renderNetworkIcon(network.id, 16)}
                                                    <span>{network.name}</span>
                                                    {selectedNetworkFilter === network.id && <Check className="w-4 h-4 ml-auto" />}
                                                </div>
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            placeholder="Search tokens..."
                            value={tokenSearch}
                            onChange={(e) => setTokenSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Token List */}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {filteredTokens.map((token) => (
                            <div key={token.symbol}>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-between p-3 h-auto"
                                    onClick={() => {
                                        const defaultNetwork = SUPPORTED_NETWORKS.find(n => token.networks.includes(n.id)) || SUPPORTED_NETWORKS[0]
                                        onSelect(token, defaultNetwork)
                                        handleClose()
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        {renderTokenIcon(token.symbol)}
                                        <div className="text-left">
                                            <div className="font-medium">{token.symbol}</div>
                                            <div className="text-sm text-muted-foreground">{token.name}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {token.networkCount > 1 && (
                                            <Badge variant="secondary" className="text-xs">
                                                {token.networkCount}
                                            </Badge>
                                        )}
                                        <div className="text-right">
                                            <div className="text-sm">{token.balance}</div>
                                            <div className="text-xs text-muted-foreground">
                                                ${token.value ? token.value.toFixed(2) : '0.00'}
                                            </div>
                                        </div>
                                    </div>
                                </Button>

                                {/* Show networks if token has multiple */}
                                {token.networkCount > 1 && (
                                    <div className="ml-12 mb-2 flex flex-wrap gap-1">
                                        {token.networks.map(networkId => {
                                            const network = SUPPORTED_NETWORKS.find(n => n.id === networkId)
                                            if (!network) return null
                                            return (
                                                <Badge
                                                    key={networkId}
                                                    variant="outline"
                                                    className="text-xs cursor-pointer hover:bg-primary/10"
                                                    onClick={() => {
                                                        onSelect(token, network)
                                                        handleClose()
                                                    }}
                                                >
                                                    {renderNetworkIcon(networkId, 12)}
                                                    <span className="ml-1">{network.name}</span>
                                                </Badge>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    // Wallet Selector Component
    const WalletSelector = () => {
        if (!isWalletSelectorOpen) return null

        const wallets = [
            { name: '1inch Wallet', icon: '🔗', description: 'Scan QR code to connect' },
            { name: 'WalletConnect', icon: '🔗', description: 'Connect via WalletConnect' },
            { name: 'Rabby Wallet', icon: '🦊', description: 'Detected' },
            { name: 'Browser Wallet', icon: '🌐', description: 'MetaMask, etc.' },
            { name: 'OKX Wallet', icon: '🟢', description: 'OKX Wallet' },
        ]

        return (
            <Dialog open={isWalletSelectorOpen} onOpenChange={setIsWalletSelectorOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Connect Wallet</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                        {wallets.map((wallet) => (
                            <Button
                                key={wallet.name}
                                variant="outline"
                                className="w-full justify-start p-4 h-auto"
                                onClick={async () => {
                                    try {
                                        await enhancedWallet.connect()
                                        setWalletConnected(true)
                                        setWalletAddress(enhancedWallet.getCurrentAddress())
                                        setIsWalletSelectorOpen(false)
                                        toast.success('Wallet connected successfully!')
                                    } catch (error) {
                                        toast.error('Failed to connect wallet')
                                    }
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">{wallet.icon}</span>
                                    <div className="text-left">
                                        <div className="font-medium">{wallet.name}</div>
                                        <div className="text-sm text-muted-foreground">{wallet.description}</div>
                                    </div>
                                </div>
                            </Button>
                        ))}
                        <Button variant="ghost" className="w-full">
                            More wallets
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }



    return (
        <div className="w-full max-w-md mx-auto">
            <Card className="w-full">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Swap</CardTitle>
                        <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 text-xs sm:text-sm">
                                Best Rate
                            </Badge>
                            <Dialog open={isSettingsOpen} onOpenChange={(open) => {
                                // Close other dialogs when settings opens
                                if (open) {
                                    setIsFromTokenSelectorOpen(false)
                                    setIsToTokenSelectorOpen(false)
                                    setIsWalletSelectorOpen(false)
                                    setIsNetworkDropdownOpen(false)
                                }
                                setIsSettingsOpen(open)
                            }}>
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

                <CardContent className="space-y-4">
                    {/* From Token Section */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">You Pay</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    Balance: {fromToken.balance}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleMaxAmount}
                                    className="h-auto p-1 text-xs"
                                >
                                    Max
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 border rounded-lg">
                            <Button
                                variant="ghost"
                                className="flex items-center gap-2 p-0 h-auto"
                                onClick={() => setIsFromTokenSelectorOpen(true)}
                            >
                                {renderTokenIcon(fromToken.symbol)}
                                <div className="text-left">
                                    <div className="font-medium">{fromToken.symbol}</div>
                                    <div className="text-sm text-muted-foreground">{fromNetwork.name}</div>
                                </div>
                                <ChevronDown className="w-4 h-4" />
                            </Button>

                            <div className="flex-1">
                                <Input
                                    type="number"
                                    placeholder="0.0"
                                    value={fromAmount}
                                    onChange={(e) => setFromAmount(e.target.value)}
                                    className="border-0 text-right text-lg font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Swap Button */}
                    <div className="flex justify-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSwapTokens}
                            className="rounded-full w-10 h-10 p-0"
                        >
                            <ArrowUpDown className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* To Token Section */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">You Receive</span>
                        </div>

                        <div className="flex items-center gap-3 p-3 border rounded-lg">
                            <Button
                                variant="ghost"
                                className="flex items-center gap-2 p-0 h-auto"
                                onClick={() => setIsToTokenSelectorOpen(true)}
                            >
                                {renderTokenIcon(toToken.symbol)}
                                <div className="text-left">
                                    <div className="font-medium">{toToken.symbol}</div>
                                    <div className="text-sm text-muted-foreground">{toNetwork.name}</div>
                                </div>
                                <ChevronDown className="w-4 h-4" />
                            </Button>

                            <div className="flex-1">
                                <Input
                                    type="number"
                                    placeholder="0.0"
                                    value={toAmount}
                                    readOnly
                                    className="border-0 text-right text-lg font-medium bg-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bitcoin Address Input */}
                    {toToken.symbol === "BTC" && (
                        <BitcoinAddressInput
                            value={bitcoinAddress}
                            onChange={(value) => {
                                setBitcoinAddress(value)
                                setIsBitcoinAddressValid(validateBitcoinAddress(value))
                            }}
                        />
                    )}

                    {/* Swap Information */}
                    {currentQuote && (
                        <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Rate</span>
                                <span>1 {fromToken.symbol} = {currentQuote.rate.toFixed(6)} {toToken.symbol}</span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Price Impact</span>
                                <span className={priceImpact > 5 ? 'text-orange-500' : ''}>
                                    {priceImpact.toFixed(2)}%
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Minimum received</span>
                                <span>{currentQuote.minimumReceived} {toToken.symbol}</span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Network Fee</span>
                                <span>~${networkFees?.[selectedFeePriority]?.feeInUSD.toFixed(2) || '0.00'}</span>
                            </div>
                        </div>
                    )}

                    {/* Order Summary for Bitcoin swaps */}
                    {isValidSwap && isBitcoinSwap && (
                        <OrderSummary
                            fromToken={fromToken}
                            toToken={toToken}
                            fromAmount={fromAmount}
                            toAmount={toAmount}
                            bitcoinAddress={bitcoinAddress}
                        />
                    )}

                    {/* High Price Impact Warning */}
                    {showHighImpactWarning && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                High price impact! More than {priceImpact.toFixed(2)}% drop!
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Bitcoin Swap Warning */}
                    {isBitcoinSwap && (
                        <Alert>
                            <Bitcoin className="h-4 w-4" />
                            <AlertDescription>
                                This is a cross-chain swap involving Bitcoin. The process may take 15-30 minutes and requires manual signing.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Swap Button */}
                    <Button
                        className="w-full"
                        size="lg"
                        onClick={handleSwap}
                        disabled={!isValidSwap || isLoading || isQuoteLoading}
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Swapping...
                            </div>
                        ) : !walletConnected ? (
                            <div className="flex items-center gap-2">
                                <Wallet className="w-4 h-4" />
                                Connect Wallet
                            </div>
                        ) : !fromAmount || !toAmount ? (
                            'Enter an amount'
                        ) : isBitcoinSwap && toToken.symbol === 'BTC' && (!bitcoinAddress || isBitcoinAddressValid !== true) ? (
                            'Enter valid Bitcoin address'
                        ) : (
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4" />
                                {isBitcoinSwap ? 'Start Bitcoin Swap' : 'Swap'}
                            </div>
                        )}
                    </Button>

                    {/* Permit and Swap Info */}
                    {currentQuote && priceImpact > 20 && (
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                                <Shield className="w-4 h-4" />
                                <span>1inch Network uses signed permit approvals</span>
                                <Info className="w-4 h-4 cursor-help" />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                This allows you to approve 1inch smart contract access to your {fromToken.symbol} tokens and swap in one single transaction.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Token Selectors */}
            <TokenSelector
                isOpen={isFromTokenSelectorOpen}
                onClose={() => setIsFromTokenSelectorOpen(false)}
                onSelect={(token, network) => {
                    setFromToken(token)
                    setFromNetwork(network)
                }}
                currentToken={fromToken}
                currentNetwork={fromNetwork}
                type="from"
            />

            <TokenSelector
                isOpen={isToTokenSelectorOpen}
                onClose={() => setIsToTokenSelectorOpen(false)}
                onSelect={(token, network) => {
                    setToToken(token)
                    setToNetwork(network)
                }}
                currentToken={toToken}
                currentNetwork={toNetwork}
                type="to"
            />

            {/* Wallet Selector */}
            <WalletSelector />

            {/* Bitcoin Swap Flow */}
            {showBitcoinFlow && (
                <BitcoinSwapFlowUI
                    fromToken={fromToken.symbol}
                    toToken={toToken.symbol}
                    fromAmount={fromAmount}
                    toAmount={toAmount}
                    userEthereumAddress={walletAddress || ''}
                    onSwapComplete={(result) => {
                        setShowBitcoinFlow(false)
                        if (result.success) {
                            toast.success('Bitcoin swap completed!')
                            onOrderCreated?.(result.orderHash || `btc_swap_${Date.now()}`)
                        } else {
                            toast.error('Bitcoin swap failed. Please try again.')
                        }
                    }}
                />
            )}
        </div>
    )
} 