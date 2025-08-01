'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Search,
    ChevronDown,
    ArrowLeft,
    Check,
    Star,
    StarOff,
    Network,
    Bitcoin
} from 'lucide-react'
import { TokenIcon } from '@web3icons/react'

interface Token {
    symbol: string
    name: string
    balance: string
    icon?: string
    networks: string[]
    networkCount: number
    isFavorite?: boolean
    price?: number
    value?: number
}

interface Network {
    id: string
    name: string
    icon: string
    color: string
    isSupported: boolean
}

interface EnhancedTokenSelectorProps {
    selectedToken: Token
    selectedNetwork: Network
    onSelect: (token: Token, network: Network) => void
    type: 'from' | 'to'
    availableTokens?: Token[]
}

// Supported networks with icons and colors
const SUPPORTED_NETWORKS: Network[] = [
    {
        id: 'ethereum',
        name: 'Ethereum',
        icon: 'ethereum',
        color: '#627EEA',
        isSupported: true
    },
    {
        id: 'bitcoin',
        name: 'Bitcoin',
        icon: 'bitcoin',
        color: '#F7931A',
        isSupported: true
    },
    {
        id: 'tron',
        name: 'Tron',
        icon: 'tron',
        color: '#FF0000',
        isSupported: true
    },
    {
        id: 'ton',
        name: 'TON',
        icon: 'ton',
        color: '#0088CC',
        isSupported: true
    },
    {
        id: 'polygon',
        name: 'Polygon',
        icon: 'polygon',
        color: '#8247E5',
        isSupported: true
    },
    {
        id: 'bsc',
        name: 'BNB Chain',
        icon: 'bsc',
        color: '#F3BA2F',
        isSupported: true
    },
    {
        id: 'arbitrum',
        name: 'Arbitrum',
        icon: 'arbitrum',
        color: '#28A0F0',
        isSupported: true
    },
    {
        id: 'optimism',
        name: 'Optimism',
        icon: 'optimism',
        color: '#FF0420',
        isSupported: true
    }
]

// Enhanced token data with multi-chain support
const ENHANCED_TOKENS: Token[] = [
    {
        symbol: 'USDC',
        name: 'USD Coin',
        balance: '0.00',
        networks: ['ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism'],
        networkCount: 5,
        isFavorite: false
    },
    {
        symbol: 'USDT',
        name: 'Tether USD',
        balance: '0.00',
        networks: ['ethereum', 'tron', 'polygon', 'bsc', 'arbitrum', 'optimism'],
        networkCount: 6,
        isFavorite: false
    },
    {
        symbol: 'ETH',
        name: 'Ethereum',
        balance: '0.00',
        networks: ['ethereum', 'arbitrum', 'optimism'],
        networkCount: 3,
        isFavorite: false
    },
    {
        symbol: 'BTC',
        name: 'Bitcoin',
        balance: '0.00',
        networks: ['bitcoin'],
        networkCount: 1,
        isFavorite: false
    },
    {
        symbol: 'WBTC',
        name: 'Wrapped Bitcoin',
        balance: '0.00',
        networks: ['ethereum', 'polygon', 'arbitrum'],
        networkCount: 3,
        isFavorite: false
    },
    {
        symbol: 'TRX',
        name: 'TRON',
        balance: '0.00',
        networks: ['tron'],
        networkCount: 1,
        isFavorite: false
    },
    {
        symbol: 'TON',
        name: 'TON',
        balance: '0.00',
        networks: ['ton'],
        networkCount: 1,
        isFavorite: false
    },
    {
        symbol: 'MATIC',
        name: 'Polygon',
        balance: '0.00',
        networks: ['polygon', 'ethereum'],
        networkCount: 2,
        isFavorite: false
    },
    {
        symbol: 'BNB',
        name: 'BNB',
        balance: '0.00',
        networks: ['bsc'],
        networkCount: 1,
        isFavorite: false
    },
    {
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        balance: '0.00',
        networks: ['ethereum', 'polygon', 'bsc'],
        networkCount: 3,
        isFavorite: false
    },
    {
        symbol: 'UNI',
        name: 'Uniswap',
        balance: '0.00',
        networks: ['ethereum', 'polygon', 'arbitrum'],
        networkCount: 3,
        isFavorite: false
    },
    {
        symbol: 'LINK',
        name: 'Chainlink',
        balance: '0.00',
        networks: ['ethereum', 'polygon', 'bsc'],
        networkCount: 3,
        isFavorite: false
    }
]

