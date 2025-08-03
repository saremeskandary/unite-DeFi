"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    ExternalLink,
    Copy,
    RefreshCw,
    Activity,
    Coins,
    Gas,
    ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

export interface TonTransactionInfo {
    hash: string;
    from: string;
    to: string;
    amount: string;
    amountFormatted: string;
    token: string;
    status: 'pending' | 'confirmed' | 'failed' | 'cancelled';
    confirmations: number;
    requiredConfirmations: number;
    gasUsed?: string;
    gasFee?: string;
    gasFeeFormatted?: string;
    blockNumber?: number;
    timestamp?: string;
    createdAt: string;
    updatedAt: string;
    error?: string;
    type: 'transfer' | 'jetton_transfer' | 'swap' | 'contract_call';
}

interface TonTransactionStatusProps {
    transaction: TonTransactionInfo;
    onUpdate?: (transaction: TonTransactionInfo) => void;
    autoRefresh?: boolean;
    refreshInterval?: number;
    showDetails?: boolean;
}

const STATUS_CONFIG = {
    pending: {
        icon: Clock,
        color: "bg-yellow-500",
        text: "Pending",
        description: "Transaction is being processed",
        variant: "default" as const,
    },
    confirmed: {
        icon: CheckCircle,
        color: "bg-green-500",
        text: "Confirmed",
        description: "Transaction completed successfully",
        variant: "default" as const,
    },
    failed: {
        icon: XCircle,
        color: "bg-red-500",
        text: "Failed",
        description: "Transaction failed",
        variant: "destructive" as const,
    },
    cancelled: {
        icon: AlertCircle,
        color: "bg-gray-500",
        text: "Cancelled",
        description: "Transaction was cancelled",
        variant: "secondary" as const,
    },
};

