"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Search, ChevronDown, Coins, ExternalLink, AlertCircle } from "lucide-react";
import { TokenIcon } from "@web3icons/react";
import { toast } from "sonner";
import { useTonAddress } from "@tonconnect/ui-react";

interface JettonToken {
    symbol: string;
    name: string;
    address: string;
    decimals: number;
    balance: string;
    balanceFormatted: string;
    priceUSD?: number;
    valueUSD?: number;
    isJetton: boolean;
    verified?: boolean;
    logo?: string;
}

interface JettonTokenSelectorProps {
    token: JettonToken;
    onSelect: (token: JettonToken) => void;
    type: "from" | "to";
    availableTokens?: JettonToken[];
    disabled?: boolean;
}

// Popular Jetton tokens on TON blockchain
const POPULAR_JETTONS: JettonToken[] = [
    {
        symbol: "TON",
        name: "TON Coin",
        address: "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c",
        decimals: 9,
        balance: "0.00",
        balanceFormatted: "0.00",
        isJetton: false,
        verified: true,
    },
    {
        symbol: "USDT",
        name: "Tether USD",
        address: "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs",
        decimals: 6,
        balance: "0.00",
        balanceFormatted: "0.00",
        isJetton: true,
        verified: true,
    },
    {
        symbol: "USDC",
        name: "USD Coin",
        address: "EQB-MPwrd1G6WKNkLz_VnV6WqBDd142KMQv-g1O-8QUA3728",
        decimals: 6,
        balance: "0.00",
        balanceFormatted: "0.00",
        isJetton: true,
        verified: true,
    },
    {
        symbol: "STON",
        name: "StonFi Token",
        address: "EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO",
        decimals: 9,
        balance: "0.00",
        balanceFormatted: "0.00",
        isJetton: true,
        verified: true,
    },
    {
        symbol: "JETTON",
        name: "JetTon",
        address: "EQB0f5YrzNSIYMHl8SCYG2aAf8ARZ7h-lrPeaPWVEQmPp_xk",
        decimals: 9,
        balance: "0.00",
        balanceFormatted: "0.00",
        isJetton: true,
        verified: true,
    },
];

