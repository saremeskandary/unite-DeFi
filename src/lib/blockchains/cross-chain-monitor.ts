import { ethers } from 'ethers';
import { EthereumProviderService } from './ethereum/ethereum-provider';
import { BitcoinAPIService } from './bitcoin/bitcoin-api';
import { MultiChainService, CrossChainSwap, SwapStatus } from './multi-chain-service';

export interface TransactionEvent {
  swapId: string;
  chain: 'ethereum' | 'bitcoin';
  eventType: 'funded' | 'redeemed' | 'refunded' | 'confirmed' | 'failed';
  txHash: string;
  blockNumber?: number;
  confirmations: number;
  timestamp: number;
  data?: any;
}

export interface MonitoringConfig {
  ethereumConfirmations: number;
  bitcoinConfirmations: number;
  pollingInterval: number; // milliseconds
  maxRetries: number;
  timeout: number; // milliseconds
}

export interface MonitoringStatus {
  isMonitoring: boolean;
  activeMonitors: number;
  lastUpdate: number;
  errors: string[];
}

export class CrossChainMonitor {
  private multiChainService: MultiChainService;
  private ethereumProvider: EthereumProviderService;
  private bitcoinAPI: BitcoinAPIService;
  private config: MonitoringConfig;
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private activeMonitors: Map<string, {
    swap: CrossChainSwap;
    lastCheck: number;
    retries: number;
  }> = new Map();
  private eventCallbacks: Map<string, (event: TransactionEvent) => void> = new Map();
  private errors: string[] = [];

  constructor(
    multiChainService: MultiChainService,
    config: Partial<MonitoringConfig> = {}
  ) {
    this.multiChainService = multiChainService;
    this.ethereumProvider = multiChainService.getEthereumProvider();
    this.bitcoinAPI = multiChainService.getBitcoinAPI();

    this.config = {
      ethereumConfirmations: 6,
      bitcoinConfirmations: 1,
      pollingInterval: 10000, // 10 seconds
      maxRetries: 3,
      timeout: 300000, // 5 minutes
      ...config
    };
  }

