import { FusionBitcoinIntegration, createBitcoinSwapDemo } from './fusion-bitcoin-integration';
import { NetworkEnum } from '@1inch/fusion-sdk';
import { ethers } from 'ethers';

/**
 * Example usage of the 1inch Fusion+ Bitcoin Integration
 * This file demonstrates how to use the FusionBitcoinIntegration class
 */

// Environment variables needed:
// ETH_PRIVATE_KEY - Your Ethereum private key
// BTC_PRIVATE_KEY_WIF - Your Bitcoin private key in WIF format
// ETH_RPC_URL - Ethereum RPC URL (e.g., Alchemy, Infura)
// INCH_API_KEY - 1inch API key

export class BitcoinSwapExamples {
  
  /**
   * Example 1: Swap ERC20 tokens (WBTC) for Native Bitcoin
   */
  static async swapERC20ToBitcoin() {
    try {
      // Initialize the integration
      const integration = new FusionBitcoinIntegration(
        process.env.ETH_PRIVATE_KEY!,
        process.env.BTC_PRIVATE_KEY_WIF!,
        process.env.ETH_RPC_URL!,
        NetworkEnum.ETHEREUM,
        true // Use Bitcoin testnet
      );

      // Create order to swap 0.1 WBTC for 0.1 BTC
      const { fusionOrder, secretHash } = await integration.createERC20ToBTCOrder({
        makerAsset: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC on Ethereum
        makerAmount: ethers.parseUnits('0.1', 8).toString(), // 0.1 WBTC (8 decimals)
        btcAddress: 'tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', // User's Bitcoin address
        btcAmount: 10000000, // 0.1 BTC in satoshis
        secret: 'my-secret-phrase-for-atomic-swap-' + Date.now() // Unique secret
      });

      // Submit the order to 1inch Fusion+ network
      const submission = await integration.submitBitcoinSwapOrder(fusionOrder, [secretHash]);
      
      console.log('ERC20→BTC swap order submitted:', submission.orderHash);
      return submission;

    } catch (error) {
      console.error('Error in ERC20→BTC swap:', error);
      throw error;
    }
  }

  /**
   * Example 2: Swap Native Bitcoin for ERC20 tokens (USDC)
   */
  static async swapBitcoinToERC20() {
    try {
      const integration = new FusionBitcoinIntegration(
        process.env.ETH_PRIVATE_KEY!,
        process.env.BTC_PRIVATE_KEY_WIF!,
        process.env.ETH_RPC_URL!,
        NetworkEnum.ETHEREUM,
        true
      );

      // Create order to swap 0.1 BTC for USDC
      const { fusionOrder, secretHash } = await integration.createBTCToERC20Order({
        btcTxId: 'your-bitcoin-transaction-id-here', // User's Bitcoin transaction ID
        btcAmount: 10000000, // 0.1 BTC in satoshis
        takerAsset: '0xA0b86a33E6441b8c4C8C1C1B8c4C8C1C1B8c4C8C1', // USDC address
        takerAmount: ethers.parseUnits('3000', 6).toString(), // 3000 USDC (6 decimals)
        ethAddress: '0xYourEthereumAddressHere', // User's Ethereum address
        secret: 'my-secret-phrase-for-atomic-swap-' + Date.now()
      });

      const submission = await integration.submitBitcoinSwapOrder(fusionOrder, [secretHash]);
      
      console.log('BTC→ERC20 swap order submitted:', submission.orderHash);
      return submission;

    } catch (error) {
      console.error('Error in BTC→ERC20 swap:', error);
      throw error;
    }
  }

  /**
   * Example 3: Monitor existing order status
   */
  static async monitorOrder(orderHash: string) {
    try {
      const integration = new FusionBitcoinIntegration(
        process.env.ETH_PRIVATE_KEY!,
        process.env.BTC_PRIVATE_KEY_WIF!,
        process.env.ETH_RPC_URL!,
        NetworkEnum.ETHEREUM,
        true
      );

      // Monitor the order status
      await integration.monitorOrderStatus(orderHash);

    } catch (error) {
      console.error('Error monitoring order:', error);
      throw error;
    }
  }

  /**
   * Example 4: Get Bitcoin UTXOs for an address
   */
  static async getBitcoinUTXOs(address: string) {
    try {
      const integration = new FusionBitcoinIntegration(
        process.env.ETH_PRIVATE_KEY!,
        process.env.BTC_PRIVATE_KEY_WIF!,
        process.env.ETH_RPC_URL!,
        NetworkEnum.ETHEREUM,
        true
      );

      const utxos = await integration.getBitcoinUTXOs(address);
      console.log('Bitcoin UTXOs:', utxos);
      return utxos;

    } catch (error) {
      console.error('Error getting Bitcoin UTXOs:', error);
      throw error;
    }
  }

  /**
   * Example 5: Verify a Bitcoin transaction
   */
  static async verifyBitcoinTransaction(txId: string, expectedAmount: string) {
    try {
      const integration = new FusionBitcoinIntegration(
        process.env.ETH_PRIVATE_KEY!,
        process.env.BTC_PRIVATE_KEY_WIF!,
        process.env.ETH_RPC_URL!,
        NetworkEnum.ETHEREUM,
        true
      );

      const isValid = await integration.verifyBitcoinTransaction(txId, expectedAmount);
      console.log('Bitcoin transaction valid:', isValid);
      return isValid;

    } catch (error) {
      console.error('Error verifying Bitcoin transaction:', error);
      throw error;
    }
  }
}

/**
 * Quick demo function that runs all examples
 */
export async function runAllExamples() {
  console.log('🚀 Starting 1inch Fusion+ Bitcoin Integration Examples...\n');

  try {
    // Example 1: ERC20 → BTC
    console.log('📤 Example 1: ERC20 → BTC Swap');
    const erc20ToBtcResult = await BitcoinSwapExamples.swapERC20ToBitcoin();
    console.log('✅ ERC20→BTC swap completed\n');

    // Example 2: BTC → ERC20 (commented out as it requires a real Bitcoin transaction)
    console.log('📥 Example 2: BTC → ERC20 Swap (requires real Bitcoin transaction)');
    // const btcToErc20Result = await BitcoinSwapExamples.swapBitcoinToERC20();
    console.log('⚠️  BTC→ERC20 swap requires a real Bitcoin transaction ID\n');

    // Example 3: Monitor order (if you have an order hash)
    console.log('👀 Example 3: Monitor Order Status');
    // await BitcoinSwapExamples.monitorOrder('your-order-hash-here');
    console.log('⚠️  Order monitoring requires a valid order hash\n');

    // Example 4: Get Bitcoin UTXOs
    console.log('💰 Example 4: Get Bitcoin UTXOs');
    const testAddress = 'tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
    await BitcoinSwapExamples.getBitcoinUTXOs(testAddress);
    console.log('✅ Bitcoin UTXOs retrieved\n');

    console.log('🎉 All examples completed successfully!');

  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}

// Export the main demo function
export { createBitcoinSwapDemo }; 