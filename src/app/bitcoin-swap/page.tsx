import { BitcoinSwapInterface } from '@/components/BitcoinSwapInterface';

export default function BitcoinSwapPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
            <div className="container mx-auto py-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-foreground mb-4">
                        Bitcoin Cross-Chain Swap
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Swap between Ethereum ERC20 tokens and native Bitcoin using 1inch Fusion+ protocol
                    </p>
                </div>

                <BitcoinSwapInterface />

                <div className="mt-12 max-w-4xl mx-auto">
                    <div className="bg-card rounded-lg shadow-lg p-6">
                        <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-primary font-bold">1</span>
                                </div>
                                <h3 className="font-semibold mb-2">Create Order</h3>
                                <p className="text-muted-foreground text-sm">
                                    Specify the tokens and amounts you want to swap
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-primary font-bold">2</span>
                                </div>
                                <h3 className="font-semibold mb-2">Atomic Swap</h3>
                                <p className="text-muted-foreground text-sm">
                                    Secure cross-chain swap using HTLC contracts
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-primary font-bold">3</span>
                                </div>
                                <h3 className="font-semibold mb-2">Complete</h3>
                                <p className="text-muted-foreground text-sm">
                                    Receive your tokens on the destination chain
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 