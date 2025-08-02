import { NextRequest, NextResponse } from 'next/server'
import { tonIntegration } from '@/lib/ton-integration'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      fromToken,
      toToken,
      fromAmount,
      toAddress,
      slippage,
      fromNetwork,
      toNetwork,
      tonWalletAddress
    } = body

    // Validate required fields
    if (!fromToken || !toToken || !fromAmount || !toAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if TON network is ready (don't require wallet initialization)
    if (!tonIntegration.isNetworkReady()) {
      return NextResponse.json(
        { error: 'TON network not ready' },
        { status: 503 }
      )
    }

    // Create TON swap order
    const tonOrder = await tonIntegration.createTONSwapOrder(
      fromToken,
      toToken,
      fromAmount,
      toAddress,
      slippage || 0.5
    )

    // Execute the TON swap
    const result = await tonIntegration.executeTONSwapOrder(tonOrder)

    if (result.success) {
      return NextResponse.json({
        success: true,
        order: {
          id: tonOrder.id,
          fromToken: tonOrder.fromToken,
          toToken: tonOrder.toToken,
          fromAmount: tonOrder.fromAmount,
          toAmount: tonOrder.toAmount,
          status: tonOrder.status,
          transactionHash: result.transactionHash,
          createdAt: tonOrder.createdAt
        },
        message: 'TON swap order created successfully'
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to execute TON swap' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in TON swap API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Get order status (this would be implemented with a database in production)
    return NextResponse.json({
      success: true,
      order: {
        id: orderId,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error getting TON swap status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 