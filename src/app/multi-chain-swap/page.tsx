import { MultiChainSwapInterface } from "@/components/swap/multi-chain-swap-interface"

export default function MultiChainSwapPage() {
    const handleOrderCreated = (orderId: string) => {
        console.log('Order created:', orderId)
        // Handle order creation (e.g., redirect to orders page)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-foreground mb-4">
                            Multi-Chain Swap Interface
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Swap tokens across different blockchains with intelligent chain-specific validation.
                            Simple chains (Bitcoin, Dogecoin) only support native tokens, while smart contract
                            chains (Ethereum, Tron, Cardano) support multiple tokens.
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-card/50 border border-border rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-foreground mb-3">Simple Chains</h3>
                            <p className="text-muted-foreground mb-4">
                                Bitcoin, Dogecoin, Litecoin, and Bitcoin Cash only support their native tokens.
                            </p>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2 text-sm">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    <span>BTC → ETH (via WBTC)</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    <span>DOGE → TRX</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                    <span className="text-muted-foreground">BTC → USDC (not allowed)</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card/50 border border-border rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-foreground mb-3">Smart Contract Chains</h3>
                            <p className="text-muted-foreground mb-4">
                                Ethereum, Tron, Cardano, Solana support multiple tokens and DeFi protocols.
                            </p>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2 text-sm">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    <span>ETH → USDC</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    <span>TRX → USDT</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    <span>ADA → AGIX</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chain Pairs Info */}
                    <div className="bg-card/50 border border-border rounded-lg p-6 mb-8">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Available Chain Pairs</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <div className="text-sm font-medium">Bitcoin ↔ Ethereum</div>
                                <div className="text-xs text-muted-foreground">BTC → ETH</div>
                            </div>
                            <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <div className="text-sm font-medium">Tron ↔ Ethereum</div>
                                <div className="text-xs text-muted-foreground">TRX ↔ ETH/USDC</div>
                            </div>
                            <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <div className="text-sm font-medium">Cardano ↔ Ethereum</div>
                                <div className="text-xs text-muted-foreground">ADA ↔ ETH/USDC</div>
                            </div>
                            <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <div className="text-sm font-medium">Solana ↔ Ethereum</div>
                                <div className="text-xs text-muted-foreground">SOL ↔ ETH/USDC</div>
                            </div>
                            <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <div className="text-sm font-medium">Dogecoin ↔ Ethereum</div>
                                <div className="text-xs text-muted-foreground">DOGE → ETH</div>
                            </div>
                            <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <div className="text-sm font-medium">Bitcoin ↔ Tron</div>
                                <div className="text-xs text-muted-foreground">BTC → TRX</div>
                            </div>
                            <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <div className="text-sm font-medium">Ethereum ↔ Tron</div>
                                <div className="text-xs text-muted-foreground">ETH ↔ TRX/USDT</div>
                            </div>
                            <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <div className="text-sm font-medium">Custom Pair</div>
                                <div className="text-xs text-muted-foreground">Any combination</div>
                            </div>
                        </div>
                    </div>

                    {/* Swap Interface */}
                    <div className="flex justify-center">
                        <MultiChainSwapInterface onOrderCreated={handleOrderCreated} />
                    </div>

                    {/* Technical Details */}
                    <div className="mt-8 bg-card/50 border border-border rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Technical Implementation</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium text-foreground mb-2">Chain Type Validation</h4>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    <li>• Simple chains: Only native token swaps</li>
                                    <li>• Smart contract chains: Multiple token support</li>
                                    <li>• Automatic token filtering based on chain type</li>
                                    <li>• Real-time address validation per chain</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-medium text-foreground mb-2">Cross-Chain Features</h4>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    <li>• Atomic swap technology</li>
                                    <li>• Chain-specific address formats</li>
                                    <li>• Dynamic fee calculation</li>
                                    <li>• Multi-chain wallet integration</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 