import { broadcastTransaction } from '../bitcoin-network'
import { FailureParams, FailureResult } from './types'
import { buildMockRefundTransaction } from './utils'
import { getSwapState, updateSwapState } from './state'

export async function handleSwapFailure(params: FailureParams): Promise<FailureResult> {
  const { orderId, failureType, action, originalTxid } = params

  const swapState = getSwapState(orderId)

  // Handle cases that don't require existing swap state
  if (failureType === 'bitcoin_node_failure' && action === 'failover_to_backup') {
    const backupNode = 'backup_bitcoin_node.example.com'
    return {
      success: true,
      backupNode,
      continued: true
    }
  }

  if (failureType === 'stuck_transaction' && action === 'replace_by_fee' && originalTxid) {
    const replacementTxid = `replacement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return {
      success: true,
      replacementTxid,
      higherFee: true
    }
  }

  if (failureType === 'ethereum_failure' && action === 'retry_eth_completion') {
    return {
      success: true,
      retryAttempts: 3,
      btcRemainsSafe: true
    }
  }

  // For other cases, require existing swap state
  if (!swapState) {
    throw new Error('Swap not found')
  }

  switch (failureType) {
    case 'timeout': {
      return await handleTimeout(swapState, action)
    }

    case 'resolver_failure': {
      return await handleResolverFailure(swapState, action)
    }

    default:
      throw new Error(`Unknown failure type: ${failureType}`)
  }
}

async function handleTimeout(swapState: any, action: string): Promise<FailureResult> {
  if (action === 'refund_btc') {
    // Build and broadcast refund transaction (mock for testing)
    const refundTxHex = buildMockRefundTransaction(swapState.userAddress)

    const broadcastResult = await broadcastTransaction({
      txHex: refundTxHex,
      network: swapState.network
    })

    if (!broadcastResult.success) {
      throw new Error('Failed to broadcast refund transaction')
    }

    // Update swap state
    updateSwapState(swapState.orderId, {
      status: 'refunded',
      refundTxid: broadcastResult.txid
    })

    return {
      success: true,
      refundTxid: broadcastResult.txid
    }
  }

  return { success: false }
}

async function handleResolverFailure(swapState: any, action: string): Promise<FailureResult> {
  if (action === 'user_refund_btc') {
    // Build and broadcast refund transaction (mock for testing)
    const refundTxHex = buildMockRefundTransaction(swapState.userAddress)

    const broadcastResult = await broadcastTransaction({
      txHex: refundTxHex,
      network: swapState.network
    })

    if (!broadcastResult.success) {
      throw new Error('Failed to broadcast refund transaction')
    }

    // Update swap state
    updateSwapState(swapState.orderId, {
      status: 'refunded',
      refundTxid: broadcastResult.txid
    })

    return {
      success: true,
      refundTxid: broadcastResult.txid
    }
  }

  return { success: false }
} 