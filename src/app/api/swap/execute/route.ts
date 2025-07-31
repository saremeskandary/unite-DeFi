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
      feePriority = 'standard',
      chainId = 1,
      quoteId
    } = body;

    // Enhanced validation
    if (!fromToken || !toToken || !fromAmount || !toAddress) {
      return NextResponse.json(
        {
          error: 'Missing required parameters',
          required: ['fromToken', 'toToken', 'fromAmount', 'toAddress'],
          received: { fromToken, toToken, fromAmount, toAddress }
        },
        { status: 400 }
      );
    }

    // Validate amount is a positive number
    const amountNum = parseFloat(fromAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: 'fromAmount must be a positive number' },
        { status: 400 }
      );
    }

    // Validate slippage is within reasonable bounds
    if (slippage < 0.1 || slippage > 50) {
      return NextResponse.json(
        { error: 'Slippage must be between 0.1% and 50%' },
        { status: 400 }
      );
    }

    // Validate fee priority
    const validFeePriorities = ['slow', 'standard', 'fast'];
    if (!validFeePriorities.includes(feePriority)) {
      return NextResponse.json(
        {
          error: 'Invalid fee priority',
          valid: validFeePriorities,
          received: feePriority
        },
        { status: 400 }
      );
    }

    // Validate chainId is supported
    const supportedChains = [1, 137, 56, 42161]; // Ethereum, Polygon, BSC, Arbitrum
    if (!supportedChains.includes(chainId)) {
      return NextResponse.json(
        {
          error: 'Unsupported chain ID',
          supported: supportedChains,
          received: chainId
        },
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