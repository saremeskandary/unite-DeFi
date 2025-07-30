import {
  FusionSDK,
  NetworkEnum,
  PrivateKeyProviderConnector,
  Web3Like,
  OrderParams,
} from '@1inch/fusion-sdk';
import { SDK as CrossChainSDK, OrderInfo, SupportedChain, EvmCrossChainOrder } from '@1inch/cross-chain-sdk';
import { ethers, TransactionRequest } from 'ethers';
import axios from 'axios';
import {
  ERC20ToBTCParams,
  BTCToERC20Params,
  FusionOrderResult,
  BitcoinSwapOrderExtension,
  BitcoinSwapOrder
} from './bitcoin-swap-types';

/**
 * Fusion Order Manager
 * Handles 1inch Fusion+ order creation, submission, and monitoring
 */
export class FusionOrderManager {
  private fusionSDK: FusionSDK;
  private crossChainSDK: CrossChainSDK;
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private network: NetworkEnum;

  constructor(
    privateKey: string,
    rpcUrl: string,
    network: NetworkEnum = NetworkEnum.ETHEREUM
  ) {
    this.network = network;
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.signer = new ethers.Wallet(privateKey, this.provider);

    // Initialize 1inch SDKs
    const web3Provider: Web3Like = {
      eth: {
        call: (transactionConfig: TransactionRequest) => {
          return this.provider.call(transactionConfig);
        }
      },
      extend: () => { }
    };
    const connector = new PrivateKeyProviderConnector(privateKey, web3Provider);

    this.fusionSDK = new FusionSDK({
      url: 'https://api.1inch.dev/fusion',
      network: this.network,
      blockchainProvider: connector
    });

    this.crossChainSDK = new CrossChainSDK({
      url: 'https://api.1inch.dev/fusion-plus',
      authKey: process.env.INCH_API_KEY || '',
    });
  }

  /**
   * Create Fusion+ order for ERC20 → Native BTC swap
   */
  async createERC20ToBTCOrder(params: ERC20ToBTCParams): Promise<FusionOrderResult> {
    try {
      // Generate hash160 of secret (Bitcoin standard)
      const secretBuffer = Buffer.from(params.secret, 'utf8');
      const secretHash = require('crypto').createHash('sha256').update(secretBuffer).digest();
      const hash160 = require('crypto').createHash('ripemd160').update(secretHash).digest();

      // Get user's Bitcoin public key from address (simplified)
      const userPubKey = Buffer.alloc(33, 0); // Placeholder

      // Create Bitcoin extension for Fusion+ order
      const bitcoinExtension: BitcoinSwapOrderExtension = {
        chainId: 'bitcoin',
        swapType: 'erc20_to_btc',
        destinationAddress: params.btcAddress,
        destinationAmount: params.btcAmount.toString(),
        secretHash: hash160.toString('hex'),
        timelock: Math.floor(Date.now() / 1000) + 86400, // 24 hours
        recipientPublicKey: userPubKey.toString('hex')
      };

      const orderParams: OrderParams = {
        fromTokenAddress: params.makerAsset,
        toTokenAddress: '0x0000000000000000000000000000000000000000', // Placeholder
        amount: params.makerAmount,
        walletAddress: this.signer.address,
      };

      // Create Fusion order using 1inch SDK
      const fusionOrder = await this.fusionSDK.placeOrder(orderParams);

      console.log('ERC20→BTC Fusion+ order created:', fusionOrder.orderHash);
      return { fusionOrder, secretHash: hash160.toString('hex') };

    } catch (error) {
      console.error('Error creating ERC20→BTC order:', error);
      throw error;
    }
  }

  /**
   * Create Fusion+ order for Native BTC → ERC20 swap
   */
  async createBTCToERC20Order(params: BTCToERC20Params): Promise<FusionOrderResult> {
    try {
      const secretBuffer = Buffer.from(params.secret, 'utf8');
      const secretHash = require('crypto').createHash('sha256').update(secretBuffer).digest();
      const hash160 = require('crypto').createHash('ripemd160').update(secretHash).digest();

      const bitcoinExtension: BitcoinSwapOrderExtension = {
        chainId: 'bitcoin',
        swapType: 'btc_to_erc20',
        sourceTxId: params.btcTxId,
        sourceAmount: params.btcAmount.toString(),
        secretHash: hash160.toString('hex'),
        timelock: Math.floor(Date.now() / 1000) + 86400,
        ethRecipient: params.ethAddress
      };

      const orderParams: OrderParams = {
        fromTokenAddress: '0x0000000000000000000000000000000000000000', // BTC placeholder
        toTokenAddress: params.takerAsset,
        amount: params.btcAmount.toString(),
        walletAddress: this.signer.address,
      };

      const fusionOrder = await this.fusionSDK.placeOrder(orderParams);

      console.log('BTC→ERC20 Fusion+ order created:', fusionOrder.orderHash);
      return { fusionOrder, secretHash: hash160.toString('hex') };

    } catch (error) {
      console.error('Error creating BTC→ERC20 order:', error);
      throw error;
    }
  }

