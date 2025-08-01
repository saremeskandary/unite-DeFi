import axios from 'axios';

export interface TokenPrice {
  symbol: string;
  price: number;
  change24h: number;
  marketCap?: number;
  volume24h?: number;
  lastUpdated: string;
  source: string;
}

export interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  rate: number;
  priceImpact: number;
  gasEstimate: string;
  gasCost: number;
  source: string;
}

export class PriceOracleService {
  private coingeckoBaseUrl = 'https://api.coingecko.com/api/v3';
  private inchBaseUrl = 'https://api.1inch.dev/swap/v6.0';
  private inchApiKey: string;
  private etherscanApiKey: string;
  private fallbackApiUrl = 'https://api.coinbase.com/v2';

  // Rate limiting
  private requestCount = 0;
  private lastRequestTime = 0;
  private readonly RATE_LIMIT = 50; // requests per minute
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute in ms

  // Cache for prices
  private priceCache = new Map<string, { price: TokenPrice; timestamp: number }>();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  constructor() {
    this.inchApiKey = process.env.INCH_API_KEY || process.env.NEXT_PUBLIC_INCH_API_KEY || '';
    this.etherscanApiKey = process.env.ETHERSCAN_API_KEY || '';
  }

  /**
   * Rate limiting helper
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();

    // Reset counter if window has passed
    if (now - this.lastRequestTime > this.RATE_LIMIT_WINDOW) {
      this.requestCount = 0;
      this.lastRequestTime = now;
    }

    // Check if we're at the limit
    if (this.requestCount >= this.RATE_LIMIT) {
      const waitTime = this.RATE_LIMIT_WINDOW - (now - this.lastRequestTime);
      console.warn(`Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.lastRequestTime = Date.now();
    }

    this.requestCount++;
  }

  /**
   * Get cached price if available and not expired
   */
  private getCachedPrice(symbol: string): TokenPrice | null {
    const cached = this.priceCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.price;
    }
    return null;
  }

  /**
   * Cache a price
   */
  private cachePrice(symbol: string, price: TokenPrice): void {
    this.priceCache.set(symbol, { price, timestamp: Date.now() });
  }

  /**
   * Get token price from CoinGecko with rate limiting and fallback
   */
  async getTokenPrice(symbol: string, currency: string = 'usd'): Promise<TokenPrice | null> {
    // Check cache first
    const cached = this.getCachedPrice(symbol);
    if (cached) {
      return cached;
    }

    try {
      await this.checkRateLimit();

      const coinId = this.getCoinGeckoId(symbol);
      if (!coinId) {
        console.warn(`No CoinGecko ID found for symbol: ${symbol}`);
        return null;
      }

      const response = await axios.get(
        `${this.coingeckoBaseUrl}/simple/price`,
        {
          params: {
            ids: coinId,
            vs_currencies: currency,
            include_24hr_change: true,
            include_market_cap: true,
            include_24hr_vol: true,
            include_last_updated_at: true
          },
          timeout: 5000
        }
      );

      const data = response.data[coinId];
      if (!data) return null;

      const priceData: TokenPrice = {
        symbol: symbol.toUpperCase(),
        price: data[currency],
        change24h: data[`${currency}_24h_change`] || 0,
        marketCap: data[`${currency}_market_cap`],
        volume24h: data[`${currency}_24h_vol`],
        lastUpdated: new Date(data.last_updated_at * 1000).toISOString(),
        source: 'coingecko'
      };

      // Cache the result
      this.cachePrice(symbol, priceData);
      return priceData;

    } catch (error: any) {
      console.error(`Error fetching price for ${symbol}:`, error);

      // If it's a rate limit error, try fallback
      if (error.response?.status === 429) {
        console.log(`Rate limited for ${symbol}, trying fallback...`);
        return this.getFallbackPrice(symbol, currency);
      }

      return null;
    }
  }

  /**
   * Fallback price fetching from Coinbase API
   */
  private async getFallbackPrice(symbol: string, currency: string = 'usd'): Promise<TokenPrice | null> {
    try {
      const coinbaseSymbol = this.getCoinbaseSymbol(symbol);
      if (!coinbaseSymbol) return null;

      const response = await axios.get(
        `${this.fallbackApiUrl}/prices/${coinbaseSymbol}-${currency.toUpperCase()}/spot`,
        { timeout: 5000 }
      );

      if (response.data?.data) {
        const priceData: TokenPrice = {
          symbol: symbol.toUpperCase(),
          price: parseFloat(response.data.data.amount),
          change24h: 0, // Coinbase doesn't provide 24h change in this endpoint
          lastUpdated: new Date().toISOString(),
          source: 'coinbase'
        };

        this.cachePrice(symbol, priceData);
        return priceData;
      }
    } catch (error) {
      console.error(`Fallback price fetch failed for ${symbol}:`, error);
    }

    return null;
  }

  /**
   * Get multiple token prices with batching and rate limiting
   */
  async getMultipleTokenPrices(symbols: string[]): Promise<Map<string, TokenPrice>> {
    const prices = new Map<string, TokenPrice>();

    // Check cache first for all symbols
    const uncachedSymbols: string[] = [];
    for (const symbol of symbols) {
      const cached = this.getCachedPrice(symbol);
      if (cached) {
        prices.set(symbol, cached);
      } else {
        uncachedSymbols.push(symbol);
      }
    }

    // If all prices are cached, return immediately
    if (uncachedSymbols.length === 0) {
      return prices;
    }

    // Batch request for CoinGecko (max 50 symbols per request)
    const batches = this.chunkArray(uncachedSymbols, 50);

    for (const batch of batches) {
      try {
        await this.checkRateLimit();

        const coinIds = batch.map(s => this.getCoinGeckoId(s)).filter(Boolean);

        if (coinIds.length === 0) continue;

        const response = await axios.get(
          `${this.coingeckoBaseUrl}/simple/price`,
          {
            params: {
              ids: coinIds.join(','),
              vs_currencies: 'usd',
              include_24hr_change: true,
              include_market_cap: true
            },
            timeout: 5000
          }
        );

        for (const [coinId, data] of Object.entries(response.data)) {
          const symbol = this.getSymbolFromCoinGeckoId(coinId);
          if (symbol && data && typeof data === 'object' && 'usd' in data) {
            const priceData = data as { usd: number; usd_24h_change?: number; usd_market_cap?: number };
            const tokenPrice: TokenPrice = {
              symbol: symbol.toUpperCase(),
              price: priceData.usd,
              change24h: priceData.usd_24h_change || 0,
              marketCap: priceData.usd_market_cap,
              lastUpdated: new Date().toISOString(),
              source: 'coingecko'
            };

            prices.set(symbol, tokenPrice);
            this.cachePrice(symbol, tokenPrice);
          }
        }
      } catch (error: any) {
        console.error('Error fetching batch of token prices:', error);

        // If rate limited, try individual fallback requests
        if (error.response?.status === 429) {
          for (const symbol of batch) {
            const fallbackPrice = await this.getFallbackPrice(symbol);
            if (fallbackPrice) {
              prices.set(symbol, fallbackPrice);
            }
          }
        }
      }
    }

    return prices;
  }

  /**
   * Helper to chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Get Coinbase symbol mapping
   */
  private getCoinbaseSymbol(symbol: string): string | null {
    const coinbaseMap: { [key: string]: string } = {
      'BTC': 'BTC',
      'ETH': 'ETH',
      'USDC': 'USDC',
      'USDT': 'USDT',
      'WETH': 'WETH',
      'WBTC': 'WBTC',
      'DAI': 'DAI',
      'UNI': 'UNI',
      'LINK': 'LINK',
      'AAVE': 'AAVE',
      'MATIC': 'MATIC',
      'SOL': 'SOL',
      'ADA': 'ADA',
      'DOT': 'DOT',
      'AVAX': 'AVAX',
      'ATOM': 'ATOM',
      'FTM': 'FTM',
      'NEAR': 'NEAR',
      'ALGO': 'ALGO',
      'XRP': 'XRP'
    };

    return coinbaseMap[symbol.toUpperCase()] || null;
  }

  /**
   * Get swap quote from 1inch API
   */
  async getSwapQuote(
    fromToken: string,
    toToken: string,
    amount: string,
    fromAddress: string,
    chainId: number = 1
  ): Promise<SwapQuote | null> {
    try {
      if (!this.inchApiKey) {
        console.warn('1inch API key not configured');
        return null;
      }

      const response = await axios.get(
        `${this.inchBaseUrl}/${chainId}/quote`,
        {
          params: {
            src: fromToken,
            dst: toToken,
            amount: amount,
            from: fromAddress,
            includeTokensInfo: true,
            includeGas: true
          },
          headers: {
            'Authorization': `Bearer ${this.inchApiKey}`,
            'Accept': 'application/json'
          },
          timeout: 10000
        }
      );

      const data = response.data;
      const rate = parseFloat(data.toAmount) / parseFloat(data.fromAmount);

      return {
        fromToken: data.fromToken.symbol,
        toToken: data.toToken.symbol,
        fromAmount: data.fromAmount,
        toAmount: data.toAmount,
        rate,
        priceImpact: data.priceImpact || 0,
        gasEstimate: data.tx?.gas || '0',
        gasCost: data.tx?.gasCost || 0,
        source: '1inch'
      };
    } catch (error) {
      console.error('Error fetching swap quote:', error);
      return null;
    }
  }

  /**
   * Calculate exchange rate between two tokens
   */
  async getExchangeRate(fromToken: string, toToken: string): Promise<number | null> {
    try {
      const [fromPrice, toPrice] = await Promise.all([
        this.getTokenPrice(fromToken),
        this.getTokenPrice(toToken)
      ]);

      if (!fromPrice || !toPrice) return null;

      return toPrice.price / fromPrice.price;
    } catch (error) {
      console.error('Error calculating exchange rate:', error);
      return null;
    }
  }

  /**
   * Get gas price estimate for Ethereum network
   */
  async getGasPrice(chainId: number = 1): Promise<{ fast: number; standard: number; slow: number } | null> {
    try {
      if (chainId === 1 && this.etherscanApiKey) {
        // Ethereum mainnet - use Etherscan API
        const response = await axios.get('https://api.etherscan.io/api', {
          params: {
            module: 'gastracker',
            action: 'gasoracle',
            apikey: this.etherscanApiKey
          },
          timeout: 5000
        });

        if (response.data.status === '1') {
          const result = response.data.result;
          return {
            fast: parseInt(result.FastGasPrice),
            standard: parseInt(result.ProposeGasPrice),
            slow: parseInt(result.SafeGasPrice)
          };
        }
      }

      // For testnets or when Etherscan is not available, use RPC
      try {
        const rpcUrl = chainId === 11155111 ?
          'https://eth-sepolia.public.blastapi.io' :
          'https://eth-mainnet.public.blastapi.io';

        const response = await axios.post(rpcUrl, {
          jsonrpc: '2.0',
          method: 'eth_gasPrice',
          params: [],
          id: 1
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        });

        if (response.data.result) {
          const gasPrice = parseInt(response.data.result, 16);
          const gwei = gasPrice / 1e9;

          return {
            fast: Math.round(gwei * 1.2),
            standard: Math.round(gwei),
            slow: Math.round(gwei * 0.8)
          };
        }
      } catch (rpcError) {
        console.warn('RPC gas price fetch failed:', rpcError);
      }

      // Fallback: use 1inch gas price API
      if (this.inchApiKey) {
        const response = await axios.get(`${this.inchBaseUrl}/${chainId}/gas`, {
          headers: {
            'Authorization': `Bearer ${this.inchApiKey}`
          },
          timeout: 5000
        });

        if (response.data) {
          return {
            fast: response.data.fast || 20,
            standard: response.data.standard || 15,
            slow: response.data.slow || 10
          };
        }
      }

      // Final fallback: return reasonable defaults
      return {
        fast: 25,
        standard: 20,
        slow: 15
      };
    } catch (error) {
      console.error('Error fetching gas price:', error);
      return {
        fast: 25,
        standard: 20,
        slow: 15
      };
    }
  }

  /**
   * Calculate dynamic fees based on network conditions
   */
  async calculateDynamicFees(
    chainId: number = 1,
    gasLimit: number = 21000,
    priority: 'fast' | 'standard' | 'slow' = 'standard'
  ): Promise<{
    gasPrice: number;
    gasLimit: number;
    totalFee: number;
    estimatedTime: string;
  }> {
    const gasPrices = await this.getGasPrice(chainId);
    if (!gasPrices) {
      throw new Error('Unable to fetch gas prices');
    }

    const gasPrice = gasPrices[priority];
    const totalFee = (gasPrice * gasLimit) / 1e9; // Convert to ETH
    const estimatedTime = this.getEstimatedTime(priority);

    return {
      gasPrice,
      gasLimit,
      totalFee,
      estimatedTime
    };
  }

  private getEstimatedTime(priority: 'fast' | 'standard' | 'slow'): string {
    switch (priority) {
      case 'fast':
        return '~30 seconds';
      case 'standard':
        return '~2-5 minutes';
      case 'slow':
        return '~10-15 minutes';
      default:
        return '~2-5 minutes';
    }
  }

  private getCoinGeckoId(symbol: string): string | null {
    const coinMap: { [key: string]: string } = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'WETH': 'weth',
      'WBTC': 'wrapped-bitcoin',
      'DAI': 'dai',
      'UNI': 'uniswap',
      'LINK': 'chainlink',
      'AAVE': 'aave',
      'MATIC': 'matic-network',
      'SOL': 'solana',
      'ADA': 'cardano',
      'DOT': 'polkadot',
      'AVAX': 'avalanche-2',
      'ATOM': 'cosmos',
      'FTM': 'fantom',
      'NEAR': 'near',
      'ALGO': 'algorand',
      'XRP': 'ripple'
    };

    return coinMap[symbol.toUpperCase()] || null;
  }

  private getSymbolFromCoinGeckoId(coinId: string): string | null {
    const reverseMap: { [key: string]: string } = {
      'bitcoin': 'BTC',
      'ethereum': 'ETH',
      'usd-coin': 'USDC',
      'tether': 'USDT',
      'weth': 'WETH',
      'wrapped-bitcoin': 'WBTC',
      'dai': 'DAI',
      'uniswap': 'UNI',
      'chainlink': 'LINK',
      'aave': 'AAVE',
      'matic-network': 'MATIC',
      'solana': 'SOL',
      'cardano': 'ADA',
      'polkadot': 'DOT',
      'avalanche-2': 'AVAX',
      'cosmos': 'ATOM',
      'fantom': 'FTM',
      'near': 'NEAR',
      'algorand': 'ALGO',
      'ripple': 'XRP'
    };

    return reverseMap[coinId] || null;
  }
}

// Global instance
export const priceOracle = new PriceOracleService(); 