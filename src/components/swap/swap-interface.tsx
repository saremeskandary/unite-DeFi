"use client"

import { useState } from "react"
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

interface SwapInterfaceProps {
  onOrderCreated: (orderId: string) => void
}

export function SwapInterface({ onOrderCreated }: SwapInterfaceProps) {
  const [fromToken, setFromToken] = useState({ symbol: "USDC", name: "USD Coin", balance: "1,250.00" })
  const [toToken, setToToken] = useState({ symbol: "BTC", name: "Bitcoin", balance: "0.00" })
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [bitcoinAddress, setBitcoinAddress] = useState("")
  const [slippage, setSlippage] = useState("0.5")
  const [isLoading, setIsLoading] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const handleSwapTokens = () => {
    const temp = fromToken
    setFromToken(toToken)
    setToToken(temp)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
  }

  const handleAmountChange = (value: string) => {
    setFromAmount(value)
    // Simulate price calculation
    const rate = 0.000023 // Example BTC/USDC rate
    const calculated = (Number.parseFloat(value) * rate).toFixed(8)
    setToAmount(calculated)
  }

  const handleMaxAmount = () => {
    // Remove commas and convert to number
    const maxBalance = parseFloat(fromToken.balance.replace(/,/g, ""))
    setFromAmount(maxBalance.toString())
    // Trigger price calculation
    const rate = 0.000023
    const calculated = (maxBalance * rate).toFixed(8)
    setToAmount(calculated)
  }

  const handleSlippageChange = (value: number[]) => {
    setSlippage(value[0].toString())
  }

  const handleCreateOrder = async () => {
    setIsLoading(true)
    // Simulate order creation
    setTimeout(() => {
      const orderId = `order_${Date.now()}`
      onOrderCreated(orderId)
      setIsLoading(false)
    }, 2000)
  }

  const isValidSwap = fromAmount && toAmount && bitcoinAddress && Number.parseFloat(fromAmount) > 0

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
              value={toAmount}
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
        {fromAmount && toAmount && (
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">Rate</span>
              <span className="text-foreground text-right">
                1 {fromToken.symbol} = 0.000023 {toToken.symbol}
              </span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">Slippage Tolerance</span>
              <span className="text-foreground">{slippage}%</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">Network Fee</span>
              <span className="text-foreground">~$2.50</span>
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
