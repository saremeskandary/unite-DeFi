"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Search, ChevronDown, ChevronRight, Star, ArrowLeft } from "lucide-react"
import { TokenIcon } from "@web3icons/react"
import { enhancedWallet } from "@/lib/enhanced-wallet"
import {
    NETWORKS,
    TOKENS_DATA,
    Token,
    Network
} from "@/constants"

interface ChainTokenSelectorProps {
    selectedToken: Token
    selectedNetwork: Network
    onSelect: (token: Token, network: Network) => void
    type: "from" | "to"
}

export function ChainTokenSelector({ selectedToken, selectedNetwork, onSelect, type }: ChainTokenSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState("")
    const [tokens, setTokens] = useState<Token[]>(TOKENS_DATA)
    const [isLoading, setIsLoading] = useState(false)
    const [viewMode, setViewMode] = useState<'tokens' | 'networks'>('tokens')
    const [expandedToken, setExpandedToken] = useState<string | null>(null)
    const [selectedNetworkFilter, setSelectedNetworkFilter] = useState<string | null>(null)

    // Load real token data when component mounts
    useEffect(() => {
        loadTokenData()
    }, [])

    const loadTokenData = async () => {
        setIsLoading(true)
        try {
            if (enhancedWallet.isConnected()) {
                const walletInfo = await enhancedWallet.getWalletInfo()
                if (walletInfo && walletInfo.tokens.length > 0) {
                    const realTokens = TOKENS_DATA.map(token => {
                        const walletToken = walletInfo.tokens.find((t: any) => t.symbol === token.symbol)
                        return {
                            ...token,
                            balance: walletToken?.balance || '0.00',
                            value: walletToken?.value || 0
                        }
                    })
                    setTokens(realTokens)
                    return
                }
            }
            setTokens(TOKENS_DATA)
        } catch (error) {
            console.error('Error loading token data:', error)
            setTokens(TOKENS_DATA)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSelect = (token: Token, network: Network) => {
        onSelect(token, network)
        setIsOpen(false)
        setSearch("")
        setViewMode('tokens')
        setExpandedToken(null)
        setSelectedNetworkFilter(null)
    }

    const handleNetworkSelect = (network: Network) => {
        setSelectedNetworkFilter(network.id)
        setViewMode('tokens')
    }

    const toggleTokenExpansion = (tokenSymbol: string) => {
        setExpandedToken(expandedToken === tokenSymbol ? null : tokenSymbol)
    }

    const renderTokenIcon = (symbol: string, size: number = 24) => {
        const iconMap: { [key: string]: string } = {
            USDC: "usdc",
            USDT: "usdt",
            WETH: "weth",
            WBTC: "wbtc",
            DAI: "dai",
            UNI: "uni",
            LINK: "link",
            AAVE: "aave",
            ETH: "eth",
            BTC: "btc",
            MATIC: "matic",
            SOL: "sol",
            TRX: "trx",
            ADA: "ada",
            DOGE: "doge",
            BNB: "bnb",
            AVAX: "avax",
            "1INCH": "1inch",
            wBETH: "wbeth",
            WEFTH: "wefth"
        }

        const iconName = iconMap[symbol.toUpperCase()]
        if (iconName) {
            return <TokenIcon symbol={iconName} size={size} variant="branded" />
        }

        return (
            <div
                className="rounded-full bg-muted flex items-center justify-center"
                style={{ width: size, height: size }}
            >
                <span className="text-xs font-medium">{symbol.slice(0, 2)}</span>
            </div>
        )
    }

    const renderNetworkIcon = (networkId: string, size: number = 24) => {
        const network = NETWORKS.find(n => n.id === networkId)
        if (network) {
            return <TokenIcon symbol={network.icon} size={size} variant="branded" />
        }
        return (
            <div
                className="rounded-full bg-muted flex items-center justify-center"
                style={{ width: size, height: size }}
            >
                <span className="text-xs font-medium">{networkId.slice(0, 2).toUpperCase()}</span>
            </div>
        )
    }

    const filteredTokens = useMemo(() => {
        let filtered = tokens

        // Filter by search
        if (search) {
            filtered = filtered.filter(
                (token) =>
                    token.symbol.toLowerCase().includes(search.toLowerCase()) ||
                    token.name.toLowerCase().includes(search.toLowerCase())
            )
        }

        // Filter by selected network
        if (selectedNetworkFilter) {
            filtered = filtered.filter(token =>
                token.networks?.includes(selectedNetworkFilter)
            )
        }

        return filtered
    }, [tokens, search, selectedNetworkFilter])

    const popularTokens = useMemo(() => {
        return tokens.filter(token => token.isFavorite).slice(0, 10)
    }, [tokens])

    const getNetworkName = (networkId: string) => {
        const network = NETWORKS.find(n => n.id === networkId)
        return network?.name || networkId
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    className="bg-muted/50 hover:bg-accent text-foreground border-0 h-10 sm:h-12 px-2 sm:px-3"
                >
                    <div className="flex items-center space-x-1 sm:space-x-2">
                        {renderTokenIcon(selectedToken.symbol, 24)}
                        <div className="flex flex-col items-start">
                            <span className="font-medium text-xs sm:text-sm">
                                {selectedToken.symbol}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {selectedNetwork.name}
                            </span>
                        </div>
                        <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                </Button>
            </DialogTrigger>

            <DialogContent className="bg-card border-border text-foreground w-[90vw] max-w-md max-h-[85vh] overflow-hidden mx-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl flex items-center space-x-2">
                        {viewMode === 'networks' && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode('tokens')}
                                className="p-1 h-auto"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                        )}
                        <span>
                            {viewMode === 'networks' ? 'Select Network' : 'Select Token'}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 flex flex-col h-full">
                    {/* Network Selector */}
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewMode('networks')}
                            className="flex items-center space-x-2"
                        >
                            <span className="text-xs">All networks</span>
                            <ChevronDown className="w-3 h-3" />
                        </Button>
                        {selectedNetworkFilter && (
                            <Badge
                                variant="secondary"
                                className="text-xs"
                                onClick={() => setSelectedNetworkFilter(null)}
                            >
                                {getNetworkName(selectedNetworkFilter)} ×
                            </Badge>
                        )}
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or paste address"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 bg-muted border-border text-foreground h-10"
                        />
                    </div>

                    {/* Popular Tokens */}
                    {viewMode === 'tokens' && (
                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground mb-2">
                                Popular Tokens
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {popularTokens.map((token) => (
                                    <Badge
                                        key={token.symbol}
                                        variant="secondary"
                                        className="bg-muted hover:bg-accent cursor-pointer text-xs"
                                        onClick={() => {
                                            const defaultNetwork = NETWORKS.find(n => n.id === token.networks?.[0])
                                            if (defaultNetwork) {
                                                handleSelect(token, defaultNetwork)
                                            }
                                        }}
                                    >
                                        <div className="flex items-center space-x-1">
                                            {renderTokenIcon(token.symbol, 16)}
                                            <span>{token.symbol}</span>
                                        </div>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div className="space-y-1 max-h-60 overflow-y-auto flex-1">
                        {viewMode === 'networks' ? (
                            // Networks List
                            NETWORKS.map((network) => (
                                <Button
                                    key={network.id}
                                    variant="ghost"
                                    className="w-full justify-between p-3 h-auto hover:bg-accent"
                                    onClick={() => handleNetworkSelect(network)}
                                >
                                    <div className="flex items-center space-x-3">
                                        {renderNetworkIcon(network.id, 32)}
                                        <div className="text-left">
                                            <div className="font-medium text-sm">
                                                {network.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {network.type === 'simple' ? 'Native token only' : 'Multiple tokens'}
                                            </div>
                                        </div>
                                    </div>
                                </Button>
                            ))
                        ) : (
                            // Tokens List
                            filteredTokens.map((token) => (
                                <div key={token.symbol}>
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-between p-3 h-auto hover:bg-accent"
                                        onClick={() => {
                                            if (token.networkCount === 1) {
                                                const network = NETWORKS.find(n => n.id === token.networks?.[0])
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
                                            <div className="text-left">
                                                <div className="font-medium text-sm">
                                                    {token.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {token.networkCount} {token.networkCount === 1 ? 'network' : 'networks'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="text-xs text-muted-foreground">
                                                {token.balance}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="p-1 h-auto"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    // Toggle favorite
                                                }}
                                            >
                                                <Star className={`w-3 h-3 ${token.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                                            </Button>
                                            {token.networkCount && token.networkCount > 1 && (
                                                <div className="text-muted-foreground">
                                                    {expandedToken === token.symbol ? (
                                                        <ChevronDown className="w-3 h-3" />
                                                    ) : (
                                                        <ChevronRight className="w-3 h-3" />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </Button>

                                    {/* Expanded Networks */}
                                    {expandedToken === token.symbol && token.networks && (
                                        <div className="ml-12 mb-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                {token.networks.map((networkId) => {
                                                    const network = NETWORKS.find(n => n.id === networkId)
                                                    if (!network) return null

                                                    return (
                                                        <Button
                                                            key={networkId}
                                                            variant="ghost"
                                                            size="sm"
                                                            className="justify-start p-2 h-auto text-xs"
                                                            onClick={() => handleSelect(token, network)}
                                                        >
                                                            <div className="flex items-center space-x-2">
                                                                {renderNetworkIcon(networkId, 16)}
                                                                <span>{network.name}</span>
                                                            </div>
                                                        </Button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
} 