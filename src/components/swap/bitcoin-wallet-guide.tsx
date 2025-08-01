"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Copy,
    Check,
    ExternalLink,
    Download,
    Shield,
    Zap,
    Monitor,
    AlertTriangle,
    Info,
    ChevronRight,
    Star
} from "lucide-react"
import { toast } from "sonner"

interface WalletGuideProps {
    transactionHex: string
    onWalletSelected?: (wallet: string) => void
}

interface WalletInfo {
    name: string
    description: string
    pros: string[]
    cons: string[]
    difficulty: 'Easy' | 'Medium' | 'Hard'
    security: 'High' | 'Medium' | 'Low'
    cost: string
    downloadUrl: string
    steps: WalletStep[]
}

interface WalletStep {
    number: number
    title: string
    description: string
    details: string[]
    tips?: string[]
    warnings?: string[]
}

const walletGuides: Record<string, WalletInfo> = {
    electrum: {
        name: "Electrum",
        description: "Most popular Bitcoin wallet with excellent HTLC support",
        pros: [
            "Excellent HTLC support",
            "Advanced transaction tools",
            "Cross-platform",
            "Active development",
            "Large community"
        ],
        cons: [
            "Desktop only",
            "Requires some technical knowledge"
        ],
        difficulty: "Easy",
        security: "High",
        cost: "Free",
        downloadUrl: "https://electrum.org/",
        steps: [
            {
                number: 1,
                title: "Download and Install Electrum",
                description: "Get Electrum from the official website",
                details: [
                    "Visit https://electrum.org/",
                    "Download for your operating system",
                    "Verify the download signature",
                    "Install and create a new wallet"
                ],
                tips: [
                    "Always download from the official website",
                    "Check GPG signatures for security"
                ]
            },
            {
                number: 2,
                title: "Configure for Testnet (Testing)",
                description: "Set up testnet for safe testing",
                details: [
                    "Go to Tools → Network",
                    "Check 'Use Testnet'",
                    "Restart Electrum",
                    "Get testnet coins from faucet"
                ],
                warnings: [
                    "Only use testnet for testing",
                    "Testnet coins have no real value"
                ]
            },
            {
                number: 3,
                title: "Access Transaction Signing",
                description: "Open the transaction signing interface",
                details: [
                    "Go to Tools → Sign/Verify Message",
                    "Or press Ctrl+Shift+S (Windows/Linux)",
                    "Or press Cmd+Shift+S (Mac)",
                    "Click 'Load Transaction'"
                ]
            },
            {
                number: 4,
                title: "Import Your Transaction",
                description: "Paste the transaction from your DeFi app",
                details: [
                    "Copy the transaction hex from above",
                    "Paste it in the 'Raw Transaction' field",
                    "Click 'Load'",
                    "Review transaction details"
                ],
                tips: [
                    "Double-check the transaction hex",
                    "Verify all inputs and outputs"
                ]
            },
            {
                number: 5,
                title: "Review Transaction Details",
                description: "Carefully verify all transaction information",
                details: [
                    "Check that inputs are from your addresses",
                    "Verify the HTLC address is correct",
                    "Confirm the amounts and fees",
                    "Check the time lock duration"
                ],
                warnings: [
                    "Never sign if you don't understand the transaction",
                    "Verify the HTLC address matches your swap"
                ]
            },
            {
                number: 6,
                title: "Sign the Transaction",
                description: "Sign with your wallet password",
                details: [
                    "Enter your wallet password if encrypted",
                    "Click 'Sign'",
                    "Review the signed transaction",
                    "Copy the signed transaction hex"
                ]
            },
            {
                number: 7,
                title: "Broadcast the Transaction",
                description: "Send the signed transaction to the network",
                details: [
                    "Click 'Broadcast' in Electrum",
                    "Or copy signed hex and use block explorer",
                    "Wait for confirmation",
                    "Monitor the HTLC address"
                ],
                tips: [
                    "Keep the signed transaction as backup",
                    "Monitor for secret reveal"
                ]
            }
        ]
    },
    bitcoinCore: {
        name: "Bitcoin Core",
        description: "Reference implementation with maximum security",
        pros: [
            "Full node validation",
            "Maximum security",
            "Complete control",
            "No trust in third parties",
            "Advanced scripting support"
        ],
        cons: [
            "High resource usage",
            "Long sync time",
            "Complex setup",
            "Command line interface"
        ],
        difficulty: "Hard",
        security: "High",
        cost: "Free",
        downloadUrl: "https://bitcoincore.org/",
        steps: [
            {
                number: 1,
                title: "Download and Install Bitcoin Core",
                description: "Get the reference Bitcoin implementation",
                details: [
                    "Visit https://bitcoincore.org/",
                    "Download the latest version",
                    "Verify the download signature",
                    "Install and let it sync"
                ],
                warnings: [
                    "Initial sync can take several days",
                    "Requires significant disk space"
                ]
            },
            {
                number: 2,
                title: "Configure for Testnet",
                description: "Set up testnet for safe testing",
                details: [
                    "Add 'testnet=1' to bitcoin.conf",
                    "Restart Bitcoin Core",
                    "Let testnet sync",
                    "Get testnet coins from faucet"
                ]
            },
            {
                number: 3,
                title: "Access Debug Console",
                description: "Open the command line interface",
                details: [
                    "Go to Help → Debug Window",
                    "Click 'Console' tab",
                    "This is where you'll enter commands",
                    "Commands are case-sensitive"
                ]
            },
            {
                number: 4,
                title: "Decode the Transaction",
                description: "Understand what the transaction does",
                details: [
                    "Copy the transaction hex from above",
                    "Enter: decoderawtransaction \"[hex]\"",
                    "Review the decoded output",
                    "Verify inputs, outputs, and amounts"
                ],
                tips: [
                    "Always decode before signing",
                    "Check that inputs belong to you"
                ]
            },
            {
                number: 5,
                title: "Sign the Transaction",
                description: "Sign with your wallet",
                details: [
                    "Enter: signrawtransactionwithwallet \"[hex]\"",
                    "Check for \"complete\": true",
                    "If incomplete, check error messages",
                    "Copy the signed transaction hex"
                ],
                warnings: [
                    "Ensure you have sufficient funds",
                    "Verify you own the input addresses"
                ]
            },
            {
                number: 6,
                title: "Broadcast the Transaction",
                description: "Send to the Bitcoin network",
                details: [
                    "Enter: sendrawtransaction \"[signed_hex]\"",
                    "Note the returned transaction ID",
                    "Use gettransaction [txid] to monitor",
                    "Wait for confirmations"
                ]
            }
        ]
    },
    trezor: {
        name: "Trezor",
        description: "Hardware wallet with maximum security",
        pros: [
            "Hardware security",
            "Private keys never leave device",
            "User-friendly interface",
            "Multi-currency support",
            "Recovery seed backup"
        ],
        cons: [
            "Hardware cost ($59-169)",
            "Requires physical device",
            "Limited advanced features"
        ],
        difficulty: "Medium",
        security: "High",
        cost: "$59-169",
        downloadUrl: "https://suite.trezor.io/",
        steps: [
            {
                number: 1,
                title: "Purchase and Setup Trezor",
                description: "Get your hardware wallet",
                details: [
                    "Buy from https://shop.trezor.io/",
                    "Connect to computer",
                    "Follow setup wizard",
                    "Write down recovery seed",
                    "Set PIN code"
                ],
                warnings: [
                    "Only buy from official store",
                    "Never share your recovery seed"
                ]
            },
            {
                number: 2,
                title: "Install Trezor Suite",
                description: "Get the official Trezor software",
                details: [
                    "Download from https://suite.trezor.io/",
                    "Install Trezor Suite",
                    "Connect your Trezor device",
                    "Enable Expert mode in settings"
                ]
            },
            {
                number: 3,
                title: "Access Advanced Features",
                description: "Enable advanced transaction signing",
                details: [
                    "Go to Settings → Advanced",
                    "Enable 'Expert mode'",
                    "Enable 'Custom scripts' if available",
                    "Connect your Trezor device"
                ]
            },
            {
                number: 4,
                title: "Import Transaction",
                description: "Load the transaction into Trezor Suite",
                details: [
                    "Go to Send tab",
                    "Click 'Advanced' or 'Raw transaction'",
                    "Paste the transaction hex from above",
                    "Review transaction details"
                ]
            },
            {
                number: 5,
                title: "Review on Device",
                description: "Verify transaction on Trezor screen",
                details: [
                    "Check input addresses (should be yours)",
                    "Verify output addresses (HTLC + change)",
                    "Confirm amounts and fees",
                    "Press button to confirm"
                ],
                warnings: [
                    "Always verify on the device screen",
                    "Never trust only the computer display"
                ]
            },
            {
                number: 6,
                title: "Sign and Broadcast",
                description: "Complete the transaction",
                details: [
                    "Enter PIN if prompted",
                    "Confirm on device",
                    "Signed transaction appears in Suite",
                    "Click 'Send' or 'Broadcast'"
                ]
            }
        ]
    }
}