export function JettonTokenSelector({
    token,
    onSelect,
    type,
    availableTokens,
    disabled = false
}: JettonTokenSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [tokens, setTokens] = useState<JettonToken[]>(availableTokens || POPULAR_JETTONS);
    const [isLoading, setIsLoading] = useState(false);
    const [customJettonAddress, setCustomJettonAddress] = useState("");
    const [isAddingCustomToken, setIsAddingCustomToken] = useState(false);

    const tonAddress = useTonAddress();

    // Load Jetton token data when component mounts
    useEffect(() => {
        if (tonAddress) {
            loadJettonData();
        }
    }, [tonAddress]);

    // Update tokens when availableTokens prop changes
    useEffect(() => {
        if (availableTokens) {
            setTokens(availableTokens);
        }
    }, [availableTokens]);

    const loadJettonData = async () => {
        if (!tonAddress) {
            setTokens(POPULAR_JETTONS);
            return;
        }

        setIsLoading(true);
        try {
            // Fetch Jetton tokens from TON API
            const response = await fetch(
                `/api/ton/tokens?address=${tonAddress}&includeBalances=true&includePrices=true`
            );

            if (response.ok) {
                const data = await response.json();
                const jettonTokens = data.tokens?.map((t: any) => ({
                    symbol: t.symbol,
                    name: t.name,
                    address: t.address,
                    decimals: t.decimals || 9,
                    balance: t.balance || "0.00",
                    balanceFormatted: t.balanceFormatted || "0.00",
                    priceUSD: t.priceUSD || 0,
                    valueUSD: t.valueUSD || 0,
                    isJetton: t.isJetton || false,
                    verified: true,
                })) || [];

                setTokens(jettonTokens.length > 0 ? jettonTokens : POPULAR_JETTONS);
            } else {
                console.warn('Failed to fetch Jetton data:', response.statusText);
                setTokens(POPULAR_JETTONS);
            }
        } catch (error) {
            console.error('Error loading Jetton data:', error);
            setTokens(POPULAR_JETTONS);
            toast.error('Failed to load Jetton tokens');
        } finally {
            setIsLoading(false);
        }
    };

    const addCustomJetton = async () => {
        if (!customJettonAddress.trim()) {
            toast.error('Please enter a Jetton contract address');
            return;
        }

        setIsAddingCustomToken(true);
        try {
            // Validate and fetch Jetton token info
            const response = await fetch('/api/ton/tokens', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'addCustomJetton',
                    address: customJettonAddress.trim(),
                    userAddress: tonAddress,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const newJetton: JettonToken = {
                    symbol: data.symbol || 'UNKNOWN',
                    name: data.name || 'Unknown Jetton',
                    address: customJettonAddress.trim(),
                    decimals: data.decimals || 9,
                    balance: data.balance || "0.00",
                    balanceFormatted: data.balanceFormatted || "0.00",
                    priceUSD: data.priceUSD || 0,
                    valueUSD: data.valueUSD || 0,
                    isJetton: true,
                    verified: false,
                };

                setTokens(prev => [newJetton, ...prev]);
                setCustomJettonAddress("");
                setIsAddingCustomToken(false);
                toast.success(`Added custom Jetton: ${newJetton.symbol}`);
            } else {
                const error = await response.json();
                toast.error(error.message || 'Failed to add custom Jetton');
            }
        } catch (error) {
            console.error('Error adding custom Jetton:', error);
            toast.error('Failed to add custom Jetton');
        } finally {
            setIsAddingCustomToken(false);
        }
    };

    const handleSelect = (selectedToken: JettonToken) => {
        onSelect(selectedToken);
        setIsOpen(false);
        setSearch("");
    };

    const renderTokenIcon = (token: JettonToken, size: number = 24) => {
        const iconMap: { [key: string]: string } = {
            TON: "ton",
            USDC: "usdc",
            USDT: "usdt",
            STON: "generic",
            JETTON: "generic",
        };

        const iconName = iconMap[token.symbol.toUpperCase()];
        if (iconName && iconName !== "generic") {
            return <TokenIcon symbol={iconName} size={size} variant="branded" />;
        }

        return (
            <div
                className="rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold"
                style={{ width: size, height: size }}
            >
                <span className="text-xs">{token.symbol.slice(0, 2)}</span>
            </div>
        );
    };

    const filteredTokens = useMemo(() => {
        if (!search) return tokens;
        return tokens.filter(
            (token) =>
                token.symbol.toLowerCase().includes(search.toLowerCase()) ||
                token.name.toLowerCase().includes(search.toLowerCase()) ||
                token.address.toLowerCase().includes(search.toLowerCase())
        );
    }, [search, tokens]);

    const formatBalance = (token: JettonToken) => {
        if (parseFloat(token.balance) === 0) return "0.00";
        return parseFloat(token.balance) < 0.01 ? "< 0.01" : token.balanceFormatted;
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    disabled={disabled}
                    className="bg-muted/50 hover:bg-accent text-foreground border-0 h-10 sm:h-12 px-2 sm:px-3 disabled:opacity-50"
                >
                    <div className="flex items-center space-x-1 sm:space-x-2">
                        {renderTokenIcon(token, 24)}
                        <span className="font-medium text-xs sm:text-sm">
                            {token.symbol}
                        </span>
                        <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                </Button>
            </DialogTrigger>

            <DialogContent className="bg-card border-border text-foreground w-[90vw] max-w-md max-h-[85vh] overflow-hidden mx-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
                        <Coins className="w-5 h-5 text-blue-500" />
                        Select Jetton Token
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 flex flex-col h-full">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search Jettons or paste address..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 bg-muted border-border text-foreground h-10"
                        />
                    </div>

                    {/* Add Custom Jetton */}
                    <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                        <div className="text-sm font-medium text-foreground">Add Custom Jetton</div>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Jetton contract address..."
                                value={customJettonAddress}
                                onChange={(e) => setCustomJettonAddress(e.target.value)}
                                className="flex-1 h-8 text-xs"
                            />
                            <Button
                                onClick={addCustomJetton}
                                disabled={isAddingCustomToken || !customJettonAddress.trim()}
                                size="sm"
                                className="h-8 px-3"
                            >
                                {isAddingCustomToken ? "Adding..." : "Add"}
                            </Button>
                        </div>
                    </div>

                    {/* Popular Jettons */}
                    <div className="space-y-1">
                        <div className="text-sm text-muted-foreground mb-2">Popular Jettons</div>
                        <div className="flex flex-wrap gap-2">
                            {tokens.slice(0, 4).map((token) => (
                                <Badge
                                    key={token.address}
                                    variant="secondary"
                                    className="bg-muted hover:bg-accent cursor-pointer text-xs"
                                    onClick={() => handleSelect(token)}
                                >
                                    <div className="flex items-center space-x-1">
                                        {renderTokenIcon(token, 16)}
                                        <span>{token.symbol}</span>
                                    </div>
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Connection Notice */}
                    {!tonAddress && (
                        <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                            <div className="text-sm text-yellow-700 dark:text-yellow-300">
                                Connect your TON wallet to see your Jetton balances
                            </div>
                        </div>
                    )}

                    {/* Token List */}
                    <div className="space-y-1 max-h-60 overflow-y-auto flex-1">
                        {isLoading ? (
                            <div className="flex items-center justify-center p-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                <span className="ml-2 text-sm text-muted-foreground">Loading Jettons...</span>
                            </div>
                        ) : (
                            filteredTokens.map((tokenOption) => (
                                <Button
                                    key={tokenOption.address}
                                    variant="ghost"
                                    className="w-full justify-between p-2 sm:p-3 h-auto hover:bg-accent"
                                    onClick={() => handleSelect(tokenOption)}
                                >
                                    <div className="flex items-center space-x-2 sm:space-x-3">
                                        {renderTokenIcon(tokenOption, 32)}
                                        <div className="text-left">
                                            <div className="font-medium text-sm flex items-center gap-1">
                                                {tokenOption.symbol}
                                                {tokenOption.verified && (
                                                    <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                                                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                                    </div>
                                                )}
                                                {tokenOption.isJetton && (
                                                    <Badge variant="outline" className="text-xs px-1 py-0">
                                                        Jetton
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                                                {tokenOption.name}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs sm:text-sm">
                                            {formatBalance(tokenOption)}
                                        </div>
                                        {tokenOption.valueUSD && tokenOption.valueUSD > 0 && (
                                            <div className="text-xs text-muted-foreground">
                                                ${tokenOption.valueUSD.toFixed(2)}
                                            </div>
                                        )}
                                    </div>
                                </Button>
                            ))
                        )}

                        {filteredTokens.length === 0 && !isLoading && (
                            <div className="text-center p-8 text-muted-foreground">
                                <Coins className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <div className="text-sm">No Jettons found</div>
                                <div className="text-xs">Try searching for a different token</div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="text-xs text-muted-foreground text-center">
                        <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs"
                            onClick={() => window.open('https://tonviewer.com', '_blank')}
                        >
                            View on TON Explorer <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}