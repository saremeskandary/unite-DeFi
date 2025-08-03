import { TronAPIService, TronNetworkConfig } from './tron-api';
import TronWeb from 'tronweb';

export interface TronAccount {
  address: string;
  privateKey: string;
  balance: number;
  trc20Tokens: Array<{
    contractAddress: string;
    symbol: string;
    balance: string;
    decimals: number;
  }>;
}

export interface TronTransactionParams {
  from: string;
  to: string;
  amount: number; // in TRX (will be converted to sun)
  privateKey: string;
}

export interface TronTRC20TransferParams {
  from: string;
  to: string;
  contractAddress: string;
  amount: string;
  privateKey: string;
}

export interface TronTransactionResult {
  success: boolean;
  txid?: string;
  error?: string;
  fee?: number;
}

export class TronNetworkOperations {
  private tronService: TronAPIService;
  private tronWeb: any;

  constructor(networkConfig: TronNetworkConfig) {
    this.tronService = new TronAPIService(networkConfig);
    this.tronWeb = this.tronService.getTronWeb();
  }

  /**
   * Create a new Tron account
   */
  createAccount(): TronAccount {
    try {
      const account = this.tronWeb.utils.accounts.generateAccount();

      return {
        address: account.address.base58,
        privateKey: account.privateKey,
        balance: 0,
        trc20Tokens: []
      };
    } catch (error) {
      console.error('Error creating account:', error);
      throw new Error('Failed to create Tron account');
    }
  }

  /**
   * Get account information
   */
  async getAccount(address: string): Promise<TronAccount | null> {
    try {
      const addressInfo = await this.tronService.getAddressInfo(address);

      if (!addressInfo) {
        return null;
      }

      return {
        address: addressInfo.address,
        privateKey: '', // We don't store private keys
        balance: addressInfo.balance,
        trc20Tokens: addressInfo.trc20Tokens
      };
    } catch (error) {
      console.error('Error getting account:', error);
      return null;
    }
  }

