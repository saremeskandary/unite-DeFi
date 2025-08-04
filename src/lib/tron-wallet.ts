import { TronWeb } from 'tronweb';
import { priceOracle } from './price-oracle';

export interface TronTokenBalance {
  symbol: string;
  name: string;
  balance: string;
  balanceRaw: string;
  decimals: number;
  contractAddress?: string;
  price?: number;
  value?: number;
  change24h?: number;
  network: string;
}

export interface TronWalletInfo {
  address: string;
  network: string;
  nativeBalance: string;
  nativeBalanceFormatted: string;
  tokens: TronTokenBalance[];
  totalValue: number;
  lastUpdated: string;
}

export interface TronNetworkConfig {
  network: 'mainnet' | 'nile' | 'shasta' | 'local';
  rpcUrl: string;
  apiUrl: string;
  blockExplorer: string;
  confirmations: number;
}

export class TronWalletService {
  private tronWeb: TronWeb | null = null;
  private currentAddress: string | null = null;
  private currentNetwork: string | null = null;
  private readonly STORAGE_KEY = 'unite-defi-tron-wallet-connection';

  // Network configurations
  private networks: Record<string, TronNetworkConfig> = {
    mainnet: {
      network: 'mainnet',
      rpcUrl: 'https://api.trongrid.io',
      apiUrl: 'https://api.trongrid.io',
      blockExplorer: 'https://tronscan.org',
      confirmations: 19
    },
    nile: {
      network: 'nile',
      rpcUrl: 'https://nile.trongrid.io',
      apiUrl: 'https://nile.trongrid.io',
      blockExplorer: 'https://nile.tronscan.org',
      confirmations: 6
    },
    shasta: {
      network: 'shasta',
      rpcUrl: 'https://api.shasta.trongrid.io',
      apiUrl: 'https://api.shasta.trongrid.io',
      blockExplorer: 'https://shasta.tronscan.org',
      confirmations: 6
    }
  };

  // Common TRC20 token addresses (Mainnet)
  private mainnetTokens = {
    'USDT': {
      address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      decimals: 6,
      name: 'Tether USD'
    },
    'USDC': {
      address: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8',
      decimals: 6,
      name: 'USD Coin'
    },
    'TUSD': {
      address: 'TUpMhErZL2fhh4sVNULAbNKLokS4GjC1F4',
      decimals: 18,
      name: 'TrueUSD'
    },
    'BTT': {
      address: 'TAFjULxiVgT4qWk6UZwjqwZXTSaGaqnVp4',
      decimals: 18,
      name: 'BitTorrent'
    },
    'WIN': {
      address: 'TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7',
      decimals: 6,
      name: 'WINk'
    },
    'JST': {
      address: 'TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9',
      decimals: 18,
      name: 'JUST'
    }
  };

  // Nile testnet token addresses
  private nileTokens = {
    'USDT': {
      address: 'TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf',
      decimals: 6,
      name: 'Tether USD (Nile)'
    },
    'USDC': {
      address: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8',
      decimals: 6,
      name: 'USD Coin (Nile)'
    }
  };

  // Shasta testnet token addresses
  private shastaTokens = {
    'USDT': {
      address: 'TG3XXyExBkP1Z3Kox3TGYx3EPyfP8W2Acu',
      decimals: 6,
      name: 'Tether USD (Shasta)'
    },
    'USDC': {
      address: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8',
      decimals: 6,
      name: 'USD Coin (Shasta)'
    }
  };

  constructor() {
    this.initializeTronWeb();
    // Use a timeout to prevent the restoration from hanging the app
    setTimeout(() => {
      this.restoreConnectionState().catch(error => {
        console.warn('Failed to restore Tron wallet connection state:', error);
      });
    }, 0);
  }

  private initializeTronWeb() {
    if (typeof window !== 'undefined') {
      // Initialize with Nile testnet by default
      this.tronWeb = new TronWeb({
        fullHost: this.networks.nile.rpcUrl,
        headers: { "TRON-PRO-API-KEY": process.env.NEXT_PUBLIC_TRON_API_KEY || "" }
      });
    }
  }

