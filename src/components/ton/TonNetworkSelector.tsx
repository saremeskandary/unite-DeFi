"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    CheckCircle,
    AlertCircle,
    Wifi,
    WifiOff,
    Settings,
    Globe,
    TestTube,
    Clock,
    Activity,
    ExternalLink,
    RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface TonNetwork {
    id: string;
    name: string;
    displayName: string;
    chainId: number;
    rpcUrl: string;
    explorerUrl: string;
    isTestnet: boolean;
    isActive: boolean;
}

interface NetworkStatus {
    isConnected: boolean;
    blockHeight: number;
    avgBlockTime: number;
    lastBlockTime: string;
    nodeCount: number;
    latency: number;
    isHealthy: boolean;
}

interface TonNetworkSelectorProps {
    currentNetwork: TonNetwork;
    onNetworkChange: (network: TonNetwork) => void;
    showStatus?: boolean;
    showQuickToggle?: boolean;
    disabled?: boolean;
    className?: string;
}

// Available TON networks
const TON_NETWORKS: TonNetwork[] = [
    {
        id: "mainnet",
        name: "mainnet",
        displayName: "TON Mainnet",
        chainId: -239,
        rpcUrl: "https://toncenter.com/api/v2/jsonRPC",
        explorerUrl: "https://tonviewer.com",
        isTestnet: false,
        isActive: true,
    },
    {
        id: "testnet",
        name: "testnet",
        displayName: "TON Testnet",
        chainId: -3,
        rpcUrl: "https://testnet.toncenter.com/api/v2/jsonRPC",
        explorerUrl: "https://testnet.tonviewer.com",
        isTestnet: true,
        isActive: true,
    },
    {
        id: "sandbox",
        name: "sandbox",
        displayName: "TON Sandbox",
        chainId: -1,
        rpcUrl: "https://sandbox.tonhubapi.com/jsonRPC",
        explorerUrl: "https://sandbox.tonviewer.com",
        isTestnet: true,
        isActive: false, // Not commonly used
    },
];

