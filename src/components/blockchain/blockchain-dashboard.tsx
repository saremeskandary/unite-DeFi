'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { useToast } from '../../hooks/use-toast'
import { useBlockchainIntegration } from '../../hooks/use-blockchain-integration'
import { useAppStore } from '../../lib/store'
import {
    Wallet,
    Network,
    Bitcoin,
    ArrowRightLeft,
    RefreshCw,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle
} from 'lucide-react'

export function BlockchainDashboard() {
    const [selectedFromChain, setSelectedFromChain] = useState<'ethereum' | 'bitcoin'>('ethereum')
    const [selectedToChain, setSelectedToChain] = useState<'ethereum' | 'bitcoin'>('bitcoin')
    const [fromAmount, setFromAmount] = useState('')
    const [toAmount, setToAmount] = useState('')
    const [fromAddress, setFromAddress] = useState('')
    const [toAddress, setToAddress] = useState('')
    const [secret, setSecret] = useState('')
    const [selectedSwapId, setSelectedSwapId] = useState('')

    const { toast } = useToast()
    const {
        isInitializing,
        status,
        initialize,
        connectEthereum,
        switchEthereumNetwork,
        createSwap,
        fundSwap,
        redeemSwap,
        refundSwap,
        getBalance,
        monitorSwap
    } = useBlockchainIntegration()

    const { activeSwaps, swapHistory, addNotification } = useAppStore()

    // Initialize blockchain services on mount
    useEffect(() => {
        initialize()
    }, [initialize])

    // Auto-populate addresses when wallet is connected
    useEffect(() => {
        if (status.ethereum.connected && status.ethereum.account) {
            setFromAddress(status.ethereum.account)
        }
    }, [status.ethereum.connected, status.ethereum.account])

    const handleCreateSwap = async () => {
        if (!fromAmount || !toAmount || !fromAddress || !toAddress) {
            toast({
                title: "Missing Information",
                description: "Please fill in all required fields",
                variant: "destructive",
            })
            return
        }

        try {
            const swap = await createSwap({
                fromChain: selectedFromChain,
                toChain: selectedToChain,
                fromToken: selectedFromChain === 'ethereum' ? 'ETH' : 'BTC',
                toToken: selectedToChain === 'ethereum' ? 'ETH' : 'BTC',
                fromAmount,
                toAmount,
                fromAddress,
                toAddress
            })

            // Clear form
            setFromAmount('')
            setToAmount('')
            setFromAddress('')
            setToAddress('')

            toast({
                title: "Swap Created",
                description: `Swap ${swap.id} has been created successfully`,
            })
        } catch (error) {
            console.error('Failed to create swap:', error)
        }
    }

    const handleFundSwap = async () => {
        if (!selectedSwapId) {
            toast({
                title: "No Swap Selected",
                description: "Please select a swap to fund",
                variant: "destructive",
            })
            return
        }

        try {
            await fundSwap(selectedSwapId)
        } catch (error) {
            console.error('Failed to fund swap:', error)
        }
    }

    const handleRedeemSwap = async () => {
        if (!selectedSwapId || !secret) {
            toast({
                title: "Missing Information",
                description: "Please select a swap and enter the secret",
                variant: "destructive",
            })
            return
        }

        try {
            await redeemSwap(selectedSwapId, secret)
            setSecret('')
        } catch (error) {
            console.error('Failed to redeem swap:', error)
        }
    }

    const handleRefundSwap = async () => {
        if (!selectedSwapId) {
            toast({
                title: "No Swap Selected",
                description: "Please select a swap to refund",
                variant: "destructive",
            })
            return
        }

        try {
            await refundSwap(selectedSwapId)
        } catch (error) {
            console.error('Failed to refund swap:', error)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="h-4 w-4 text-green-500" />
            case 'failed':
                return <XCircle className="h-4 w-4 text-red-500" />
            case 'pending':
                return <Clock className="h-4 w-4 text-yellow-500" />
            default:
                return <AlertTriangle className="h-4 w-4 text-gray-500" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800'
            case 'failed':
                return 'bg-red-100 text-red-800'
            case 'pending':
                return 'bg-yellow-100 text-yellow-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Blockchain Dashboard</h1>
                    <p className="text-muted-foreground">Manage cross-chain swaps and blockchain connections</p>
                </div>
                <Button onClick={initialize} disabled={isInitializing}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isInitializing ? 'animate-spin' : ''}`} />
                    {isInitializing ? 'Initializing...' : 'Refresh Status'}
                </Button>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ethereum Status</CardTitle>
                        <Bitcoin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Connected:</span>
                                <Badge variant={status.ethereum.connected ? "default" : "secondary"}>
                                    {status.ethereum.connected ? 'Connected' : 'Disconnected'}
                                </Badge>
                            </div>
                            {status.ethereum.connected && (
                                <>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Network:</span>
                                        <span className="text-sm font-medium">{status.ethereum.network || 'Unknown'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Account:</span>
                                        <span className="text-sm font-mono">
                                            {status.ethereum.account?.slice(0, 6)}...{status.ethereum.account?.slice(-4)}
                                        </span>
                                    </div>
                                </>
                            )}
                            {!status.ethereum.connected && (
                                <Button onClick={connectEthereum} size="sm" className="w-full">
                                    <Wallet className="mr-2 h-4 w-4" />
                                    Connect Wallet
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bitcoin Status</CardTitle>
                        <Bitcoin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Network:</span>
                                <Badge variant="outline">{status.bitcoin.network}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Status:</span>
                                <Badge variant={status.bitcoin.status === 'online' ? "default" : "secondary"}>
                                    {status.bitcoin.status}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="create" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="create">Create Swap</TabsTrigger>
                    <TabsTrigger value="manage">Manage Swaps</TabsTrigger>
                    <TabsTrigger value="monitor">Monitor</TabsTrigger>
                </TabsList>

                <TabsContent value="create" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create Cross-Chain Swap</CardTitle>
                            <CardDescription>
                                Create a new atomic swap between Ethereum and Bitcoin
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fromChain">From Chain</Label>
                                    <Select value={selectedFromChain} onValueChange={(value: 'ethereum' | 'bitcoin') => setSelectedFromChain(value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ethereum">Ethereum</SelectItem>
                                            <SelectItem value="bitcoin">Bitcoin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="toChain">To Chain</Label>
                                    <Select value={selectedToChain} onValueChange={(value: 'ethereum' | 'bitcoin') => setSelectedToChain(value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ethereum">Ethereum</SelectItem>
                                            <SelectItem value="bitcoin">Bitcoin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fromAmount">From Amount</Label>
                                    <Input
                                        id="fromAmount"
                                        type="number"
                                        placeholder="0.0"
                                        value={fromAmount}
                                        onChange={(e) => setFromAmount(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="toAmount">To Amount</Label>
                                    <Input
                                        id="toAmount"
                                        type="number"
                                        placeholder="0.0"
                                        value={toAmount}
                                        onChange={(e) => setToAmount(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fromAddress">From Address</Label>
                                    <Input
                                        id="fromAddress"
                                        placeholder="0x..."
                                        value={fromAddress}
                                        onChange={(e) => setFromAddress(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="toAddress">To Address</Label>
                                    <Input
                                        id="toAddress"
                                        placeholder="0x..."
                                        value={toAddress}
                                        onChange={(e) => setToAddress(e.target.value)}
                                    />
                                </div>
                            </div>

                            <Button onClick={handleCreateSwap} className="w-full">
                                <ArrowRightLeft className="mr-2 h-4 w-4" />
                                Create Swap
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="manage" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Manage Active Swaps</CardTitle>
                            <CardDescription>
                                Fund, redeem, or refund your active swaps
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="swapId">Select Swap</Label>
                                <Select value={selectedSwapId} onValueChange={setSelectedSwapId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a swap" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {activeSwaps.map((swap) => (
                                            <SelectItem key={swap.id} value={swap.id}>
                                                {swap.id} - {swap.status}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="secret">Secret (for redemption)</Label>
                                <Input
                                    id="secret"
                                    placeholder="Enter secret to redeem swap"
                                    value={secret}
                                    onChange={(e) => setSecret(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button onClick={handleFundSwap} variant="outline" className="flex-1">
                                    Fund Swap
                                </Button>
                                <Button onClick={handleRedeemSwap} variant="outline" className="flex-1">
                                    Redeem Swap
                                </Button>
                                <Button onClick={handleRefundSwap} variant="outline" className="flex-1">
                                    Refund Swap
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="monitor" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Active Swaps */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Active Swaps</CardTitle>
                                <CardDescription>
                                    Currently active cross-chain swaps
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {activeSwaps.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No active swaps</p>
                                    ) : (
                                        activeSwaps.map((swap) => (
                                            <div key={swap.id} className="flex items-center justify-between p-2 border rounded">
                                                <div className="flex items-center space-x-2">
                                                    {getStatusIcon(swap.status)}
                                                    <div>
                                                        <p className="text-sm font-medium">{swap.id}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {swap.fromAmount} {swap.fromToken} → {swap.toAmount} {swap.toToken}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge className={getStatusColor(swap.status)}>
                                                    {swap.status}
                                                </Badge>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Swap History */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Swap History</CardTitle>
                                <CardDescription>
                                    Completed and failed swaps
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {swapHistory.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No swap history</p>
                                    ) : (
                                        swapHistory.map((swap) => (
                                            <div key={swap.id} className="flex items-center justify-between p-2 border rounded">
                                                <div className="flex items-center space-x-2">
                                                    {getStatusIcon(swap.status)}
                                                    <div>
                                                        <p className="text-sm font-medium">{swap.id}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {swap.fromAmount} {swap.fromToken} → {swap.toAmount} {swap.toToken}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge className={getStatusColor(swap.status)}>
                                                    {swap.status}
                                                </Badge>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
} 