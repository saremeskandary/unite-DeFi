import { NextRequest, NextResponse } from 'next/server'
import { tonIntegration, TONIntegrationService } from '@/lib/ton-integration'

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
        { error: 'Missing required fields: fromToken, toToken, fromAmount, toAddress' },
        { status: 400 }
      )
    }

    // Validate amount format
    const numAmount = parseFloat(fromAmount)
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount format' },
        { status: 400 }
      )
    }

    // Validate destination address format
    if (!TONIntegrationService.validateAddress(toAddress)) {
      return NextResponse.json(
        { error: 'Invalid TON address format' },
        { status: 400 }
      )
    }

    // Validate slippage if provided
    if (slippage !== undefined) {
      const numSlippage = parseFloat(slippage)
      if (isNaN(numSlippage) || numSlippage < 0.1 || numSlippage > 50) {
        return NextResponse.json(
          { error: 'Slippage must be between 0.1 and 50' },
          { status: 400 }
        )
      }
    }

    // Validate token support
    if (!tonIntegration.isTokenSupported(fromToken)) {
      return NextResponse.json(
        { error: `From token ${fromToken} is not supported` },
        { status: 400 }
      )
    }

    if (!tonIntegration.isTokenSupported(toToken)) {
      return NextResponse.json(
        { error: `To token ${toToken} is not supported` },
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
    const fromToken = searchParams.get('fromToken')
    const toToken = searchParams.get('toToken')
    const amount = searchParams.get('amount')
    const toAddress = searchParams.get('toAddress')

    // If orderId is provided, return order status
    if (orderId) {
      // Validate order ID format
      if (!/^ton_swap_\d+_[a-z0-9]{9}$/.test(orderId)) {
        return NextResponse.json(
          { error: 'Invalid order ID format' },
          { status: 400 }
        )
      }

      // Get order status (this would be implemented with a database in production)
      return NextResponse.json({
        success: true,
        order: {
          id: orderId,
          status: 'pending',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        }
      })
    }

    // If quote parameters are provided, return swap quote
    if (fromToken && toToken && amount && toAddress) {
      // Validate parameters
      const numAmount = parseFloat(amount)
      if (isNaN(numAmount) || numAmount <= 0) {
        return NextResponse.json(
          { error: 'Invalid amount format' },
          { status: 400 }
        )
      }

      if (!TONIntegrationService.validateAddress(toAddress)) {
        return NextResponse.json(
          { error: 'Invalid TON address format' },
          { status: 400 }
        )
      }

      if (!tonIntegration.isTokenSupported(fromToken) || !tonIntegration.isTokenSupported(toToken)) {
        return NextResponse.json(
          { error: 'Unsupported token pair' },
          { status: 400 }
        )
      }

      // Check if TON network is ready
      if (!tonIntegration.isNetworkReady()) {
        return NextResponse.json(
          { error: 'TON network not ready' },
          { status: 503 }
        )
      }

      // Get estimated swap quote
      try {
        const quote = await tonIntegration.createTONSwapOrder(
          fromToken,
          toToken,
          amount,
          toAddress,
          0.5 // Default slippage for quote
        )

        return NextResponse.json({
          success: true,
          quote: {
            fromToken: quote.fromToken,
            toToken: quote.toToken,
            fromAmount: quote.fromAmount,
            estimatedToAmount: quote.toAmount,
            fee: quote.fee,
            slippage: quote.slippage,
            expiresAt: quote.expiresAt
          }
        })
      } catch (error) {
        return NextResponse.json(
          { error: 'Failed to get swap quote' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Either orderId or quote parameters (fromToken, toToken, amount, toAddress) are required' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in TON swap GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 