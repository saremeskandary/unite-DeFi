import { ethers } from 'ethers';
import { EthereumProviderService } from './ethereum/ethereum-provider';
import { EthereumHTLCService } from './ethereum/ethereum-htlc';
import { BitcoinAPIService, BitcoinNetworks } from './bitcoin/bitcoin-api';
import { createHtlcScript } from './bitcoin/bitcoin-htlc';
import * as bitcoin from 'bitcoinjs-lib';

export interface CrossChainSwap {
  id: string;
  fromChain: 'ethereum' | 'bitcoin';
  toChain: 'ethereum' | 'bitcoin';
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  fromAddress: string;
  toAddress: string;
  secret: string;
  secretHash: string;
  locktime: number;
  status: 'pending' | 'funded' | 'redeemed' | 'refunded' | 'completed' | 'failed';
  ethereumContractId?: string;
  bitcoinHtlcAddress?: string;
  bitcoinFundingTxId?: string;
  ethereumTxHash?: string;
  bitcoinTxHash?: string;
  createdAt: string;
  expiresAt: string;
}

export interface SwapInitiationParams {
  fromChain: 'ethereum' | 'bitcoin';
  toChain: 'ethereum' | 'bitcoin';
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  fromAddress: string;
  toAddress: string;
  locktime?: number;
}

export interface SwapStatus {
  swap: CrossChainSwap;
  ethereumStatus?: {
    funded: boolean;
    withdrawn: boolean;
    refunded: boolean;
    confirmations: number;
  };
  bitcoinStatus?: {
    funded: boolean;
    withdrawn: boolean;
    refunded: boolean;
    confirmations: number;
  };
}

export class MultiChainService {
  private ethereumProvider: EthereumProviderService;
  private ethereumHTLC: EthereumHTLCService;
  private bitcoinAPI: BitcoinAPIService;
  private activeSwaps: Map<string, CrossChainSwap> = new Map();

  constructor() {
    this.ethereumProvider = new EthereumProviderService();
    this.ethereumHTLC = this.ethereumProvider.getHTLCService();
    this.bitcoinAPI = new BitcoinAPIService(BitcoinNetworks.testnet); // Default to testnet
  }

  /**
   * Initialize the multi-chain service
   */
  async initialize(): Promise<{ success: boolean; error?: string }> {
    try {
      // Initialize Ethereum provider
      const ethStatus = await this.ethereumProvider.initializeProvider();
      if (!ethStatus.connected) {
        throw new Error('Failed to connect to Ethereum provider');
      }

      return { success: true };

    } catch (error) {
      console.error('Error initializing multi-chain service:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Initialization failed'
      };
    }
  }

  /**
   * Initiate a cross-chain swap
   */
  async initiateSwap(params: SwapInitiationParams): Promise<{ success: boolean; swap?: CrossChainSwap; error?: string }> {
    try {
      // Generate secret and hash
      const secret = this.ethereumHTLC.generateSecret();
      const secretHash = this.ethereumHTLC.generateSecretHash(secret);

      // Set default locktime if not provided (24 hours from now)
      const locktime = params.locktime || Math.floor(Date.now() / 1000) + 86400;

      // Create swap object
      const swap: CrossChainSwap = {
        id: `swap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fromChain: params.fromChain,
        toChain: params.toChain,
        fromToken: params.fromToken,
        toToken: params.toToken,
        fromAmount: params.fromAmount,
        toAmount: params.toAmount,
        fromAddress: params.fromAddress,
        toAddress: params.toAddress,
        secret,
        secretHash,
        locktime,
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(locktime * 1000).toISOString()
      };

      // Store the swap
      this.activeSwaps.set(swap.id, swap);

      return {
        success: true,
        swap
      };

    } catch (error) {
      console.error('Error initiating swap:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initiate swap'
      };
    }
  }

  /**
   * Fund the HTLC on the source chain
   */
  async fundSwap(swapId: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const swap = this.activeSwaps.get(swapId);
      if (!swap) {
        throw new Error('Swap not found');
      }

      if (swap.status !== 'pending') {
        throw new Error('Swap is not in pending status');
      }

      if (swap.fromChain === 'ethereum') {
        return await this.fundEthereumHTLC(swap);
      } else if (swap.fromChain === 'bitcoin') {
        return await this.fundBitcoinHTLC(swap);
      } else {
        throw new Error('Unsupported source chain');
      }

    } catch (error) {
      console.error('Error funding swap:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fund swap'
      };
    }
  }

  /**
   * Fund Ethereum HTLC
   */
  private async fundEthereumHTLC(swap: CrossChainSwap): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const signer = await this.ethereumProvider.getProviderStatus();
      if (!signer.account) {
        throw new Error('No Ethereum account connected');
      }

      // Get HTLC contract address (this would be deployed on the network)
      const htlcContractAddress = process.env.ETHEREUM_HTLC_CONTRACT_ADDRESS;
      if (!htlcContractAddress) {
        throw new Error('HTLC contract address not configured');
      }

      const result = await this.ethereumHTLC.createHTLC({
        secretHash: swap.secretHash,
        recipient: swap.toAddress,
        locktime: swap.locktime,
        amount: swap.fromAmount,
        signer: await this.ethereumProvider.getProvider().getSigner(),
        contractAddress: htlcContractAddress
      });

      if (result.success && result.contractId) {
        swap.ethereumContractId = result.contractId;
        swap.status = 'funded';
        swap.ethereumTxHash = result.contractId; // For now, use contract ID as tx hash
        this.activeSwaps.set(swap.id, swap);

        return {
          success: true,
          txHash: result.contractId
        };
      } else {
        throw new Error(result.error || 'Failed to create Ethereum HTLC');
      }

    } catch (error) {
      console.error('Error funding Ethereum HTLC:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fund Ethereum HTLC'
      };
    }
  }

  /**
   * Fund Bitcoin HTLC
   */
  private async fundBitcoinHTLC(swap: CrossChainSwap): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      // Create Bitcoin HTLC script
      const htlcScript = createHtlcScript({
        secretHash: swap.secretHash,
        locktime: swap.locktime,
        senderPubKey: swap.fromAddress, // This should be the actual public key
        receiverPubKey: swap.toAddress, // This should be the actual public key
        network: this.bitcoinAPI.getNetwork()
      });

      swap.bitcoinHtlcAddress = htlcScript.address;

      // For now, we'll simulate the funding transaction
      // In a real implementation, this would create and broadcast a Bitcoin transaction
      const mockTxId = `btc_funding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      swap.bitcoinFundingTxId = mockTxId;
      swap.status = 'funded';
      swap.bitcoinTxHash = mockTxId;
      this.activeSwaps.set(swap.id, swap);

      return {
        success: true,
        txHash: mockTxId
      };

    } catch (error) {
      console.error('Error funding Bitcoin HTLC:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fund Bitcoin HTLC'
      };
    }
  }

  /**
   * Redeem the swap on the destination chain
   */
  async redeemSwap(swapId: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const swap = this.activeSwaps.get(swapId);
      if (!swap) {
        throw new Error('Swap not found');
      }

      if (swap.status !== 'funded') {
        throw new Error('Swap is not funded');
      }

      if (swap.toChain === 'ethereum') {
        return await this.redeemEthereumHTLC(swap);
      } else if (swap.toChain === 'bitcoin') {
        return await this.redeemBitcoinHTLC(swap);
      } else {
        throw new Error('Unsupported destination chain');
      }

    } catch (error) {
      console.error('Error redeeming swap:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to redeem swap'
      };
    }
  }