export function TonNetworkSelector({
    currentNetwork,
    onNetworkChange,
    showStatus = true,
    showQuickToggle = true,
    disabled = false,
    className,
}: TonNetworkSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
        isConnected: false,
        blockHeight: 0,
        avgBlockTime: 0,
        lastBlockTime: "",
        nodeCount: 0,
        latency: 0,
        isHealthy: false,
    });
    const [isLoadingStatus, setIsLoadingStatus] = useState(false);

    // Load network status
    useEffect(() => {
        loadNetworkStatus();

        // Auto-refresh network status every 30 seconds
        const interval = setInterval(loadNetworkStatus, 30000);
        return () => clearInterval(interval);
    }, [currentNetwork]);

    const loadNetworkStatus = async () => {
        setIsLoadingStatus(true);
        try {
            const startTime = Date.now();
            const response = await fetch('/api/ton/network-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    network: currentNetwork.name,
                    rpcUrl: currentNetwork.rpcUrl,
                }),
            });

            const latency = Date.now() - startTime;

            if (response.ok) {
                const data = await response.json();
                setNetworkStatus({
                    isConnected: true,
                    blockHeight: data.blockHeight || 0,
                    avgBlockTime: data.avgBlockTime || 5,
                    lastBlockTime: data.lastBlockTime || new Date().toISOString(),
                    nodeCount: data.nodeCount || 1,
                    latency,
                    isHealthy: data.isHealthy !== false,
                });
            } else {
                setNetworkStatus(prev => ({
                    ...prev,
                    isConnected: false,
                    isHealthy: false,
                    latency,
                }));
            }
        } catch (error) {
            console.error('Failed to load network status:', error);
            setNetworkStatus(prev => ({
                ...prev,
                isConnected: false,
                isHealthy: false,
                latency: 999,
            }));
        } finally {
            setIsLoadingStatus(false);
        }
    };

    const handleNetworkSwitch = (network: TonNetwork) => {
        if (network.id === currentNetwork.id || disabled) return;

        onNetworkChange(network);
        setIsOpen(false);
        toast.success(`Switched to ${network.displayName}`);
    };

    const handleQuickToggle = () => {
        if (disabled) return;

        const targetNetwork = currentNetwork.isTestnet
            ? TON_NETWORKS.find(n => !n.isTestnet && n.isActive)
            : TON_NETWORKS.find(n => n.isTestnet && n.isActive);

        if (targetNetwork) {
            handleNetworkSwitch(targetNetwork);
        }
    };

    const getStatusColor = () => {
        if (!networkStatus.isConnected) return "text-red-500";
        if (!networkStatus.isHealthy) return "text-yellow-500";
        if (networkStatus.latency > 1000) return "text-orange-500";
        return "text-green-500";
    };

    const getStatusIcon = () => {
        if (isLoadingStatus) return <RefreshCw className="w-4 h-4 animate-spin" />;
        if (!networkStatus.isConnected) return <WifiOff className="w-4 h-4" />;
        if (!networkStatus.isHealthy) return <AlertCircle className="w-4 h-4" />;
        return <Wifi className="w-4 h-4" />;
    };

    const formatLatency = (latency: number) => {
        if (latency < 100) return "Fast";
        if (latency < 500) return "Good";
        if (latency < 1000) return "Slow";
        return "Poor";
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {/* Quick Toggle for Mainnet/Testnet */}
            {showQuickToggle && (
                <div className="flex items-center gap-2">
                    <Label htmlFor="network-toggle" className="text-sm">
                        {currentNetwork.isTestnet ? (
                            <div className="flex items-center gap-1">
                                <TestTube className="w-3 h-3" />
                                Testnet
                            </div>
                        ) : (
                            <div className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                Mainnet
                            </div>
                        )}
                    </Label>
                    <Switch
                        id="network-toggle"
                        checked={!currentNetwork.isTestnet}
                        onCheckedChange={handleQuickToggle}
                        disabled={disabled}
                    />
                </div>
            )}

            {/* Network Selector */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={disabled}
                        className="flex items-center gap-2"
                    >
                        <div className={cn("w-2 h-2 rounded-full",
                            currentNetwork.isTestnet ? "bg-orange-500" : "bg-blue-500"
                        )} />
                        <span className="hidden sm:inline">{currentNetwork.displayName}</span>
                        <span className="sm:hidden">{currentNetwork.isTestnet ? "Test" : "Main"}</span>
                        <Settings className="w-3 h-3" />
                    </Button>
                </DialogTrigger>

                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Select TON Network</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Current Network Status */}
                        {showStatus && (
                            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">Network Status</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={loadNetworkStatus}
                                        disabled={isLoadingStatus}
                                        className="h-6 w-6 p-0"
                                    >
                                        <RefreshCw className={cn("w-3 h-3", isLoadingStatus && "animate-spin")} />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className={getStatusColor()}>
                                            {getStatusIcon()}
                                        </div>
                                        <span>{networkStatus.isConnected ? "Connected" : "Disconnected"}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-muted-foreground" />
                                        <span>{formatLatency(networkStatus.latency)}</span>
                                    </div>

                                    {networkStatus.isConnected && (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-muted-foreground" />
                                                <span>Block #{networkStatus.blockHeight.toLocaleString()}</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-muted-foreground" />
                                                <span>~{networkStatus.avgBlockTime}s</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Network List */}
                        <div className="space-y-2">
                            {TON_NETWORKS.filter(network => network.isActive).map((network) => (
                                <Button
                                    key={network.id}
                                    variant={network.id === currentNetwork.id ? "default" : "ghost"}
                                    onClick={() => handleNetworkSwitch(network)}
                                    disabled={disabled}
                                    className="w-full justify-between p-4 h-auto"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-3 h-3 rounded-full",
                                            network.isTestnet ? "bg-orange-500" : "bg-blue-500"
                                        )} />
                                        <div className="text-left">
                                            <div className="font-medium">{network.displayName}</div>
                                            <div className="text-xs text-muted-foreground">
                                                Chain ID: {network.chainId}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {network.isTestnet && (
                                            <Badge variant="outline" className="text-xs">
                                                Testnet
                                            </Badge>
                                        )}
                                        {network.id === currentNetwork.id && (
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                        )}
                                    </div>
                                </Button>
                            ))}
                        </div>

                        {/* Explorer Links */}
                        <div className="pt-2 border-t border-border">
                            <div className="text-sm text-muted-foreground mb-2">Quick Links</div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(currentNetwork.explorerUrl, '_blank')}
                                    className="flex-1"
                                >
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    Explorer
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open('https://ton.org/docs', '_blank')}
                                    className="flex-1"
                                >
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    Docs
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Status Indicator */}
            {showStatus && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className={cn("flex items-center gap-1", getStatusColor())}>
                                {getStatusIcon()}
                                <span className="text-xs hidden md:inline">
                                    {networkStatus.isConnected ? formatLatency(networkStatus.latency) : "Offline"}
                                </span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <div className="text-xs space-y-1">
                                <div>Network: {currentNetwork.displayName}</div>
                                <div>Status: {networkStatus.isConnected ? "Connected" : "Disconnected"}</div>
                                {networkStatus.isConnected && (
                                    <>
                                        <div>Latency: {networkStatus.latency}ms</div>
                                        <div>Block: #{networkStatus.blockHeight.toLocaleString()}</div>
                                    </>
                                )}
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
    );
} 