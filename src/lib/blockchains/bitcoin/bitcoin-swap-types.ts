import { OrderInfo } from '@1inch/cross-chain-sdk';

export interface BlockstreamTx {
  vin: {
    witness?: string[];
    prevout?: {
      scriptpubkey_address: string;
    };
  }[];
}

export interface Utxo {
  txid: string;
  vout: number;
  value: number;
  scriptpubkey: string;
}

export interface BitcoinSwapOrderExtension {
  swapType: 'erc20_to_btc' | 'btc_to_erc20';
  recipientPublicKey?: string;
  secretHash: string;
  destinationAmount?: string;
  sourceTxId?: string;
  sourceAmount?: string;
  chainId?: string;
  destinationAddress?: string;
  timelock?: number;
  ethRecipient?: string;
}

export interface BitcoinSwapOrder extends Omit<OrderInfo, 'extension'> {
  extension: BitcoinSwapOrderExtension;
}

export interface ERC20ToBTCParams {
  makerAsset: string;      // ERC20 token address (e.g., WBTC)
  makerAmount: string;     // Amount in wei
  btcAddress: string;      // User's Bitcoin address
  btcAmount: number;       // BTC amount in satoshis
  secret: string;          // Secret for HTLC
}

export interface BTCToERC20Params {
  btcTxId: string;         // Bitcoin transaction ID with locked BTC
  btcAmount: number;       // BTC amount in satoshis
  takerAsset: string;      // Desired ERC20 token
  takerAmount: string;     // Desired ERC20 amount
  ethAddress: string;      // User's Ethereum address
  secret: string;          // Secret for HTLC
}

export interface FusionOrderResult {
  fusionOrder: OrderInfo;
  secretHash: string;
}

export interface BitcoinHTLCConfig {
  secretHash: Buffer;
  recipientPublicKey: Buffer;
  lockTimeBlocks: number;
}

export interface BitcoinFundingConfig {
  htlcAddress: string;
  amountSatoshis: number;
}

export interface ERC20EscrowResponse {
  escrowAddress: string;
  txHash: string;
} 