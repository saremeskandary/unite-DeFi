import * as React from 'react'

export default function OrdersPage() {
    const [orders] = React.useState([
        {
            id: 'order_1',
            status: 'Pending',
            fromToken: 'USDC',
            toToken: 'BTC',
            fromAmount: '1000',
            toAmount: '0.023',
            timestamp: new Date().toISOString()
        },
        {
            id: 'order_2',
            status: 'Completed',
            fromToken: 'USDC',
            toToken: 'BTC',
            fromAmount: '500',
            toAmount: '0.0115',
            timestamp: new Date().toISOString()
        }
    ])

    return (
        <div data-testid="orders-page">
            <h1>Order History</h1>
            {orders.map((order) => (
                <div key={order.id}>
                    <div>{order.status}</div>
                    <div>{order.fromToken} → {order.toToken}</div>
                </div>
            ))}
        </div>
    )
} 