  /**
   * Start monitoring all active swaps
   */
  async startMonitoring(): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.isMonitoring) {
        return { success: true }; // Already monitoring
      }

      this.isMonitoring = true;
      this.errors = [];

      // Start monitoring interval
      this.monitoringInterval = setInterval(async () => {
        await this.monitorActiveSwaps();
      }, this.config.pollingInterval);

      // Initial monitoring
      await this.monitorActiveSwaps();

      return { success: true };

    } catch (error) {
      console.error('Error starting monitoring:', error);
      this.isMonitoring = false;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start monitoring'
      };
    }
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Add a swap to monitoring
   */
  addSwapToMonitoring(swap: CrossChainSwap): void {
    this.activeMonitors.set(swap.id, {
      swap,
      lastCheck: Date.now(),
      retries: 0
    });
  }

  /**
   * Remove a swap from monitoring
   */
  removeSwapFromMonitoring(swapId: string): void {
    this.activeMonitors.delete(swapId);
  }

  /**
   * Register event callback
   */
  onTransactionEvent(eventType: string, callback: (event: TransactionEvent) => void): void {
    this.eventCallbacks.set(eventType, callback);
  }

  /**
   * Monitor all active swaps
   */
  private async monitorActiveSwaps(): Promise<void> {
    const swaps = this.multiChainService.getActiveSwaps();

    for (const swap of swaps) {
      // Add to monitoring if not already being monitored
      if (!this.activeMonitors.has(swap.id)) {
        this.addSwapToMonitoring(swap);
      }

      await this.monitorSwap(swap);
    }
  }

  /**
   * Monitor a specific swap
   */
  private async monitorSwap(swap: CrossChainSwap): Promise<void> {
    try {
      const monitor = this.activeMonitors.get(swap.id);
      if (!monitor) {
        return;
      }

      // Check if we should skip this check (rate limiting)
      const now = Date.now();
      if (now - monitor.lastCheck < this.config.pollingInterval) {
        return;
      }

      monitor.lastCheck = now;

      // Get current swap status
      const status = await this.multiChainService.getSwapStatus(swap.id);
      if (!status) {
        return;
      }

      // Monitor Ethereum transactions
      if (swap.fromChain === 'ethereum' || swap.toChain === 'ethereum') {
        await this.monitorEthereumTransactions(swap, status);
      }

      // Monitor Bitcoin transactions
      if (swap.fromChain === 'bitcoin' || swap.toChain === 'bitcoin') {
        await this.monitorBitcoinTransactions(swap, status);
      }

      // Reset retry count on successful monitoring
      monitor.retries = 0;

    } catch (error) {
      console.error(`Error monitoring swap ${swap.id}:`, error);

      const monitor = this.activeMonitors.get(swap.id);
      if (monitor) {
        monitor.retries++;

        if (monitor.retries >= this.config.maxRetries) {
          this.removeSwapFromMonitoring(swap.id);
          this.emitEvent('failed', {
            swapId: swap.id,
            chain: 'unknown',
            eventType: 'failed',
            txHash: '',
            confirmations: 0,
            timestamp: Date.now(),
            data: { error: error instanceof Error ? error.message : 'Max retries exceeded' }
          });
        }
      }
    }
  }

  /**
   * Monitor Ethereum transactions
   */
  private async monitorEthereumTransactions(swap: CrossChainSwap, status: SwapStatus): Promise<void> {
    try {
      // Monitor funding transaction
      if (swap.fromChain === 'ethereum' && swap.ethereumTxHash) {
        const txStatus = await this.ethereumProvider.getTransactionStatus(swap.ethereumTxHash);

        if (txStatus.status === 'confirmed' && txStatus.confirmations >= this.config.ethereumConfirmations) {
          this.emitEvent('funded', {
            swapId: swap.id,
            chain: 'ethereum',
            eventType: 'funded',
            txHash: swap.ethereumTxHash,
            blockNumber: txStatus.blockNumber,
            confirmations: txStatus.confirmations,
            timestamp: Date.now()
          });
        } else if (txStatus.status === 'failed') {
          this.emitEvent('failed', {
            swapId: swap.id,
            chain: 'ethereum',
            eventType: 'failed',
            txHash: swap.ethereumTxHash,
            confirmations: txStatus.confirmations,
            timestamp: Date.now()
          });
        }
      }

      // Monitor HTLC contract status
      if (swap.ethereumContractId && status.ethereumStatus) {
        const ethStatus = status.ethereumStatus;

        if (ethStatus.withdrawn) {
          this.emitEvent('redeemed', {
            swapId: swap.id,
            chain: 'ethereum',
            eventType: 'redeemed',
            txHash: swap.ethereumContractId,
            confirmations: ethStatus.confirmations,
            timestamp: Date.now()
          });
        } else if (ethStatus.refunded) {
          this.emitEvent('refunded', {
            swapId: swap.id,
            chain: 'ethereum',
            eventType: 'refunded',
            txHash: swap.ethereumContractId,
            confirmations: ethStatus.confirmations,
            timestamp: Date.now()
          });
        }
      }

    } catch (error) {
      console.error(`Error monitoring Ethereum transactions for swap ${swap.id}:`, error);
      this.addError(`Ethereum monitoring error for swap ${swap.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Monitor Bitcoin transactions
   */
  private async monitorBitcoinTransactions(swap: CrossChainSwap, status: SwapStatus): Promise<void> {
    try {
      // Monitor funding transaction
      if (swap.fromChain === 'bitcoin' && swap.bitcoinFundingTxId) {
        const txStatus = await this.bitcoinAPI.monitorTransaction(swap.bitcoinFundingTxId, this.config.bitcoinConfirmations);

        if (txStatus.confirmed) {
          this.emitEvent('funded', {
            swapId: swap.id,
            chain: 'bitcoin',
            eventType: 'funded',
            txHash: swap.bitcoinFundingTxId,
            blockNumber: txStatus.blockHeight,
            confirmations: txStatus.confirmations,
            timestamp: Date.now()
          });
        }
      }

      // Monitor redemption transaction
      if (swap.toChain === 'bitcoin' && swap.bitcoinTxHash && swap.status === 'completed') {
        const txStatus = await this.bitcoinAPI.monitorTransaction(swap.bitcoinTxHash, this.config.bitcoinConfirmations);

        if (txStatus.confirmed) {
          this.emitEvent('redeemed', {
            swapId: swap.id,
            chain: 'bitcoin',
            eventType: 'redeemed',
            txHash: swap.bitcoinTxHash,
            blockNumber: txStatus.blockHeight,
            confirmations: txStatus.confirmations,
            timestamp: Date.now()
          });
        }
      }

      // Monitor Bitcoin status from multi-chain service
      if (status.bitcoinStatus) {
        const btcStatus = status.bitcoinStatus;

        if (btcStatus.withdrawn) {
          this.emitEvent('redeemed', {
            swapId: swap.id,
            chain: 'bitcoin',
            eventType: 'redeemed',
            txHash: swap.bitcoinTxHash || '',
            confirmations: btcStatus.confirmations,
            timestamp: Date.now()
          });
        } else if (btcStatus.refunded) {
          this.emitEvent('refunded', {
            swapId: swap.id,
            chain: 'bitcoin',
            eventType: 'refunded',
            txHash: swap.bitcoinTxHash || '',
            confirmations: btcStatus.confirmations,
            timestamp: Date.now()
          });
        }
      }

    } catch (error) {
      console.error(`Error monitoring Bitcoin transactions for swap ${swap.id}:`, error);
      this.addError(`Bitcoin monitoring error for swap ${swap.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Emit transaction event
   */
  private emitEvent(eventType: string, event: TransactionEvent): void {
    // Emit to specific event type callback
    const callback = this.eventCallbacks.get(eventType);
    if (callback) {
      try {
        callback(event);
      } catch (error) {
        console.error(`Error in event callback for ${eventType}:`, error);
      }
    }

    // Emit to general callback
    const generalCallback = this.eventCallbacks.get('*');
    if (generalCallback) {
      try {
        generalCallback(event);
      } catch (error) {
        console.error('Error in general event callback:', error);
      }
    }
  }

  /**
   * Add error to monitoring status
   */
  private addError(error: string): void {
    this.errors.push(error);

    // Keep only last 10 errors
    if (this.errors.length > 10) {
      this.errors = this.errors.slice(-10);
    }
  }

  /**
   * Get monitoring status
   */
  getMonitoringStatus(): MonitoringStatus {
    return {
      isMonitoring: this.isMonitoring,
      activeMonitors: this.activeMonitors.size,
      lastUpdate: Date.now(),
      errors: [...this.errors]
    };
  }

  /**
   * Get active monitors
   */
  getActiveMonitors(): Map<string, { swap: CrossChainSwap; lastCheck: number; retries: number }> {
    return new Map(this.activeMonitors);
  }

  /**
   * Get monitoring configuration
   */
  getConfig(): MonitoringConfig {
    return { ...this.config };
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clear errors
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForConfirmation(
    swapId: string,
    chain: 'ethereum' | 'bitcoin',
    eventType: 'funded' | 'redeemed' | 'refunded',
    timeout: number = this.config.timeout
  ): Promise<TransactionEvent | null> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        // Check if timeout reached
        if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          resolve(null);
          return;
        }

        // Check if event occurred
        const swap = this.multiChainService.getSwap(swapId);
        if (!swap) {
          clearInterval(checkInterval);
          resolve(null);
          return;
        }

        // Check for the specific event
        if (chain === 'ethereum') {
          if (eventType === 'funded' && swap.ethereumTxHash) {
            // Check if funded
            this.ethereumProvider.getTransactionStatus(swap.ethereumTxHash).then(status => {
              if (status.status === 'confirmed' && status.confirmations >= this.config.ethereumConfirmations) {
                clearInterval(checkInterval);
                resolve({
                  swapId,
                  chain: 'ethereum',
                  eventType: 'funded',
                  txHash: swap.ethereumTxHash!,
                  blockNumber: status.blockNumber,
                  confirmations: status.confirmations,
                  timestamp: Date.now()
                });
              }
            });
          }
        } else if (chain === 'bitcoin') {
          if (eventType === 'funded' && swap.bitcoinFundingTxId) {
            // Check if funded
            this.bitcoinAPI.monitorTransaction(swap.bitcoinFundingTxId, this.config.bitcoinConfirmations).then(status => {
              if (status.confirmed) {
                clearInterval(checkInterval);
                resolve({
                  swapId,
                  chain: 'bitcoin',
                  eventType: 'funded',
                  txHash: swap.bitcoinFundingTxId!,
                  blockNumber: status.blockHeight,
                  confirmations: status.confirmations,
                  timestamp: Date.now()
                });
              }
            });
          }
        }
      }, 5000); // Check every 5 seconds
    });
  }
} 