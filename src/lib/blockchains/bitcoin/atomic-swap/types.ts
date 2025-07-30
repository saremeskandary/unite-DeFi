import * as bitcoin from 'bitcoinjs-lib'

export interface SwapParams {
  fromToken: string
  toToken: string
  amount: string
  userAddress: string
  network?: bitcoin.Network
  bitcoinFees?: number
  ethereumFees?: number
  secret?: string
}

export interface SwapResult {
  success: boolean
  orderId?: string
  secretHash?: string
  secret?: string
  btcAddress?: string
  profitable?: boolean
  reason?: string
  error?: string
}

export interface SwapActionParams {
  orderId: string
  secretHash?: string
  action: string
  btcAmount?: string
  secret?: string
}

export interface SwapActionResult {
  success: boolean
  btcAddress?: string
  btcAmount?: string
  fundingTxid?: string
  ethTxid?: string
  btcTxid?: string
  secret?: string
  error?: string
}

export interface MonitoringParams {
  orderId: string
  checkType: string
}

export interface MonitoringResult {
  locked?: boolean
  txid?: string
  completed?: boolean
  userReceivedBtc?: boolean
  resolverReceivedWbtc?: boolean
  refunded?: boolean
  resolverReceivedBtc?: boolean
  userReceivedWbtc?: boolean
  userRedeemedBtc?: boolean
  error?: string
}

export interface FailureParams {
  orderId: string
  failureType: string
  action: string
  originalTxid?: string
}

export interface FailureResult {
  success: boolean
  refundTxid?: string
  backupNode?: string
  continued?: boolean
  replacementTxid?: string
  higherFee?: boolean
  retryAttempts?: number
  btcRemainsSafe?: boolean
  error?: string
}

export interface SwapState {
  orderId: string
  fromToken: string
  toToken: string
  amount: string
  userAddress: string
  secret: string
  secretHash: string
  network: bitcoin.Network
  status: string
  createdAt: number
  btcAddress?: string
  htlcScript?: any
  fundingTxid?: string
  btcTxid?: string
  ethTxid?: string
  refundTxid?: string
} 