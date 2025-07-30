#!/usr/bin/env node

import { OneInchBitcoinIntegration, exampleUsage } from '../src/lib/1inch-bitcoin-integration';
import { BitcoinKeyGenerator } from '../src/lib/bitcoin-key-generator';

/**
 * Example script demonstrating 1inch + Bitcoin integration
 * Usage: npx tsx scripts/example-1inch-integration.ts
 */

async function main() {
  console.log('🔗 1inch + Bitcoin Integration Example\n');

  // Check if environment variables are set
  const inchApiKey = process.env.NEXT_PUBLIC_INCH_API_KEY;
  const btcPrivateKey = process.env.NEXT_PUBLIC_BTC_PRIVATE_KEY_WIF;
  const ethPrivateKey = process.env.NEXT_PUBLIC_ETH_PRIVATE_KEY;
  const ethRpcUrl = process.env.NEXT_PUBLIC_ETH_RPC_URL;

  if (!inchApiKey || !btcPrivateKey || !ethPrivateKey || !ethRpcUrl) {
    console.log('⚠️  Environment variables not set. Using demo mode.\n');

    // Generate a demo Bitcoin key
    const demoKey = BitcoinKeyGenerator.generateWIFKeyPair(true);
    console.log('📝 Generated Demo Bitcoin Key:');
    console.log(`  WIF: ${demoKey.privateKeyWIF}`);
    console.log(`  Address: ${demoKey.address}`);
    console.log(`  Network: ${demoKey.network}\n`);

    console.log('🔧 To use real integration, set these environment variables:');
    console.log('  NEXT_PUBLIC_INCH_API_KEY=your_1inch_api_key');
    console.log('  NEXT_PUBLIC_BTC_PRIVATE_KEY_WIF=your_bitcoin_private_key');
    console.log('  NEXT_PUBLIC_ETH_PRIVATE_KEY=your_ethereum_private_key');
    console.log('  NEXT_PUBLIC_ETH_RPC_URL=your_ethereum_rpc_url\n');

    console.log('📚 Get your 1inch API key from: https://portal.1inch.dev/');
    console.log('📚 Get your Ethereum RPC URL from: https://infura.io/ or https://alchemy.com/\n');

    return;
  }

  try {
    // Initialize the integration
    const integration = new OneInchBitcoinIntegration(
      inchApiKey,
      btcPrivateKey,
      ethPrivateKey,
      ethRpcUrl,
      true // Use testnet
    );

    console.log('✅ Integration initialized successfully!\n');

    // Get Bitcoin address
    const btcAddress = integration.getBitcoinAddress();
    console.log('📝 Bitcoin Address:', btcAddress);

    // Get Bitcoin balance
    const btcBalance = await integration.getBitcoinBalance();
    console.log('💰 Bitcoin Balance:', btcBalance, 'BTC\n');

    // Example: Get quote for USDC to Bitcoin
    console.log('📊 Getting swap quote (USDC → Bitcoin)...');

    try {
      const quote = await integration.getERC20ToBitcoinQuote(
        '0xA0b86a33E6441b8c4C3131C8C5C9C5C9C5C9C5C9', // USDC address (example)
        '1000000000', // 1000 USDC (6 decimals)
        btcAddress
      );

      console.log('✅ Quote received:');
      console.log(`  From: ${quote.fromTokenAmount} USDC`);
      console.log(`  To: ${quote.toTokenAmount} WBTC`);
      console.log(`  Estimated Gas: ${quote.estimatedGas} wei`);
      console.log(`  Protocols: ${quote.protocols.length} protocols used\n`);

      console.log('💡 To execute this swap, uncomment the execution code in the script.\n');

    } catch (error) {
      console.log('❌ Error getting quote:', error);
      console.log('💡 This is expected if the 1inch API key is not set or invalid.\n');
    }

    // Example: Send Bitcoin
    console.log('📤 Example: Sending Bitcoin...');
    try {
      // Generate a new address to send to
      const recipientKey = BitcoinKeyGenerator.generateWIFKeyPair(true);
      console.log(`  Recipient Address: ${recipientKey.address}`);

      if (btcBalance > 0.001) {
        const txHash = await integration.sendBitcoin(recipientKey.address, 0.001);
        console.log(`  ✅ Transaction sent: ${txHash}`);
      } else {
        console.log('  ⚠️  Insufficient balance for sending (need > 0.001 BTC)');
      }
    } catch (error) {
      console.log('  ❌ Error sending Bitcoin:', error);
    }

  } catch (error) {
    console.error('❌ Error initializing integration:', error);
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

export { main }; 