export function BitcoinWalletGuide({ transactionHex, onWalletSelected }: WalletGuideProps) {
    const [selectedWallet, setSelectedWallet] = useState<string>("electrum")
    const [copiedHex, setCopiedHex] = useState(false)

    const copyTransactionHex = async () => {
        try {
            await navigator.clipboard.writeText(transactionHex)
            setCopiedHex(true)
            toast.success("Transaction hex copied to clipboard")
            setTimeout(() => setCopiedHex(false), 2000)
        } catch (error) {
            toast.error("Failed to copy transaction hex")
        }
    }

    const handleWalletSelect = (wallet: string) => {
        setSelectedWallet(wallet)
        onWalletSelected?.(wallet)
    }

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'Easy': return 'bg-green-500'
            case 'Medium': return 'bg-yellow-500'
            case 'Hard': return 'bg-red-500'
            default: return 'bg-gray-500'
        }
    }

    const getSecurityColor = (security: string) => {
        switch (security) {
            case 'High': return 'bg-green-500'
            case 'Medium': return 'bg-yellow-500'
            case 'Low': return 'bg-red-500'
            default: return 'bg-gray-500'
        }
    }

    const currentWallet = walletGuides[selectedWallet]

    return (
        <div className="space-y-6">
            {/* Transaction Hex Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Copy className="w-5 h-5" />
                        <span>Transaction Hex</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Copy this transaction hex and follow the wallet guide below to sign it:
                        </p>
                        <div className="bg-muted rounded-lg p-3">
                            <div className="flex items-center justify-between">
                                <code className="text-xs break-all font-mono">
                                    {transactionHex.slice(0, 64)}...
                                </code>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={copyTransactionHex}
                                    className="ml-2 flex-shrink-0"
                                >
                                    {copiedHex ? (
                                        <Check className="w-4 h-4" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Wallet Selection */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Shield className="w-5 h-5" />
                        <span>Choose Your Bitcoin Wallet</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs value={selectedWallet} onValueChange={handleWalletSelect}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="electrum" className="flex items-center space-x-2">
                                <Star className="w-4 h-4" />
                                <span>Electrum</span>
                            </TabsTrigger>
                            <TabsTrigger value="bitcoinCore" className="flex items-center space-x-2">
                                <Zap className="w-4 h-4" />
                                <span>Bitcoin Core</span>
                            </TabsTrigger>
                            <TabsTrigger value="trezor" className="flex items-center space-x-2">
                                <Shield className="w-4 h-4" />
                                <span>Trezor</span>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value={selectedWallet} className="mt-6">
                            <div className="space-y-6">
                                {/* Wallet Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="font-semibold text-lg">{currentWallet.name}</h3>
                                            <p className="text-sm text-muted-foreground">{currentWallet.description}</p>
                                        </div>

                                        <div className="flex space-x-2">
                                            <Badge className={getDifficultyColor(currentWallet.difficulty)}>
                                                {currentWallet.difficulty}
                                            </Badge>
                                            <Badge className={getSecurityColor(currentWallet.security)}>
                                                {currentWallet.security} Security
                                            </Badge>
                                            <Badge variant="outline">
                                                {currentWallet.cost}
                                            </Badge>
                                        </div>

                                        <Button
                                            onClick={() => window.open(currentWallet.downloadUrl, '_blank')}
                                            className="w-full"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download {currentWallet.name}
                                        </Button>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-medium text-sm mb-2">Pros</h4>
                                            <ul className="space-y-1">
                                                {currentWallet.pros.map((pro, index) => (
                                                    <li key={index} className="flex items-center space-x-2 text-sm">
                                                        <Check className="w-3 h-3 text-green-500" />
                                                        <span>{pro}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div>
                                            <h4 className="font-medium text-sm mb-2">Cons</h4>
                                            <ul className="space-y-1">
                                                {currentWallet.cons.map((con, index) => (
                                                    <li key={index} className="flex items-center space-x-2 text-sm">
                                                        <AlertTriangle className="w-3 h-3 text-yellow-500" />
                                                        <span>{con}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Step-by-Step Guide */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg">Step-by-Step Guide</h3>
                                    <div className="space-y-4">
                                        {currentWallet.steps.map((step) => (
                                            <Card key={step.number}>
                                                <CardHeader>
                                                    <CardTitle className="flex items-center space-x-2">
                                                        <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                                                            {step.number}
                                                        </div>
                                                        <span className="text-base">{step.title}</span>
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-3">
                                                    <p className="text-sm text-muted-foreground">{step.description}</p>

                                                    <div>
                                                        <h4 className="font-medium text-sm mb-2">Steps:</h4>
                                                        <ul className="space-y-1">
                                                            {step.details.map((detail, index) => (
                                                                <li key={index} className="flex items-start space-x-2 text-sm">
                                                                    <ChevronRight className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                                                                    <span>{detail}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    {step.tips && step.tips.length > 0 && (
                                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                            <h4 className="font-medium text-sm text-blue-800 mb-2">Tips:</h4>
                                                            <ul className="space-y-1">
                                                                {step.tips.map((tip, index) => (
                                                                    <li key={index} className="flex items-start space-x-2 text-sm text-blue-700">
                                                                        <Info className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                                                                        <span>{tip}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {step.warnings && step.warnings.length > 0 && (
                                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                                            <h4 className="font-medium text-sm text-yellow-800 mb-2">Warnings:</h4>
                                                            <ul className="space-y-1">
                                                                {step.warnings.map((warning, index) => (
                                                                    <li key={index} className="flex items-start space-x-2 text-sm text-yellow-700">
                                                                        <AlertTriangle className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                                                                        <span>{warning}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>

                                {/* Additional Resources */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Additional Resources</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => window.open('https://testnet-faucet.mempool.co/', '_blank')}
                                                className="w-full justify-start"
                                            >
                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                Get Testnet Bitcoin (for testing)
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => window.open('https://blockstream.info/testnet/', '_blank')}
                                                className="w-full justify-start"
                                            >
                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                Testnet Block Explorer
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => window.open('https://blockstream.info/testnet/tx/publish', '_blank')}
                                                className="w-full justify-start"
                                            >
                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                Broadcast Transaction (if needed)
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
} 