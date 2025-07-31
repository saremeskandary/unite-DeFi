import { NextRequest, NextResponse } from 'next/server';
import { priceOracle } from '@/lib/price-oracle';
import { blockchainIntegration } from '@/lib/blockchain-integration';
import { secureRoute, createSecureResponse, createSecureErrorResponse } from '@/lib/security/security-middleware';
import { swapQuoteSchema } from '@/lib/security/validation-schemas';
import { createBusinessError, ErrorCode } from '@/lib/security/error-handler';

async function getSwapQuote(request: NextRequest) {
  // Get validated data from security middleware
  const validatedData = (request as any).validatedData;

  const {
    fromToken,
    toToken,
    amount,
    fromAddress,
    chainId,
    slippage
  } = validatedData;

  // Get swap quote from 1inch
  const quote = await priceOracle.getSwapQuote(
    fromToken,
    toToken,
    amount,
    fromAddress,
    chainId
  );

  if (!quote) {
    throw createBusinessError(ErrorCode.SWAP_FAILED, 'Failed to get swap quote');
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

  return createSecureResponse(response, request);
}

// Export the secured route handler
export const GET = secureRoute(getSwapQuote, 'api', swapQuoteSchema); 