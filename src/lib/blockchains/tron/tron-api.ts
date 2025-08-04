import { TronWeb } from 'tronweb';
import axios from 'axios';

export interface TronNetworkConfig {
  network: 'mainnet' | 'nile' | 'shasta' | 'local';
  rpcUrl: string;
  apiUrl: string;
  blockExplorer: string;
  confirmations: number;
}

export interface TronTransaction {
  txID: string;
  blockNumber: number;
  confirmations: number;
  from: string;
  to: string;
  value: number;
  fee: number;
  timestamp: number;
  contractAddress?: string;
  contractType?: string;
}

export interface TronAddressInfo {
  address: string;
  balance: number;
  totalReceived: number;
  totalSent: number;
  txCount: number;
  trc20Tokens: Array<{
    contractAddress: string;
    symbol: string;
    balance: string;
    decimals: number;
  }>;
}

export interface TronTokenInfo {
  contractAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
}

export interface BroadcastResult {
  success: boolean;
  txid?: string;
  error?: string;
}

export class TronAPIService {
  private config: TronNetworkConfig;
  private tronWeb: TronWeb;

  constructor(config: TronNetworkConfig) {
    this.config = config;
    this.tronWeb = new TronWeb({
      fullHost: config.rpcUrl,
      headers: { "TRON-PRO-API-KEY": process.env.TRON_API_KEY || "" }
    });
  }

  /**
   * Get address information including balance and TRC20 tokens
   */
  async getAddressInfo(address: string): Promise<TronAddressInfo | null> {
    try {
      // Get account info from TronWeb
      const account = await this.tronWeb.trx.getAccount(address);

      // Get TRC20 token balances
      const trc20Tokens = await this.getTRC20TokenBalances(address);

      // Get transaction count
      const txCount = await this.getTransactionCount(address);

      return {
        address: address,
        balance: account.balance || 0,
        totalReceived: 0, // Would need to calculate from transaction history
        totalSent: 0, // Would need to calculate from transaction history
        txCount: txCount,
        trc20Tokens: trc20Tokens
      };

    } catch (error) {
      console.error('Error getting address info:', error);
      return null;
    }
  }

