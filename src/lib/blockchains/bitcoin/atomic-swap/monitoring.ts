import { MonitoringParams, MonitoringResult } from './types'
import { getSwapState } from './state'

export async function monitorSwapProgress(params: MonitoringParams): Promise<MonitoringResult> {
  const { orderId, checkType } = params

  const swapState = getSwapState(orderId)
  if (!swapState) {
    throw new Error('Swap not found')
  }

  switch (checkType) {
    case 'btc_lock': {
      return handleBtcLockCheck(swapState)
    }

    case 'completion': {
      return handleCompletionCheck(swapState)
    }

    case 'refund': {
      return handleRefundCheck(swapState)
    }

    default:
      throw new Error(`Unknown check type: ${checkType}`)
  }
}

function handleBtcLockCheck(swapState: any): MonitoringResult {
  // Check if BTC is locked in HTLC
  if (swapState.status === 'btc_locked' && swapState.fundingTxid) {
    return {
      locked: true,
      txid: swapState.fundingTxid
    }
  }
  return { locked: false }
}

function handleCompletionCheck(swapState: any): MonitoringResult {
  // Check if swap is completed
  if (swapState.status === 'completed') {
    const isWbtcToBtc = swapState.fromToken === 'WBTC' && swapState.toToken === 'BTC'
    const isBtcToWbtc = swapState.fromToken === 'BTC' && swapState.toToken === 'WBTC'

    return {
      completed: true,
      userReceivedBtc: isWbtcToBtc,
      resolverReceivedWbtc: isWbtcToBtc,
      userReceivedWbtc: isBtcToWbtc,
      userRedeemedBtc: isBtcToWbtc
    }
  }
  return { completed: false }
}

function handleRefundCheck(swapState: any): MonitoringResult {
  // Check if refund occurred
  if (swapState.status === 'refunded') {
    return {
      refunded: true,
      resolverReceivedBtc: swapState.fromToken === 'WBTC',
      userReceivedBtc: swapState.fromToken === 'BTC'
    }
  }
  return { refunded: false }
} 