export function EnhancedTokenSelector({
    selectedToken,
    selectedNetwork,
    onSelect,
    type,
    availableTokens
}: EnhancedTokenSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [tokens, setTokens] = useState<Token[]>(availableTokens || ENHANCED_TOKENS)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedNetworkFilter, setSelectedNetworkFilter] = useState<string>('all')
    const [expandedToken, setExpandedToken] = useState<string | null>(null)
    const [favorites, setFavorites] = useState<string[]>([])

    // Load favorites from localStorage
    useEffect(() => {
        const savedFavorites = localStorage.getItem('token-favorites')
        if (savedFavorites) {
            setFavorites(JSON.parse(savedFavorites))
        }
    }, [])

    // Save favorites to localStorage
    const toggleFavorite = (tokenSymbol: string) => {
        const newFavorites = favorites.includes(tokenSymbol)
            ? favorites.filter(f => f !== tokenSymbol)
            : [...favorites, tokenSymbol]

        setFavorites(newFavorites)
        localStorage.setItem('token-favorites', JSON.stringify(newFavorites))
    }

    // Filter tokens based on search and network filter
    const filteredTokens = useMemo(() => {
        let filtered = tokens

        // Filter by search
        if (search) {
            filtered = filtered.filter(token =>
                token.name.toLowerCase().includes(search.toLowerCase()) ||
                token.symbol.toLowerCase().includes(search.toLowerCase())
            )
        }

        // Filter by network
        if (selectedNetworkFilter !== 'all') {
            filtered = filtered.filter(token =>
                token.networks.includes(selectedNetworkFilter)
            )
        }

        // Sort by favorites first, then alphabetically
        return filtered.sort((a, b) => {
            const aIsFavorite = favorites.includes(a.symbol)
            const bIsFavorite = favorites.includes(b.symbol)

            if (aIsFavorite && !bIsFavorite) return -1
            if (!aIsFavorite && bIsFavorite) return 1

            return a.symbol.localeCompare(b.symbol)
        })
    }, [tokens, search, selectedNetworkFilter, favorites])

    const handleSelect = (token: Token, network: Network) => {
        onSelect(token, network)
        setIsOpen(false)
        setSearch('')
        setSelectedNetworkFilter('all')
        setExpandedToken(null)
    }

    const toggleTokenExpansion = (tokenSymbol: string) => {
        setExpandedToken(expandedToken === tokenSymbol ? null : tokenSymbol)
    }

    const renderNetworkIcon = (networkId: string, size: number = 20) => {
        const network = SUPPORTED_NETWORKS.find(n => n.id === networkId)
        if (!network) return null

        const iconMap: Record<string, any> = {
            ethereum: Network,
            bitcoin: Bitcoin,
            tron: Network,
            ton: Network,
            polygon: Network,
            bsc: Network,
            arbitrum: Network,
            optimism: Network
        }

        const IconComponent = iconMap[networkId] || Network
        return (
            <div
                className="flex items-center justify-center rounded-full"
                style={{
                    width: size,
                    height: size,
                    backgroundColor: network.color,
                    color: 'white'
                }}
            >
                <IconComponent size={size * 0.6} />
            </div>
        )
    }

    const renderTokenIcon = (symbol: string, size: number = 24) => {
        return (
            <div className="flex items-center justify-center">
                <TokenIcon name={symbol.toLowerCase()} size={size} />
            </div>
        )
    }

    const getNetworkName = (networkId: string) => {
        const network = SUPPORTED_NETWORKS.find(n => n.id === networkId)
        return network?.name || networkId
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    className="bg-muted/50 hover:bg-accent text-foreground border-0 h-12 px-3 w-full justify-between"
                >
                    <div className="flex items-center space-x-3">
                        {renderTokenIcon(selectedToken.symbol, 24)}
                        <div className="flex flex-col items-start">
                            <span className="font-medium text-sm">
                                {selectedToken.symbol}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                {renderNetworkIcon(selectedNetwork.id, 12)}
                                {selectedNetwork.name}
                            </span>
                        </div>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                </Button>
            </DialogTrigger>

            <DialogContent className="bg-card border-border text-foreground w-[90vw] max-w-md max-h-[85vh] overflow-hidden mx-auto">
                <DialogHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsOpen(false)}
                            className="p-1 h-8 w-8"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <DialogTitle className="text-lg font-semibold">
                            Select {type === 'from' ? 'From' : 'To'} Token
                        </DialogTitle>
                        <div className="w-8" /> {/* Spacer for centering */}
                    </div>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Network Filter */}
                    <div className="space-y-2">
                        <Select value={selectedNetworkFilter} onValueChange={setSelectedNetworkFilter}>
                            <SelectTrigger className="w-full">
                                <SelectValue>
                                    <div className="flex items-center gap-2">
                                        <Network className="w-4 h-4" />
                                        {selectedNetworkFilter === 'all' ? 'All Networks' : getNetworkName(selectedNetworkFilter)}
                                    </div>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    <div className="flex items-center gap-2">
                                        <Check className="w-4 h-4" />
                                        All Networks
                                    </div>
                                </SelectItem>
                                {SUPPORTED_NETWORKS.map((network) => (
                                    <SelectItem key={network.id} value={network.id}>
                                        <div className="flex items-center gap-2">
                                            {renderNetworkIcon(network.id, 16)}
                                            {network.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            placeholder="Search tokens..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Tokens List */}
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                        {filteredTokens.map((token) => (
                            <div key={token.symbol}>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-between p-3 h-auto hover:bg-accent"
                                    onClick={() => {
                                        if (token.networkCount === 1) {
                                            const network = SUPPORTED_NETWORKS.find(n => n.id === token.networks[0])
                                            if (network) {
                                                handleSelect(token, network)
                                            }
                                        } else {
                                            toggleTokenExpansion(token.symbol)
                                        }
                                    }}
                                >
                                    <div className="flex items-center space-x-3">
                                        {renderTokenIcon(token.symbol, 32)}
                                        <div className="text-left flex-1">
                                            <div className="font-medium text-sm flex items-center gap-2">
                                                {token.name}
                                                {favorites.includes(token.symbol) && (
                                                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                                )}
                                            </div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                <Badge variant="secondary" className="text-xs">
                                                    {token.networkCount} {token.networkCount === 1 ? 'network' : 'networks'}
                                                </Badge>
                                                {token.balance !== '0.00' && (
                                                    <span>Balance: {token.balance}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                toggleFavorite(token.symbol)
                                            }}
                                            className="p-1 h-6 w-6"
                                        >
                                            {favorites.includes(token.symbol) ? (
                                                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                            ) : (
                                                <StarOff className="w-3 h-3 text-muted-foreground" />
                                            )}
                                        </Button>
                                        {token.networkCount > 1 && (
                                            <ChevronDown
                                                className={`w-4 h-4 transition-transform ${expandedToken === token.symbol ? 'rotate-180' : ''
                                                    }`}
                                            />
                                        )}
                                    </div>
                                </Button>

                                {/* Expanded Networks List */}
                                {expandedToken === token.symbol && token.networkCount > 1 && (
                                    <div className="ml-4 space-y-1">
                                        {token.networks.map((networkId) => {
                                            const network = SUPPORTED_NETWORKS.find(n => n.id === networkId)
                                            if (!network) return null

                                            return (
                                                <Button
                                                    key={networkId}
                                                    variant="ghost"
                                                    className="w-full justify-between p-2 h-auto hover:bg-accent/50"
                                                    onClick={() => handleSelect(token, network)}
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        {renderNetworkIcon(networkId, 20)}
                                                        <span className="text-sm">{network.name}</span>
                                                    </div>
                                                    {selectedToken.symbol === token.symbol && selectedNetwork.id === networkId && (
                                                        <Check className="w-4 h-4 text-primary" />
                                                    )}
                                                </Button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {filteredTokens.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No tokens found</p>
                            <p className="text-xs">Try adjusting your search or network filter</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
} 