  /**
   * Get TRC20 token balances for an address
   */
  async getTRC20TokenBalances(address: string): Promise<Array<{
    contractAddress: string;
    symbol: string;
    balance: string;
    decimals: number;
  }>> {
    try {
      // Common TRC20 tokens on Tron
      const commonTokens = [
        { address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', symbol: 'USDT', decimals: 6 },
        { address: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8', symbol: 'USDC', decimals: 6 },
        { address: 'TQn9Y2khDD95J42FQtQTdwVVRKjqEQnQUk', symbol: 'JST', decimals: 18 }
      ];

      const balances = [];

      for (const token of commonTokens) {
        try {
          const contract = await this.tronWeb.contract().at(token.address);
          const balance = await contract.balanceOf(address).call();

          if (balance && balance > 0) {
            balances.push({
              contractAddress: token.address,
              symbol: token.symbol,
              balance: balance.toString(),
              decimals: token.decimals
            });
          }
        } catch (error) {
          // Token might not exist or contract might be invalid
          continue;
        }
      }

      return balances;

    } catch (error) {
      console.error('Error getting TRC20 token balances:', error);
      return [];
    }
  }

  /**
   * Get transaction count for an address
   */
  async getTransactionCount(address: string): Promise<number> {
    try {
      // Use a simpler approach - get account info which includes transaction count
      const account = await this.tronWeb.trx.getAccount(address);
      // For now, return 0 as transaction count is not directly available
      // In a real implementation, you might need to use the API directly
      return 0;
    } catch (error) {
      console.error('Error getting transaction count:', error);
      return 0;
    }
  }

  /**
   * Get transaction information
   */
  async getTransaction(txid: string): Promise<TronTransaction | null> {
    try {
      const tx = await this.tronWeb.trx.getTransaction(txid);
      const txInfo = await this.tronWeb.trx.getTransactionInfo(txid);

      if (!tx || !txInfo) {
        return null;
      }

      return {
        txID: tx.txID,
        blockNumber: (tx as any).blockNumber || 0,
        confirmations: txInfo.receipt?.result === 'SUCCESS' ? 1 : 0,
        from: (tx.raw_data?.contract?.[0]?.parameter?.value as any)?.owner_address || '',
        to: (tx.raw_data?.contract?.[0]?.parameter?.value as any)?.to_address || '',
        value: (tx.raw_data?.contract?.[0]?.parameter?.value as any)?.amount || 0,
        fee: txInfo.fee || 0,
        timestamp: tx.raw_data?.timestamp || 0,
        contractAddress: (tx.raw_data?.contract?.[0]?.parameter?.value as any)?.contract_address,
        contractType: tx.raw_data?.contract?.[0]?.type
      };

    } catch (error) {
      console.error('Error getting transaction:', error);
      return null;
    }
  }

  /**
   * Broadcast a transaction
   */
  async broadcastTransaction(signedTx: any): Promise<BroadcastResult> {
    try {
      const result = await this.tronWeb.trx.sendRawTransaction(signedTx);

      return {
        success: true,
        txid: result.txid
      };

    } catch (error) {
      console.error('Error broadcasting transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get current block height
   */
  async getBlockHeight(): Promise<number> {
    try {
      const block = await this.tronWeb.trx.getCurrentBlock();
      return block.block_header?.raw_data?.number || 0;
    } catch (error) {
      console.error('Error getting block height:', error);
      return 0;
    }
  }

  /**
   * Get block information
   */
  async getBlock(blockHash: string): Promise<any> {
    try {
      return await this.tronWeb.trx.getBlock(blockHash);
    } catch (error) {
      console.error('Error getting block:', error);
      return null;
    }
  }

  /**
   * Get block by height
   */
  async getBlockByHeight(height: number): Promise<any> {
    try {
      return await this.tronWeb.trx.getBlockByNumber(height);
    } catch (error) {
      console.error('Error getting block by height:', error);
      return null;
    }
  }

  /**
   * Monitor transaction confirmation
   */
  async monitorTransaction(txid: string, requiredConfirmations: number = this.config.confirmations): Promise<{
    confirmed: boolean;
    confirmations: number;
    blockHeight?: number;
  }> {
    try {
      const tx = await this.getTransaction(txid);
      if (!tx) {
        return { confirmed: false, confirmations: 0 };
      }

      const currentHeight = await this.getBlockHeight();
      const confirmations = tx.blockNumber > 0 ? currentHeight - tx.blockNumber + 1 : 0;

      return {
        confirmed: confirmations >= requiredConfirmations,
        confirmations: confirmations,
        blockHeight: tx.blockNumber
      };

    } catch (error) {
      console.error('Error monitoring transaction:', error);
      return { confirmed: false, confirmations: 0 };
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForConfirmation(
    txid: string,
    requiredConfirmations: number = this.config.confirmations,
    timeout: number = 300000 // 5 minutes
  ): Promise<{
    confirmed: boolean;
    confirmations: number;
    blockHeight?: number;
  }> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const status = await this.monitorTransaction(txid, requiredConfirmations);

      if (status.confirmed) {
        return status;
      }

      // Wait 3 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Timeout reached
    return await this.monitorTransaction(txid, requiredConfirmations);
  }

  /**
   * Get energy and bandwidth estimates (Tron's equivalent of gas)
   */
  async getResourceEstimates(): Promise<{
    energy: number;
    bandwidth: number;
    sun: number; // Tron's smallest unit
  }> {
    try {
      const account = await this.tronWeb.trx.getAccountResources();

      return {
        energy: account.EnergyUsed || 0,
        bandwidth: account.NetUsed || 0,
        sun: account.NetLimit || 0
      };

    } catch (error) {
      console.error('Error getting resource estimates:', error);
      return {
        energy: 0,
        bandwidth: 0,
        sun: 0
      };
    }
  }

  /**
   * Validate Tron address
   */
  validateAddress(address: string): boolean {
    try {
      return this.tronWeb.isAddress(address);
    } catch (error) {
      return false;
    }
  }

  /**
   * Convert address to hex format
   */
  addressToHex(address: string): string {
    try {
      return this.tronWeb.address.toHex(address);
    } catch (error) {
      throw new Error('Invalid Tron address');
    }
  }

  /**
   * Convert hex address to base58 format
   */
  hexToAddress(hexAddress: string): string {
    try {
      return this.tronWeb.address.fromHex(hexAddress);
    } catch (error) {
      throw new Error('Invalid hex address');
    }
  }

  /**
   * Get network configuration
   */
  getNetworkConfig(): TronNetworkConfig {
    return this.config;
  }

  /**
   * Get TronWeb instance
   */
  getTronWeb(): TronWeb {
    return this.tronWeb;
  }
} 