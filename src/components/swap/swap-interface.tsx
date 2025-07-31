"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { TokenSelector } from "./token-selector"
import { BitcoinAddressInput } from "./bitcoin-address-input"
import { OrderSummary } from "./order-summary"
import { ArrowUpDown, Settings, Info } from "lucide-react"
import { enhancedWallet } from "@/lib/enhanced-wallet"
import { toast } from "sonner"

interface SwapInterfaceProps {
  onOrderCreated: (orderId: string) => void
}

interface Token {
  symbol: string
  name: string
  balance: string
  price?: number
  value?: number
}

interface SwapQuote {
  fromToken: string
  toToken: string
  fromAmount: string
  toAmount: string
  rate: number
  priceImpact: number
  gasEstimate: string
  gasCost: number
  source: string
}

interface NetworkFee {
  gasPrice: number
  gasLimit: number
  totalFee: number
  feeInUSD: number
  priority: 'slow' | 'standard' | 'fast'
  estimatedTime: string
}

export function SwapInterface({ onOrderCreated }: SwapInterfaceProps) {
  const [fromToken, setFromToken] = useState<Token>({ symbol: "USDC", name: "USD Coin", balance: "0.00" })
  const [toToken, setToToken] = useState<Token>({ symbol: "BTC", name: "Bitcoin", balance: "0.00" })
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [bitcoinAddress, setBitcoinAddress] = useState("")
  const [slippage, setSlippage] = useState("0.5")
  const [isLoading, setIsLoading] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isQuoteLoading, setIsQuoteLoading] = useState(false)
  const [currentQuote, setCurrentQuote] = useState<SwapQuote | null>(null)
  const [networkFees, setNetworkFees] = useState<{ slow: NetworkFee; standard: NetworkFee; fast: NetworkFee } | null>(null)
  const [selectedFeePriority, setSelectedFeePriority] = useState<'slow' | 'standard' | 'fast'>('standard')
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)

  // Initialize wallet connection and load token balances
  useEffect(() => {
    const initializeWallet = async () => {
      if (enhancedWallet.isConnected()) {
        setWalletConnected(true)
        setWalletAddress(enhancedWallet.getCurrentAddress())
        await loadTokenBalances()
      }
    }

    initializeWallet()

    // Listen for wallet changes
    enhancedWallet.onAccountChange((address) => {
      setWalletAddress(address)
      loadTokenBalances()
    })

    enhancedWallet.onChainChange((chainId) => {
      loadTokenBalances()
    })
  }, [])

  // Load token balances from wallet
  const loadTokenBalances = useCallback(async () => {
    if (!enhancedWallet.isConnected()) return

    try {
      const walletInfo = await enhancedWallet.getWalletInfo()
      if (!walletInfo) return

      // Update from token balance
      const fromTokenBalance = walletInfo.tokens.find(t => t.symbol === fromToken.symbol)
      if (fromTokenBalance) {
        setFromToken(prev => ({
          ...prev,
          balance: fromTokenBalance.balance,
          price: fromTokenBalance.price,
          value: fromTokenBalance.value
        }))
      } else if (fromToken.symbol === 'ETH') {
        setFromToken(prev => ({
          ...prev,
          balance: walletInfo.nativeBalanceFormatted
        }))
      }

      // Update to token balance
      const toTokenBalance = walletInfo.tokens.find(t => t.symbol === toToken.symbol)
      if (toTokenBalance) {
        setToToken(prev => ({
          ...prev,
          balance: toTokenBalance.balance,
          price: toTokenBalance.price,
          value: toTokenBalance.value
        }))
      } else if (toToken.symbol === 'ETH') {
        setToToken(prev => ({
          ...prev,
          balance: walletInfo.nativeBalanceFormatted
        }))
      }
    } catch (error) {
      console.error('Error loading token balances:', error)
    }
  }, [fromToken.symbol, toToken.symbol])

  // Get swap quote when amount changes
  const getSwapQuote = useCallback(async (amount: string) => {
    if (!amount || parseFloat(amount) <= 0 || !walletAddress) {
      setToAmount("")
      setCurrentQuote(null)
      return
    }

    setIsQuoteLoading(true)
    try {
      const response = await fetch(
        `/api/swap/quote?fromToken=${fromToken.symbol}&toToken=${toToken.symbol}&amount=${amount}&fromAddress=${walletAddress}`
      )

      if (response.ok) {
        const data = await response.json()
        setCurrentQuote(data.quote)
        setToAmount(data.quote.toAmount)
        setNetworkFees(data.fees)
      } else {
        console.error('Failed to get swap quote')
        setToAmount("")
        setCurrentQuote(null)
      }
    } catch (error) {
      console.error('Error getting swap quote:', error)
      setToAmount("")
      setCurrentQuote(null)
    } finally {
      setIsQuoteLoading(false)
    }
  }, [fromToken.symbol, toToken.symbol, walletAddress])

  const handleSwapTokens = () => {
    const temp = fromToken
    setFromToken(toToken)
    setToToken(temp)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
    // Clear current quote when swapping tokens
    setCurrentQuote(null)
  }

  const handleAmountChange = (value: string) => {
    setFromAmount(value)
    // Get real-time quote
    getSwapQuote(value)
  }

  const handleMaxAmount = () => {
    const maxBalance = parseFloat(fromToken.balance.replace(/,/g, ""))
    setFromAmount(maxBalance.toString())
    getSwapQuote(maxBalance.toString())
  }

  const handleSlippageChange = (value: number[]) => {
    setSlippage(value[0].toString())
  }

  const handleCreateOrder = async () => {
    if (!walletConnected) {
      toast.error("Please connect your wallet first")
      return
    }

    if (!currentQuote) {
      toast.error("Please enter a valid amount to get a quote")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/swap/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromToken: fromToken.symbol,
          toToken: toToken.symbol,
          fromAmount: fromAmount,
          toAddress: bitcoinAddress || walletAddress,
          slippage: parseFloat(slippage),
          feePriority: selectedFeePriority
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Swap order created successfully!")
        onOrderCreated(result.order.id)
      } else {
        toast.error(result.error || "Failed to create swap order")
      }
    } catch (error) {
      console.error('Error creating swap order:', error)
      toast.error("Failed to create swap order")
    } finally {
      setIsLoading(false)
    }
  }

  const isValidSwap = fromAmount && toAmount && (bitcoinAddress || walletAddress) &&
    Number.parseFloat(fromAmount) > 0 && walletConnected && currentQuote

  return (
    <Card className="bg-card/50 border-border backdrop-blur-sm w-full max-w-md mx-auto">
      <CardHeader className="pb-4 px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground text-lg sm:text-xl">Swap</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 text-xs sm:text-sm">
              Best Rate
            </Badge>
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground p-2">
                  <Settings className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border w-[90vw] max-w-sm mx-auto">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Swap Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Slippage Tolerance</Label>
                    <div className="space-y-2">
                      <Slider
                        value={[parseFloat(slippage)]}
                        onValueChange={handleSlippageChange}
                        max={5}
                        min={0.1}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">0.1%</span>
                        <span className="text-foreground font-medium">{slippage}%</span>
                        <span className="text-muted-foreground">5%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSlippage("0.5")}
                      className="flex-1 border-border text-muted-foreground hover:bg-accent text-xs"
                    >
                      0.5%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSlippage("1.0")}
                      className="flex-1 border-border text-muted-foreground hover:bg-accent text-xs"
                    >
                      1.0%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSlippage("2.0")}
                      className="flex-1 border-border text-muted-foreground hover:bg-accent text-xs"
                    >
                      2.0%
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-4 sm:px-6">
        {/* From Token */}
        <div className="space-y-2">
          <Label className="text-muted-foreground text-sm">From</Label>
          <div className="relative">
            <Input
              type="number"
              placeholder="0.00"
              value={fromAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="bg-muted/50 border-border text-foreground text-lg sm:text-xl h-14 sm:h-16 pr-28 sm:pr-32"
            />
            <div className="absolute right-2 top-2">
              <TokenSelector token={fromToken} onSelect={setFromToken} type="from" />
            </div>
          </div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">
              Balance: {fromToken.balance} {fromToken.symbol}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80 h-auto p-0 text-xs"
              onClick={handleMaxAmount}
            >
              Max
            </Button>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleSwapTokens}
            variant="ghost"
            size="sm"
            className="rounded-full bg-muted hover:bg-accent text-foreground p-2"
          >
            <ArrowUpDown className="w-4 h-4" />
          </Button>
        </div>

        {/* To Token */}
        <div className="space-y-2">
          <Label className="text-muted-foreground text-sm">To</Label>
          <div className="relative">
            <Input
              type="number"
              placeholder="0.00"
              value={isQuoteLoading ? "Loading..." : toAmount}
              readOnly
              className="bg-muted/50 border-border text-foreground text-lg sm:text-xl h-14 sm:h-16 pr-28 sm:pr-32"
            />
            <div className="absolute right-2 top-2">
              <TokenSelector token={toToken} onSelect={setToToken} type="to" />
            </div>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">
            Balance: {toToken.balance} {toToken.symbol}
          </div>
        </div>

        {/* Bitcoin Address Input */}
        {toToken.symbol === "BTC" && <BitcoinAddressInput value={bitcoinAddress} onChange={setBitcoinAddress} />}

        {/* Price Info */}
        {currentQuote && (
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">Rate</span>
              <span className="text-foreground text-right">
                1 {fromToken.symbol} = {currentQuote.rate.toFixed(8)} {toToken.symbol}
              </span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">Price Impact</span>
              <span className={`text-right ${Math.abs(currentQuote.priceImpact) > 1 ? 'text-red-500' : 'text-foreground'}`}>
                {currentQuote.priceImpact.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">Slippage Tolerance</span>
              <span className="text-foreground">{slippage}%</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">Network Fee</span>
              <span className="text-foreground">
                ~${networkFees?.[selectedFeePriority]?.feeInUSD?.toFixed(2) || '2.50'}
              </span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">Source</span>
              <span className="text-foreground">{currentQuote.source}</span>
            </div>
          </div>
        )}

        {/* Order Summary */}
        {isValidSwap && (
          <OrderSummary
            fromToken={fromToken}
            toToken={toToken}
            fromAmount={fromAmount}
            toAmount={toAmount}
            bitcoinAddress={bitcoinAddress}
          />
        )}

        {/* Swap Button */}
        <Button
          onClick={handleCreateOrder}
          disabled={!isValidSwap || isLoading}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm sm:text-base"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              <span className="text-xs sm:text-sm">Creating Order...</span>
            </div>
          ) : !walletConnected ? (
            "Connect Wallet to Swap"
          ) : (
            "Create Swap Order"
          )}
        </Button>

        {/* Info */}
        <div className="flex items-start space-x-2 text-xs text-muted-foreground bg-muted/20 rounded-lg p-3">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p className="text-xs leading-relaxed">
            This swap uses atomic swap technology to ensure trustless execution. Your funds remain secure throughout the
            process.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
