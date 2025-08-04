"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Clock, CheckCircle, AlertCircle, ExternalLink, Copy, RefreshCw } from "lucide-react"
import { useRealTimeOrderStatus } from "@/hooks/useOrderStatus"
import { OrderStatus } from "@/lib/services/order-monitor"

interface OrderStatusPanelProps {
  orderId: string | null
}

export function OrderStatusPanel({ orderId }: OrderStatusPanelProps) {
  const [timeRemaining, setTimeRemaining] = useState("")

  // Use real-time order status monitoring
  const {
    orderStatus: order,
    isLoading,
    error,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    refreshStatus,
  } = useRealTimeOrderStatus(orderId, {
    autoStart: true,
    network: 'testnet',
  })

  // Update timer based on real order data
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
        return "bg-primary/20 text-primary border-primary/30"
      case "executing":
        return "bg-primary/20 text-primary border-primary/30"
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "failed":
        return "bg-destructive/20 text-destructive border-destructive/30"
      default:
        return "bg-muted text-muted-foreground border-muted"
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
      <Card className="bg-card/50 border-border">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No Active Orders</h3>
          <p className="text-muted-foreground">Create a swap order to track its progress here</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading || !order) {
    return (
      <Card className="bg-card/50 border-border">
        <CardContent className="p-8 text-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading order details...</p>
          {isMonitoring && (
            <div className="mt-2 text-xs text-primary">
              Real-time monitoring active
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-card/50 border-border">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Order</h3>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <Button onClick={refreshStatus} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground text-lg">Order Status</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className={getStatusColor(order.status)}>
              {getStatusIcon(order.status)}
              <span className="ml-1 capitalize">{order.status}</span>
            </Badge>
            {isMonitoring && (
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-foreground">{order.progress}%</span>
          </div>
          <Progress value={order.progress} className="h-2" />
          <div className="text-center text-sm text-muted-foreground">
            Estimated completion: {timeRemaining}
          </div>
        </div>

        {/* Order Details */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Order ID</span>
            <div className="flex items-center space-x-2">
              <span className="text-foreground font-mono text-sm">{order.id.slice(0, 12)}...</span>
              <Button
                onClick={() => copyToClipboard(order.id)}
                variant="ghost"
                size="sm"
                className="h-auto p-1 text-muted-foreground hover:text-foreground"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Swap</span>
            <span className="text-foreground">
              {order.fromAmount} {order.fromToken} → {order.toAmount} {order.toToken}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Destination</span>
            <div className="flex items-center space-x-2">
              <span className="text-foreground font-mono text-sm">
                {order.bitcoinAddress.slice(0, 8)}...{order.bitcoinAddress.slice(-8)}
              </span>
              <Button
                onClick={() => copyToClipboard(order.bitcoinAddress)}
                variant="ghost"
                size="sm"
                className="h-auto p-1 text-muted-foreground hover:text-foreground"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Transaction Hashes */}
        <div className="space-y-3">
          <h4 className="text-foreground font-medium">Transactions</h4>

          {order.txHashes.ethereum && (
            <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
              <div>
                <div className="text-sm text-foreground font-medium">Ethereum</div>
                <div className="text-xs text-muted-foreground font-mono">
                  {order.txHashes.ethereum.slice(0, 10)}...{order.txHashes.ethereum.slice(-10)}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary/80"
                onClick={() => window.open(`https://etherscan.io/tx/${order.txHashes.ethereum}`, "_blank")}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          )}

          {order.txHashes.bitcoin ? (
            <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
              <div>
                <div className="text-sm text-foreground font-medium">Bitcoin</div>
                <div className="text-xs text-muted-foreground font-mono">
                  {order.txHashes.bitcoin.slice(0, 10)}...{order.txHashes.bitcoin.slice(-10)}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary/80"
                onClick={() => window.open(`https://blockstream.info/tx/${order.txHashes.bitcoin}`, "_blank")}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="text-sm text-muted-foreground">Bitcoin transaction pending...</div>
            </div>
          )}
        </div>

        {/* Status Steps */}
        <div className="space-y-3">
          <h4 className="text-foreground font-medium">Swap Phases</h4>

          <div className="space-y-2">
            {[
              { phase: "Order Created", completed: order.phases.orderCreated },
              { phase: "Ethereum HTLC Funded", completed: order.phases.ethereumHtlcFunded },
              { phase: "Bitcoin HTLC Created", completed: order.phases.bitcoinHtlcCreated },
              { phase: "Bitcoin HTLC Funded", completed: order.phases.bitcoinHtlcFunded },
              { phase: "Swap Completed", completed: order.phases.swapCompleted },
            ].map((step, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${step.completed ? "bg-green-400" : "bg-muted"}`} />
                <span className={`text-sm ${step.completed ? "text-foreground" : "text-muted-foreground"}`}>{step.phase}</span>
                {step.completed && <CheckCircle className="w-4 h-4 text-green-400" />}
              </div>
            ))}
          </div>
        </div>

        {/* Monitoring Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            {isMonitoring ? "Real-time monitoring active" : "Monitoring paused"}
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={refreshStatus}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {isMonitoring ? (
              <Button
                onClick={stopMonitoring}
                variant="outline"
                size="sm"
              >
                Pause
              </Button>
            ) : (
              <Button
                onClick={startMonitoring}
                variant="outline"
                size="sm"
              >
                Resume
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
