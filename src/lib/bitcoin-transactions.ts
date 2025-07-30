import * as bitcoin from 'bitcoinjs-lib'

export interface Utxo {
  txid: string
  vout: number
  value: number
  script: Buffer
}

export interface RedeemTxParams {
  utxo: Utxo
  secret: string
  receiverKeyPair: any // ECPair from ecpair library
  redeemAddress: string
  htlcScript: Buffer
  network: bitcoin.Network
}

export interface RefundTxParams {
  utxo: Utxo
  senderKeyPair: any // ECPair from ecpair library
  refundAddress: string
  htlcScript: Buffer
  locktime: number
  network: bitcoin.Network
  enableRBF?: boolean
  replaceTxId?: string
}

export interface FeeEstimateParams {
  inputCount: number
  outputCount: number
  feeRate: number
}

export function buildHtlcRedeemTx(params: RedeemTxParams): bitcoin.Transaction {
  // Stub implementation - will be implemented based on tests
  const tx = new bitcoin.Transaction()
  tx.addInput(Buffer.from(params.utxo.txid, 'hex'), params.utxo.vout)
  tx.addOutput(bitcoin.address.toOutputScript(params.redeemAddress, params.network), params.utxo.value - 1000)
  return tx
}

export function buildHtlcRefundTx(params: RefundTxParams): bitcoin.Transaction {
  // Stub implementation - will be implemented based on tests
  const tx = new bitcoin.Transaction()
  tx.addInput(Buffer.from(params.utxo.txid, 'hex'), params.utxo.vout)
  tx.addOutput(bitcoin.address.toOutputScript(params.refundAddress, params.network), params.utxo.value - 1000)
  tx.locktime = params.locktime
  return tx
}

export function estimateTxFee(params: FeeEstimateParams): number {
  // Stub implementation - will be implemented based on tests
  const baseSize = 10 + params.inputCount * 148 + params.outputCount * 34
  return baseSize * params.feeRate
} 