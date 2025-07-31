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

  constructor() {
    this.inchApiKey = process.env.INCH_API_KEY || '';
  }

  /**
   * Get token price from CoinGecko
   */
  async getTokenPrice(symbol: string, currency: string = 'usd'): Promise<TokenPrice | null> {
    try {
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

      return {
        symbol: symbol.toUpperCase(),
        price: data[currency],
        change24h: data[`${currency}_24h_change`] || 0,
        marketCap: data[`${currency}_market_cap`],
        volume24h: data[`${currency}_24h_vol`],
        lastUpdated: new Date(data.last_updated_at * 1000).toISOString(),
        source: 'coingecko'
      };
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return null;
    }
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
   * Get multiple token prices
   */
  async getMultipleTokenPrices(symbols: string[]): Promise<Map<string, TokenPrice>> {
    const prices = new Map<string, TokenPrice>();

    // Batch request for CoinGecko
    const coinIds = symbols.map(s => this.getCoinGeckoId(s)).filter(Boolean);

    if (coinIds.length > 0) {
      try {
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
            prices.set(symbol, {
              symbol: symbol.toUpperCase(),
              price: priceData.usd,
              change24h: priceData.usd_24h_change || 0,
              marketCap: priceData.usd_market_cap,
              lastUpdated: new Date().toISOString(),
              source: 'coingecko'
            });
          }
        }
      } catch (error) {
        console.error('Error fetching multiple token prices:', error);
      }
    }

    return prices;
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
      const response = await axios.get('https://api.etherscan.io/api', {
        params: {
          module: 'gastracker',
          action: 'gasoracle',
          apikey: process.env.ETHERSCAN_API_KEY || ''
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
    } catch (error) {
      console.error('Error fetching gas price:', error);
    }

    return null;
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