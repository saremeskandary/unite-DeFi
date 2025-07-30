"use client"

import { useState } from "react"
import { SwapInterface } from "@/components/swap/swap-interface"
import { OrderStatusPanel } from "@/components/orders/order-status-panel"
import { Header } from "@/components/layout/header"
import { Card } from "@/components/ui/card"

export default function HomePage() {
  const [activeOrder, setActiveOrder] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">Cross-Chain Bitcoin Swaps</h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Seamlessly swap between Bitcoin and ERC20 tokens using atomic swaps powered by 1inch Fusion+
            </p>
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
                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <div className="text-2xl font-bold text-white">$2.4M</div>
                  <div className="text-sm text-slate-400">24h Volume</div>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <div className="text-2xl font-bold text-white">1,247</div>
                  <div className="text-sm text-slate-400">Total Swaps</div>
                </Card>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <Card className="bg-slate-800/30 border-slate-700 p-6 text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Trustless</h3>
              <p className="text-slate-400">Atomic swaps ensure your funds are always secure without intermediaries</p>
            </Card>

            <Card className="bg-slate-800/30 border-slate-700 p-6 text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Fast</h3>
              <p className="text-slate-400">Complete swaps in minutes with optimized routing and execution</p>
            </Card>

            <Card className="bg-slate-800/30 border-slate-700 p-6 text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Best Rates</h3>
              <p className="text-slate-400">Powered by 1inch aggregation for optimal pricing and minimal slippage</p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
