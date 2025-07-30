"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-xl">Swap</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              Best Rate
            </Badge>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* From Token */}
        <div className="space-y-2">
          <Label className="text-slate-300">From</Label>
          <div className="relative">
            <Input
              type="number"
              placeholder="0.00"
              value={fromAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white text-xl h-16 pr-32"
            />
            <div className="absolute right-2 top-2">
              <TokenSelector token={fromToken} onSelect={setFromToken} type="from" />
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">
              Balance: {fromToken.balance} {fromToken.symbol}
            </span>
            <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 h-auto p-0">
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
            className="rounded-full bg-slate-700 hover:bg-slate-600 text-white"
          >
            <ArrowUpDown className="w-4 h-4" />
          </Button>
        </div>

        {/* To Token */}
        <div className="space-y-2">
          <Label className="text-slate-300">To</Label>
          <div className="relative">
            <Input
              type="number"
              placeholder="0.00"
              value={toAmount}
              readOnly
              className="bg-slate-700/50 border-slate-600 text-white text-xl h-16 pr-32"
            />
            <div className="absolute right-2 top-2">
              <TokenSelector token={toToken} onSelect={setToToken} type="to" />
            </div>
          </div>
          <div className="text-sm text-slate-400">
            Balance: {toToken.balance} {toToken.symbol}
          </div>
        </div>

        {/* Bitcoin Address Input */}
        {toToken.symbol === "BTC" && <BitcoinAddressInput value={bitcoinAddress} onChange={setBitcoinAddress} />}

        {/* Price Info */}
        {fromAmount && toAmount && (
          <div className="bg-slate-700/30 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Rate</span>
              <span className="text-white">
                1 {fromToken.symbol} = 0.000023 {toToken.symbol}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Slippage Tolerance</span>
              <span className="text-white">{slippage}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Network Fee</span>
              <span className="text-white">~$2.50</span>
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
          className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Creating Order...</span>
            </div>
          ) : (
            "Create Swap Order"
          )}
        </Button>

        {/* Info */}
        <div className="flex items-start space-x-2 text-xs text-slate-400 bg-slate-700/20 rounded-lg p-3">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            This swap uses atomic swap technology to ensure trustless execution. Your funds remain secure throughout the
            process.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
