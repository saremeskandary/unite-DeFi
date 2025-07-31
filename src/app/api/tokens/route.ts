import { NextRequest, NextResponse } from 'next/server';
import { enhancedWallet } from '@/lib/enhanced-wallet';
import { priceOracle } from '@/lib/price-oracle';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const includePrices = searchParams.get('includePrices') === 'true';

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Get wallet info if connected
    let walletInfo: any = null;
    if (enhancedWallet.isConnected() && enhancedWallet.getCurrentAddress() === address) {
      walletInfo = await enhancedWallet.getWalletInfo();
    }

    // Define supported tokens
    const supportedTokens = [
      {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        contractAddress: '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8C',
        network: 'ethereum',
        icon: 'usdc'
      },
      {
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        network: 'ethereum',
        icon: 'usdt'
      },
      {
        symbol: 'WETH',
        name: 'Wrapped Ethereum',
        decimals: 18,
        contractAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        network: 'ethereum',
        icon: 'weth'
      },
      {
        symbol: 'WBTC',
        name: 'Wrapped Bitcoin',
        decimals: 8,
        contractAddress: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        network: 'ethereum',
        icon: 'wbtc'
      },
      {
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        decimals: 18,
        contractAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        network: 'ethereum',
        icon: 'dai'
      },
      {
        symbol: 'UNI',
        name: 'Uniswap',
        decimals: 18,
        contractAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        network: 'ethereum',
        icon: 'uni'
      },
      {
        symbol: 'LINK',
        name: 'Chainlink',
        decimals: 18,
        contractAddress: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
        network: 'ethereum',
        icon: 'link'
      },
      {
        symbol: 'AAVE',
        name: 'Aave',
        decimals: 18,
        contractAddress: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
        network: 'ethereum',
        icon: 'aave'
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        contractAddress: null, // Native token
        network: 'ethereum',
        icon: 'eth'
      },
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        decimals: 8,
        contractAddress: null, // Cross-chain token
        network: 'bitcoin',
        icon: 'btc'
      }
    ];

    // Add balance and price information if wallet is connected
    const tokensWithData = await Promise.all(
      supportedTokens.map(async (token) => {
        let balance = '0';
        let price = null;
        let change24h = null;

        // Get balance if wallet is connected
        if (walletInfo) {
          if (token.symbol === 'ETH') {
            balance = walletInfo.nativeBalanceFormatted;
          } else {
            const tokenBalance = walletInfo.tokens.find((t: any) => t.symbol === token.symbol);
            if (tokenBalance) {
              balance = tokenBalance.balance;
              price = tokenBalance.price;
              change24h = tokenBalance.change24h;
            }
          }
        }

        // Get price if not already available and prices are requested
        if (!price && includePrices) {
          const priceData = await priceOracle.getTokenPrice(token.symbol);
          if (priceData) {
            price = priceData.price;
            change24h = priceData.change24h;
          }
        }

        return {
          ...token,
          balance,
          price,
          change24h,
          value: price && balance !== '0' ? parseFloat(balance) * price : null
        };
      })
    );

    // Filter out tokens with zero balance if requested
    const includeZeroBalances = searchParams.get('includeZeroBalances') !== 'false';
    const filteredTokens = includeZeroBalances
      ? tokensWithData
      : tokensWithData.filter(token => parseFloat(token.balance) > 0);

    return NextResponse.json({
      tokens: filteredTokens,
      totalTokens: filteredTokens.length,
      walletConnected: enhancedWallet.isConnected(),
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tokens' },
      { status: 500 }
    );
  }
} 