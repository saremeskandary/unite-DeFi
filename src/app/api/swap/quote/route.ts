import { NextRequest, NextResponse } from 'next/server';
import { priceOracle } from '@/lib/price-oracle';
import { blockchainIntegration } from '@/lib/blockchain-integration';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromToken = searchParams.get('fromToken');
    const toToken = searchParams.get('toToken');
    const amount = searchParams.get('amount');
    const fromAddress = searchParams.get('fromAddress');
    const chainId = parseInt(searchParams.get('chainId') || '1');
    const slippage = parseFloat(searchParams.get('slippage') || '0.5');

    // Enhanced validation
    if (!fromToken || !toToken || !amount || !fromAddress) {
      return NextResponse.json(
        {
          error: 'Missing required parameters',
          required: ['fromToken', 'toToken', 'amount', 'fromAddress'],
          received: { fromToken, toToken, amount, fromAddress }
        },
        { status: 400 }
      );
    }

    // Validate amount is a positive number
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
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

    // Get swap quote from 1inch
    const quote = await priceOracle.getSwapQuote(
      fromToken,
      toToken,
      amount,
      fromAddress,
      chainId
    );

    if (!quote) {
      return NextResponse.json(
        { error: 'Failed to get swap quote' },
        { status: 404 }
      );
    }

    // Get dynamic fee options
    const feeOptions = await blockchainIntegration.getFeeOptions();

    // Get current gas price for fee calculation
    const gasEstimate = await blockchainIntegration.estimateGas(
      fromToken,
      toToken,
      amount,
      fromAddress
    );

    // Calculate price impact
    const fromPrice = await priceOracle.getTokenPrice(fromToken);
    const toPrice = await priceOracle.getTokenPrice(toToken);

    let priceImpact = 0;
    if (fromPrice && toPrice) {
      const expectedRate = toPrice.price / fromPrice.price;
      const actualRate = quote.rate;
      priceImpact = ((actualRate - expectedRate) / expectedRate) * 100;
    }

    const response = {
      quote: {
        fromToken: quote.fromToken,
        toToken: quote.toToken,
        fromAmount: quote.fromAmount,
        toAmount: quote.toAmount,
        rate: quote.rate,
        priceImpact: priceImpact,
        gasEstimate: quote.gasEstimate,
        gasCost: quote.gasCost,
        source: quote.source
      },
      fees: {
        slow: {
          ...feeOptions.slow,
          estimatedTime: '5-10 minutes'
        },
        standard: {
          ...feeOptions.standard,
          estimatedTime: '2-5 minutes'
        },
        fast: {
          ...feeOptions.fast,
          estimatedTime: '30 seconds - 2 minutes'
        }
      },
      gasEstimate: {
        gasLimit: gasEstimate.gasLimit,
        gasPrice: gasEstimate.gasPrice,
        totalFee: gasEstimate.totalFee
      },
      metadata: {
        chainId,
        fromAddress,
        timestamp: new Date().toISOString(),
        quoteExpiry: new Date(Date.now() + 30 * 1000).toISOString() // 30 seconds
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error getting swap quote:', error);
    return NextResponse.json(
      { error: 'Failed to get swap quote' },
      { status: 500 }
    );
  }
} 