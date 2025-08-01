"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    Copy,
    ExternalLink,
    CheckCircle,
    AlertCircle,
    Clock,
    Bitcoin,
    ArrowRight,
    Info,
    Code
} from "lucide-react"
import { toast } from "sonner"
import { BitcoinSwapFlow, BitcoinSwapFlowParams, BitcoinSwapFlowResult } from "@/lib/blockchains/bitcoin/bitcoin-swap-flow"
import { BitcoinTransactionBuilder, BitcoinTransactionData } from "@/lib/blockchains/bitcoin/bitcoin-transaction-builder"
import { BitcoinTransactionViewer } from "./bitcoin-transaction-viewer"

interface BitcoinSwapFlowUIProps {
    fromToken: string
    toToken: string
    fromAmount: string
    toAmount: string
    userEthereumAddress: string
    fromBitcoinAddress?: string
    toBitcoinAddress?: string
    onSwapComplete: (result: BitcoinSwapFlowResult) => void
}

export function BitcoinSwapFlowUI({
    fromToken,
    toToken,
    fromAmount,
    toAmount,
    userEthereumAddress,
    fromBitcoinAddress = "",
    toBitcoinAddress = "",
    onSwapComplete
}: BitcoinSwapFlowUIProps) {
    const [bitcoinAddress, setBitcoinAddress] = useState("")
    const [isValidBitcoinAddress, setIsValidBitcoinAddress] = useState(false)
    const [swapDirection, setSwapDirection] = useState<'erc20-to-btc' | 'btc-to-erc20'>('erc20-to-btc')
    const [isLoading, setIsLoading] = useState(false)
    const [swapResult, setSwapResult] = useState<BitcoinSwapFlowResult | null>(null)
    const [currentStep, setCurrentStep] = useState(1)
    const [transactionData, setTransactionData] = useState<BitcoinTransactionData | null>(null)
    const [showTransactionViewer, setShowTransactionViewer] = useState(false)

    // Initialize Bitcoin swap flow
    const bitcoinSwapFlow = new BitcoinSwapFlow(
        process.env.NEXT_PUBLIC_ETH_PRIVATE_KEY || '',
        process.env.NEXT_PUBLIC_BTC_PRIVATE_KEY_WIF || '',
        true // Use testnet
    )

    // Initialize Bitcoin transaction builder
    const transactionBuilder = new BitcoinTransactionBuilder(true) // Use testnet

    // Determine swap direction
    useEffect(() => {
        if (fromToken === 'BTC' && toToken !== 'BTC') {
            setSwapDirection('btc-to-erc20')
        } else if (fromToken !== 'BTC' && toToken === 'BTC') {
            setSwapDirection('erc20-to-btc')
        }
    }, [fromToken, toToken])

    // Use passed Bitcoin addresses based on swap direction
    useEffect(() => {
        if (swapDirection === 'btc-to-erc20') {
            setBitcoinAddress(fromBitcoinAddress)
        } else {
            setBitcoinAddress(toBitcoinAddress)
        }
    }, [fromBitcoinAddress, toBitcoinAddress, swapDirection])

    // Validate Bitcoin address
    useEffect(() => {
        if (bitcoinAddress) {
            const isValid = bitcoinSwapFlow.validateBitcoinAddress(bitcoinAddress)
            setIsValidBitcoinAddress(isValid)
        } else {
            setIsValidBitcoinAddress(false)
        }
    }, [bitcoinAddress])

    const handleBitcoinAddressChange = (value: string) => {
        setBitcoinAddress(value)
    }

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            toast.success("Copied to clipboard")
        } catch (error) {
            toast.error("Failed to copy")
        }
    }

    const handleCreateSwap = async () => {
        if (!isValidBitcoinAddress) {
            toast.error("Please enter a valid Bitcoin address")
            return
        }

        setIsLoading(true)
        setCurrentStep(2)

        try {
            const params: BitcoinSwapFlowParams = {
                fromToken: fromToken as 'BTC' | 'ERC20',
                toToken: toToken as 'BTC' | 'ERC20',
                fromAmount,
                toAmount,
                userBitcoinAddress: swapDirection === 'btc-to-erc20' ? fromBitcoinAddress : toBitcoinAddress,
                userEthereumAddress
            }

            let result: BitcoinSwapFlowResult

            if (swapDirection === 'erc20-to-btc') {
                result = await bitcoinSwapFlow.handleERC20ToBTCSwap(params)
            } else {
                result = await bitcoinSwapFlow.handleBTCToERC20Swap(params)
            }

            setSwapResult(result)
            setCurrentStep(3)

            if (result.success) {
                // Generate transaction data for manual signing
                if (swapDirection === 'btc-to-erc20' && result.htlcAddress) {
                    try {
                        const txData = await transactionBuilder.buildHTLCFundingTransaction({
                            secretHash: result.secretHash || '',
                            recipientAddress: bitcoinAddress,
                            lockTime: Math.floor(Date.now() / 1000) + 3600, // 1 hour
                            amount: parseFloat(fromAmount) * 100000000, // Convert to satoshis
                            feeRate: 10, // satoshis per byte
                            userAddress: bitcoinAddress,
                            utxos: [] // Mock UTXOs - in production, fetch from API
                        })
                        setTransactionData(txData)
                    } catch (error) {
                        console.error('Failed to build transaction:', error)
                    }
                }

                onSwapComplete(result)
                toast.success("Swap order created successfully!")
            } else {
                toast.error(result.error || "Failed to create swap order")
            }

        } catch (error) {
            toast.error("An error occurred while creating the swap")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const getSwapInstructions = () => {
        return bitcoinSwapFlow.getSwapInstructions(swapDirection)
    }

    const getNetworkInfo = () => {
        return bitcoinSwapFlow.getBitcoinNetworkInfo()
    }

    const renderStep1 = () => (
        <div className="space-y-4">
            <div>
                <Label htmlFor="bitcoin-address">Bitcoin Address</Label>
                <div className="flex space-x-2">
                    <Input
                        id="bitcoin-address"
                        value={bitcoinAddress}
                        onChange={(e) => handleBitcoinAddressChange(e.target.value)}
                        placeholder="Enter your Bitcoin address"
                        className="flex-1"
                    />
                    {isValidBitcoinAddress && (
                        <Badge variant="secondary" className="flex items-center space-x-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>Valid</span>
                        </Badge>
                    )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    This is where you'll receive Bitcoin (for ERC20→BTC) or where you'll send Bitcoin from (for BTC→ERC20)
                </p>
            </div>

            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    <strong>Bitcoin Swap Process:</strong>
                    <ul className="mt-2 space-y-1 text-sm">
                        {getSwapInstructions().map((instruction, index) => (
                            <li key={index} className="flex items-start space-x-2">
                                <span className="text-muted-foreground">{index + 1}.</span>
                                <span>{instruction}</span>
                            </li>
                        ))}
                    </ul>
                </AlertDescription>
            </Alert>

            <Button
                onClick={handleCreateSwap}
                disabled={!isValidBitcoinAddress || isLoading}
                className="w-full"
            >
                {isLoading ? "Creating Swap..." : "Create Bitcoin Swap"}
            </Button>
        </div>
    )

    const renderStep2 = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-center">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 text-primary-foreground" />
                </div>
            </div>
            <p className="text-center text-muted-foreground">
                Creating your Bitcoin swap order...
            </p>
        </div>
    )

    const renderStep3 = () => {
        if (!swapResult) return null

        if (!swapResult.success) {
            return (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Failed to create swap: {swapResult.error}
                    </AlertDescription>
                </Alert>
            )
        }

        return (
            <div className="space-y-4">
                <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Swap order created successfully!</strong>
                    </AlertDescription>
                </Alert>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Swap Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Order Hash:</span>
                            <div className="flex items-center space-x-2">
                                <span className="font-mono text-xs">{swapResult.orderHash?.slice(0, 8)}...</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(swapResult.orderHash || '')}
                                >
                                    <Copy className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>

                        {swapDirection === 'btc-to-erc20' && swapResult.htlcAddress && (
                            <>
                                <Separator />
                                <div>
                                    <Label className="text-sm font-medium">Send Bitcoin to:</Label>
                                    <div className="mt-2 p-3 bg-muted rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono text-sm break-all">{swapResult.htlcAddress}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => copyToClipboard(swapResult.htlcAddress || '')}
                                            >
                                                <Copy className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Send exactly {fromAmount} BTC to this address
                                    </p>
                                </div>
                            </>
                        )}

                        {swapResult.secretHash && (
                            <>
                                <Separator />
                                <div>
                                    <Label className="text-sm font-medium">Secret Hash:</Label>
                                    <div className="mt-2 p-3 bg-muted rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono text-xs break-all">{swapResult.secretHash}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => copyToClipboard(swapResult.secretHash || '')}
                                            >
                                                <Copy className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {swapResult.instructions && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Next Steps</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {swapResult.instructions.map((instruction, index) => (
                                    <li key={index} className="flex items-start space-x-2 text-sm">
                                        <span className="text-muted-foreground">{index + 1}.</span>
                                        <span>{instruction}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                <div className="flex space-x-2">
                    {transactionData && (
                        <Button
                            onClick={() => setShowTransactionViewer(true)}
                            className="flex-1"
                        >
                            <Code className="w-4 h-4 mr-2" />
                            View Transaction
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        onClick={() => window.open(getNetworkInfo().explorer, '_blank')}
                        className="flex-1"
                    >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View on Explorer
                    </Button>
                    <Button
                        onClick={() => {
                            setCurrentStep(1)
                            setSwapResult(null)
                            setTransactionData(null)
                        }}
                        className="flex-1"
                    >
                        Create Another Swap
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <Bitcoin className="w-5 h-5" />
                    <span>Bitcoin Swap</span>
                    <Badge variant="secondary">{getNetworkInfo().network}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
            </CardContent>

            {/* Transaction Viewer Dialog */}
            {transactionData && (
                <Dialog open={showTransactionViewer} onOpenChange={setShowTransactionViewer}>
                    <DialogContent className="bg-card border-border w-[95vw] max-w-4xl mx-auto max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-foreground">Bitcoin Transaction Details</DialogTitle>
                        </DialogHeader>
                        <BitcoinTransactionViewer
                            transactionData={transactionData}
                            transactionType="funding"
                            onTransactionSigned={(signedTx) => {
                                console.log('Transaction signed:', signedTx)
                                toast.success("Transaction signed successfully!")
                                setShowTransactionViewer(false)
                            }}
                        />
                    </DialogContent>
                </Dialog>
            )}
        </Card>
    )
} 