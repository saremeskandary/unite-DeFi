 import { SwapActionParams, SwapActionResult, SwapState } from './types'
import { buildMockRedeemTransaction } from './utils'
import { getSwapState, updateSwapState, getSecret } from './state'
import { createHtlcScript } from '../bitcoin-htlc'
import { fundHtlcAddress, broadcastTransaction } from '../bitcoin-network'

export async function handleSwapAction(params: SwapActionParams): Promise<SwapActionResult> {
  const { orderId, secretHash, action, btcAmount, secret } = params
  
  const swapState = getSwapState(orderId)
  if (!swapState) {
    throw new Error('Swap not found')
  }

  switch (action) {
    case 'lock_btc': {
      return await handleLockBtc(swapState, secretHash)
    }

    case 'claim_btc': {
      return await handleClaimBtc(swapState, secret)
    }

    case 'claim_erc20': {
      return await handleClaimErc20(swapState, secret)
    }

    case 'fund_btc_htlc': {
      return await handleFundBtcHtlc(swapState, btcAmount)
    }

    case 'fill_erc20_order': {
      return await handleFillErc20Order(swapState, secretHash)
    }

    case 'claim_btc_with_secret': {
      return await handleClaimBtcWithSecret(swapState, secret)
    }

    default:
      throw new Error(`Unknown action: ${action}`)
  }
}

async function handleLockBtc(swapState: SwapState, secretHash?: string): Promise<SwapActionResult> {
  if (!secretHash) {
    throw new Error('Secret hash required for BTC lock')
  }

  const htlcParams = {
    secretHash,
    locktime: Math.floor(Date.now() / 1000) + 3600,
    senderPubKey: 'mock_resolver_pubkey',
    receiverPubKey: 'mock_user_pubkey',
    network: swapState.network
  }

  const htlcScript = createHtlcScript(htlcParams)
  
  // Fund the HTLC address
  const fundingResult = await fundHtlcAddress({
    address: htlcScript.address,
    amount: parseInt(swapState.amount),
    network: swapState.network
  })

  // Update swap state
  updateSwapState(swapState.orderId, {
    btcAddress: htlcScript.address,
    fundingTxid: fundingResult.txid,
    status: 'btc_locked'
  })

  return {
    success: true,
    btcAddress: htlcScript.address,
    btcAmount: swapState.amount,
    fundingTxid: fundingResult.txid
  }
}

async function handleClaimBtc(swapState: SwapState, secret?: string): Promise<SwapActionResult> {
  if (!secret) {
    throw new Error('Secret required for BTC claim')
  }

  // Validate secret matches
  const expectedSecret = getSecret(swapState.secretHash)
  if (secret !== expectedSecret) {
    throw new Error('Invalid secret')
  }

  // Build and broadcast redeem transaction (mock for testing)
  const redeemTxHex = buildMockRedeemTransaction(secret, swapState.userAddress)
  
  const broadcastResult = await broadcastTransaction({
    txHex: redeemTxHex,
    network: swapState.network
  })

  if (!broadcastResult.success) {
    throw new Error('Failed to broadcast redeem transaction')
  }

  // Update swap state
  updateSwapState(swapState.orderId, {
    status: 'btc_claimed',
    btcTxid: broadcastResult.txid
  })

  return {
    success: true,
    btcTxid: broadcastResult.txid,
    secret
  }
}

async function handleClaimErc20(swapState: SwapState, secret?: string): Promise<SwapActionResult> {
  if (!secret) {
    throw new Error('Secret required for ERC20 claim')
  }

  // Validate secret matches
  const expectedSecret = getSecret(swapState.secretHash)
  if (secret !== expectedSecret) {
    throw new Error('Invalid secret')
  }

  // Mock Ethereum transaction
  const ethTxid = `eth_claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Update swap state
  updateSwapState(swapState.orderId, {
    status: 'completed',
    ethTxid
  })

  return {
    success: true,
    ethTxid,
    secret
  }
}

async function handleFundBtcHtlc(swapState: SwapState, btcAmount?: string): Promise<SwapActionResult> {
  if (!btcAmount) {
    throw new Error('BTC amount required for funding')
  }

  const fundingResult = await fundHtlcAddress({
    address: swapState.btcAddress!,
    amount: parseInt(btcAmount),
    network: swapState.network
  })

  // Update swap state
  updateSwapState(swapState.orderId, {
    fundingTxid: fundingResult.txid,
    status: 'btc_funded'
  })

  return {
    success: true,
    fundingTxid: fundingResult.txid
  }
}

async function handleFillErc20Order(swapState: SwapState, secretHash?: string): Promise<SwapActionResult> {
  if (!secretHash) {
    throw new Error('Secret hash required for order fill')
  }

  const expectedSecret = getSecret(secretHash)
  if (!expectedSecret) {
    throw new Error('Secret not found for hash')
  }

  // Mock Ethereum transaction for ERC20 transfer
  const ethTxid = `eth_fill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Update swap state
  updateSwapState(swapState.orderId, {
    status: 'erc20_filled',
    ethTxid
  })

  return {
    success: true,
    ethTxid,
    secret: expectedSecret
  }
}

async function handleClaimBtcWithSecret(swapState: SwapState, secret?: string): Promise<SwapActionResult> {
  if (!secret) {
    throw new Error('Secret required for BTC claim')
  }

  // Validate secret matches
  const expectedSecret = getSecret(swapState.secretHash)
  if (secret !== expectedSecret) {
    throw new Error('Invalid secret')
  }

  // Build and broadcast redeem transaction (mock for testing)
  const redeemTxHex = buildMockRedeemTransaction(secret, swapState.userAddress)
  
  const broadcastResult = await broadcastTransaction({
    txHex: redeemTxHex,
    network: swapState.network
  })

  if (!broadcastResult.success) {
    throw new Error('Failed to broadcast redeem transaction')
  }

  // Update swap state
  updateSwapState(swapState.orderId, {
    status: 'completed',
    btcTxid: broadcastResult.txid
  })

  return {
    success: true,
    btcTxid: broadcastResult.txid,
    secret
  }
}