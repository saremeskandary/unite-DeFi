"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { OrderStatusPanel } from "@/components/orders/order-status-panel"
import { useRealTimeOrderStatus } from "@/hooks/useOrderStatus"
import { useOrderStatusStream } from "@/hooks/useOrderStatusStream"

export default function TestRealtimePage() {
    const [orderId, setOrderId] = useState("test-order-123")
    const [useSSE, setUseSSE] = useState(true)

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-white mb-2">Real-time Order Status Test</h1>
                <p className="text-slate-400">Test the real-time order monitoring functionality</p>
            </div>

            {/* Controls */}
            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                    <CardTitle className="text-white">Test Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                        <div className="flex-1">
                            <label className="text-sm text-slate-400 mb-2 block">Order ID</label>
                            <Input
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                                placeholder="Enter order ID"
                                className="bg-slate-700 border-slate-600 text-white"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="useSSE"
                                checked={useSSE}
                                onChange={(e) => setUseSSE(e.target.checked)}
                                className="rounded"
                            />
                            <label htmlFor="useSSE" className="text-sm text-slate-400">
                                Use Server-Sent Events
                            </label>
                        </div>
                    </div>

                    <div className="flex space-x-2">
                        <Button
                            onClick={() => setOrderId(`order-${Date.now()}`)}
                            variant="outline"
                        >
                            Generate New Order ID
                        </Button>
                        <Button
                            onClick={() => setOrderId("test-order-123")}
                            variant="outline"
                        >
                            Reset to Test Order
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Order Status Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center space-x-2">
                            <span>Order Status Panel</span>
                            <Badge variant="secondary" className="text-xs">
                                {useSSE ? "SSE" : "Polling"}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <OrderStatusPanel orderId={orderId} />
                    </CardContent>
                </Card>

                {/* Raw Data Display */}
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white">Raw Data</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RawDataDisplay orderId={orderId} useSSE={useSSE} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function RawDataDisplay({ orderId, useSSE }: { orderId: string; useSSE: boolean }) {
    const pollingHook = useRealTimeOrderStatus(orderId, { autoStart: !useSSE })
    const sseHook = useOrderStatusStream(orderId, { autoConnect: useSSE })

    const data = useSSE ? sseHook : pollingHook

    return (
        <div className="space-y-4">
            <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${data.isConnected || data.isMonitoring ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-sm text-slate-400">
                    {useSSE ? 'SSE Connection' : 'Polling Status'}: {data.isConnected || data.isMonitoring ? 'Active' : 'Inactive'}
                </span>
            </div>

            {data.isLoading && (
                <div className="text-sm text-blue-400">Loading...</div>
            )}

            {data.error && (
                <div className="text-sm text-red-400">
                    Error: {data.error.message}
                </div>
            )}

            {data.orderStatus && (
                <div className="space-y-2">
                    <div className="text-sm text-slate-400">Order Status:</div>
                    <pre className="text-xs bg-slate-900 p-3 rounded overflow-auto max-h-96 text-green-400">
                        {JSON.stringify(data.orderStatus, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    )
} 