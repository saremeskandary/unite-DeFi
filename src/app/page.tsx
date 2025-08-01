"use client"

import { useState } from "react"
import { SwapInterface } from "@/components/swap/swap-interface"
import { OrderStatusPanel } from "@/components/orders/order-status-panel"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const [activeOrder, setActiveOrder] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">Cross-Chain DeFi Swaps</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Seamlessly swap between TON, TRON, Bitcoin and Ethereum tokens using atomic swaps powered by 1inch Fusion+
            </p>
            {/* <div className="mt-6 flex justify-center gap-4">
              <Link href="/1inch-style-swap-demo">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Try 1inch-Style Interface
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div> */}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Main Swap Interface */}
            <div className="space-y-6">
              <SwapInterface onOrderCreated={setActiveOrder} />
            </div>

            {/* Order Status Panel */}
            <div className="space-y-6">
              <OrderStatusPanel orderId={activeOrder} />

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-6">
                  <div className="text-2xl font-bold text-foreground">$2.4M</div>
                  <div className="text-sm text-muted-foreground">24h Volume</div>
                </Card>
                <Card className="p-6">
                  <div className="text-2xl font-bold text-foreground">1,247</div>
                  <div className="text-sm text-muted-foreground">Total Swaps</div>
                </Card>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Trustless</h3>
              <p className="text-muted-foreground">Atomic swaps ensure your funds are always secure without intermediaries</p>
            </Card>

            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Fast</h3>
              <p className="text-muted-foreground">Complete swaps in minutes with optimized routing and execution</p>
            </Card>

            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Best Rates</h3>
              <p className="text-muted-foreground">Powered by 1inch aggregation for optimal pricing and minimal slippage</p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
