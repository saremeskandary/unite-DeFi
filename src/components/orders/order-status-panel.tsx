"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Clock, CheckCircle, AlertCircle, ExternalLink, Copy, RefreshCw } from "lucide-react"

interface OrderStatusPanelProps {
  orderId: string | null
}

interface OrderStatus {
  id: string
  status: "pending" | "funding" | "executing" | "completed" | "failed"
  progress: number
  fromToken: string
  toToken: string
  fromAmount: string
  toAmount: string
  bitcoinAddress: string
  createdAt: string
  estimatedCompletion: string
  txHashes: {
    ethereum?: string
    bitcoin?: string
  }
}

const MOCK_ORDER: OrderStatus = {
  id: "order_1234567890",
  status: "executing",
  progress: 65,
  fromToken: "USDC",
  toToken: "BTC",
  fromAmount: "1000.00",
  toAmount: "0.02314",
  bitcoinAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  createdAt: "2024-01-15T10:30:00Z",
  estimatedCompletion: "2024-01-15T11:00:00Z",
  txHashes: {
    ethereum: "0x742d35cc6634c0532925a3b8d4c9db96590b5b8c742d35cc6634c0532925a3b8",
    bitcoin: undefined,
  },
}

export function OrderStatusPanel({ orderId }: OrderStatusPanelProps) {
  const [order, setOrder] = useState<OrderStatus | null>(null)
  const [timeRemaining, setTimeRemaining] = useState("")

  useEffect(() => {
    if (orderId) {
      // Simulate loading order data
      setTimeout(() => {
        setOrder({ ...MOCK_ORDER, id: orderId })
      }, 1000)
    }
  }, [orderId])

  useEffect(() => {
    if (order) {
      const updateTimer = () => {
        const now = new Date()
        const completion = new Date(order.estimatedCompletion)
        const diff = completion.getTime() - now.getTime()

        if (diff > 0) {
          const minutes = Math.floor(diff / 60000)
          const seconds = Math.floor((diff % 60000) / 1000)
          setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`)
        } else {
          setTimeRemaining("Completing...")
        }
      }

      updateTimer()
      const interval = setInterval(updateTimer, 1000)
      return () => clearInterval(interval)
    }
  }, [order])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "funding":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "executing":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "failed":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />
      case "funding":
        return <RefreshCw className="w-4 h-4 animate-spin" />
      case "executing":
        return <RefreshCw className="w-4 h-4 animate-spin" />
      case "completed":
        return <CheckCircle className="w-4 h-4" />
      case "failed":
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (!orderId) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Active Orders</h3>
          <p className="text-slate-400">Create a swap order to track its progress here</p>
        </CardContent>
      </Card>
    )
  }

  if (!order) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-8 text-center">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading order details...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg">Order Status</CardTitle>
          <Badge variant="secondary" className={getStatusColor(order.status)}>
            {getStatusIcon(order.status)}
            <span className="ml-1 capitalize">{order.status}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Progress</span>
            <span className="text-white">{order.progress}%</span>
          </div>
          <Progress value={order.progress} className="h-2" />
          <div className="text-center text-sm text-slate-400">Estimated completion: {timeRemaining}</div>
        </div>

        {/* Order Details */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-slate-400">Order ID</span>
            <div className="flex items-center space-x-2">
              <span className="text-white font-mono text-sm">{order.id.slice(0, 12)}...</span>
              <Button
                onClick={() => copyToClipboard(order.id)}
                variant="ghost"
                size="sm"
                className="h-auto p-1 text-slate-400 hover:text-white"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Swap</span>
            <span className="text-white">
              {order.fromAmount} {order.fromToken} → {order.toAmount} {order.toToken}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Destination</span>
            <div className="flex items-center space-x-2">
              <span className="text-white font-mono text-sm">
                {order.bitcoinAddress.slice(0, 8)}...{order.bitcoinAddress.slice(-8)}
              </span>
              <Button
                onClick={() => copyToClipboard(order.bitcoinAddress)}
                variant="ghost"
                size="sm"
                className="h-auto p-1 text-slate-400 hover:text-white"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Transaction Hashes */}
        <div className="space-y-3">
          <h4 className="text-white font-medium">Transactions</h4>

          {order.txHashes.ethereum && (
            <div className="flex items-center justify-between bg-slate-700/30 rounded-lg p-3">
              <div>
                <div className="text-sm text-white font-medium">Ethereum</div>
                <div className="text-xs text-slate-400 font-mono">
                  {order.txHashes.ethereum.slice(0, 10)}...{order.txHashes.ethereum.slice(-10)}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-400 hover:text-blue-300"
                onClick={() => window.open(`https://etherscan.io/tx/${order.txHashes.ethereum}`, "_blank")}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          )}

          {order.txHashes.bitcoin ? (
            <div className="flex items-center justify-between bg-slate-700/30 rounded-lg p-3">
              <div>
                <div className="text-sm text-white font-medium">Bitcoin</div>
                <div className="text-xs text-slate-400 font-mono">
                  {order.txHashes.bitcoin.slice(0, 10)}...{order.txHashes.bitcoin.slice(-10)}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-400 hover:text-blue-300"
                onClick={() => window.open(`https://blockstream.info/tx/${order.txHashes.bitcoin}`, "_blank")}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="bg-slate-700/30 rounded-lg p-3">
              <div className="text-sm text-slate-400">Bitcoin transaction pending...</div>
            </div>
          )}
        </div>

        {/* Status Steps */}
        <div className="space-y-3">
          <h4 className="text-white font-medium">Swap Phases</h4>

          <div className="space-y-2">
            {[
              { phase: "Order Created", completed: true },
              { phase: "Ethereum HTLC Funded", completed: true },
              { phase: "Bitcoin HTLC Created", completed: order.progress >= 50 },
              { phase: "Bitcoin HTLC Funded", completed: order.progress >= 75 },
              { phase: "Swap Completed", completed: order.progress >= 100 },
            ].map((step, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${step.completed ? "bg-green-400" : "bg-slate-600"}`} />
                <span className={`text-sm ${step.completed ? "text-white" : "text-slate-400"}`}>{step.phase}</span>
                {step.completed && <CheckCircle className="w-4 h-4 text-green-400" />}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
