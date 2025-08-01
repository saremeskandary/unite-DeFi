"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, DollarSign, Activity, BarChart3, PieChart } from "lucide-react"

interface PortfolioData {
  totalValue: number
  totalSwaps: number
  totalVolume: number
  profitLoss: number
  profitLossPercentage: number
  topTokens: Array<{
    symbol: string
    amount: string
    value: number
    change24h: number
  }>
  recentActivity: Array<{
    type: "swap" | "receive"
    fromToken: string
    toToken: string
    amount: string
    value: number
    date: string
  }>
}

const MOCK_PORTFOLIO: PortfolioData = {
  totalValue: 12450.75,
  totalSwaps: 23,
  totalVolume: 45230.5,
  profitLoss: 1250.3,
  profitLossPercentage: 11.2,
  topTokens: [
    { symbol: "BTC", amount: "0.15432", value: 6680.5, change24h: 2.4 },
    { symbol: "USDC", amount: "3250.00", value: 3250.0, change24h: 0.1 },
    { symbol: "WETH", amount: "1.2456", value: 2520.25, change24h: -1.8 },
  ],
  recentActivity: [
    {
      type: "swap",
      fromToken: "USDC",
      toToken: "BTC",
      amount: "1000.00",
      value: 1000.0,
      date: "2024-01-15T10:30:00Z",
    },
    {
      type: "receive",
      fromToken: "WETH",
      toToken: "BTC",
      amount: "0.5",
      value: 1250.0,
      date: "2024-01-14T16:20:00Z",
    },
    {
      type: "swap",
      fromToken: "DAI",
      toToken: "BTC",
      amount: "750.00",
      value: 750.0,
      date: "2024-01-13T09:15:00Z",
    },
  ],
}

export default function PortfolioPage() {
  const [portfolio] = useState<PortfolioData>(MOCK_PORTFOLIO)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Portfolio</h1>
            <p className="text-slate-400">Track your cross-chain swap performance and holdings</p>
          </div>

          {/* Portfolio Overview */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Total Value</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(portfolio.totalValue)}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Total Swaps</p>
                    <p className="text-2xl font-bold text-white">{portfolio.totalSwaps}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Total Volume</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(portfolio.totalVolume)}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">P&L</p>
                    <p
                      className={`text-2xl font-bold ${portfolio.profitLoss >= 0 ? "text-green-400" : "text-red-400"}`}
                    >
                      {formatCurrency(portfolio.profitLoss)}
                    </p>
                    <div className="flex items-center mt-1">
                      {portfolio.profitLoss >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-400 mr-1" />
                      )}
                      <span className={`text-sm ${portfolio.profitLoss >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {portfolio.profitLossPercentage > 0 ? "+" : ""}
                        {portfolio.profitLossPercentage}%
                      </span>
                    </div>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${portfolio.profitLoss >= 0 ? "bg-green-500/20" : "bg-red-500/20"
                      }`}
                  >
                    {portfolio.profitLoss >= 0 ? (
                      <TrendingUp className="w-6 h-6 text-green-400" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-red-400" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Top Holdings */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <PieChart className="w-5 h-5 mr-2" />
                  Top Holdings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {portfolio.topTokens.map((token, index) => (
                  <div key={token.symbol} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                        {token.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-white font-medium">{token.symbol}</div>
                        <div className="text-slate-400 text-sm">{token.amount}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">{formatCurrency(token.value)}</div>
                      <div
                        className={`text-sm flex items-center ${token.change24h >= 0 ? "text-green-400" : "text-red-400"
                          }`}
                      >
                        {token.change24h >= 0 ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        {token.change24h > 0 ? "+" : ""}
                        {token.change24h}%
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {portfolio.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.type === "swap" ? "bg-blue-500/20" : "bg-green-500/20"
                          }`}
                      >
                        {activity.type === "swap" ? (
                          <Activity
                            className={`w-5 h-5 ${activity.type === "swap" ? "text-blue-400" : "text-green-400"}`}
                          />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-green-400 rotate-180" />
                        )}
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          {activity.fromToken} → {activity.toToken}
                        </div>
                        <div className="text-slate-400 text-sm">{formatDate(activity.date)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">
                        {activity.amount} {activity.fromToken}
                      </div>
                      <div className="text-slate-400 text-sm">{formatCurrency(activity.value)}</div>
                    </div>
                  </div>
                ))}

                <Button variant="ghost" className="w-full text-blue-400 hover:text-blue-300">
                  View All Activity
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
