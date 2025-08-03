// Cross Chain Resolver - Resolver logic for cross-chain swaps
import { CrossChainResolver as BitcoinCrossChainResolver } from '../blockchains/bitcoin/cross-chain-resolver';
import { CrossChainResolverConfig } from '../blockchains/bitcoin/cross-chain-resolver';
import { TONCrossChainResolver, TONCrossChainResolverConfig } from '../blockchains/ton/ton-cross-chain-resolver';
import * as bitcoin from 'bitcoinjs-lib';

/**
 * Fusion Cross-Chain Resolver
 * 
 * This class provides a unified interface for cross-chain resolution
 * across all supported blockchains (Bitcoin, TON, Tron, Ethereum)
 * using the 1inch Fusion+ protocol.
 */
export class FusionCrossChainResolver {
  private bitcoinResolver: BitcoinCrossChainResolver;
  private tonResolver: TONCrossChainResolver;
  private config: CrossChainResolverConfig;

  constructor(
    config: CrossChainResolverConfig,
    privateKey: string,
    rpcUrl: string
  ) {
    this.config = config;

    // Initialize Bitcoin resolver
    this.bitcoinResolver = new BitcoinCrossChainResolver(
      config,
      privateKey,
      rpcUrl
    );

    // Initialize TON resolver
    const tonConfig: TONCrossChainResolverConfig = {
      srcChainId: config.srcChainId,
      dstChainId: -239, // TON testnet
      srcEscrowFactory: config.srcEscrowFactory,
      dstEscrowFactory: 'EQDtonescrowfactory',
      srcResolver: config.srcResolver,
      dstResolver: 'EQDtonresolver',
      tonNetwork: 'testnet',
      minProfitThreshold: config.minProfitThreshold,
      maxGasPrice: config.maxGasPrice,
      timeoutSeconds: config.timeoutSeconds
    };

    this.tonResolver = new TONCrossChainResolver(
      tonConfig,
      privateKey,
      rpcUrl
    );
  }

  /**
 * Get the appropriate resolver for a given chain
 */
  getResolver(chainId: number): BitcoinCrossChainResolver | TONCrossChainResolver {
    if (chainId === 0) { // Bitcoin
      return this.bitcoinResolver;
    }

    if (chainId === -239 || chainId === -3) { // TON testnet or mainnet
      return this.tonResolver;
    }

    // Default to Bitcoin resolver for unsupported chains
    // TODO: Add Tron resolver when implemented
    return this.bitcoinResolver;
  }

  /**
   * Deploy source escrow for any chain
   */
  async deploySrc(params: any): Promise<{ txHash: string; blockHash: string }> {
    const resolver = this.getResolver(params.order.srcChainId);
    return resolver.deploySrc(params);
  }

  /**
   * Deploy destination escrow for any chain
   */
  async deployDst(immutables: any): Promise<{ txHash: string; blockTimestamp: number }> {
    const resolver = this.getResolver(immutables.dstChainId);
    return resolver.deployDst(immutables);
  }

  /**
   * Withdraw from escrow on any chain
   */
  async withdraw(params: any): Promise<{ txHash?: string }> {
    const chainId = params.chain === 'src' ? params.immutables.srcChainId : params.immutables.dstChainId;
    const resolver = this.getResolver(chainId);
    return resolver.withdraw(params);
  }

  /**
   * Cancel escrow on any chain
   */
  async cancel(params: any): Promise<{ txHash?: string }> {
    const chainId = params.chain === 'src' ? params.immutables.srcChainId : params.immutables.dstChainId;
    const resolver = this.getResolver(chainId);
    return resolver.cancel(params);
  }

  /**
 * Get resolver address for a specific chain
 */
  getResolverAddress(chainId: number): string {
    if (chainId === 0) { // Bitcoin
      return this.bitcoinResolver.getBitcoinResolverAddress();
    }

    if (chainId === -239 || chainId === -3) { // TON
      return this.tonResolver.getTONResolverAddress();
    }

    // Default to Ethereum address
    return this.bitcoinResolver.getResolverAddress();
  }

  /**
   * Get all orders across all chains
   */
  getAllOrders(): any[] {
    // Aggregate orders from all chains
    const bitcoinOrders = this.bitcoinResolver.getAllOrders();
    const tonOrders = this.tonResolver.getAllOrders();

    return [...bitcoinOrders, ...tonOrders];
  }

  /**
   * Get pending orders across all chains
   */
  getPendingOrders(): any[] {
    // Aggregate pending orders from all chains
    const bitcoinPending = this.bitcoinResolver.getPendingOrders();
    const tonPending = this.tonResolver.getPendingOrders();

    return [...bitcoinPending, ...tonPending];
  }

  /**
   * Check if order is expired
   */
  isOrderExpired(orderHash: string): boolean {
    // Check both resolvers for the order
    const bitcoinExpired = this.bitcoinResolver.isOrderExpired(orderHash);
    const tonExpired = this.tonResolver.isOrderExpired(orderHash);

    return bitcoinExpired || tonExpired;
  }

  /**
   * Expire orders across all chains
   */
  expireOrders(): void {
    this.bitcoinResolver.expireOrders();
    this.tonResolver.expireOrders();
    // TODO: Add Tron resolver when implemented
  }

  /**
   * Calculate escrow addresses for any chain combination
   */
  async calculateEscrowAddresses(
    srcEscrowEvent: any,
    dstDeployedAt: number,
    dstTaker: string,
    dstChainId?: number
  ): Promise<{ srcEscrowAddress: string; dstEscrowAddress: string }> {
    // Use appropriate resolver based on destination chain
    if (dstChainId === -239 || dstChainId === -3) { // TON
      return this.tonResolver.calculateEscrowAddresses(
        srcEscrowEvent,
        dstDeployedAt,
        dstTaker
      );
    }

    // Default to Bitcoin resolver
    return this.bitcoinResolver.calculateEscrowAddresses(
      srcEscrowEvent,
      dstDeployedAt,
      dstTaker
    );
  }

  /**
   * Get supported chain IDs
   */
  getSupportedChainIds(): number[] {
    return [
      1,    // Ethereum
      0,    // Bitcoin
      -239, // TON testnet
      -3    // TON mainnet
    ];
  }

  /**
   * Check if chain is supported
   */
  isChainSupported(chainId: number): boolean {
    return this.getSupportedChainIds().includes(chainId);
  }

  /**
   * Get chain name by ID
   */
  getChainName(chainId: number): string {
    switch (chainId) {
      case 1: return 'Ethereum';
      case 0: return 'Bitcoin';
      case -239: return 'TON Testnet';
      case -3: return 'TON Mainnet';
      default: return 'Unknown';
    }
  }
}

// Export specific resolvers for direct use
export { BitcoinCrossChainResolver as CrossChainResolver } from '../blockchains/bitcoin/cross-chain-resolver';
export { TONCrossChainResolver } from '../blockchains/ton/ton-cross-chain-resolver';
export type { CrossChainResolverConfig, CrossChainOrder } from '../blockchains/bitcoin/cross-chain-resolver';
export type { TONCrossChainResolverConfig, TONCrossChainOrder } from '../blockchains/ton/ton-cross-chain-resolver'; 