#!/usr/bin/env node

import { BitcoinKeyGenerator, demoKeyGeneration } from '../src/lib/bitcoin-key-generator';

/**
 * Command line script to generate Bitcoin WIF keys
 * Usage: npx tsx scripts/generate-bitcoin-keys.ts [options]
 */

const args = process.argv.slice(2);
const command = args[0];

console.log('🔑 Bitcoin WIF Key Generator\n');

switch (command) {
  case 'demo':
    // Run the full demo
    demoKeyGeneration();
    break;
    
  case 'testnet':
    // Generate a single testnet key
    console.log('📝 Generating Testnet Key Pair:');
    const testnetKey = BitcoinKeyGenerator.generateWIFKeyPair(true);
    console.log('Private Key (WIF):', testnetKey.privateKeyWIF);
    console.log('Public Key:', testnetKey.publicKey);
    console.log('Address:', testnetKey.address);
    console.log('Network:', testnetKey.network);
    break;
    
  case 'mainnet':
    // Generate a single mainnet key
    console.log('📝 Generating Mainnet Key Pair:');
    const mainnetKey = BitcoinKeyGenerator.generateWIFKeyPair(false);
    console.log('Private Key (WIF):', mainnetKey.privateKeyWIF);
    console.log('Public Key:', mainnetKey.publicKey);
    console.log('Address:', mainnetKey.address);
    console.log('Network:', mainnetKey.network);
    break;
    
  case 'multiple':
    // Generate multiple testnet keys
    const count = parseInt(args[1]) || 5;
    console.log(`🔢 Generating ${count} Testnet Key Pairs:`);
    const multipleKeys = BitcoinKeyGenerator.generateMultipleKeyPairs(count, true);
    multipleKeys.forEach((key, index) => {
      console.log(`\nKey ${index + 1}:`);
      console.log(`  WIF: ${key.privateKeyWIF}`);
      console.log(`  Address: ${key.address}`);
    });
    break;
    
  case 'validate':
    // Validate a WIF key
    const wifKey = args[1];
    if (!wifKey) {
      console.error('❌ Please provide a WIF key to validate');
      console.log('Usage: npx tsx scripts/generate-bitcoin-keys.ts validate <WIF_KEY>');
      process.exit(1);
    }
    console.log('✅ Validating WIF Key:');
    const validation = BitcoinKeyGenerator.validateWIF(wifKey);
    console.log('Is Valid:', validation.isValid);
    console.log('Network:', validation.network);
    if (validation.address) {
      console.log('Address:', validation.address);
    }
    if (validation.error) {
      console.log('Error:', validation.error);
    }
    break;
    
  case 'convert':
    // Convert hex private key to WIF
    const hexKey = args[1];
    const network = args[2] === 'mainnet' ? false : true;
    if (!hexKey) {
      console.error('❌ Please provide a hex private key to convert');
      console.log('Usage: npx tsx scripts/generate-bitcoin-keys.ts convert <HEX_KEY> [mainnet|testnet]');
      process.exit(1);
    }
    console.log('🔄 Converting Hex to WIF:');
    const convertedKey = BitcoinKeyGenerator.hexToWIF(hexKey, network);
    console.log('Private Key (WIF):', convertedKey.privateKeyWIF);
    console.log('Public Key:', convertedKey.publicKey);
    console.log('Address:', convertedKey.address);
    console.log('Network:', convertedKey.network);
    break;
    
  default:
    // Show help
    console.log('Usage: npx tsx scripts/generate-bitcoin-keys.ts <command> [options]\n');
    console.log('Commands:');
    console.log('  demo                    - Run full demo with multiple examples');
    console.log('  testnet                 - Generate a single testnet key pair');
    console.log('  mainnet                 - Generate a single mainnet key pair');
    console.log('  multiple [count]        - Generate multiple testnet keys (default: 5)');
    console.log('  validate <WIF_KEY>      - Validate a WIF private key');
    console.log('  convert <HEX_KEY> [net] - Convert hex private key to WIF (net: mainnet|testnet)');
    console.log('');
    console.log('Examples:');
    console.log('  npx tsx scripts/generate-bitcoin-keys.ts demo');
    console.log('  npx tsx scripts/generate-bitcoin-keys.ts testnet');
    console.log('  npx tsx scripts/generate-bitcoin-keys.ts multiple 10');
    console.log('  npx tsx scripts/generate-bitcoin-keys.ts validate cNcC6Zq3j3pn9Y9XhQ7jJ5K8mN2pQ4rT7vX1zA6bC9dE');
    console.log('  npx tsx scripts/generate-bitcoin-keys.ts convert 1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    break;
} 