  /**
   * Send TRX transaction
   */
  async sendTransaction(params: TronTransactionParams): Promise<TronTransactionResult> {
    try {
      console.log('Sending TRX transaction:', {
        from: params.from,
        to: params.to,
        amount: params.amount
      });

      // Validate addresses
      if (!this.tronService.validateAddress(params.from)) {
        return {
          success: false,
          error: 'Invalid from address'
        };
      }

      if (!this.tronService.validateAddress(params.to)) {
        return {
          success: false,
          error: 'Invalid to address'
        };
      }

      // Convert TRX to sun (1 TRX = 1,000,000 sun)
      const amountInSun = params.amount * 1_000_000;

      // Create transaction
      const transaction = await this.tronWeb.trx.sendTransaction(
        params.to,
        amountInSun,
        params.privateKey
      );

      if (transaction.result) {
        return {
          success: true,
          txid: transaction.txid,
          fee: transaction.fee || 0
        };
      } else {
        return {
          success: false,
          error: 'Transaction failed'
        };
      }

    } catch (error) {
      console.error('Error sending transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send TRC20 token transaction
   */
  async sendTRC20Transaction(params: TronTRC20TransferParams): Promise<TronTransactionResult> {
    try {
      console.log('Sending TRC20 transaction:', {
        from: params.from,
        to: params.to,
        contractAddress: params.contractAddress,
        amount: params.amount
      });

      // Validate addresses
      if (!this.tronService.validateAddress(params.from)) {
        return {
          success: false,
          error: 'Invalid from address'
        };
      }

      if (!this.tronService.validateAddress(params.to)) {
        return {
          success: false,
          error: 'Invalid to address'
        };
      }

      if (!this.tronService.validateAddress(params.contractAddress)) {
        return {
          success: false,
          error: 'Invalid contract address'
        };
      }

      // Get contract instance
      const contract = await this.tronWeb.contract().at(params.contractAddress);

      // Send transaction
      const result = await contract.transfer(
        params.to,
        params.amount
      ).send({
        feeLimit: 1000000000, // 1000 TRX fee limit
        callValue: 0
      });

      if (result) {
        return {
          success: true,
          txid: result,
          fee: 0 // Fee will be calculated by the network
        };
      } else {
        return {
          success: false,
          error: 'TRC20 transfer failed'
        };
      }

    } catch (error) {
      console.error('Error sending TRC20 transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(txid: string): Promise<{
    confirmed: boolean;
    confirmations: number;
    blockHeight?: number;
    success?: boolean;
  }> {
    try {
      const status = await this.tronService.monitorTransaction(txid);
      const tx = await this.tronService.getTransaction(txid);

      return {
        confirmed: status.confirmed,
        confirmations: status.confirmations,
        blockHeight: status.blockHeight,
        success: tx?.confirmations > 0
      };
    } catch (error) {
      console.error('Error getting transaction status:', error);
      return {
        confirmed: false,
        confirmations: 0
      };
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(
    txid: string,
    requiredConfirmations: number = 6,
    timeout: number = 300000 // 5 minutes
  ): Promise<{
    confirmed: boolean;
    confirmations: number;
    blockHeight?: number;
  }> {
    try {
      return await this.tronService.waitForConfirmation(txid, requiredConfirmations, timeout);
    } catch (error) {
      console.error('Error waiting for transaction:', error);
      return {
        confirmed: false,
        confirmations: 0
      };
    }
  }

  /**
   * Get network resources (energy and bandwidth)
   */
  async getAccountResources(address: string): Promise<{
    energy: number;
    bandwidth: number;
    sun: number;
  }> {
    try {
      return await this.tronService.getResourceEstimates();
    } catch (error) {
      console.error('Error getting account resources:', error);
      return {
        energy: 0,
        bandwidth: 0,
        sun: 0
      };
    }
  }

  /**
   * Freeze TRX to get energy and bandwidth
   */
  async freezeBalance(
    address: string,
    privateKey: string,
    amount: number, // TRX amount to freeze
    duration: number = 3 // days
  ): Promise<TronTransactionResult> {
    try {
      console.log('Freezing balance:', { address, amount, duration });

      const amountInSun = amount * 1_000_000;
      const durationInSeconds = duration * 24 * 60 * 60;

      const result = await this.tronWeb.trx.freezeBalance(
        amountInSun,
        durationInSeconds,
        {
          owner_address: address,
          privateKey: privateKey
        }
      );

      if (result.result) {
        return {
          success: true,
          txid: result.txid,
          fee: result.fee || 0
        };
      } else {
        return {
          success: false,
          error: 'Freeze balance failed'
        };
      }

    } catch (error) {
      console.error('Error freezing balance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Unfreeze TRX
   */
  async unfreezeBalance(
    address: string,
    privateKey: string
  ): Promise<TronTransactionResult> {
    try {
      console.log('Unfreezing balance for:', address);

      const result = await this.tronWeb.trx.unfreezeBalance({
        owner_address: address,
        privateKey: privateKey
      });

      if (result.result) {
        return {
          success: true,
          txid: result.txid,
          fee: result.fee || 0
        };
      } else {
        return {
          success: false,
          error: 'Unfreeze balance failed'
        };
      }

    } catch (error) {
      console.error('Error unfreezing balance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get common TRC20 tokens
   */
  getCommonTokens(): Array<{
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  }> {
    return [
      {
        address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6
      },
      {
        address: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6
      },
      {
        address: 'TQn9Y2khDD95J42FQtQTdwVVRKjqEQnQUk',
        symbol: 'JST',
        name: 'JUST',
        decimals: 18
      },
      {
        address: 'TKzxdSv2FZKQrEqkKVgp5DcwEXBEKMg2Ax',
        symbol: 'OKB',
        name: 'OKB',
        decimals: 18
      }
    ];
  }

  /**
   * Get Tron service instance
   */
  getTronService(): TronAPIService {
    return this.tronService;
  }

  /**
   * Get TronWeb instance
   */
  getTronWeb(): any {
    return this.tronWeb;
  }
} 