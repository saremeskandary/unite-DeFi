import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';

// Initialize Bitcoin ECC library
bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

export interface BitcoinKeyPair {
  privateKeyWIF: string;
  publicKey: string;
  address: string;
  network: 'testnet' | 'mainnet';
}

export interface ValidationResult {
  isValid: boolean;
  network?: 'testnet' | 'mainnet';
  address?: string;
  error?: string;
}

export class BitcoinKeyGenerator {
  /**
   * Generate a new Bitcoin key pair
   */
  static generateWIFKeyPair(isTestnet: boolean = true): BitcoinKeyPair {
    const network = isTestnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
    const keyPair = ECPair.makeRandom({ network });

    const { address } = bitcoin.payments.p2pkh({
      pubkey: keyPair.publicKey,
      network
    });

    return {
      privateKeyWIF: keyPair.toWIF(),
      publicKey: keyPair.publicKey.toString('hex'),
      address: address!,
      network: isTestnet ? 'testnet' : 'mainnet'
    };
  }

  /**
   * Generate multiple key pairs
   */
  static generateMultipleKeyPairs(count: number, isTestnet: boolean = true): BitcoinKeyPair[] {
    const keys: BitcoinKeyPair[] = [];
    for (let i = 0; i < count; i++) {
      keys.push(this.generateWIFKeyPair(isTestnet));
    }
    return keys;
  }

  /**
   * Validate a WIF private key
   */
  static validateWIF(wifKey: string): ValidationResult {
    try {
      // Try testnet first
      try {
        const testnetKeyPair = ECPair.fromWIF(wifKey, bitcoin.networks.testnet);
        const { address } = bitcoin.payments.p2pkh({
          pubkey: testnetKeyPair.publicKey,
          network: bitcoin.networks.testnet
        });
        return {
          isValid: true,
          network: 'testnet',
          address: address!
        };
      } catch {
        // Try mainnet
        const mainnetKeyPair = ECPair.fromWIF(wifKey, bitcoin.networks.bitcoin);
        const { address } = bitcoin.payments.p2pkh({
          pubkey: mainnetKeyPair.publicKey,
          network: bitcoin.networks.bitcoin
        });
        return {
          isValid: true,
          network: 'mainnet',
          address: address!
        };
      }
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Invalid WIF key'
      };
    }
  }

  /**
   * Convert hex private key to WIF
   */
  static hexToWIF(hexKey: string, isTestnet: boolean = true): BitcoinKeyPair {
    const network = isTestnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;

    // Ensure hex key is 64 characters (32 bytes)
    const normalizedHex = hexKey.length === 64 ? hexKey : hexKey.padStart(64, '0');

    const keyPair = ECPair.fromPrivateKey(Buffer.from(normalizedHex, 'hex'), { network });

    const { address } = bitcoin.payments.p2pkh({
      pubkey: keyPair.publicKey,
      network
    });

    return {
      privateKeyWIF: keyPair.toWIF(),
      publicKey: keyPair.publicKey.toString('hex'),
      address: address!,
      network: isTestnet ? 'testnet' : 'mainnet'
    };
  }
}

/**
 * Demo function to showcase key generation
 */
export function demoKeyGeneration() {
  console.log('🔑 Bitcoin Key Generation Demo\n');

  // Generate testnet keys
  console.log('📝 Testnet Key Pairs:');
  const testnetKeys = BitcoinKeyGenerator.generateMultipleKeyPairs(3, true);
  testnetKeys.forEach((key, index) => {
    console.log(`\nKey ${index + 1}:`);
    console.log(`  WIF: ${key.privateKeyWIF}`);
    console.log(`  Address: ${key.address}`);
    console.log(`  Network: ${key.network}`);
  });

  // Generate mainnet keys
  console.log('\n📝 Mainnet Key Pairs:');
  const mainnetKeys = BitcoinKeyGenerator.generateMultipleKeyPairs(2, false);
  mainnetKeys.forEach((key, index) => {
    console.log(`\nKey ${index + 1}:`);
    console.log(`  WIF: ${key.privateKeyWIF}`);
    console.log(`  Address: ${key.address}`);
    console.log(`  Network: ${key.network}`);
  });

  // Validate some keys
  console.log('\n✅ Key Validation Examples:');
  const testKey = testnetKeys[0].privateKeyWIF;
  const validation = BitcoinKeyGenerator.validateWIF(testKey);
  console.log(`Testnet key validation: ${validation.isValid ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`Network: ${validation.network}`);
  console.log(`Address: ${validation.address}`);

  // Convert hex to WIF
  console.log('\n🔄 Hex to WIF Conversion:');
  const sampleHex = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  const convertedKey = BitcoinKeyGenerator.hexToWIF(sampleHex, true);
  console.log(`Hex: ${sampleHex}`);
  console.log(`WIF: ${convertedKey.privateKeyWIF}`);
  console.log(`Address: ${convertedKey.address}`);
} 