"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Copy,
    Check,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    AlertTriangle,
    Info,
    Bitcoin,
    Code,
    FileText,
    Shield,
    Clock
} from "lucide-react"
import { toast } from "sonner"
import { BitcoinTransactionData, OpcodeExplanation } from "@/lib/blockchains/bitcoin/bitcoin-transaction-builder"
import { BitcoinWalletGuide } from "./bitcoin-wallet-guide"

interface BitcoinTransactionViewerProps {
    transactionData: BitcoinTransactionData
    transactionType: 'funding' | 'spending'
    onTransactionSigned?: (signedTx: string) => void
}

export function BitcoinTransactionViewer({
    transactionData,
    transactionType,
    onTransactionSigned
}: BitcoinTransactionViewerProps) {
    const [copiedField, setCopiedField] = useState<string | null>(null)
    const [expandedSections, setExpandedSections] = useState<{
        rawTx: boolean
        inputs: boolean
        outputs: boolean
        opcodes: boolean
        explanation: boolean
        walletGuide: boolean
    }>({
        rawTx: false,
        inputs: false,
        outputs: false,
        opcodes: false,
        explanation: false,
        walletGuide: false
    })

    const copyToClipboard = async (text: string, fieldName: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedField(fieldName)
            toast.success(`${fieldName} copied to clipboard`)
            setTimeout(() => setCopiedField(null), 2000)
        } catch (error) {
            toast.error("Failed to copy to clipboard")
        }
    }

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }))
    }

    const formatSatoshi = (satoshi: number) => {
        return (satoshi / 100000000).toFixed(8)
    }

    const formatHex = (hex: string, maxLength: number = 64) => {
        if (hex.length <= maxLength) return hex
        return `${hex.slice(0, maxLength)}...${hex.slice(-8)}`
    }

    const getTransactionTypeIcon = () => {
        return transactionType === 'funding' ? <Bitcoin className="w-5 h-5" /> : <Shield className="w-5 h-5" />
    }

    const getTransactionTypeColor = () => {
        return transactionType === 'funding' ? 'bg-blue-500' : 'bg-green-500'
    }

    return (
        <div className="space-y-4">
            {/* Transaction Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        {getTransactionTypeIcon()}
                        <span>
                            {transactionType === 'funding' ? 'HTLC Funding' : 'HTLC Spending'} Transaction
                        </span>
                        <Badge className={getTransactionTypeColor()}>
                            {transactionType === 'funding' ? 'Create HTLC' : 'Claim Funds'}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Transaction Summary */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Amount:</span>
                                <span className="font-mono">{formatSatoshi(transactionData.totalAmount)} BTC</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Fee:</span>
                                <span className="font-mono">{formatSatoshi(transactionData.fee)} BTC</span>
                            </div>
                            {transactionData.changeAmount > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Change:</span>
                                    <span className="font-mono">{formatSatoshi(transactionData.changeAmount)} BTC</span>
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Inputs:</span>
                                <span>{transactionData.inputs.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Outputs:</span>
                                <span>{transactionData.outputs.length}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Raw Transaction */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                            <Code className="w-5 h-5" />
                            <span>Raw Transaction</span>
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(transactionData.rawTransaction, 'Raw Transaction')}
                                className="flex items-center space-x-2"
                            >
                                {copiedField === 'Raw Transaction' ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <Copy className="w-4 h-4" />
                                )}
                                <span>Copy</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleSection('rawTx')}
                            >
                                {expandedSections.rawTx ? (
                                    <ChevronUp className="w-4 h-4" />
                                ) : (
                                    <ChevronDown className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="bg-muted rounded-lg p-3 font-mono text-xs">
                        {expandedSections.rawTx ? (
                            <div className="whitespace-pre-wrap break-all">
                                {transactionData.rawTransaction}
                            </div>
                        ) : (
                            <div className="text-muted-foreground">
                                {formatHex(transactionData.rawTransaction, 100)}...
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Transaction Explanation */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                            <FileText className="w-5 h-5" />
                            <span>Transaction Explanation</span>
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSection('explanation')}
                        >
                            {expandedSections.explanation ? (
                                <ChevronUp className="w-4 h-4" />
                            ) : (
                                <ChevronDown className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                </CardHeader>
                {expandedSections.explanation && (
                    <CardContent>
                        <div className="prose prose-sm max-w-none">
                            <p className="whitespace-pre-line text-sm leading-relaxed">
                                {transactionData.explanation}
                            </p>
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Inputs */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                            <Info className="w-5 h-5" />
                            <span>Transaction Inputs ({transactionData.inputs.length})</span>
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSection('inputs')}
                        >
                            {expandedSections.inputs ? (
                                <ChevronUp className="w-4 h-4" />
                            ) : (
                                <ChevronDown className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                </CardHeader>
                {expandedSections.inputs && (
                    <CardContent>
                        <div className="space-y-3">
                            {transactionData.inputs.map((input, index) => (
                                <div key={index} className="border rounded-lg p-3 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm font-medium">Input #{index + 1}</span>
                                                <Badge variant="secondary" className="text-xs">
                                                    {formatSatoshi(input.amount)} BTC
                                                </Badge>
                                            </div>
                                            <div className="text-xs text-muted-foreground font-mono">
                                                TXID: {formatHex(input.txid, 32)}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Address: {input.address}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyToClipboard(input.txid, `Input ${index + 1} TXID`)}
                                        >
                                            <Copy className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Outputs */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                            <Bitcoin className="w-5 h-5" />
                            <span>Transaction Outputs ({transactionData.outputs.length})</span>
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSection('outputs')}
                        >
                            {expandedSections.outputs ? (
                                <ChevronUp className="w-4 h-4" />
                            ) : (
                                <ChevronDown className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                </CardHeader>
                {expandedSections.outputs && (
                    <CardContent>
                        <div className="space-y-3">
                            {transactionData.outputs.map((output, index) => (
                                <div key={index} className="border rounded-lg p-3 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm font-medium">Output #{index + 1}</span>
                                                <Badge
                                                    variant={output.type === 'htlc' ? 'default' : 'secondary'}
                                                    className="text-xs"
                                                >
                                                    {output.type.toUpperCase()}
                                                </Badge>
                                                <Badge variant="outline" className="text-xs">
                                                    {formatSatoshi(output.amount)} BTC
                                                </Badge>
                                            </div>
                                            <div className="text-xs text-muted-foreground font-mono">
                                                Address: {output.address}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Script: {formatHex(output.scriptPubKey, 40)}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyToClipboard(output.address, `Output ${index + 1} Address`)}
                                        >
                                            <Copy className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Opcodes Explanation */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                            <Code className="w-5 h-5" />
                            <span>Bitcoin Opcodes ({transactionData.opcodes.length})</span>
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSection('opcodes')}
                        >
                            {expandedSections.opcodes ? (
                                <ChevronUp className="w-4 h-4" />
                            ) : (
                                <ChevronDown className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                </CardHeader>
                {expandedSections.opcodes && (
                    <CardContent>
                        <div className="space-y-4">
                            {transactionData.opcodes.map((opcode, index) => (
                                <div key={index} className="border rounded-lg p-4 space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center space-x-2">
                                                <Badge variant="outline" className="font-mono">
                                                    {opcode.opcode}
                                                </Badge>
                                                <span className="font-medium">{opcode.name}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {opcode.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-xs font-medium text-muted-foreground">Purpose:</span>
                                            <p className="text-sm">{opcode.purpose}</p>
                                        </div>
                                        {opcode.example && (
                                            <div>
                                                <span className="text-xs font-medium text-muted-foreground">Example:</span>
                                                <div className="bg-muted rounded p-2 mt-1">
                                                    <code className="text-xs font-mono">{opcode.example}</code>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Instructions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Clock className="w-5 h-5" />
                        <span>Signing Instructions</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {transactionData.instructions.map((instruction, index) => (
                            <div key={index} className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                                    {index + 1}
                                </div>
                                <p className="text-sm">{instruction}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Warnings */}
            {transactionData.warnings.length > 0 && (
                <Card className="border-yellow-200 bg-yellow-50">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2 text-yellow-800">
                            <AlertTriangle className="w-5 h-5" />
                            <span>Important Warnings</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {transactionData.warnings.map((warning, index) => (
                                <div key={index} className="flex items-start space-x-2">
                                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-yellow-800">{warning}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
                <Button
                    onClick={() => copyToClipboard(transactionData.rawTransaction, 'Complete Transaction')}
                    className="flex-1"
                    variant="outline"
                >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Transaction
                </Button>
                <Button
                    onClick={() => toggleSection('walletGuide')}
                    className="flex-1"
                    variant="outline"
                >
                    <Shield className="w-4 h-4 mr-2" />
                    Wallet Guide
                </Button>
                <Button
                    onClick={() => window.open('https://blockstream.info/testnet', '_blank')}
                    className="flex-1"
                    variant="outline"
                >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on Explorer
                </Button>
            </div>

            {/* Wallet Guide Section */}
            {expandedSections.walletGuide && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Shield className="w-5 h-5" />
                            <span>How to Sign This Transaction</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <BitcoinWalletGuide
                            transactionHex={transactionData.rawTransaction}
                            onWalletSelected={(wallet) => {
                                console.log('Selected wallet:', wallet)
                            }}
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    )
} 