"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
    Copy,
    Download,
    Info,
    Bitcoin,
    CheckCircle,
    AlertCircle,
    ExternalLink,
    Plus,
    Trash2
} from "lucide-react"
import { toast } from "sonner"

interface UTXO {
    txid: string
    vout: number
    value: number
    address: string
    scriptPubKey: string
}

interface BitcoinTransactionBuilderUIProps {
    htlcAddress: string
    amount: string
    secretHash: string
    network: string
    onTransactionBuilt: (transaction: any) => void
}

export function BitcoinTransactionBuilderUI({
    htlcAddress,
    amount,
    secretHash,
    network,
    onTransactionBuilt
}: BitcoinTransactionBuilderUIProps) {
    const [utxos, setUtxos] = useState<UTXO[]>([])
    const [newUtxo, setNewUtxo] = useState({
        txid: "",
        vout: 0,
        value: 0,
        address: "",
        scriptPubKey: ""
    })
    const [feeRate, setFeeRate] = useState(10) // satoshis per byte
    const [builtTransaction, setBuiltTransaction] = useState<any>(null)
    const [isBuilding, setIsBuilding] = useState(false)

    const addUtxo = () => {
        if (!newUtxo.txid || newUtxo.value <= 0) {
            toast.error("Please enter valid UTXO details")
            return
        }

        setUtxos([...utxos, { ...newUtxo }])
        setNewUtxo({
            txid: "",
            vout: 0,
            value: 0,
            address: "",
            scriptPubKey: ""
        })
        toast.success("UTXO added")
    }

    const removeUtxo = (index: number) => {
        setUtxos(utxos.filter((_, i) => i !== index))
    }

    const calculateTotalInput = () => {
        return utxos.reduce((sum, utxo) => sum + utxo.value, 0)
    }

    const calculateFee = () => {
        // Estimate fee based on input/output count
        const inputCount = utxos.length
        const outputCount = 2 // HTLC output + change output
        const estimatedSize = inputCount * 148 + outputCount * 34 + 10 // Rough estimate
        return estimatedSize * feeRate
    }

    const calculateChange = () => {
        const totalInput = calculateTotalInput()
        const fee = calculateFee()
        const htlcAmount = parseFloat(amount) * 100000000 // Convert to satoshis
        return totalInput - htlcAmount - fee
    }

    const buildTransaction = async () => {
        if (utxos.length === 0) {
            toast.error("Please add at least one UTXO")
            return
        }

        const change = calculateChange()
        if (change < 0) {
            toast.error("Insufficient funds to cover the transaction")
            return
        }

        setIsBuilding(true)

        try {
            const transaction = {
                version: 1,
                locktime: Math.floor(Date.now() / 1000) + 3600, // 1 hour
                inputs: utxos.map(utxo => ({
                    txid: utxo.txid,
                    vout: utxo.vout,
                    sequence: 0xffffffff,
                    scriptSig: "",
                    witness: []
                })),
                outputs: [
                    {
                        address: htlcAddress,
                        value: parseFloat(amount) * 100000000,
                        scriptPubKey: "HTLC_SCRIPT_PUBKEY"
                    }
                ],
                fee: calculateFee(),
                totalInput: calculateTotalInput(),
                changeAmount: change,
                htlcAddress,
                secretHash,
                amount,
                network
            }

            // Add change output if change > dust limit (546 satoshis)
            if (change > 546) {
                transaction.outputs.push({
                    address: utxos[0].address, // Use first UTXO address for change
                    value: change,
                    scriptPubKey: "CHANGE_SCRIPT_PUBKEY"
                })
            }

            setBuiltTransaction(transaction)
            onTransactionBuilt(transaction)
            toast.success("Transaction built successfully!")
        } catch (error) {
            console.error('Failed to build transaction:', error)
            toast.error("Failed to build transaction")
        } finally {
            setIsBuilding(false)
        }
    }

    const downloadTransaction = (transaction: any) => {
        const blob = new Blob([JSON.stringify(transaction, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `bitcoin-transaction-${Date.now()}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success("Transaction downloaded")
    }

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            toast.success("Copied to clipboard")
        } catch (error) {
            toast.error("Failed to copy")
        }
    }

    return (
        <div className="space-y-4">
            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    Build a Bitcoin transaction to fund the HTLC. You'll need to provide your UTXOs and sign the transaction manually.
                </AlertDescription>
            </Alert>

            {/* HTLC Details */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm flex items-center space-x-2">
                        <Bitcoin className="w-4 h-4" />
                        <span>HTLC Details</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <Label className="text-muted-foreground">Amount:</Label>
                            <div className="font-medium">{amount} BTC</div>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Network:</Label>
                            <div className="font-medium">{network}</div>
                        </div>
                    </div>
                    <div>
                        <Label className="text-muted-foreground">HTLC Address:</Label>
                        <div className="flex items-center space-x-2 mt-1">
                            <span className="font-mono text-xs break-all">{htlcAddress}</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(htlcAddress)}
                            >
                                <Copy className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                    <div>
                        <Label className="text-muted-foreground">Secret Hash:</Label>
                        <div className="flex items-center space-x-2 mt-1">
                            <span className="font-mono text-xs break-all">{secretHash}</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(secretHash)}
                            >
                                <Copy className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* UTXO Input */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Add UTXOs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="txid">Transaction ID</Label>
                            <Input
                                id="txid"
                                value={newUtxo.txid}
                                onChange={(e) => setNewUtxo({ ...newUtxo, txid: e.target.value })}
                                placeholder="Enter transaction ID"
                                className="text-xs"
                            />
                        </div>
                        <div>
                            <Label htmlFor="vout">Output Index</Label>
                            <Input
                                id="vout"
                                type="number"
                                value={newUtxo.vout}
                                onChange={(e) => setNewUtxo({ ...newUtxo, vout: parseInt(e.target.value) || 0 })}
                                placeholder="0"
                                className="text-xs"
                            />
                        </div>
                        <div>
                            <Label htmlFor="value">Value (satoshis)</Label>
                            <Input
                                id="value"
                                type="number"
                                value={newUtxo.value}
                                onChange={(e) => setNewUtxo({ ...newUtxo, value: parseInt(e.target.value) || 0 })}
                                placeholder="Enter value in satoshis"
                                className="text-xs"
                            />
                        </div>
                        <div>
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                value={newUtxo.address}
                                onChange={(e) => setNewUtxo({ ...newUtxo, address: e.target.value })}
                                placeholder="Enter address"
                                className="text-xs"
                            />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="scriptPubKey">Script Public Key</Label>
                        <Textarea
                            id="scriptPubKey"
                            value={newUtxo.scriptPubKey}
                            onChange={(e) => setNewUtxo({ ...newUtxo, scriptPubKey: e.target.value })}
                            placeholder="Enter script public key (hex)"
                            className="text-xs"
                            rows={2}
                        />
                    </div>
                    <Button onClick={addUtxo} className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Add UTXO
                    </Button>
                </CardContent>
            </Card>

            {/* UTXO List */}
            {utxos.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Selected UTXOs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {utxos.map((utxo, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                                    <div className="flex-1">
                                        <div className="text-xs font-mono">{utxo.txid.slice(0, 8)}...:{utxo.vout}</div>
                                        <div className="text-xs text-muted-foreground">{utxo.value} sats</div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeUtxo(index)}
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Fee Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Fee Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div>
                        <Label htmlFor="feeRate">Fee Rate (satoshis per byte)</Label>
                        <Input
                            id="feeRate"
                            type="number"
                            value={feeRate}
                            onChange={(e) => setFeeRate(parseInt(e.target.value) || 10)}
                            className="text-xs"
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground">Total Input:</span>
                            <div className="font-medium">{calculateTotalInput()} sats</div>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Fee:</span>
                            <div className="font-medium">{calculateFee()} sats</div>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Change:</span>
                            <div className="font-medium">{calculateChange()} sats</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Build Transaction */}
            <Button
                onClick={buildTransaction}
                disabled={utxos.length === 0 || isBuilding}
                className="w-full"
            >
                {isBuilding ? "Building Transaction..." : "Build Transaction"}
            </Button>

            {/* Built Transaction */}
            {builtTransaction && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Transaction Built</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                Your transaction has been built. Download it and sign it with your private key using a Bitcoin wallet.
                            </AlertDescription>
                        </Alert>

                        <div className="bg-muted p-4 rounded-lg">
                            <pre className="text-xs overflow-x-auto">
                                {JSON.stringify(builtTransaction, null, 2)}
                            </pre>
                        </div>

                        <div className="flex space-x-2">
                            <Button
                                onClick={() => downloadTransaction(builtTransaction)}
                                className="flex-1"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download Transaction
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => copyToClipboard(JSON.stringify(builtTransaction, null, 2))}
                                className="flex-1"
                            >
                                <Copy className="w-4 h-4 mr-2" />
                                Copy JSON
                            </Button>
                        </div>

                        <div className="text-xs text-muted-foreground space-y-1">
                            <p><strong>Next steps:</strong></p>
                            <ol className="list-decimal list-inside space-y-1">
                                <li>Import this transaction into a Bitcoin wallet that supports raw transaction signing</li>
                                <li>Sign the transaction with your private key</li>
                                <li>Broadcast the signed transaction to the Bitcoin network</li>
                                <li>Wait for confirmation (usually 1-6 blocks)</li>
                            </ol>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
} 