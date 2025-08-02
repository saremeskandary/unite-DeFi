import axios from 'axios';
import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import crypto from 'crypto';
import { Utxo, BitcoinFundingConfig } from './bitcoin-swap-types';

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
 * Bitcoin Network Operations
 * Handles Bitcoin blockchain interactions, UTXO management, and transaction operations
 */
export class BitcoinNetworkOperations {
  private btcNetwork: bitcoin.Network;
  private resolverKeyPair: any;
  private resolverBtcAddress: string;
  private useBtcTestnet: boolean;

  constructor(btcPrivateKeyWIF: string, useBtcTestnet: boolean = true) {
    this.useBtcTestnet = useBtcTestnet;
    this.btcNetwork = useBtcTestnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
    this.resolverKeyPair = ECPair.fromWIF(btcPrivateKeyWIF, this.btcNetwork);

    const { address } = bitcoin.payments.p2pkh({
      pubkey: this.resolverKeyPair.publicKey,
      network: this.btcNetwork
    });
    this.resolverBtcAddress = address!;
  }

  /**
   * Get resolver's Bitcoin address
   */
  getResolverAddress(): string {
    return this.resolverBtcAddress;
  }

  /**
   * Get resolver's key pair
   */
  getResolverKeyPair(): any {
    return this.resolverKeyPair;
  }

  /**
   * Get Bitcoin UTXOs for an address
   */
  async getBitcoinUTXOs(address: string): Promise<Utxo[]> {
    const apiUrl = this.useBtcTestnet
      ? 'https://blockstream.info/testnet/api'
      : 'https://blockstream.info/api';

    const response = await axios.get(`${apiUrl}/address/${address}/utxo`);
    return response.data;
  }

  /**
   * Get Bitcoin address transaction history
   */
  async getBitcoinAddressHistory(address: string): Promise<any[]> {
    const apiUrl = this.useBtcTestnet
      ? 'https://blockstream.info/testnet/api'
      : 'https://blockstream.info/api';

    const response = await axios.get(`${apiUrl}/address/${address}/txs`);
    return response.data;
  }

  /**
   * Broadcast Bitcoin transaction
   */
  async broadcastBitcoinTransaction(txHex: string): Promise<string> {
    const apiUrl = this.useBtcTestnet
      ? 'https://blockstream.info/testnet/api'
      : 'https://blockstream.info/api';

    const response = await axios.post(`${apiUrl}/tx`, txHex, {
      headers: { 'Content-Type': 'text/plain' }
    });

    return response.data; // Transaction ID
  }

  /**
   * Get current Bitcoin block height
   */
  async getCurrentBlockHeight(): Promise<number> {
    const apiUrl = this.useBtcTestnet
      ? 'https://blockstream.info/testnet/api'
      : 'https://blockstream.info/api';

    const response = await axios.get(`${apiUrl}/blocks/tip/height`);
    return response.data;
  }

  /**
   * Verify Bitcoin transaction
   */
  async verifyBitcoinTransaction(txId: string, expectedAmount: string): Promise<boolean> {
    try {
      const apiUrl = this.useBtcTestnet
        ? 'https://blockstream.info/testnet/api'
        : 'https://blockstream.info/api';

      const response = await axios.get(`${apiUrl}/tx/${txId}`);
      const tx = response.data;

      // Verify transaction has required confirmations and amount
      return tx.status.confirmed &&
        tx.vout.some((output: any) => output.value >= parseInt(expectedAmount));

    } catch (error) {
      console.error('Error verifying Bitcoin transaction:', error);
      return false;
    }
  }

  /**
   * Fund Bitcoin HTLC with resolver's BTC
   */
  async fundBitcoinHTLC(config: BitcoinFundingConfig): Promise<string> {
    try {
      // 1. Get UTXOs for resolver's Bitcoin address
      const utxos = await this.getBitcoinUTXOs(this.resolverBtcAddress);

      if (utxos.length === 0) {
        throw new Error('No UTXOs available for funding HTLC');
      }

      // 2. Create funding transaction
      const psbt = new bitcoin.Psbt({ network: this.btcNetwork });

      let totalInput = 0;
      for (const utxo of utxos) {
        if (totalInput >= config.amountSatoshis + 1000) break; // Add fee buffer

        psbt.addInput({
          hash: utxo.txid,
          index: utxo.vout,
          witnessUtxo: {
            script: Buffer.from(utxo.scriptpubkey, 'hex'),
            value: utxo.value
          }
        });
        totalInput += utxo.value;
      }

      // 3. Add HTLC output
      psbt.addOutput({
        address: config.htlcAddress,
        value: config.amountSatoshis
      });

      // 4. Add change output if needed
      const fee = 1000; // 1000 sats fee
      const change = totalInput - config.amountSatoshis - fee;
      if (change > 546) { // Dust limit
        psbt.addOutput({
          address: this.resolverBtcAddress,
          value: change
        });
      }

      // 5. Sign and broadcast
      for (let i = 0; i < utxos.length && i < psbt.inputCount; i++) {
        psbt.signInput(i, this.resolverKeyPair);
      }

      psbt.finalizeAllInputs();
      const tx = psbt.extractTransaction();
      const txHex = tx.toHex();

      // 6. Broadcast transaction
      const txId = await this.broadcastBitcoinTransaction(txHex);
      console.log(`Bitcoin HTLC funded with transaction: ${txId}`);

      return txId;

    } catch (error) {
      console.error('Error funding Bitcoin HTLC:', error);
      throw error;
    }
  }

  /**
   * Get Bitcoin public key from address (simplified implementation)
   * In practice, you'd need the user to provide their public key
   * or derive it from a signed message
   */
  async getBitcoinPublicKeyFromAddress(address: string): Promise<Buffer> {
    // This is a simplified implementation
    // In practice, you'd need the user to provide their public key
    // or derive it from a signed message
    return Buffer.alloc(33, 0); // Placeholder
  }
} 