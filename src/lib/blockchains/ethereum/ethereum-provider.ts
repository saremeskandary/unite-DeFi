import { ethers } from 'ethers';
import { EthereumHTLCService } from './ethereum-htlc';

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface ProviderStatus {
  connected: boolean;
  chainId: number | null;
  account: string | null;
  network: NetworkConfig | null;
}

export interface TransactionStatus {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  blockNumber?: number;
  gasUsed?: string;
  gasPrice?: string;
}

export class EthereumProviderService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private htlcService: EthereumHTLCService;
  private supportedNetworks: Map<number, NetworkConfig> = new Map();

  constructor() {
    this.htlcService = new EthereumHTLCService();
    this.initializeSupportedNetworks();
  }

  private initializeSupportedNetworks() {
    // Ethereum Mainnet
    this.supportedNetworks.set(1, {
      chainId: 1,
      name: 'Ethereum Mainnet',
      rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
      blockExplorer: 'https://etherscan.io',
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18
      }
    });

    // Ethereum Sepolia Testnet
    this.supportedNetworks.set(11155111, {
      chainId: 11155111,
      name: 'Sepolia Testnet',
      rpcUrl: 'https://sepolia.infura.io/v3/your-api-key',
      blockExplorer: 'https://sepolia.etherscan.io',
      nativeCurrency: {
        name: 'Sepolia Ether',
        symbol: 'ETH',
        decimals: 18
      }
    });

    // Polygon Mainnet
    this.supportedNetworks.set(137, {
      chainId: 137,
      name: 'Polygon Mainnet',
      rpcUrl: 'https://polygon-rpc.com',
      blockExplorer: 'https://polygonscan.com',
      nativeCurrency: {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18
      }
    });
  }

  /**
   * Initialize provider and connect to wallet
   */
  async initializeProvider(): Promise<ProviderStatus> {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask or other Ethereum provider not found');
      }

      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.htlcService = new EthereumHTLCService(this.provider);

      // Request account access
      const accounts = await this.provider.send('eth_requestAccounts', []);
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      this.signer = await this.provider.getSigner();
      const chainId = await this.provider.send('eth_chainId', []);
      const network = this.supportedNetworks.get(parseInt(chainId, 16));

      return {
        connected: true,
        chainId: parseInt(chainId, 16),
        account: accounts[0],
        network
      };

    } catch (error) {
      console.error('Error initializing provider:', error);
      return {
        connected: false,
        chainId: null,
        account: null,
        network: null
      };
    }
  }

  /**
   * Switch to a specific network
   */
  async switchNetwork(chainId: number): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      const network = this.supportedNetworks.get(chainId);
      if (!network) {
        throw new Error(`Unsupported network: ${chainId}`);
      }

      await this.provider.send('wallet_switchEthereumChain', [
        { chainId: `0x${chainId.toString(16)}` }
      ]);

      return { success: true };

    } catch (error: any) {
      // If the network doesn't exist, add it
      if (error.code === 4902) {
        return await this.addNetwork(chainId);
      }

      console.error('Error switching network:', error);
      return {
        success: false,
        error: error.message || 'Failed to switch network'
      };
    }
  }

  /**
   * Add a new network to MetaMask
   */
  private async addNetwork(chainId: number): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      const network = this.supportedNetworks.get(chainId);
      if (!network) {
        throw new Error(`Unsupported network: ${chainId}`);
      }

      await this.provider.send('wallet_addEthereumChain', [{
        chainId: `0x${chainId.toString(16)}`,
        chainName: network.name,
        nativeCurrency: network.nativeCurrency,
        rpcUrls: [network.rpcUrl],
        blockExplorerUrls: [network.blockExplorer]
      }]);

      return { success: true };

    } catch (error) {
      console.error('Error adding network:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add network'
      };
    }
  }

  /**
   * Get current provider status
   */
  async getProviderStatus(): Promise<ProviderStatus> {
    try {
      if (!this.provider) {
        return {
          connected: false,
          chainId: null,
          account: null,
          network: null
        };
      }

      const accounts = await this.provider.listAccounts();
      const chainId = await this.provider.send('eth_chainId', []);
      const network = this.supportedNetworks.get(parseInt(chainId, 16));

      return {
        connected: accounts.length > 0,
        chainId: parseInt(chainId, 16),
        account: accounts[0] || null,
        network
      };

    } catch (error) {
      console.error('Error getting provider status:', error);
      return {
        connected: false,
        chainId: null,
        account: null,
        network: null
      };
    }
  }

  /**
   * Get account balance
   */
  async getBalance(address?: string): Promise<string> {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      const targetAddress = address || (await this.provider.getSigner()).getAddress();
      const balance = await this.provider.getBalance(targetAddress);
      return ethers.formatEther(balance);

    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
    }
  }

  /**
   * Send a transaction
   */
  async sendTransaction(
    to: string,
    amount: string,
    data?: string
  ): Promise<{ success: boolean; hash?: string; error?: string }> {
    try {
      if (!this.signer) {
        throw new Error('Signer not initialized');
      }

      const tx = await this.signer.sendTransaction({
        to,
        value: ethers.parseEther(amount),
        data: data || '0x'
      });

      return {
        success: true,
        hash: tx.hash
      };

    } catch (error) {
      console.error('Error sending transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed'
      };
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(hash: string, confirmations: number = 1): Promise<TransactionStatus> {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      const receipt = await this.provider.waitForTransaction(hash, confirmations);
      const block = await this.provider.getBlock(receipt.blockNumber!);

      return {
        hash,
        status: receipt.status === 1 ? 'confirmed' : 'failed',
        confirmations: receipt.confirmations,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: receipt.gasPrice?.toString()
      };

    } catch (error) {
      console.error('Error waiting for transaction:', error);
      return {
        hash,
        status: 'failed',
        confirmations: 0
      };
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(hash: string): Promise<TransactionStatus> {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      const receipt = await this.provider.getTransactionReceipt(hash);

      if (!receipt) {
        return {
          hash,
          status: 'pending',
          confirmations: 0
        };
      }

      const currentBlock = await this.provider.getBlockNumber();
      const confirmations = currentBlock - receipt.blockNumber + 1;

      return {
        hash,
        status: receipt.status === 1 ? 'confirmed' : 'failed',
        confirmations,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: receipt.gasPrice?.toString()
      };

    } catch (error) {
      console.error('Error getting transaction status:', error);
      return {
        hash,
        status: 'failed',
        confirmations: 0
      };
    }
  }

  /**
   * Get HTLC service instance
   */
  getHTLCService(): EthereumHTLCService {
    return this.htlcService;
  }

  /**
   * Get supported networks
   */
  getSupportedNetworks(): NetworkConfig[] {
    return Array.from(this.supportedNetworks.values());
  }

  /**
   * Listen for account changes
   */
  onAccountsChanged(callback: (accounts: string[]) => void): void {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', callback);
    }
  }

  /**
   * Listen for chain changes
   */
  onChainChanged(callback: (chainId: string) => void): void {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('chainChanged', callback);
    }
  }

  /**
   * Remove event listeners
   */
  removeListeners(): void {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.removeAllListeners();
    }
  }
} 