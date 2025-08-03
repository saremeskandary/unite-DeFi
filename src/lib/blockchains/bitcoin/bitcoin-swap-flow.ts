import { NetworkEnum } from '@1inch/fusion-sdk';
import { BitcoinHTLCOperations } from './bitcoin-htlc-operations';
import { BitcoinNetworkOperations } from './bitcoin-network-operations';
import { FusionOrderManager } from './fusion-order-manager';
import { SwapMonitoringService } from './swap-monitoring-service';

export interface BitcoinSwapFlowParams {
  fromToken: 'BTC' | 'ERC20';
  toToken: 'BTC' | 'ERC20';
  fromAmount: string;
  toAmount: string;
  userBitcoinAddress: string;
  userEthereumAddress: string;
  secret?: string;
}

export interface BitcoinSwapFlowResult {
  success: boolean;
  orderHash?: string;
  htlcAddress?: string;
  secretHash?: string;
  instructions?: string[];
  error?: string;
}

/**
 * Bitcoin Swap Flow Handler
 * 
 * This class handles the different flows for Bitcoin ↔ ERC20 swaps:
 * 
 * 1. ERC20 → BTC: User sends ERC20, receives BTC at their address
 * 2. BTC → ERC20: User sends BTC to HTLC, receives ERC20
 * 
 * Key differences from other chains:
 * - Bitcoin has no smart contracts, so we use HTLCs
 * - Users must manually send Bitcoin transactions
 * - No direct wallet connection possible
 * - Requires monitoring Bitcoin blockchain for confirmations
 */
export class BitcoinSwapFlow {
  private htlcOperations: BitcoinHTLCOperations;
  private networkOperations: BitcoinNetworkOperations;
  private orderManager: FusionOrderManager;
  private monitoringService: SwapMonitoringService;

  constructor(
    private privateKey: string,
    private btcPrivateKeyWIF: string,
    private rpcUrl: string = process.env.ETH_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/test-key',
    private network: NetworkEnum = NetworkEnum.ETHEREUM,
    private useBtcTestnet: boolean = true
  ) {
    this.htlcOperations = new BitcoinHTLCOperations(useBtcTestnet);
    this.networkOperations = new BitcoinNetworkOperations(btcPrivateKeyWIF, useBtcTestnet);
    this.orderManager = new FusionOrderManager(privateKey, rpcUrl, network);
    this.monitoringService = new SwapMonitoringService(
      this.htlcOperations,
      this.networkOperations,
      this.orderManager
    );
  }