  /**
   * Redeem Ethereum HTLC
   */
  private async redeemEthereumHTLC(swap: CrossChainSwap): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      if (!swap.ethereumContractId) {
        throw new Error('Ethereum contract ID not found');
      }

      const htlcContractAddress = process.env.ETHEREUM_HTLC_CONTRACT_ADDRESS;
      if (!htlcContractAddress) {
        throw new Error('HTLC contract address not configured');
      }

      const result = await this.ethereumHTLC.withdrawHTLC({
        contractId: swap.ethereumContractId,
        preimage: swap.secret,
        signer: await this.ethereumProvider.getProvider().getSigner(),
        contractAddress: htlcContractAddress
      });

      if (result.success) {
        swap.status = 'completed';
        this.activeSwaps.set(swap.id, swap);

        return {
          success: true,
          txHash: result.txHash
        };
      } else {
        throw new Error(result.error || 'Failed to withdraw from Ethereum HTLC');
      }

    } catch (error) {
      console.error('Error redeeming Ethereum HTLC:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to redeem Ethereum HTLC'
      };
    }
  }

  /**
   * Redeem Bitcoin HTLC
   */
  private async redeemBitcoinHTLC(swap: CrossChainSwap): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      if (!swap.bitcoinHtlcAddress) {
        throw new Error('Bitcoin HTLC address not found');
      }

      // For now, we'll simulate the redemption transaction
      // In a real implementation, this would create and broadcast a Bitcoin transaction
      const mockTxId = `btc_redeem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      swap.status = 'completed';
      swap.bitcoinTxHash = mockTxId;
      this.activeSwaps.set(swap.id, swap);

      return {
        success: true,
        txHash: mockTxId
      };

    } catch (error) {
      console.error('Error redeeming Bitcoin HTLC:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to redeem Bitcoin HTLC'
      };
    }
  }

  /**
   * Get swap status
   */
  async getSwapStatus(swapId: string): Promise<SwapStatus | null> {
    try {
      const swap = this.activeSwaps.get(swapId);
      if (!swap) {
        return null;
      }

      const status: SwapStatus = { swap };

      // Check Ethereum status if applicable
      if (swap.ethereumContractId) {
        const htlcContractAddress = process.env.ETHEREUM_HTLC_CONTRACT_ADDRESS;
        if (htlcContractAddress) {
          const ethStatus = await this.ethereumHTLC.getHTLCStatus(swap.ethereumContractId, htlcContractAddress);
          if (ethStatus) {
            status.ethereumStatus = {
              funded: ethStatus.exists,
              withdrawn: ethStatus.withdrawn,
              refunded: ethStatus.refunded,
              confirmations: 0 // Would need to get from transaction receipt
            };
          }
        }
      }

      // Check Bitcoin status if applicable
      if (swap.bitcoinFundingTxId) {
        const btcStatus = await this.bitcoinAPI.monitorTransaction(swap.bitcoinFundingTxId);
        status.bitcoinStatus = {
          funded: btcStatus.confirmed,
          withdrawn: false, // Would need to check for redemption transaction
          refunded: false, // Would need to check for refund transaction
          confirmations: btcStatus.confirmations
        };
      }

      return status;

    } catch (error) {
      console.error('Error getting swap status:', error);
      return null;
    }
  }

  /**
   * Get all active swaps
   */
  getActiveSwaps(): CrossChainSwap[] {
    return Array.from(this.activeSwaps.values());
  }

  /**
   * Get swap by ID
   */
  getSwap(swapId: string): CrossChainSwap | undefined {
    return this.activeSwaps.get(swapId);
  }

  /**
   * Get Ethereum provider service
   */
  getEthereumProvider(): EthereumProviderService {
    return this.ethereumProvider;
  }

  /**
   * Get Bitcoin API service
   */
  getBitcoinAPI(): BitcoinAPIService {
    return this.bitcoinAPI;
  }
} 