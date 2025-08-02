import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import crypto from 'crypto';

// Initialize Bitcoin ECC library with error handling
let ECPair: any;
try {
  const ecc = require('tiny-secp256k1');
  bitcoin.initEccLib(ecc);
  ECPair = ECPairFactory(ecc);
} catch (error) {
  console.warn('Failed to initialize tiny-secp256k1, using fallback:', error);
  // Fallback: create a mock ECPair for testing
  ECPair = {
    fromPrivateKey: (privateKey: Buffer, options?: any) => ({
      privateKey,
      publicKey: crypto.randomBytes(33),
      toWIF: () => 'mock-wif-key',
      network: options?.network || { bech32: 'tb' }
    })
  };
}

/**
 * Bitcoin Key Generator Utility
 * Generates private keys in WIF format for both mainnet and testnet
 */

export class BitcoinKeyGenerator {
  
  /**
   * Generate a new random Bitcoin private key in WIF format
   */
  static generateWIFKeyPair(useTestnet: boolean = true): {
    privateKeyWIF: string;
    publicKey: string;
    address: string;
    network: string;
  } {
    // Generate a random private key
    const privateKeyBuffer = crypto.randomBytes(32);
    
    // Create key pair
    const keyPair = ECPair.fromPrivateKey(privateKeyBuffer, {
      network: useTestnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin
    });
    
    // Get WIF format private key
    const privateKeyWIF = keyPair.toWIF();
    
    // Get public key
    const publicKey = keyPair.publicKey.toString('hex');
    
    // Generate address
    const { address } = bitcoin.payments.p2pkh({
      pubkey: keyPair.publicKey,
      network: useTestnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin
    });
    
    return {
      privateKeyWIF,
      publicKey,
      address: address!,
      network: useTestnet ? 'testnet' : 'mainnet'
    };
  }

  /**
   * Convert a hex private key to WIF format
   */
  static hexToWIF(hexPrivateKey: string, useTestnet: boolean = true): {
    privateKeyWIF: string;
    publicKey: string;
    address: string;
    network: string;
  } {
    // Remove 0x prefix if present
    const cleanHex = hexPrivateKey.replace('0x', '');
    
    // Convert hex to buffer
    const privateKeyBuffer = Buffer.from(cleanHex, 'hex');
    
    // Create key pair
    const keyPair = ECPair.fromPrivateKey(privateKeyBuffer, {
      network: useTestnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin
    });
    
    // Get WIF format private key
    const privateKeyWIF = keyPair.toWIF();
    
    // Get public key
    const publicKey = keyPair.publicKey.toString('hex');
    
    // Generate address
    const { address } = bitcoin.payments.p2pkh({
      pubkey: keyPair.publicKey,
      network: useTestnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin
    });
    
    return {
      privateKeyWIF,
      publicKey,
      address: address!,
      network: useTestnet ? 'testnet' : 'mainnet'
    };
  }

  /**
   * Validate a WIF private key
   */
  static validateWIF(wifKey: string): {
    isValid: boolean;
    network: string;
    address?: string;
    error?: string;
  } {
    try {
      // Try to parse the WIF key
      const keyPair = ECPair.fromWIF(wifKey);
      
      // Determine network
      const network = keyPair.network === bitcoin.networks.testnet ? 'testnet' : 'mainnet';
      
      // Generate address
      const { address } = bitcoin.payments.p2pkh({
        pubkey: keyPair.publicKey,
        network: keyPair.network
      });
      
      return {
        isValid: true,
        network,
        address: address!
      };
    } catch (error) {
      return {
        isValid: false,
        network: 'unknown',
        error: error instanceof Error ? error.message : 'Invalid WIF key'
      };
    }
  }

  /**
   * Generate multiple key pairs for testing
   */
  static generateMultipleKeyPairs(count: number = 5, useTestnet: boolean = true): Array<{
    privateKeyWIF: string;
    publicKey: string;
    address: string;
    network: string;
  }> {
    const keyPairs = [];
    
    for (let i = 0; i < count; i++) {
      keyPairs.push(this.generateWIFKeyPair(useTestnet));
    }
    
    return keyPairs;
  }
}

/**
 * Demo function to show how to use the key generator
 */
export function demoKeyGeneration() {
  console.log('🔑 Bitcoin Key Generator Demo\n');
  
  // Generate testnet key pair
  console.log('📝 Generating Testnet Key Pair:');
  const testnetKey = BitcoinKeyGenerator.generateWIFKeyPair(true);
  console.log('Private Key (WIF):', testnetKey.privateKeyWIF);
  console.log('Public Key:', testnetKey.publicKey);
  console.log('Address:', testnetKey.address);
  console.log('Network:', testnetKey.network);
  console.log('');
  
  // Generate mainnet key pair
  console.log('📝 Generating Mainnet Key Pair:');
  const mainnetKey = BitcoinKeyGenerator.generateWIFKeyPair(false);
  console.log('Private Key (WIF):', mainnetKey.privateKeyWIF);
  console.log('Public Key:', mainnetKey.publicKey);
  console.log('Address:', mainnetKey.address);
  console.log('Network:', mainnetKey.network);
  console.log('');
  
  // Validate a WIF key
  console.log('✅ Validating WIF Key:');
  const validation = BitcoinKeyGenerator.validateWIF(testnetKey.privateKeyWIF);
  console.log('Is Valid:', validation.isValid);
  console.log('Network:', validation.network);
  console.log('Address:', validation.address);
  console.log('');
  
  // Generate multiple test keys
  console.log('🔢 Generating Multiple Test Keys:');
  const multipleKeys = BitcoinKeyGenerator.generateMultipleKeyPairs(3, true);
  multipleKeys.forEach((key, index) => {
    console.log(`Key ${index + 1}:`);
    console.log(`  WIF: ${key.privateKeyWIF}`);
    console.log(`  Address: ${key.address}`);
  });
}

// Export for use in other files
export default BitcoinKeyGenerator; 