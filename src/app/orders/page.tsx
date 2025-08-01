"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ExternalLink, Search, Filter, Clock, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"

interface Order {
  id: string
  status: "pending" | "funding" | "executing" | "completed" | "failed"
  fromToken: string
  toToken: string
  fromAmount: string
  toAmount: string
  createdAt: string
  completedAt?: string
  txHashes: {
    ethereum?: string
    bitcoin?: string
  }
}

const MOCK_ORDERS: Order[] = [
  {
    id: "order_1234567890",
    status: "completed",
    fromToken: "USDC",
    toToken: "BTC",
    fromAmount: "1000.00",
    toAmount: "0.02314",
    createdAt: "2024-01-15T10:30:00Z",
    completedAt: "2024-01-15T10:45:00Z",
    txHashes: {
      ethereum: "0x742d35cc6634c0532925a3b8d4c9db96590b5b8c742d35cc6634c0532925a3b8",
      bitcoin: "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890",
    },
  },
  {
    id: "order_0987654321",
    status: "executing",
    fromToken: "WETH",
    toToken: "BTC",
    fromAmount: "0.5",
    toAmount: "0.01157",
    createdAt: "2024-01-15T09:15:00Z",
    txHashes: {
      ethereum: "0x123456789012345678901234567890123456789012345678901234567890abcd",
    },
  },
  {
    id: "order_1122334455",
    status: "failed",
    fromToken: "DAI",
    toToken: "BTC",
    fromAmount: "500.00",
    toAmount: "0.01157",
    createdAt: "2024-01-14T16:20:00Z",
    txHashes: {},
  },
]

export default function OrdersPage() {
  const [orders] = useState<Order[]>(MOCK_ORDERS)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.fromToken.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.toToken.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

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
            <h1 className="text-3xl font-bold text-white mb-2">Order History</h1>
            <p className="text-slate-400">Track and manage your cross-chain swap orders</p>
          </div>

          {/* Filters */}
          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search by order ID or token..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48 bg-slate-700 border-slate-600 text-white">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="executing">Executing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Orders List */}
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">No Orders Found</h3>
                  <p className="text-slate-400">
                    {searchTerm || statusFilter !== "all"
                      ? "Try adjusting your search or filter criteria"
                      : "You haven't created any swap orders yet"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredOrders.map((order) => (
                <Card
                  key={order.id}
                  className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Order Info */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <Badge variant="secondary" className={getStatusColor(order.status)}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1 capitalize">{order.status}</span>
                          </Badge>
                          <span className="text-slate-400 text-sm font-mono">{order.id}</span>
                        </div>

                        <div className="text-white font-medium">
                          {order.fromAmount} {order.fromToken} → {order.toAmount} {order.toToken}
                        </div>

                        <div className="text-sm text-slate-400">
                          Created: {formatDate(order.createdAt)}
                          {order.completedAt && (
                            <span className="ml-4">Completed: {formatDate(order.completedAt)}</span>
                          )}
                        </div>
                      </div>

                      {/* Transaction Links */}
                      <div className="flex items-center space-x-2">
                        {order.txHashes.ethereum && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-600 bg-slate-700 hover:bg-slate-600 text-white"
                            onClick={() => window.open(`https://etherscan.io/tx/${order.txHashes.ethereum}`, "_blank")}
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            ETH Tx
                          </Button>
                        )}

                        {order.txHashes.bitcoin && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-600 bg-slate-700 hover:bg-slate-600 text-white"
                            onClick={() =>
                              window.open(`https://blockstream.info/tx/${order.txHashes.bitcoin}`, "_blank")
                            }
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            BTC Tx
                          </Button>
                        )}

                        <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Stats Summary */}
          <div className="grid md:grid-cols-4 gap-4 mt-8">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">{orders.length}</div>
                <div className="text-sm text-slate-400">Total Orders</div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-400">
                  {orders.filter((o) => o.status === "completed").length}
                </div>
                <div className="text-sm text-slate-400">Completed</div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {orders.filter((o) => o.status === "executing").length}
                </div>
                <div className="text-sm text-slate-400">In Progress</div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-400">
                  {orders.filter((o) => o.status === "failed").length}
                </div>
                <div className="text-sm text-slate-400">Failed</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