  /**
   * Handle ERC20 → BTC Swap
   * 
   * Flow:
   * 1. User approves ERC20 tokens
   * 2. System locks ERC20 tokens in escrow
   * 3. System creates Bitcoin HTLC and funds it
   * 4. User receives Bitcoin at their address
   * 5. System monitors for secret reveal to complete swap
   */
  async handleERC20ToBTCSwap(params: BitcoinSwapFlowParams): Promise<BitcoinSwapFlowResult> {
    try {
      // 1. Generate secret and hash for HTLC
      const secret = params.secret || this.generateSecret();
      const secretHash = this.htlcOperations.generateSecretHash(secret);

      // 2. Create Fusion+ order for ERC20 → BTC
      const order = await this.orderManager.createERC20ToBTCOrder({
        makerAsset: params.fromToken === 'ERC20' ? '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' : '0x0000000000000000000000000000000000000000', // WBTC address
        makerAmount: params.fromAmount,
        btcAddress: params.userBitcoinAddress,
        btcAmount: parseInt(params.toAmount),
        secret: secret
      });

      // 3. Create Bitcoin HTLC script
      const htlcScript = this.htlcOperations.createBitcoinHTLCScript({
        secretHash,
        recipientPublicKey: Buffer.from(this.networkOperations.getResolverAddress(), 'hex'),
        lockTimeBlocks: await this.networkOperations.getCurrentBlockHeight() + 144 // 24 hours
      });

      // 4. Create HTLC address
      const htlcAddress = this.htlcOperations.createHTLCAddress(htlcScript);

      // 5. Fund the HTLC with Bitcoin
      const fundingTxId = await this.networkOperations.fundBitcoinHTLC({
        htlcAddress,
        amountSatoshis: parseInt(params.toAmount)
      });

      // 6. Start monitoring for secret reveal
      this.monitoringService.monitorSecretReveal(
        order.fusionOrder.orderHash,
        htlcAddress,
        htlcScript
      );

      return {
        success: true,
        orderHash: order.fusionOrder.orderHash,
        htlcAddress,
        secretHash: secretHash.toString('hex'),
        instructions: [
          'ERC20 tokens have been locked in escrow',
          `Bitcoin HTLC funded at address: ${htlcAddress}`,
          'Bitcoin will be sent to your address once the swap completes',
          'Monitor the order status for updates'
        ]
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle BTC → ERC20 Swap
   * 
   * Flow:
   * 1. User provides Bitcoin address where they'll send BTC
   * 2. System creates HTLC address for user to send BTC to
   * 3. System locks ERC20 tokens in escrow
   * 4. User manually sends BTC to HTLC address
   * 5. System monitors for BTC deposit
   * 6. Once BTC confirmed, ERC20 tokens are released
   */
  async handleBTCToERC20Swap(params: BitcoinSwapFlowParams): Promise<BitcoinSwapFlowResult> {
    try {
      // 1. Generate secret and hash for HTLC
      const secret = params.secret || this.generateSecret();
      const secretHash = this.htlcOperations.generateSecretHash(secret);

      // 2. Create Fusion+ order for BTC → ERC20
      const order = await this.orderManager.createBTCToERC20Order({
        btcTxId: '', // Will be filled when user sends BTC
        btcAmount: parseInt(params.fromAmount),
        takerAsset: params.toToken === 'ERC20' ? '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' : '0x0000000000000000000000000000000000000000',
        takerAmount: params.toAmount,
        ethAddress: params.userEthereumAddress,
        secret: secret
      });

      // 3. Create Bitcoin HTLC script for user to send BTC to
      const htlcScript = this.htlcOperations.createBitcoinHTLCScript({
        secretHash,
        recipientPublicKey: Buffer.from(params.userBitcoinAddress, 'hex'),
        lockTimeBlocks: await this.networkOperations.getCurrentBlockHeight() + 144 // 24 hours
      });

      // 4. Create HTLC address for user to send BTC to
      const htlcAddress = this.htlcOperations.createHTLCAddress(htlcScript);

      // 5. Start monitoring for Bitcoin deposit
      this.monitoringService.monitorBitcoinSecretReveal(
        order.fusionOrder.orderHash,
        htlcAddress,
        secretHash.toString('hex')
      );

      return {
        success: true,
        orderHash: order.fusionOrder.orderHash,
        htlcAddress,
        secretHash: secretHash.toString('hex'),
        instructions: [
          'ERC20 tokens have been locked in escrow',
          `Send exactly ${params.fromAmount} BTC to: ${htlcAddress}`,
          'Use the secret to claim your ERC20 tokens once BTC is confirmed',
          'Secret (keep safe): ' + secret,
          'Monitor the order status for updates'
        ]
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate a random secret for HTLC
   */
  private generateSecret(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Get swap instructions based on direction
   */
  getSwapInstructions(direction: 'erc20-to-btc' | 'btc-to-erc20'): string[] {
    if (direction === 'erc20-to-btc') {
      return [
        '1. Connect your Ethereum wallet',
        '2. Approve ERC20 token spending',
        '3. Confirm the swap transaction',
        '4. Bitcoin will be sent to your address automatically',
        '5. Monitor order status for completion'
      ];
    } else {
      return [
        '1. Connect your Ethereum wallet',
        '2. Confirm the swap order',
        '3. Send Bitcoin to the provided HTLC address',
        '4. Use the secret to claim your ERC20 tokens',
        '5. Monitor order status for completion'
      ];
    }
  }

  /**
   * Validate Bitcoin address
   */
  validateBitcoinAddress(address: string): boolean {
    const patterns = [
      /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/, // Legacy
      /^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/, // P2SH
      /^bc1[a-z0-9]{39,59}$/, // Bech32
      /^bc1[a-z0-9]{25,39}$/, // Bech32m
    ];

    return patterns.some(pattern => pattern.test(address));
  }

  /**
   * Get Bitcoin network info
   */
  getBitcoinNetworkInfo() {
    return {
      network: this.useBtcTestnet ? 'testnet' : 'mainnet',
      explorer: this.useBtcTestnet
        ? 'https://blockstream.info/testnet'
        : 'https://blockstream.info',
      confirmations: 3,
      estimatedTime: '10-30 minutes'
    };
  }
} 