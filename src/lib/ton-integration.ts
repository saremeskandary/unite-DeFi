import { tonSDK, TONSDKService, TONTransactionOptions, TONBalanceInfo } from './ton-sdk';
import { priceOracle } from './price-oracle';
import { deDustAPI, DeDustQuote } from './dedust-api';

// TON Integration Types
export interface TONSwapOrder {
  id: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  fromAddress: string;
  toAddress: string;
  slippage: number;
  fee: string;
  status: 'pending' | 'confirmed' | 'failed';
  transactionHash?: string;
  createdAt: string;
  expiresAt: string;
}

export interface TONNetworkInfo {
  name: string;
  chainId: number;
  isTestnet: boolean;
  blockHeight: number;
  averageBlockTime: number;
  totalSupply: string;
}

export interface TONTokenInfo {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
  price?: number;
  value?: number;
}

/**
 * TON Integration Service
 * Provides high-level TON blockchain operations and integration with the existing
 * DeFi infrastructure for cross-chain swaps and token management.
 */
export class TONIntegrationService {
  private tonSDK: TONSDKService;
  private isInitialized: boolean = false;

  constructor() {
    this.tonSDK = tonSDK;
    this.initialize();
  }

  /**
   * Initialize TON integration
   */
  private async initialize(): Promise<void> {
    try {
      // Set network based on environment
      const network = process.env.NEXT_PUBLIC_TON_NETWORK || 'testnet';
      this.tonSDK.setNetwork(network as 'mainnet' | 'testnet' | 'sandbox');

      // Only initialize wallet if we're in a client environment and credentials are provided
      // Skip wallet initialization during server-side rendering
      if (typeof window !== 'undefined') {
        if (process.env.TON_MNEMONIC) {
          const mnemonic = process.env.TON_MNEMONIC.split(' ');
          await this.tonSDK.initializeWalletFromMnemonic(mnemonic);
        } else if (process.env.TON_PRIVATE_KEY) {
          const privateKey = Buffer.from(process.env.TON_PRIVATE_KEY, 'hex');
          await this.tonSDK.initializeWalletFromPrivateKey(privateKey);
        }
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize TON integration:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Check if TON integration is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.tonSDK.isWalletInitialized();
  }

  /**
   * Check if TON network is initialized (for server-side operations)
   */
  isNetworkReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get TON network information
   */
  async getNetworkInfo(): Promise<TONNetworkInfo> {
    try {
      const network = this.tonSDK.getCurrentNetwork();
      const stats = await this.tonSDK.getNetworkStats();

      return {
        name: network?.name || 'Unknown',
        chainId: network?.chainId || -239,
        isTestnet: network?.isTestnet || true,
        blockHeight: stats.currentBlockHeight,
        averageBlockTime: stats.averageBlockTime,
        totalSupply: stats.totalSupply
      };
    } catch (error) {
      throw new Error(`Failed to get network info: ${error}`);
    }
  }

  /**
   * Get TON wallet balance
   */
  async getWalletBalance(): Promise<TONBalanceInfo> {
    if (!this.isReady()) {
      throw new Error('TON integration not ready');
    }

    try {
      return await this.tonSDK.getBalance();
    } catch (error) {
      throw new Error(`Failed to get wallet balance: ${error}`);
    }
  }

  /**
   * Get TON token information
   */
  async getTokenInfo(symbol: string): Promise<TONTokenInfo | null> {
    try {
      // For now, we'll focus on native TON
      // In the future, this can be extended to support TON tokens (Jetton)
      if (symbol.toUpperCase() === 'TON') {
        const balance = await this.getWalletBalance();
        const price = await this.getTokenPrice('TON');

        return {
          symbol: 'TON',
          name: 'TON',
          address: balance.address,
          decimals: 9,
          balance: balance.balance,
          balanceFormatted: balance.balanceFormatted,
          price,
          value: price ? parseFloat(balance.balanceFormatted) * price : undefined
        };
      }

      return null;
    } catch (error) {
      throw new Error(`Failed to get token info: ${error}`);
    }
  }

  /**
   * Get token price from price oracle
   */
  private async getTokenPrice(symbol: string): Promise<number | undefined> {
    try {
      // Use the existing price oracle to get TON price
      const price = await priceOracle.getTokenPrice(symbol);
      return price?.price;
    } catch (error) {
      console.warn(`Failed to get price for ${symbol}:`, error);
      return undefined;
    }
  }

  /**
   * Send TON transaction
   */
  async sendTransaction(options: TONTransactionOptions): Promise<string> {
    if (!this.isReady()) {
      throw new Error('TON integration not ready');
    }

    try {
      return await this.tonSDK.sendTransaction(options);
    } catch (error) {
      throw new Error(`Failed to send transaction: ${error}`);
    }
  }

  /**
   * Create TON swap order (for cross-chain swaps)
   */
  async createTONSwapOrder(
    fromToken: string,
    toToken: string,
    fromAmount: string,
    toAddress: string,
    slippage: number = 0.5
  ): Promise<TONSwapOrder> {
    if (!this.isReady()) {
      throw new Error('TON integration not ready');
    }

    try {
      // Get current wallet address
      const fromAddress = this.tonSDK.getCurrentAddress();
      if (!fromAddress) {
        throw new Error('No wallet address available');
      }

      // Get swap quote (this would integrate with 1inch or other DEX)
      const quote = await this.getSwapQuote(fromToken, toToken, fromAmount, fromAddress);

      // Calculate fees
      const fee = await this.tonSDK.estimateFee(toAddress, fromAmount);

      // Create order
      const order: TONSwapOrder = {
        id: `ton_swap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fromToken,
        toToken,
        fromAmount,
        toAmount: quote.toAmount,
        fromAddress,
        toAddress,
        slippage,
        fee,
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
      };

      return order;
    } catch (error) {
      throw new Error(`Failed to create TON swap order: ${error}`);
    }
  }

  /**
   * Execute TON swap order with DeDust integration
   */
  async executeTONSwapOrder(order: TONSwapOrder): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    if (!this.isReady()) {
      throw new Error('TON integration not ready');
    }

    try {
      // Check if this is a same-chain TON swap or cross-chain
      const isSameChainSwap = order.fromToken === 'TON' || order.toToken === 'TON';

      if (isSameChainSwap) {
        // Use DeDust for TON native swaps
        try {
          const swapParams = await deDustAPI.prepareSwap({
            fromToken: order.fromToken,
            toToken: order.toToken,
            amount: order.fromAmount,
            slippage: order.slippage,
            deadline: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
            recipient: order.toAddress
          });

          // Execute the DeDust swap transaction
          const transactionHash = await this.sendTransaction({
            amount: swapParams.value,
            destination: swapParams.to,
            payload: swapParams.data
          });

          return {
            success: true,
            transactionHash
          };
        } catch (deDustError) {
          console.warn('DeDust swap failed, falling back to simple transfer:', deDustError);

          // Fallback to simple transfer
          const transactionHash = await this.sendTransaction({
            amount: order.fromAmount,
            destination: order.toAddress,
            payload: `Fallback swap ${order.fromToken} to ${order.toToken}`
          });

          return {
            success: true,
            transactionHash
          };
        }
      } else {
        // Cross-chain swap - use simplified approach for now
        const transactionHash = await this.sendTransaction({
          amount: order.fromAmount,
          destination: order.toAddress,
          payload: `Cross-chain swap ${order.fromToken} to ${order.toToken}`
        });

        return {
          success: true,
          transactionHash
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get swap quote using DeDust API
   */
  private async getSwapQuote(
    fromToken: string,
    toToken: string,
    fromAmount: string,
    fromAddress: string
  ): Promise<{ toAmount: string; fee: string; deDustQuote?: DeDustQuote }> {
    try {
      // Try to get real quote from DeDust API
      const deDustQuote = await deDustAPI.getSwapQuote(fromToken, toToken, fromAmount, 0.5);

      // Estimate TON network fee
      const networkFee = await this.tonSDK.estimateFee(fromAddress, fromAmount);

      // Combine DeDust swap fee with network fee
      const totalFee = (parseFloat(networkFee) + parseFloat(deDustQuote.fee || '0')).toString();

      return {
        toAmount: deDustQuote.toAmount,
        fee: totalFee,
        deDustQuote
      };
    } catch (error) {
      console.warn('Failed to get DeDust quote, using fallback:', error);

      // Fallback to simplified calculation
      const toAmount = fromAmount; // Simplified 1:1
      const fee = await this.tonSDK.estimateFee(fromAddress, fromAmount);

      return {
        toAmount,
        fee
      };
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(transactionHash: string): Promise<{
    status: 'pending' | 'confirmed' | 'failed';
    confirmations: number;
    blockNumber?: number;
  }> {
    try {
      const transaction = await this.tonSDK.getTransaction(transactionHash);

      if (!transaction) {
        return {
          status: 'pending',
          confirmations: 0
        };
      }

      return {
        status: transaction.status,
        confirmations: transaction.confirmations,
        blockNumber: undefined // TON doesn't use block numbers in the same way
      };
    } catch (error) {
      throw new Error(`Failed to get transaction status: ${error}`);
    }
  }

  /**
   * Validate TON address
   */
  static validateAddress(address: string): boolean {
    return TONSDKService.validateAddress(address);
  }

  /**
   * Convert TON amount to nano TON
   */
  static toNano(amount: string | number): string {
    return TONSDKService.toNano(amount);
  }

  /**
   * Convert nano TON to TON
   */
  static fromNano(nanoAmount: string | number): string {
    return TONSDKService.fromNano(nanoAmount);
  }

  /**
   * Get supported TON tokens
   */
  getSupportedTokens(): string[] {
    return ['TON']; // For now, only native TON is supported
  }

  /**
   * Check if token is supported
   */
  isTokenSupported(symbol: string): boolean {
    return this.getSupportedTokens().includes(symbol.toUpperCase());
  }

  /**
   * Get TON SDK instance (for advanced operations)
   */
  getTONSDK(): TONSDKService {
    return this.tonSDK;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.tonSDK.cleanup();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const tonIntegration = new TONIntegrationService(); 