  /**
   * Submit order to 1inch Fusion+ network
   */
  async submitBitcoinSwapOrder(order: OrderInfo, secretHashes: string[]) {
    try {
      const submission = await this.crossChainSDK.submitOrder(
        this.network as SupportedChain,
        order as unknown as EvmCrossChainOrder,
        (order as any).quoteId,
        secretHashes
      );

      console.log('Bitcoin swap order submitted:', submission.orderHash);

      // Start monitoring order status
      this.monitorOrderStatus(submission.orderHash);

      return submission;

    } catch (error) {
      console.error('Error submitting Bitcoin swap order:', error);
      throw error;
    }
  }

  /**
   * Monitor order status using 1inch API
   */
  async monitorOrderStatus(orderHash: string) {
    const checkStatus = async () => {
      try {
        const response = await axios.get(
          `https://api.1inch.dev/fusion-plus/orders/${orderHash}`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.INCH_API_KEY}`
            }
          }
        );

        const order = response.data;
        console.log(`Order ${orderHash} status:`, order.status);

        switch (order.status) {
          case 'pending':
            console.log('Order waiting for resolver...');
            setTimeout(checkStatus, 10000);
            break;
          case 'matched':
            console.log('Order matched with resolver:', order.resolverAddress);
            await this.handleOrderMatched(order);
            break;
          case 'completed':
            console.log('Order completed successfully');
            return order;
          case 'failed':
            console.log('Order failed:', order.failureReason);
            break;
          default:
            setTimeout(checkStatus, 10000);
        }

      } catch (error) {
        console.error('Error checking order status:', error);
        setTimeout(checkStatus, 10000);
      }
    };

    await checkStatus();
  }

  /**
   * Handle matched order based on swap type
   */
  async handleOrderMatched(order: BitcoinSwapOrder) {
    const extension = order.extension;

    if (extension.swapType === 'erc20_to_btc') {
      await this.handleERC20ToBTCSwap(order);
    } else if (extension.swapType === 'btc_to_erc20') {
      await this.handleBTCToERC20Swap(order);
    }
  }

  /**
   * Handle ERC20 → BTC swap (user locks ERC20, resolver locks BTC)
   */
  async handleERC20ToBTCSwap(order: BitcoinSwapOrder) {
    try {
      const extension = order.extension;
      console.log('Handling ERC20→BTC swap for order:', order.orderHash);

      // This would trigger the Bitcoin HTLC funding process
      // Implementation depends on the specific resolver logic

    } catch (error) {
      console.error('Error handling ERC20→BTC swap:', error);
    }
  }

  /**
   * Handle BTC → ERC20 swap (user locks BTC, resolver locks ERC20)
   */
  async handleBTCToERC20Swap(order: BitcoinSwapOrder) {
    try {
      const extension = order.extension;
      console.log('Handling BTC→ERC20 swap for order:', order.orderHash);

      // This would trigger the ERC20 escrow process
      // Implementation depends on the specific resolver logic

    } catch (error) {
      console.error('Error handling BTC→ERC20 swap:', error);
    }
  }

  /**
   * Complete Fusion swap on Ethereum side
   */
  async completeFusionSwap(orderHash: string, secret: Buffer): Promise<void> {
    try {
      const response = await axios.post(
        `https://api.1inch.dev/fusion-plus/orders/${orderHash}/complete`,
        {
          secret: secret.toString('hex'),
          preimage: secret
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.INCH_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Fusion swap completed:', response.data);

    } catch (error) {
      console.error('Error completing Fusion swap:', error);
    }
  }

  /**
   * Create ERC20 token escrow for BTC → ERC20 swap
   */
  async createERC20Escrow(params: {
    orderHash: string;
    tokenAddress: string;
    amount: string;
    secretHash: string;
    timelock: number;
  }): Promise<{ escrowAddress: string; txHash: string }> {
    try {
      // Use 1inch Fusion API to create ERC20 escrow
      const response = await axios.post(
        `https://api.1inch.dev/fusion-plus/orders/${params.orderHash}/erc20-escrow`,
        {
          tokenAddress: params.tokenAddress,
          amount: params.amount,
          secretHash: params.secretHash,
          timelock: params.timelock,
          recipient: this.signer.address
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.INCH_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('ERC20 escrow created:', response.data);

      return {
        escrowAddress: response.data.escrowAddress,
        txHash: response.data.txHash
      };

    } catch (error) {
      console.error('Error creating ERC20 escrow:', error);
      throw error;
    }
  }

  /**
   * Notify 1inch network about Bitcoin deposit
   */
  async notifyBitcoinDeposit(
    orderHash: string,
    txId: string,
    htlcAddress: string
  ): Promise<void> {
    try {
      const response = await axios.post(
        `https://api.1inch.dev/fusion-plus/orders/${orderHash}/bitcoin-deposit`,
        {
          txId: txId,
          htlcAddress: htlcAddress,
          confirmations: 1
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.INCH_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Bitcoin deposit notified:', response.data);

    } catch (error) {
      console.error('Error notifying Bitcoin deposit:', error);
    }
  }
} 