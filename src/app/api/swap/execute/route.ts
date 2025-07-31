import { NextRequest, NextResponse } from 'next/server';
import { blockchainIntegration } from '@/lib/blockchain-integration';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fromToken,
      toToken,
      fromAmount,
      toAddress,
      slippage = 0.5,
      feePriority = 'standard'
    } = body;

    if (!fromToken || !toToken || !fromAmount || !toAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters: fromToken, toToken, fromAmount, toAddress' },
        { status: 400 }
      );
    }

    // Create and execute the swap order
    const result = await blockchainIntegration.createSwapOrder(
      fromToken,
      toToken,
      fromAmount,
      toAddress,
      slippage
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to execute swap order'
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      order: result.order,
      transactionHash: result.transactionHash,
      message: 'Swap order created successfully'
    });

  } catch (error) {
    console.error('Error executing swap order:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute swap order'
      },
      { status: 500 }
    );
  }
} 