export function TonTransactionStatus({
    transaction,
    onUpdate,
    autoRefresh = true,
    refreshInterval = 5000,
    showDetails = false,
}: TonTransactionStatusProps) {
    const [currentTransaction, setCurrentTransaction] = useState<TonTransactionInfo>(transaction);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    const statusConfig = STATUS_CONFIG[currentTransaction.status];
    const StatusIcon = statusConfig.icon;

    // Auto-refresh transaction status
    useEffect(() => {
        if (!autoRefresh || currentTransaction.status === 'confirmed' || currentTransaction.status === 'failed') {
            return;
        }

        const interval = setInterval(() => {
            refreshTransactionStatus();
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, currentTransaction.status, currentTransaction.hash]);

    const refreshTransactionStatus = useCallback(async () => {
        if (isRefreshing) return;

        setIsRefreshing(true);
        try {
            const response = await fetch(`/api/ton/transaction?hash=${currentTransaction.hash}`);
            if (response.ok) {
                const updatedTransaction = await response.json();
                setCurrentTransaction(updatedTransaction);
                setLastRefresh(new Date());
                onUpdate?.(updatedTransaction);
            } else {
                console.warn('Failed to refresh transaction status:', response.statusText);
            }
        } catch (error) {
            console.error('Error refreshing transaction status:', error);
        } finally {
            setIsRefreshing(false);
        }
    }, [currentTransaction.hash, onUpdate, isRefreshing]);

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast.success(`${label} copied to clipboard`);
        }).catch(() => {
            toast.error(`Failed to copy ${label}`);
        });
    };

    const openInExplorer = () => {
        const explorerUrl = `https://tonviewer.com/transaction/${currentTransaction.hash}`;
        window.open(explorerUrl, '_blank');
    };

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const calculateProgress = () => {
        if (currentTransaction.status === 'confirmed') return 100;
        if (currentTransaction.status === 'failed' || currentTransaction.status === 'cancelled') return 0;

        return Math.min(
            (currentTransaction.confirmations / currentTransaction.requiredConfirmations) * 100,
            95
        );
    };

    const getTypeIcon = () => {
        switch (currentTransaction.type) {
            case 'jetton_transfer':
                return <Coins className="w-4 h-4" />;
            case 'swap':
                return <ArrowRight className="w-4 h-4" />;
            case 'contract_call':
                return <Activity className="w-4 h-4" />;
            default:
                return <Coins className="w-4 h-4" />;
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${statusConfig.color} animate-pulse`} />
                        Transaction Status
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={refreshTransactionStatus}
                            disabled={isRefreshing}
                        >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                        {showDetails && (
                            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        <ExternalLink className="w-4 h-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>Transaction Details</DialogTitle>
                                    </DialogHeader>
                                    <TransactionDetails transaction={currentTransaction} />
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                    <Badge variant={statusConfig.variant} className="flex items-center gap-1">
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.text}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                        {getTypeIcon()}
                        <span className="ml-1 capitalize">{currentTransaction.type.replace('_', ' ')}</span>
                    </div>
                </div>

                {/* Progress Bar */}
                {currentTransaction.status === 'pending' && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Confirmations</span>
                            <span>{currentTransaction.confirmations}/{currentTransaction.requiredConfirmations}</span>
                        </div>
                        <Progress value={calculateProgress()} className="h-2" />
                    </div>
                )}

                {/* Transaction Info */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Hash</span>
                        <div className="flex items-center gap-1">
                            <code className="text-xs font-mono">{formatAddress(currentTransaction.hash)}</code>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(currentTransaction.hash, "Transaction hash")}
                                className="h-6 w-6 p-0"
                            >
                                <Copy className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Amount</span>
                        <div className="text-sm font-medium">
                            {currentTransaction.amountFormatted} {currentTransaction.token}
                        </div>
                    </div>

                    {currentTransaction.gasFeeFormatted && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Gas className="w-3 h-3" />
                                Fee
                            </span>
                            <div className="text-sm">{currentTransaction.gasFeeFormatted} TON</div>
                        </div>
                    )}
                </div>

                {/* Error Message */}
                {currentTransaction.status === 'failed' && currentTransaction.error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                            <div className="text-sm text-red-700 dark:text-red-300">
                                {currentTransaction.error}
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                    <Button variant="outline" onClick={openInExplorer} className="flex-1">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View on Explorer
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => copyToClipboard(currentTransaction.hash, "Transaction hash")}
                    >
                        <Copy className="w-4 h-4" />
                    </Button>
                </div>

                {/* Last Updated */}
                <div className="text-xs text-muted-foreground text-center">
                    Last updated: {lastRefresh.toLocaleTimeString()}
                </div>
            </CardContent>
        </Card>
    );
}

// Detailed transaction view component
function TransactionDetails({ transaction }: { transaction: TonTransactionInfo }) {
    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast.success(`${label} copied to clipboard`);
        }).catch(() => {
            toast.error(`Failed to copy ${label}`);
        });
    };

    const DetailRow = ({ label, value, copyable = false }: { label: string; value: string; copyable?: boolean }) => (
        <div className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <div className="flex items-center gap-1">
                <code className="text-xs font-mono bg-muted px-2 py-1 rounded">{value}</code>
                {copyable && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(value, label)}
                        className="h-6 w-6 p-0"
                    >
                        <Copy className="w-3 h-3" />
                    </Button>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="space-y-1">
                <DetailRow label="Transaction Hash" value={transaction.hash} copyable />
                <DetailRow label="From Address" value={transaction.from} copyable />
                <DetailRow label="To Address" value={transaction.to} copyable />
                <DetailRow label="Amount" value={`${transaction.amountFormatted} ${transaction.token}`} />
                <DetailRow label="Status" value={transaction.status} />
                <DetailRow label="Type" value={transaction.type.replace('_', ' ')} />

                {transaction.blockNumber && (
                    <DetailRow label="Block Number" value={transaction.blockNumber.toString()} />
                )}

                {transaction.gasFeeFormatted && (
                    <DetailRow label="Gas Fee" value={`${transaction.gasFeeFormatted} TON`} />
                )}

                {transaction.gasUsed && (
                    <DetailRow label="Gas Used" value={transaction.gasUsed} />
                )}

                <DetailRow label="Confirmations" value={`${transaction.confirmations}/${transaction.requiredConfirmations}`} />
                <DetailRow label="Created At" value={new Date(transaction.createdAt).toLocaleString()} />
                <DetailRow label="Updated At" value={new Date(transaction.updatedAt).toLocaleString()} />

                {transaction.timestamp && (
                    <DetailRow label="Block Timestamp" value={new Date(transaction.timestamp).toLocaleString()} />
                )}
            </div>

            {transaction.error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                        <div>
                            <div className="font-medium text-red-700 dark:text-red-300 mb-1">Error Details</div>
                            <div className="text-sm text-red-600 dark:text-red-400 font-mono">
                                {transaction.error}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}