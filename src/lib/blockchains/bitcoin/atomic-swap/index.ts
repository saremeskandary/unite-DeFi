import * as bitcoin from 'bitcoinjs-lib'
import { createHtlcScript } from '../bitcoin-htlc'
import { calculateSwapProfitability, type Order } from '../../../resolver-logic'
import { resetNetworkTracking } from '../bitcoin-network'
import { SwapParams, SwapResult, SwapActionParams, SwapActionResult, MonitoringParams, MonitoringResult, FailureParams, FailureResult, SwapState } from './types'
import { generateOrderId, generateSecret, createSecretHash } from './utils'
import { validateSecretUniqueness, storeSwapState, storeSecret, resetSwapState as resetState } from './state'
import { handleSwapAction } from './actions'
import { handleSwapFailure as handleFailure } from './failures'
import { monitorSwapProgress as monitorSwap } from './monitoring'

export async function initiateAtomicSwap(params: SwapParams): Promise<SwapResult> {
  try {
    const { fromToken, toToken, amount, userAddress, network = bitcoin.networks.testnet, bitcoinFees, ethereumFees, secret } = params

    // Check profitability for resolver
    const order: Order = {
      fromToken,
      toToken,
      amount,
      userAddress,
      bitcoinFees,
      ethereumFees
    }

    const profitability = calculateSwapProfitability(order)

    if (!profitability.profitable) {
      return {
        success: false,
        profitable: false,
        reason: profitability.reason || 'fees too high relative to order amount',
        error: 'Order not profitable for resolver'
      }
    }

    // Generate or use provided secret
    const finalSecret = secret || generateSecret()

    // Validate secret uniqueness
    if (!validateSecretUniqueness(finalSecret)) {
      return {
        success: false,
        error: 'secret reuse'
      }
    }

    // Create secret hash
    const secretHash = createSecretHash(finalSecret)

    // Generate order ID
    const orderId = generateOrderId()

    // Store swap state
    const swapState: SwapState = {
      orderId,
      fromToken,
      toToken,
      amount,
      userAddress,
      secret: finalSecret,
      secretHash,
      network,
      status: 'initiated',
      createdAt: Date.now()
    }

    storeSwapState(orderId, swapState)
    storeSecret(secretHash, finalSecret)

    // For BTC to ERC20 swaps, create HTLC address
    let btcAddress: string | undefined
    if (fromToken === 'BTC' && toToken === 'WBTC') {
      const htlcParams = {
        secretHash,
        locktime: Math.floor(Date.now() / 1000) + 3600, // 1 hour locktime
        senderPubKey: 'mock_sender_pubkey', // In real implementation, this would be user's pubkey
        receiverPubKey: 'mock_receiver_pubkey', // In real implementation, this would be resolver's pubkey
        network
      }

      const htlcScript = createHtlcScript(htlcParams)
      btcAddress = htlcScript.address

      // Update swap state with HTLC address
      swapState.btcAddress = btcAddress
      swapState.htlcScript = htlcScript
    }

    return {
      success: true,
      orderId,
      secretHash,
      secret: finalSecret,
      btcAddress,
      profitable: true,
      reason: 'profitable_swap'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

export async function completeAtomicSwap(params: SwapActionParams): Promise<SwapActionResult> {
  try {
    return await handleSwapAction(params)
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

export async function monitorSwapProgress(params: MonitoringParams): Promise<MonitoringResult> {
  try {
    return await monitorSwap(params)
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

export async function handleSwapFailure(params: FailureParams): Promise<FailureResult> {
  try {
    return await handleFailure(params)
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Utility function to reset state for testing
export function resetSwapState(): void {
  resetState()
  resetNetworkTracking()
}

// Export types for external use
export type {
  SwapParams,
  SwapResult,
  SwapActionParams,
  SwapActionResult,
  MonitoringParams,
  MonitoringResult,
  FailureParams,
  FailureResult
} 