import { ChainTokenSelector } from "@/components/swap/chain-token-selector"
import { useState } from "react"

interface Token {
    symbol: string
    name: string
    balance: string
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

export default function ChainTokenSelectorDemo() {
    const [selectedToken, setSelectedToken] = useState<Token>({
        symbol: "WBTC",
        name: "Wrapped BTC",
        balance: "0.00",
        networks: ["ethereum", "polygon", "arbitrum", "optimism", "avalanche", "bsc", "gnosis", "linea", "zksync"],
        networkCount: 10,
        isFavorite: true
    })

    const [selectedNetwork, setSelectedNetwork] = useState<Network>({
        id: 'ethereum',
        name: 'Ethereum',
        icon: 'eth',
        chainId: 1,
        type: 'smart_contract'
    })

    const handleSelect = (token: Token, network: Network) => {
        setSelectedToken(token)
        setSelectedNetwork(network)
        console.log('Selected:', token.symbol, 'on', network.name)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-foreground mb-4">
                            Chain-Token Selector Demo
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            A comprehensive token and network selector similar to 1inch interface.
                            Select tokens with expandable network options and chain-specific filtering.
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-card/50 border border-border rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-foreground mb-3">Key Features</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>• Network filtering and selection</li>
                                <li>• Expandable tokens showing available networks</li>
                                <li>• Search by name or paste address</li>
                                <li>• Popular tokens with quick selection</li>
                                <li>• Favorite tokens with star indicators</li>
                                <li>• Chain-specific token availability</li>
                            </ul>
                        </div>

                        <div className="bg-card/50 border border-border rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-foreground mb-3">Supported Networks</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>• Ethereum</div>
                                <div>• Polygon</div>
                                <div>• BSC</div>
                                <div>• Arbitrum</div>
                                <div>• Optimism</div>
                                <div>• Avalanche</div>
                                <div>• Solana</div>
                                <div>• Tron</div>
                                <div>• Cardano</div>
                                <div>• Bitcoin</div>
                                <div>• Dogecoin</div>
                                <div>• Gnosis</div>
                                <div>• Linea</div>
                                <div>• zkSync Era</div>
                            </div>
                        </div>
                    </div>

                    {/* Current Selection Display */}
                    <div className="bg-card/50 border border-border rounded-lg p-6 mb-8">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Current Selection</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-medium">{selectedToken.symbol}</span>
                                </div>
                                <div>
                                    <div className="font-medium">{selectedToken.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {selectedToken.networkCount} {selectedToken.networkCount === 1 ? 'network' : 'networks'}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-medium">{selectedNetwork.name.slice(0, 2)}</span>
                                </div>
                                <div>
                                    <div className="font-medium">{selectedNetwork.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {selectedNetwork.type === 'simple' ? 'Native token only' : 'Multiple tokens'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Selector Demo */}
                    <div className="flex justify-center mb-8">
                        <div className="bg-card/50 border border-border rounded-lg p-6 w-full max-w-md">
                            <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
                                Try the Selector
                            </h3>
                            <div className="flex justify-center">
                                <ChainTokenSelector
                                    selectedToken={selectedToken}
                                    selectedNetwork={selectedNetwork}
                                    onSelect={handleSelect}
                                    type="from"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Usage Examples */}
                    <div className="bg-card/50 border border-border rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Usage Examples</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium text-foreground mb-2">Multi-Network Tokens</h4>
                                <div className="space-y-2 text-sm text-muted-foreground">
                                    <div>• <strong>WBTC</strong> - Available on 10 networks</div>
                                    <div>• <strong>USDC</strong> - Available on 8 networks</div>
                                    <div>• <strong>USDT</strong> - Available on 8 networks</div>
                                    <div>• <strong>WETH</strong> - Available on 6 networks</div>
                                    <div>• <strong>LINK</strong> - Available on 7 networks</div>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium text-foreground mb-2">Single-Network Tokens</h4>
                                <div className="space-y-2 text-sm text-muted-foreground">
                                    <div>• <strong>BTC</strong> - Bitcoin network only</div>
                                    <div>• <strong>ETH</strong> - Ethereum network only</div>
                                    <div>• <strong>SOL</strong> - Solana network only</div>
                                    <div>• <strong>TRX</strong> - Tron network only</div>
                                    <div>• <strong>ADA</strong> - Cardano network only</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Technical Details */}
                    <div className="mt-8 bg-card/50 border border-border rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Technical Implementation</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium text-foreground mb-2">Interface Features</h4>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    <li>• Dual view modes: tokens and networks</li>
                                    <li>• Expandable token entries</li>
                                    <li>• Network filtering</li>
                                    <li>• Real-time search</li>
                                    <li>• Favorite token management</li>
                                    <li>• Responsive design</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-medium text-foreground mb-2">Data Structure</h4>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    <li>• Token metadata with network availability</li>
                                    <li>• Network configuration with chain types</li>
                                    <li>• Dynamic filtering and search</li>
                                    <li>• Wallet integration for balances</li>
                                    <li>• Icon mapping for tokens and networks</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 