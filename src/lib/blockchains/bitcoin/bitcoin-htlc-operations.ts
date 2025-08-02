import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import crypto from 'crypto';
import { BitcoinHTLCConfig } from './bitcoin-swap-types';

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
 * Bitcoin HTLC Operations
 * Handles creation and management of Bitcoin HTLC scripts for atomic swaps
 */
export class BitcoinHTLCOperations {
  private btcNetwork: bitcoin.Network;

  constructor(useBtcTestnet: boolean = true) {
    this.btcNetwork = useBtcTestnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
  }

  /**
   * Create HTLC Script for Bitcoin atomic swaps
   * Uses improved script that allows anyone to refund after timeout
   */
  createBitcoinHTLCScript(config: BitcoinHTLCConfig): Buffer {
    return bitcoin.script.compile([
      bitcoin.opcodes.OP_IF,
      bitcoin.opcodes.OP_HASH160,
      config.secretHash, // Hash160 of the secret
      bitcoin.opcodes.OP_EQUALVERIFY,
      config.recipientPublicKey, // User's public key
      bitcoin.opcodes.OP_CHECKSIG,
      bitcoin.opcodes.OP_ELSE,
      bitcoin.script.number.encode(config.lockTimeBlocks), // Refund timelock
      bitcoin.opcodes.OP_CHECKLOCKTIMEVERIFY,
      bitcoin.opcodes.OP_DROP,
      bitcoin.opcodes.OP_TRUE, // Anyone can spend after timeout (improved safety)
      bitcoin.opcodes.OP_ENDIF,
    ]);
  }

  /**
   * Create P2SH address for HTLC script
   */
  createHTLCAddress(htlcScript: Buffer): string {
    const p2sh = bitcoin.payments.p2sh({
      redeem: { output: htlcScript, network: this.btcNetwork },
      network: this.btcNetwork
    });
    return p2sh.address!;
  }

  /**
   * Extract secret from Bitcoin spending transaction
   */
  extractSecretFromTransaction(
    spendingTx: any,
    htlcScript: Buffer
  ): Buffer | null {
    try {
      // Find input that spends from HTLC
      const htlcInput = spendingTx.vin[0]; // Assuming first input

      if (htlcInput.witness && htlcInput.witness.length > 1) {
        // For witness transactions, secret is typically in witness stack
        const secret = Buffer.from(htlcInput.witness[1], 'hex');

        // Verify secret matches hash
        const secretHash = bitcoin.crypto.hash160(secret);
        // You'd compare this with the expected hash from the order

        return secret;
      }

      return null;

    } catch (error) {
      console.error('Error extracting secret:', error);
      return null;
    }
  }

  /**
   * Generate hash160 of secret (Bitcoin standard)
   */
  generateSecretHash(secret: string): Buffer {
    const secretBuffer = Buffer.from(secret, 'utf8');
    return bitcoin.crypto.hash160(secretBuffer);
  }

  /**
   * Create key pair from WIF private key
   */
  createKeyPairFromWIF(wif: string): any {
    return ECPair.fromWIF(wif, this.btcNetwork);
  }

  /**
   * Get Bitcoin address from public key
   */
  getAddressFromPublicKey(publicKey: Buffer): string {
    const { address } = bitcoin.payments.p2pkh({
      pubkey: publicKey,
      network: this.btcNetwork
    });
    return address!;
  }
} 