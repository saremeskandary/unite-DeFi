"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    CheckCircle,
    XCircle,
    Clock,
    ExternalLink,
    Loader2,
    AlertCircle
} from "lucide-react"
import { toast } from "sonner"

export interface TransactionStatus {
    hash: string
    status: 'pending' | 'confirmed' | 'failed'
    confirmations: number
    requiredConfirmations: number
    estimatedTime: string
    gasUsed?: string
    gasPrice?: string
    totalFee?: string
    blockNumber?: number
    timestamp?: number
}

interface TransactionMonitorProps {
    transactionHash: string
    network: string
    onComplete?: (status: TransactionStatus) => void
    onError?: (error: string) => void
}

export function TransactionMonitor({
    transactionHash,
    network,
    onComplete,
    onError
}: TransactionMonitorProps) {
    const [status, setStatus] = useState<TransactionStatus>({
        hash: transactionHash,
        status: 'pending',
        confirmations: 0,
        requiredConfirmations: network === 'ethereum' ? 12 : 6,
        estimatedTime: '~2-5 minutes'
    })
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (transactionHash) {
            monitorTransaction()
        }
    }, [transactionHash, network])

    const monitorTransaction = async () => {
        setIsLoading(true)
        setError(null)

        try {
            // Start monitoring the transaction
            const interval = setInterval(async () => {
                try {
                    const response = await fetch(`/api/transaction-status`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            hash: transactionHash,
                            network
                        })
                    })

                    if (response.ok) {
                        const data = await response.json()
                        const newStatus: TransactionStatus = {
                            ...status,
                            ...data,
                            hash: transactionHash
                        }

                        setStatus(newStatus)

                        // Check if transaction is confirmed
                        if (newStatus.status === 'confirmed') {
                            clearInterval(interval)
                            setIsLoading(false)
                            onComplete?.(newStatus)
                            toast.success('Transaction confirmed!')
                        } else if (newStatus.status === 'failed') {
                            clearInterval(interval)
                            setIsLoading(false)
                            setError('Transaction failed')
                            onError?.('Transaction failed')
                            toast.error('Transaction failed')
                        }
                    } else {
                        throw new Error('Failed to fetch transaction status')
                    }
                } catch (err) {
                    console.error('Error monitoring transaction:', err)
                    // Don't stop monitoring on temporary errors
                }
            }, 5000) // Check every 5 seconds

            // Cleanup interval on unmount
            return () => clearInterval(interval)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to monitor transaction')
            setIsLoading(false)
            onError?.(err instanceof Error ? err.message : 'Failed to monitor transaction')
        }
    }

    const getExplorerUrl = () => {
        const explorers: { [key: string]: string } = {
            'ethereum': `https://etherscan.io/tx/${transactionHash}`,
            'sepolia': `https://sepolia.etherscan.io/tx/${transactionHash}`,
            'goerli': `https://goerli.etherscan.io/tx/${transactionHash}`,
            'polygon': `https://polygonscan.com/tx/${transactionHash}`,
            'arbitrum': `https://arbiscan.io/tx/${transactionHash}`,
            'optimism': `https://optimistic.etherscan.io/tx/${transactionHash}`,
            'bsc': `https://bscscan.com/tx/${transactionHash}`,
            'avalanche': `https://snowtrace.io/tx/${transactionHash}`,
        }
        return explorers[network] || `https://etherscan.io/tx/${transactionHash}`
    }

    const getStatusIcon = () => {
        switch (status.status) {
            case 'confirmed':
                return <CheckCircle className="w-5 h-5 text-green-500" />
            case 'failed':
                return <XCircle className="w-5 h-5 text-red-500" />
            case 'pending':
                return isLoading ? <Loader2 className="w-5 h-5 animate-spin text-blue-500" /> : <Clock className="w-5 h-5 text-yellow-500" />
            default:
                return <AlertCircle className="w-5 h-5 text-gray-500" />
        }
    }

    const getStatusColor = () => {
        switch (status.status) {
            case 'confirmed':
                return 'bg-green-500/10 text-green-500 border-green-500/20'
            case 'failed':
                return 'bg-red-500/10 text-red-500 border-red-500/20'
            case 'pending':
                return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
            default:
                return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
        }
    }

    const progressPercentage = (status.confirmations / status.requiredConfirmations) * 100

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    {getStatusIcon()}
                    <span>Transaction Status</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Transaction Hash */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Transaction Hash</label>
                    <div className="flex items-center space-x-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                            {transactionHash}
                        </code>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                navigator.clipboard.writeText(transactionHash)
                                toast.success('Hash copied to clipboard')
                            }}
                            className="shrink-0"
                        >
                            Copy
                        </Button>
                    </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor()}>
                        {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                    </Badge>
                    {status.status === 'pending' && (
                        <span className="text-sm text-muted-foreground">
                            {status.estimatedTime}
                        </span>
                    )}
                </div>

                {/* Progress Bar */}
                {status.status === 'pending' && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Confirmations</span>
                            <span>{status.confirmations}/{status.requiredConfirmations}</span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                    </div>
                )}

                {/* Transaction Details */}
                {status.blockNumber && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Block Number</span>
                            <span>{status.blockNumber}</span>
                        </div>
                        {status.gasUsed && (
                            <div className="flex justify-between text-sm">
                                <span>Gas Used</span>
                                <span>{status.gasUsed}</span>
                            </div>
                        )}
                        {status.totalFee && (
                            <div className="flex justify-between text-sm">
                                <span>Total Fee</span>
                                <span>{parseFloat(status.totalFee).toFixed(6)} ETH</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(getExplorerUrl(), '_blank')}
                        className="flex-1"
                    >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View on Explorer
                    </Button>
                    {status.status === 'pending' && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={monitorTransaction}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                'Refresh'
                            )}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
} 