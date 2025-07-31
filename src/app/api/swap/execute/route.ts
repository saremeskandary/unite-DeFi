import { NextRequest, NextResponse } from 'next/server';
import { blockchainIntegration } from '@/lib/blockchain-integration';
import { secureRoute, createSecureResponse, createSecureErrorResponse } from '@/lib/security/security-middleware';
import { swapExecuteSchema } from '@/lib/security/validation-schemas';
import { createBusinessError, ErrorCode } from '@/lib/security/error-handler';

async function executeSwap(request: NextRequest) {
  // Get validated data from security middleware
  const validatedData = (request as any).validatedData;

  const {
    fromToken,
    toToken,
    fromAmount,
    toAddress,
    slippage,
    feePriority,
    chainId,
    quoteId
  } = validatedData;

  // Create and execute the swap order
  const result = await blockchainIntegration.createSwapOrder(
    fromToken,
    toToken,
    fromAmount,
    toAddress,
    slippage
  );

  if (!result.success) {
    throw createBusinessError(ErrorCode.SWAP_FAILED, result.error || 'Failed to execute swap order');
  }

  const response = {
    success: true,
    order: result.order,
    transactionHash: result.transactionHash,
    message: 'Swap order created successfully'
  };

  return createSecureResponse(response, request);
}

// Export the secured route handler
export const POST = secureRoute(executeSwap, 'swap', swapExecuteSchema); 