  /**
   * Save connection state to localStorage
   */
  private saveConnectionState(): void {
    if (typeof window === 'undefined') return;

    const connectionState = {
      address: this.currentAddress,
      network: this.currentNetwork,
      timestamp: Date.now()
    };

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(connectionState));
    } catch (error) {
      console.warn('Failed to save Tron wallet connection state:', error);
    }
  }

  /**
   * Restore connection state from localStorage
   */
  private async restoreConnectionState(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const savedState = localStorage.getItem(this.STORAGE_KEY);
      if (!savedState) return;

      const connectionState = JSON.parse(savedState);
      const { address, network, timestamp } = connectionState;

      // Check if the saved state is not too old (24 hours)
      const isExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000;
      if (isExpired) {
        this.clearConnectionState();
        return;
      }

      // Restore the state
      if (address && network) {
        this.currentAddress = address;
        this.currentNetwork = network;

        // Update TronWeb to use the correct network
        if (this.networks[network]) {
          this.tronWeb = new TronWeb({
            fullHost: this.networks[network].rpcUrl,
            headers: { "TRON-PRO-API-KEY": process.env.NEXT_PUBLIC_TRON_API_KEY || "" }
          });
        }

        console.log('Tron wallet connection restored from localStorage');
      }
    } catch (error) {
      console.warn('Failed to restore Tron wallet connection state:', error);
      this.clearConnectionState();
    }
  }

  /**
   * Clear connection state from localStorage
   */
  private clearConnectionState(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear Tron wallet connection state:', error);
    }
  }

  /**
   * Connect to Tron wallet
   */
  async connect(): Promise<TronWalletInfo | null> {
    try {
      if (!this.tronWeb) {
        throw new Error('TronWeb not initialized');
      }

      // Check if TronLink is available
      if (typeof window !== 'undefined' && window.tronWeb && window.tronWeb.ready) {
        // Use TronLink if available
        this.tronWeb = window.tronWeb;
        this.currentNetwork = this.getCurrentNetworkFromTronWeb();
      } else {
        // Fallback to default network (Nile testnet)
        this.currentNetwork = 'nile';
        this.tronWeb = new TronWeb({
          fullHost: this.networks.nile.rpcUrl,
          headers: { "TRON-PRO-API-KEY": process.env.NEXT_PUBLIC_TRON_API_KEY || "" }
        });
      }

      // Get the current account
      const account = await this.tronWeb.trx.getAccount();
      if (!account || !account.address) {
        throw new Error('No Tron account found. Please connect your Tron wallet.');
      }

      this.currentAddress = this.tronWeb.address.fromHex(account.address);

      // Save connection state
      this.saveConnectionState();

      return await this.getWalletInfo();
    } catch (error) {
      console.error('Error connecting to Tron wallet:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive wallet information including token balances
   */
  async getWalletInfo(): Promise<TronWalletInfo | null> {
    if (!this.tronWeb || !this.currentAddress) {
      return null;
    }

    try {
      // Get native TRX balance
      const account = await this.tronWeb.trx.getAccount(this.currentAddress);
      const nativeBalance = account.balance || 0;
      const nativeBalanceFormatted = (nativeBalance / 1_000_000).toString(); // Convert from sun to TRX

      // Get token balances
      const tokens = await this.getTokenBalances();

      // Calculate total value
      const totalValue = await this.calculateTotalValue(tokens, nativeBalanceFormatted);

      return {
        address: this.currentAddress,
        network: this.currentNetwork || 'unknown',
        nativeBalance: nativeBalance.toString(),
        nativeBalanceFormatted,
        tokens,
        totalValue,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting Tron wallet info:', error);
      return null;
    }
  }

  /**
   * Get balances for all common tokens
   */
  async getTokenBalances(): Promise<TronTokenBalance[]> {
    if (!this.tronWeb || !this.currentAddress) {
      return [];
    }

    const tokenBalances: TronTokenBalance[] = [];
    const tokenSymbols: string[] = [];

    // Determine which token list to use based on network
    let tokensToCheck;
    if (this.currentNetwork === 'nile') {
      tokensToCheck = this.nileTokens;
    } else if (this.currentNetwork === 'shasta') {
      tokensToCheck = this.shastaTokens;
    } else {
      tokensToCheck = this.mainnetTokens;
    }

    // Check balances for all tokens in the appropriate network
    for (const [symbol, tokenInfo] of Object.entries(tokensToCheck)) {
      try {
        const contract = await this.tronWeb!.contract().at(tokenInfo.address);
        const balance = await contract.balanceOf(this.currentAddress).call();

        if (balance > 0) {
          const formattedBalance = (balance / Math.pow(10, tokenInfo.decimals)).toString();
          tokenBalances.push({
            symbol,
            name: tokenInfo.name,
            balance: formattedBalance,
            balanceRaw: balance.toString(),
            decimals: tokenInfo.decimals,
            contractAddress: tokenInfo.address,
            network: this.currentNetwork || 'unknown'
          });
          tokenSymbols.push(symbol);
        }
      } catch (error) {
        console.warn(`Error fetching balance for ${symbol}:`, error);
      }
    }

    // Add native TRX balance if it exists
    const account = await this.tronWeb.trx.getAccount(this.currentAddress);
    const nativeBalance = account.balance || 0;
    if (nativeBalance > 0) {
      const trxPrice = await priceOracle.getTokenPrice('TRX');
      const trxBalance = (nativeBalance / 1_000_000).toString(); // Convert from sun to TRX
      tokenBalances.push({
        symbol: 'TRX',
        name: 'TRON',
        balance: trxBalance,
        balanceRaw: nativeBalance.toString(),
        decimals: 6,
        network: this.currentNetwork || 'unknown',
        price: trxPrice?.price,
        change24h: trxPrice?.change24h,
        value: trxPrice ? parseFloat(trxBalance) * trxPrice.price : 0
      });
      tokenSymbols.push('TRX');
    }

    // Get prices for tokens with balances
    if (tokenSymbols.length > 0) {
      const prices = await priceOracle.getMultipleTokenPrices(tokenSymbols);

      tokenBalances.forEach(token => {
        const price = prices.get(token.symbol);
        if (price) {
          token.price = price.price;
          token.change24h = price.change24h;
          token.value = parseFloat(token.balance) * price.price;
        }
      });
    }

    return tokenBalances;
  }

  /**
   * Get balance for a specific token
   */
  async getTokenBalance(symbol: string): Promise<TronTokenBalance | null> {
    if (!this.tronWeb || !this.currentAddress) {
      return null;
    }

    // Determine which token list to use based on network
    let tokensToCheck;
    if (this.currentNetwork === 'nile') {
      tokensToCheck = this.nileTokens;
    } else if (this.currentNetwork === 'shasta') {
      tokensToCheck = this.shastaTokens;
    } else {
      tokensToCheck = this.mainnetTokens;
    }

    const tokenInfo = tokensToCheck[symbol as keyof typeof tokensToCheck];
    if (!tokenInfo) {
      return null;
    }

    try {
      const contract = await this.tronWeb.contract().at(tokenInfo.address);
      const balance = await contract.balanceOf(this.currentAddress).call();
      const formattedBalance = (balance / Math.pow(10, tokenInfo.decimals)).toString();

      // Get price
      const price = await priceOracle.getTokenPrice(symbol);

      return {
        symbol,
        name: tokenInfo.name,
        balance: formattedBalance,
        balanceRaw: balance.toString(),
        decimals: tokenInfo.decimals,
        contractAddress: tokenInfo.address,
        price: price?.price,
        value: price ? parseFloat(formattedBalance) * price.price : undefined,
        change24h: price?.change24h,
        network: this.currentNetwork || 'unknown'
      };
    } catch (error) {
      console.error(`Error fetching balance for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Calculate total portfolio value
   */
  private async calculateTotalValue(tokens: TronTokenBalance[], nativeBalance: string): Promise<number> {
    let totalValue = 0;

    // Add native token value
    const trxPrice = await priceOracle.getTokenPrice('TRX');
    if (trxPrice) {
      totalValue += parseFloat(nativeBalance) * trxPrice.price;
    }

    // Add token values
    tokens.forEach(token => {
      if (token.value) {
        totalValue += token.value;
      }
    });

    return totalValue;
  }

  /**
   * Get current network from TronWeb
   */
  private getCurrentNetworkFromTronWeb(): string {
    if (!this.tronWeb) return 'nile';

    const fullHost = this.tronWeb.fullNode.host;
    if (fullHost.includes('nile')) return 'nile';
    if (fullHost.includes('shasta')) return 'shasta';
    if (fullHost.includes('trongrid')) return 'mainnet';

    return 'nile'; // Default to Nile testnet
  }

  /**
   * Switch to a different network
   */
  async switchNetwork(network: 'mainnet' | 'nile' | 'shasta'): Promise<boolean> {
    try {
      if (!this.networks[network]) {
        throw new Error(`Unsupported network: ${network}`);
      }

      this.tronWeb = new TronWeb({
        fullHost: this.networks[network].rpcUrl,
        headers: { "TRON-PRO-API-KEY": process.env.NEXT_PUBLIC_TRON_API_KEY || "" }
      });

      this.currentNetwork = network;
      this.saveConnectionState();

      return true;
    } catch (error) {
      console.error('Error switching network:', error);
      return false;
    }
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return !!this.currentAddress;
  }

  /**
   * Get current address
   */
  getCurrentAddress(): string | null {
    return this.currentAddress;
  }

  /**
   * Get current network
   */
  getCurrentNetwork(): string | null {
    return this.currentNetwork;
  }

  /**
   * Disconnect wallet
   */
  disconnect(): void {
    this.currentAddress = null;
    this.currentNetwork = null;
    this.tronWeb = null;
    this.clearConnectionState();
  }

  /**
   * Get TronWeb instance
   */
  getTronWeb(): TronWeb | null {
    return this.tronWeb;
  }

  /**
   * Get network configuration
   */
  getNetworkConfig(): TronNetworkConfig | null {
    if (!this.currentNetwork) return null;
    return this.networks[this.currentNetwork];
  }
}

// Global instance
export const tronWallet = new TronWalletService();

// Add TronWeb to window for TronLink integration
declare global {
  interface Window {
    tronWeb?: TronWeb & { ready?: boolean };
  }
} 