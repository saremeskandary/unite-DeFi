import * as bitcoin from 'bitcoinjs-lib';
import axios from 'axios';

export interface BitcoinNetworkConfig {
  network: bitcoin.Network;
  apiUrl: string;
  blockExplorer: string;
  confirmations: number;
}

export interface UTXO {
  txid: string;
  vout: number;
  value: number;
  script: string;
  address: string;
  confirmations: number;
}

export interface TransactionInfo {
  txid: string;
  blockHeight?: number;
  confirmations: number;
  inputs: Array<{
    txid: string;
    vout: number;
    value: number;
    address: string;
  }>;
  outputs: Array<{
    value: number;
    address: string;
    script: string;
  }>;
  fee: number;
  size: number;
  time: number;
}

export interface AddressInfo {
  address: string;
  balance: number;
  totalReceived: number;
  totalSent: number;
  txCount: number;
  utxos: UTXO[];
}

export interface BroadcastResult {
  success: boolean;
  txid?: string;
  error?: string;
}

export class BitcoinAPIService {
  private config: BitcoinNetworkConfig;
  private network: bitcoin.Network;

  constructor(config: BitcoinNetworkConfig) {
    this.config = config;
    this.network = config.network;
  }

  /**
   * Get address information including balance and UTXOs
   */
  async getAddressInfo(address: string): Promise<AddressInfo | null> {
    try {
      const response = await axios.get(`${this.config.apiUrl}/address/${address}`);
      const data = response.data;

      return {
        address: data.address,
        balance: data.balance,
        totalReceived: data.total_received,
        totalSent: data.total_sent,
        txCount: data.tx_count,
        utxos: data.utxos.map((utxo: any) => ({
          txid: utxo.txid,
          vout: utxo.vout,
          value: utxo.value,
          script: utxo.script,
          address: utxo.address,
          confirmations: utxo.confirmations
        }))
      };

    } catch (error) {
      console.error('Error getting address info:', error);
      return null;
    }
  }

  /**
   * Get UTXOs for an address
   */
  async getUTXOs(address: string): Promise<UTXO[]> {
    try {
      const addressInfo = await this.getAddressInfo(address);
      return addressInfo?.utxos || [];

    } catch (error) {
      console.error('Error getting UTXOs:', error);
      return [];
    }
  }

  /**
   * Get transaction information
   */
  async getTransaction(txid: string): Promise<TransactionInfo | null> {
    try {
      const response = await axios.get(`${this.config.apiUrl}/tx/${txid}`);
      const data = response.data;

      return {
        txid: data.txid,
        blockHeight: data.block_height,
        confirmations: data.confirmations,
        inputs: data.inputs.map((input: any) => ({
          txid: input.prev_txid,
          vout: input.prev_out_index,
          value: input.value,
          address: input.addr
        })),
        outputs: data.outputs.map((output: any) => ({
          value: output.value,
          address: output.addr,
          script: output.script
        })),
        fee: data.fee,
        size: data.size,
        time: data.time
      };

    } catch (error) {
      console.error('Error getting transaction:', error);
      return null;
    }
  }

  /**
   * Broadcast a transaction to the network
   */
  async broadcastTransaction(txHex: string): Promise<BroadcastResult> {
    try {
      const response = await axios.post(`${this.config.apiUrl}/tx/send`, {
        rawtx: txHex
      });

      return {
        success: true,
        txid: response.data.txid
      };

    } catch (error: any) {
      console.error('Error broadcasting transaction:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Broadcast failed'
      };
    }
  }

  /**
   * Get current block height
   */
  async getBlockHeight(): Promise<number> {
    try {
      const response = await axios.get(`${this.config.apiUrl}/blocks/tip/height`);
      return response.data;

    } catch (error) {
      console.error('Error getting block height:', error);
      return 0;
    }
  }

  /**
   * Get block information
   */
  async getBlock(blockHash: string): Promise<any> {
    try {
      const response = await axios.get(`${this.config.apiUrl}/block/${blockHash}`);
      return response.data;

    } catch (error) {
      console.error('Error getting block:', error);
      return null;
    }
  }

  /**
   * Get block by height
   */
  async getBlockByHeight(height: number): Promise<any> {
    try {
      const response = await axios.get(`${this.config.apiUrl}/block-height/${height}`);
      return response.data;

    } catch (error) {
      console.error('Error getting block by height:', error);
      return null;
    }
  }

  /**
   * Monitor transaction for confirmations
   */
  async monitorTransaction(txid: string, requiredConfirmations: number = this.config.confirmations): Promise<{
    confirmed: boolean;
    confirmations: number;
    blockHeight?: number;
  }> {
    try {
      const txInfo = await this.getTransaction(txid);

      if (!txInfo) {
        return {
          confirmed: false,
          confirmations: 0
        };
      }

      return {
        confirmed: txInfo.confirmations >= requiredConfirmations,
        confirmations: txInfo.confirmations,
        blockHeight: txInfo.blockHeight
      };

    } catch (error) {
      console.error('Error monitoring transaction:', error);
      return {
        confirmed: false,
        confirmations: 0
      };
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForConfirmation(
    txid: string,
    requiredConfirmations: number = this.config.confirmations,
    timeout: number = 300000 // 5 minutes
  ): Promise<{
    confirmed: boolean;
    confirmations: number;
    blockHeight?: number;
  }> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const status = await this.monitorTransaction(txid, requiredConfirmations);

      if (status.confirmed) {
        return status;
      }

      // Wait 10 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    // Timeout reached
    return await this.monitorTransaction(txid, requiredConfirmations);
  }

  /**
   * Get fee estimates
   */
  async getFeeEstimates(): Promise<{
    slow: number;
    medium: number;
    fast: number;
  }> {
    try {
      const response = await axios.get(`${this.config.apiUrl}/fee-estimates`);
      const data = response.data;

      return {
        slow: data['144'], // 144 blocks = ~24 hours
        medium: data['6'],  // 6 blocks = ~1 hour
        fast: data['1']     // 1 block = ~10 minutes
      };

    } catch (error) {
      console.error('Error getting fee estimates:', error);
      // Return default fee estimates
      return {
        slow: 1,
        medium: 5,
        fast: 10
      };
    }
  }

  /**
   * Validate Bitcoin address
   */
  validateAddress(address: string): boolean {
    try {
      bitcoin.address.toOutputScript(address, this.network);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get address type
   */
  getAddressType(address: string): 'legacy' | 'p2sh' | 'bech32' | 'unknown' {
    try {
      const outputScript = bitcoin.address.toOutputScript(address, this.network);

      if (bitcoin.address.payments.p2pkh({ output: outputScript, network: this.network })) {
        return 'legacy';
      } else if (bitcoin.address.payments.p2sh({ output: outputScript, network: this.network })) {
        return 'p2sh';
      } else if (bitcoin.address.payments.p2wpkh({ output: outputScript, network: this.network })) {
        return 'bech32';
      }

      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Get network configuration
   */
  getNetworkConfig(): BitcoinNetworkConfig {
    return this.config;
  }

  /**
   * Get Bitcoin network instance
   */
  getNetwork(): bitcoin.Network {
    return this.network;
  }
}

// Pre-configured network instances
export const BitcoinNetworks = {
  mainnet: {
    network: bitcoin.networks.bitcoin,
    apiUrl: 'https://blockstream.info/api',
    blockExplorer: 'https://blockstream.info',
    confirmations: 6
  },
  testnet: {
    network: bitcoin.networks.testnet,
    apiUrl: 'https://blockstream.info/testnet/api',
    blockExplorer: 'https://blockstream.info/testnet',
    confirmations: 1
  }
} as const; 