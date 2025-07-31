import { BitcoinNetworkOperations } from '@/lib/blockchains/bitcoin/bitcoin-network-operations';

export interface TransactionStatus {
  hash: string;
  network: 'ethereum' | 'bitcoin';
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  requiredConfirmations: number;
  blockNumber?: number;
  timestamp?: number;
  gasUsed?: number;
  gasPrice?: number;
  fee?: number;
  error?: string;
}

export interface TransactionMonitorCallbacks {
  onStatusUpdate?: (status: TransactionStatus) => void;
  onConfirmation?: (status: TransactionStatus) => void;
  onError?: (error: Error) => void;
}

export class TransactionMonitor {
  private hash: string;
  private network: 'ethereum' | 'bitcoin';
  private callbacks: TransactionMonitorCallbacks;
  private intervalId?: NodeJS.Timeout;
  private isMonitoring = false;
  private bitcoinOps: BitcoinNetworkOperations;

  constructor(
    hash: string,
    network: 'ethereum' | 'bitcoin',
    callbacks: TransactionMonitorCallbacks = {}
  ) {
    this.hash = hash;
    this.network = network;
    this.callbacks = callbacks;
    this.bitcoinOps = new BitcoinNetworkOperations(
      process.env.NEXT_PUBLIC_BTC_PRIVATE_KEY_WIF || '',
      true // testnet
    );
  }

  /**
   * Start monitoring the transaction
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;

    // Initial status check
    await this.checkTransactionStatus();

    // Set up polling interval (every 10 seconds)
    this.intervalId = setInterval(async () => {
      await this.checkTransactionStatus();
    }, 10000);
  }

  /**
   * Stop monitoring the transaction
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  /**
   * Check the current transaction status
   */
  private async checkTransactionStatus(): Promise<void> {
    try {
      let status: TransactionStatus;

      if (this.network === 'bitcoin') {
        status = await this.checkBitcoinTransaction();
      } else {
        status = await this.checkEthereumTransaction();
      }

      // Call the status update callback
      if (this.callbacks.onStatusUpdate) {
        this.callbacks.onStatusUpdate(status);
      }

      // Check if transaction is confirmed
      if (status.status === 'confirmed') {
        if (this.callbacks.onConfirmation) {
          this.callbacks.onConfirmation(status);
        }
        this.stopMonitoring();
      }

      // Check if transaction failed
      if (status.status === 'failed') {
        if (this.callbacks.onError) {
          this.callbacks.onError(new Error(status.error || 'Transaction failed'));
        }
        this.stopMonitoring();
      }
    } catch (error) {
      console.error('Error checking transaction status:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error as Error);
      }
    }
  }

  /**
   * Check Bitcoin transaction status
   */
  private async checkBitcoinTransaction(): Promise<TransactionStatus> {
    try {
      // Get transaction details from Bitcoin network
      const txDetails = await this.bitcoinOps.getTransaction(this.hash);

      if (!txDetails) {
        return {
          hash: this.hash,
          network: 'bitcoin',
          status: 'pending',
          confirmations: 0,
          requiredConfirmations: 6,
        };
      }

      const confirmations = txDetails.confirmations || 0;
      const status = confirmations >= 6 ? 'confirmed' : 'pending';

      return {
        hash: this.hash,
        network: 'bitcoin',
        status,
        confirmations,
        requiredConfirmations: 6,
        blockNumber: txDetails.block_height,
        timestamp: txDetails.block_time ? txDetails.block_time * 1000 : undefined,
        fee: txDetails.fee ? txDetails.fee / 100000000 : undefined, // Convert from satoshis
      };
    } catch (error) {
      console.error('Error checking Bitcoin transaction:', error);
      return {
        hash: this.hash,
        network: 'bitcoin',
        status: 'failed',
        confirmations: 0,
        requiredConfirmations: 6,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check Ethereum transaction status
   */
  private async checkEthereumTransaction(): Promise<TransactionStatus> {
    try {
      const apiKey = process.env.ETHERSCAN_API_KEY || '';
      const baseUrl = 'https://api-sepolia.etherscan.io/api'; // Using Sepolia testnet

      const response = await fetch(
        `${baseUrl}?module=proxy&action=eth_getTransactionReceipt&txhash=${this.hash}&apikey=${apiKey}`
      );

      const data = await response.json();

      if (data.error) {
        // Transaction not found or pending
        return {
          hash: this.hash,
          network: 'ethereum',
          status: 'pending',
          confirmations: 0,
          requiredConfirmations: 12,
        };
      }

      if (data.result) {
        const receipt = data.result;
        const status = receipt.status === '0x1' ? 'confirmed' : 'failed';
        const confirmations = status === 'confirmed' ? 12 : 0; // Simplified

        return {
          hash: this.hash,
          network: 'ethereum',
          status,
          confirmations,
          requiredConfirmations: 12,
          blockNumber: receipt.blockNumber ? parseInt(receipt.blockNumber, 16) : undefined,
          gasUsed: receipt.gasUsed ? parseInt(receipt.gasUsed, 16) : undefined,
          gasPrice: receipt.effectiveGasPrice ? parseInt(receipt.effectiveGasPrice, 16) : undefined,
          fee: receipt.gasUsed && receipt.effectiveGasPrice
            ? (parseInt(receipt.gasUsed, 16) * parseInt(receipt.effectiveGasPrice, 16)) / Math.pow(10, 18)
            : undefined,
          error: status === 'failed' ? 'Transaction reverted' : undefined,
        };
      }

      return {
        hash: this.hash,
        network: 'ethereum',
        status: 'pending',
        confirmations: 0,
        requiredConfirmations: 12,
      };
    } catch (error) {
      console.error('Error checking Ethereum transaction:', error);
      return {
        hash: this.hash,
        network: 'ethereum',
        status: 'failed',
        confirmations: 0,
        requiredConfirmations: 12,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Monitor multiple transactions
 */
export class MultiTransactionMonitor {
  private monitors: Map<string, TransactionMonitor> = new Map();
  private callbacks: TransactionMonitorCallbacks;

  constructor(callbacks: TransactionMonitorCallbacks = {}) {
    this.callbacks = callbacks;
  }

  /**
   * Add a transaction to monitor
   */
  addTransaction(hash: string, network: 'ethereum' | 'bitcoin'): void {
    if (this.monitors.has(hash)) {
      return; // Already monitoring
    }

    const monitor = new TransactionMonitor(hash, network, {
      onStatusUpdate: (status) => {
        if (this.callbacks.onStatusUpdate) {
          this.callbacks.onStatusUpdate(status);
        }
      },
      onConfirmation: (status) => {
        if (this.callbacks.onConfirmation) {
          this.callbacks.onConfirmation(status);
        }
        this.removeTransaction(hash);
      },
      onError: (error) => {
        if (this.callbacks.onError) {
          this.callbacks.onError(error);
        }
        this.removeTransaction(hash);
      },
    });

    this.monitors.set(hash, monitor);
    monitor.startMonitoring();
  }

  /**
   * Remove a transaction from monitoring
   */
  removeTransaction(hash: string): void {
    const monitor = this.monitors.get(hash);
    if (monitor) {
      monitor.stopMonitoring();
      this.monitors.delete(hash);
    }
  }

  /**
   * Stop monitoring all transactions
   */
  stopAll(): void {
    for (const monitor of this.monitors.values()) {
      monitor.stopMonitoring();
    }
    this.monitors.clear();
  }

  /**
   * Get all monitored transaction hashes
   */
  getMonitoredTransactions(): string[] {
    return Array.from(this.monitors.keys());
  }
} 