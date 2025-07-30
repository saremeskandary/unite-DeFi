import { NetworkEnum } from '@1inch/fusion-sdk';
import { ethers } from 'ethers';
import { BitcoinHTLCOperations } from './bitcoin-htlc-operations';
import { BitcoinNetworkOperations } from './bitcoin-network-operations';
import { FusionOrderManager } from './fusion-order-manager';
import { SwapMonitoringService } from './swap-monitoring-service';
import {
  ERC20ToBTCParams,
  BTCToERC20Params,
  FusionOrderResult,
  BitcoinSwapOrder
} from './bitcoin-swap-types';



/**
 * Complete 1inch Fusion+ Bitcoin Cross-Chain Implementation
 * Handles native BTC ↔ ERC20 token atomic swaps
 */
export class FusionBitcoinIntegration {
  private htlcOperations: BitcoinHTLCOperations;
  private networkOperations: BitcoinNetworkOperations;
  private orderManager: FusionOrderManager;
  private monitoringService: SwapMonitoringService;

  constructor(
    private privateKey: string = process.env.NEXT_PUBLIC_ETH_PRIVATE_KEY || '0x1234567890123456789012345678901234567890123456789012345678901234',
    private btcPrivateKeyWIF: string = process.env.NEXT_PUBLIC_BTC_PRIVATE_KEY_WIF || 'cVW24FEKqjU1p6qn9TaLTrB8qvaGTqK5YJfAH6aDzPLhFqJCPNcF',
    private rpcUrl: string = process.env.NEXT_PUBLIC_ETH_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/test-key',
    private network: NetworkEnum = NetworkEnum.ETHEREUM,
    private useBtcTestnet: boolean = true
  ) {
    // Initialize all service modules
    this.htlcOperations = new BitcoinHTLCOperations(useBtcTestnet);
    this.networkOperations = new BitcoinNetworkOperations(btcPrivateKeyWIF, useBtcTestnet);
    this.orderManager = new FusionOrderManager(privateKey, rpcUrl, network);
    this.monitoringService = new SwapMonitoringService(
      this.htlcOperations,
      this.networkOperations,
      this.orderManager
    );

    console.log(`Resolver BTC Address: ${this.networkOperations.getResolverAddress()}`);
  }

  /**
   * Create Fusion+ order for ERC20 → Native BTC swap
   */
  async createERC20ToBTCOrder(params: ERC20ToBTCParams): Promise<FusionOrderResult> {
    return await this.orderManager.createERC20ToBTCOrder(params);
  }

  /**
   * Create Fusion+ order for Native BTC → ERC20 swap
   */
  async createBTCToERC20Order(params: BTCToERC20Params): Promise<FusionOrderResult> {
    return await this.orderManager.createBTCToERC20Order(params);
  }

  /**
   * Submit order to 1inch Fusion+ network
   */
  async submitBitcoinSwapOrder(order: any, secretHashes: string[]) {
    return await this.orderManager.submitBitcoinSwapOrder(order, secretHashes);
  }

  /**
   * Handle ERC20 → BTC swap execution
   */
  async handleERC20ToBTCSwap(order: BitcoinSwapOrder): Promise<void> {
    return await this.monitoringService.handleERC20ToBTCSwap(order);
  }

  /**
   * Handle BTC → ERC20 swap execution
   */
  async handleBTCToERC20Swap(order: BitcoinSwapOrder): Promise<void> {
    return await this.monitoringService.handleBTCToERC20Swap(order);
  }

  /**
   * Get resolver's Bitcoin address
   */
  getResolverAddress(): string {
    return this.networkOperations.getResolverAddress();
  }

  /**
   * Get Bitcoin UTXOs for an address
   */
  async getBitcoinUTXOs(address: string) {
    return await this.networkOperations.getBitcoinUTXOs(address);
  }

  /**
   * Get Bitcoin address transaction history
   */
  async getBitcoinAddressHistory(address: string) {
    return await this.networkOperations.getBitcoinAddressHistory(address);
  }

  /**
   * Verify Bitcoin transaction
   */
  async verifyBitcoinTransaction(txId: string, expectedAmount: string): Promise<boolean> {
    return await this.networkOperations.verifyBitcoinTransaction(txId, expectedAmount);
  }
}

// Usage Example
export async function createBitcoinSwapDemo() {
  const integration = new FusionBitcoinIntegration(
    undefined, // Uses NEXT_PUBLIC_ETH_PRIVATE_KEY from env
    undefined, // Uses NEXT_PUBLIC_BTC_PRIVATE_KEY_WIF from env
    undefined, // Uses NEXT_PUBLIC_ETH_RPC_URL from env
    NetworkEnum.ETHEREUM,
    true // Use testnet
  );

  // Example 1: ERC20 → Native BTC swap
  const { fusionOrder: erc20ToBtcOrder, secretHash } = await integration.createERC20ToBTCOrder({
    makerAsset: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
    makerAmount: ethers.parseUnits('0.1', 8).toString(), // 0.1 WBTC
    btcAddress: 'tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', // User's testnet address
    btcAmount: 10000000, // 0.1 BTC in satoshis
    secret: 'my-secret-phrase-for-atomic-swap-123'
  });

  await integration.submitBitcoinSwapOrder(erc20ToBtcOrder, [secretHash]);

  console.log('Bitcoin swap order created and submitted!');
}

