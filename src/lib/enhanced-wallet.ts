import { ethers } from 'ethers';
import { priceOracle } from './price-oracle';

export interface TokenBalance {
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

export interface WalletTokenInfo {
  address: string;
  chainId: number;
  network: string;
  nativeBalance: string;
  nativeBalanceFormatted: string;
  tokens: TokenBalance[];
  totalValue: number;
  lastUpdated: string;
}

export class EnhancedWalletService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private currentAddress: string | null = null;
  private currentChainId: number | null = null;
  private readonly STORAGE_KEY = 'unite-defi-wallet-connection';

  // ERC20 Token ABIs
  private erc20Abi = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function name() view returns (string)'
  ];

  // Common token addresses (Ethereum Mainnet)
  private commonTokens = {
    'USDC': {
      address: '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8C',
      decimals: 6,
      name: 'USD Coin'
    },
    'USDT': {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      decimals: 6,
      name: 'Tether USD'
    },
    'WETH': {
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      decimals: 18,
      name: 'Wrapped Ethereum'
    },
    'WBTC': {
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      decimals: 8,
      name: 'Wrapped Bitcoin'
    },
    'DAI': {
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      decimals: 18,
      name: 'Dai Stablecoin'
    },
    'UNI': {
      address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      decimals: 18,
      name: 'Uniswap'
    },
    'LINK': {
      address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
      decimals: 18,
      name: 'Chainlink'
    },
    'AAVE': {
      address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
      decimals: 18,
      name: 'Aave'
    }
  };

  // Sepolia testnet token addresses
  private sepoliaTokens = {
    'USDC': {
      address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      decimals: 6,
      name: 'USD Coin (Sepolia)'
    },
    'USDT': {
      address: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06',
      decimals: 6,
      name: 'Tether USD (Sepolia)'
    },
    'WETH': {
      address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
      decimals: 18,
      name: 'Wrapped Ethereum (Sepolia)'
    },
    'DAI': {
      address: '0x68194a729C2450ad26072b3D33ADaCbcef39D574',
      decimals: 18,
      name: 'Dai Stablecoin (Sepolia)'
    }
  };

  private anvilTokens = {
    'USDC': {
      address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      decimals: 6,
      name: 'USD Coin (Anvil)'
    },
    'USDT': {
      address: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      decimals: 6,
      name: 'Tether USD (Anvil)'
    },
    'WETH': {
      address: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      decimals: 18,
      name: 'Wrapped Ethereum (Anvil)'
    },
    'DAI': {
      address: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
      decimals: 18,
      name: 'Dai Stablecoin (Anvil)'
    }
  };

  constructor() {
    this.initializeProvider();
    // Use a timeout to prevent the restoration from hanging the app
    setTimeout(() => {
      this.restoreConnectionState().catch(error => {
        console.warn('Failed to restore wallet connection state:', error);
      });
    }, 0);
  }

  private initializeProvider() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
    }
  }

  /**
   * Save connection state to localStorage
   */
  private saveConnectionState(): void {
    if (typeof window === 'undefined') return;

    const connectionState = {
      address: this.currentAddress,
      chainId: this.currentChainId,
      timestamp: Date.now()
    };

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(connectionState));
    } catch (error) {
      console.warn('Failed to save wallet connection state:', error);
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
      const { address, chainId, timestamp } = connectionState;

      // Check if the saved state is not too old (24 hours)
      const isExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000;
      if (isExpired) {
        this.clearConnectionState();
        return;
      }

      // Check if the wallet is still connected - use a timeout to prevent hanging
      if (window.ethereum && address) {
        try {
          // Set a timeout for the wallet check to prevent hanging
          const walletCheckPromise = window.ethereum.request({ method: 'eth_accounts' });
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Wallet check timeout')), 3000)
          );

          const accounts = await Promise.race([walletCheckPromise, timeoutPromise]) as string[];
          
          if (accounts && accounts.length > 0 && accounts[0].toLowerCase() === address.toLowerCase()) {
            // Wallet is still connected, restore the state
            this.currentAddress = address;
            this.currentChainId = chainId;
            
            // Update the provider and signer asynchronously to avoid blocking
            if (this.provider) {
              this.provider.getSigner().then(signer => {
                this.signer = signer;
              }).catch(error => {
                console.warn('Failed to restore signer:', error);
              });
            }
            
            console.log('Wallet connection restored from localStorage');
          } else {
            // Wallet is not connected anymore, clear the state
            this.clearConnectionState();
          }
        } catch (error) {
          console.warn('Failed to verify wallet connection:', error);
          this.clearConnectionState();
        }
      }
    } catch (error) {
      console.warn('Failed to restore wallet connection state:', error);
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
      console.warn('Failed to clear wallet connection state:', error);
    }
  }

  /**
   * Connect to wallet and get account info
   */
  async connect(): Promise<WalletTokenInfo | null> {
    try {
      if (!this.provider) {
        throw new Error('No provider available');
      }

      // Request account access
      const accounts = await this.provider.send('eth_requestAccounts', []);
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      this.currentAddress = accounts[0];
      this.signer = await this.provider.getSigner();

      // Get chain ID and check if it's supported
      const network = await this.provider.getNetwork();
      this.currentChainId = Number(network.chainId);

      // Check if the current network is supported
      const supportedNetworks = [1, 5, 11155111, 31337]; // Mainnet, Goerli, Sepolia, Anvil
      if (!supportedNetworks.includes(this.currentChainId)) {
        throw new Error(`Unsupported network. Please switch to Ethereum Mainnet, Goerli, Sepolia, or Anvil. Current chain ID: ${this.currentChainId}`);
      }

      // Save connection state
      this.saveConnectionState();

      return await this.getWalletInfo();
    } catch (error) {
      console.error('Error connecting to wallet:', error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('localhost:8545')) {
          throw new Error('Please switch to a supported network (Ethereum Mainnet, Goerli, Sepolia, or Anvil) in MetaMask');
        }
        throw error;
      }

      return null;
    }
  }

  /**
   * Get comprehensive wallet information including token balances
   */
  async getWalletInfo(): Promise<WalletTokenInfo | null> {
    if (!this.provider || !this.currentAddress) {
      return null;
    }

    try {
      // Get native balance
      const nativeBalance = await this.provider.getBalance(this.currentAddress);
      const nativeBalanceFormatted = ethers.formatEther(nativeBalance);

      // Get token balances
      const tokens = await this.getTokenBalances();

      // Calculate total value
      const totalValue = await this.calculateTotalValue(tokens, nativeBalanceFormatted);

      return {
        address: this.currentAddress,
        chainId: this.currentChainId!,
        network: this.getNetworkName(this.currentChainId!),
        nativeBalance: nativeBalance.toString(),
        nativeBalanceFormatted,
        tokens,
        totalValue,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting wallet info:', error);
      return null;
    }
  }

  /**
   * Get balances for all common tokens
   */
  async getTokenBalances(): Promise<TokenBalance[]> {
    if (!this.provider || !this.currentAddress) {
      return [];
    }

    const tokenBalances: TokenBalance[] = [];
    const tokenSymbols: string[] = [];

    // Determine which token list to use based on network
    let tokensToCheck;
    if (this.currentChainId === 11155111) { // Sepolia
      tokensToCheck = this.sepoliaTokens;
    } else if (this.currentChainId === 31337) { // Anvil
      tokensToCheck = this.anvilTokens;
    } else {
      tokensToCheck = this.commonTokens;
    }

    // Check balances for all tokens in the appropriate network
    for (const [symbol, tokenInfo] of Object.entries(tokensToCheck)) {
      try {
        const contract = new ethers.Contract(
          tokenInfo.address,
          this.erc20Abi,
          this.provider
        );

        const balance = await contract.balanceOf(this.currentAddress);

        if (balance > 0) {
          const formattedBalance = ethers.formatUnits(balance, tokenInfo.decimals);
          tokenBalances.push({
            symbol,
            name: tokenInfo.name,
            balance: formattedBalance,
            balanceRaw: balance.toString(),
            decimals: tokenInfo.decimals,
            contractAddress: tokenInfo.address,
            network: this.getNetworkName(this.currentChainId!)
          });
          tokenSymbols.push(symbol);
        }
      } catch (error) {
        console.warn(`Error fetching balance for ${symbol}:`, error);
      }
    }

    // Add native ETH balance if it exists
    const nativeBalance = await this.provider.getBalance(this.currentAddress);
    if (nativeBalance > 0) {
      const ethPrice = await priceOracle.getTokenPrice('ETH');
      const ethBalance = ethers.formatEther(nativeBalance);
      tokenBalances.push({
        symbol: 'ETH',
        name: 'Ethereum',
        balance: ethBalance,
        balanceRaw: nativeBalance.toString(),
        decimals: 18,
        network: this.getNetworkName(this.currentChainId!),
        price: ethPrice?.price,
        change24h: ethPrice?.change24h,
        value: ethPrice ? parseFloat(ethBalance) * ethPrice.price : 0
      });
      tokenSymbols.push('ETH');
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
  async getTokenBalance(symbol: string): Promise<TokenBalance | null> {
    if (!this.provider || !this.currentAddress) {
      return null;
    }

    const tokenInfo = this.commonTokens[symbol as keyof typeof this.commonTokens];
    if (!tokenInfo) {
      return null;
    }

    try {
      const contract = new ethers.Contract(
        tokenInfo.address,
        this.erc20Abi,
        this.provider
      );

      const balance = await contract.balanceOf(this.currentAddress);
      const formattedBalance = ethers.formatUnits(balance, tokenInfo.decimals);

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
        network: this.getNetworkName(this.currentChainId!)
      };
    } catch (error) {
      console.error(`Error fetching balance for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Calculate total portfolio value
   */
  private async calculateTotalValue(tokens: TokenBalance[], nativeBalance: string): Promise<number> {
    let totalValue = 0;

    // Add native token value
    if (this.currentChainId === 1) { // Ethereum mainnet
      const ethPrice = await priceOracle.getTokenPrice('ETH');
      if (ethPrice) {
        totalValue += parseFloat(nativeBalance) * ethPrice.price;
      }
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
   * Get network name from chain ID
   */
  private getNetworkName(chainId: number): string {
    const networks: { [key: number]: string } = {
      1: 'ethereum',
      5: 'goerli',
      11155111: 'sepolia',
      31337: 'anvil',
      137: 'polygon',
      42161: 'arbitrum',
      10: 'optimism',
      56: 'bsc',
      43114: 'avalanche'
    };

    return networks[chainId] || 'unknown';
  }

  /**
   * Get current network name
   */
  getCurrentNetworkName(): string {
    if (!this.currentChainId) return 'unknown';
    return this.getNetworkName(this.currentChainId);
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
   * Get current chain ID
   */
  getCurrentChainId(): number | null {
    return this.currentChainId;
  }

  /**
   * Switch to a supported network
   */
  async switchToSupportedNetwork(): Promise<boolean> {
    try {
      if (!this.provider) {
        throw new Error('No provider available');
      }

      // Try to switch to Sepolia testnet first (recommended for testing)
      try {
        await this.provider.send('wallet_switchEthereumChain', [{ chainId: '0xaa36a7' }]); // Sepolia
        return true;
      } catch (switchError) {
        // If Sepolia is not added, add it
        if ((switchError as any).code === 4902) {
          await this.provider.send('wallet_addEthereumChain', [{
            chainId: '0xaa36a7',
            chainName: 'Sepolia Testnet',
            nativeCurrency: {
              name: 'Sepolia Ether',
              symbol: 'SEP',
              decimals: 18
            },
            rpcUrls: ['https://sepolia.infura.io/v3/'],
            blockExplorerUrls: ['https://sepolia.etherscan.io']
          }]);
          return true;
        }
        throw switchError;
      }
    } catch (error) {
      console.error('Error switching network:', error);
      return false;
    }
  }

  /**
   * Switch to Anvil network (for local development)
   */
  async switchToAnvil(): Promise<boolean> {
    try {
      if (!this.provider) {
        throw new Error('No provider available');
      }

      // Try to switch to Anvil
      try {
        await this.provider.send('wallet_switchEthereumChain', [{ chainId: '0x7a69' }]); // Anvil (31337)
        return true;
      } catch (switchError) {
        // If Anvil is not added, add it
        if ((switchError as any).code === 4902) {
          await this.provider.send('wallet_addEthereumChain', [{
            chainId: '0x7a69',
            chainName: 'Anvil',
            nativeCurrency: {
              name: 'Ether',
              symbol: 'ETH',
              decimals: 18
            },
            rpcUrls: ['http://127.0.0.1:8545'],
            blockExplorerUrls: []
          }]);
          return true;
        }
        throw switchError;
      }
    } catch (error) {
      console.error('Error switching to Anvil:', error);
      return false;
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect(): void {
    this.currentAddress = null;
    this.currentChainId = null;
    this.signer = null;
    this.clearConnectionState();
  }

  /**
   * Listen for account changes
   */
  onAccountChange(callback: (address: string) => void): void {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          this.currentAddress = accounts[0];
          this.saveConnectionState();
          callback(accounts[0]);
        } else {
          this.disconnect();
        }
      });
    }
  }

  /**
   * Listen for chain changes
   */
  onChainChange(callback: (chainId: number) => void): void {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('chainChanged', (chainId: string) => {
        this.currentChainId = parseInt(chainId, 16);
        this.saveConnectionState();
        callback(this.currentChainId);
      });
    }
  }
}

// Global instance
export const enhancedWallet = new EnhancedWalletService(); 