"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, Clock, Shield, Zap } from "lucide-react"

interface OrderSummaryProps {
  fromToken: { symbol: string; name: string }
  toToken: { symbol: string; name: string }
  fromAmount: string
  toAmount: string
  bitcoinAddress: string
}

export function OrderSummary({ fromToken, toToken, fromAmount, toAmount, bitcoinAddress }: OrderSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="bg-slate-700/30 border-slate-600">
      <CardContent className="p-4">
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          variant="ghost"
          className="w-full justify-between p-0 h-auto text-white hover:bg-transparent"
        >
          <span className="font-medium">Order Summary</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>

        {isExpanded && (
          <div className="mt-4 space-y-4">
            {/* Swap Details */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">You Pay</span>
                <div className="text-right">
                  <div className="text-white font-medium">
                    {fromAmount} {fromToken.symbol}
                  </div>
                  <div className="text-xs text-slate-400">≈ ${(Number.parseFloat(fromAmount) * 1.0).toFixed(2)}</div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">You Receive</span>
                <div className="text-right">
                  <div className="text-white font-medium">
                    {toAmount} {toToken.symbol}
                  </div>
                  <div className="text-xs text-slate-400">≈ ${(Number.parseFloat(toAmount) * 43250).toFixed(2)}</div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Destination</span>
                <div className="text-right">
                  <div className="text-white font-mono text-sm">
                    {bitcoinAddress.slice(0, 8)}...{bitcoinAddress.slice(-8)}
                  </div>
                  <div className="text-xs text-slate-400">Bitcoin Address</div>
                </div>
              </div>
            </div>

            {/* Fees & Rates */}
            <div className="border-t border-slate-600 pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Exchange Rate</span>
                <span className="text-white">
                  1 {fromToken.symbol} = 0.000023 {toToken.symbol}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Network Fee</span>
                <span className="text-white">~$2.50</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-400">1inch Fee</span>
                <span className="text-white">0.3%</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Slippage Tolerance</span>
                <span className="text-white">0.5%</span>
              </div>
            </div>

            {/* Execution Details */}
            <div className="border-t border-slate-600 pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-400 text-sm">Estimated Time</span>
                </div>
                <span className="text-white text-sm">15-30 minutes</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Security</span>
                </div>
                <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                  Atomic Swap
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Execution</span>
                </div>
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  1inch Fusion+
                </Badge>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <div className="text-yellow-400 text-sm font-medium mb-1">Important Notice</div>
              <div className="text-yellow-300 text-xs">
                Ensure your Bitcoin address is correct. Atomic swaps cannot be reversed once initiated.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
