import { NextRequest, NextResponse } from 'next/server';
import { priceOracle } from '@/lib/price-oracle';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbols = searchParams.get('symbols');
    const currency = searchParams.get('currency') || 'usd';
    const include24hChange = searchParams.get('include24hChange') === 'true';
    const includeMarketCap = searchParams.get('includeMarketCap') === 'true';

    if (!symbols) {
      return NextResponse.json(
        { error: 'Missing required parameter: symbols (comma-separated list)' },
        { status: 400 }
      );
    }

    const symbolList = symbols.split(',').map(s => s.trim().toUpperCase());

    if (symbolList.length === 0) {
      return NextResponse.json(
        { error: 'At least one symbol must be provided' },
        { status: 400 }
      );
    }

    // Limit to 20 symbols to prevent abuse
    if (symbolList.length > 20) {
      return NextResponse.json(
        { error: 'Maximum 20 symbols allowed per request' },
        { status: 400 }
      );
    }

    // Get prices for all requested symbols
    const prices = await priceOracle.getMultipleTokenPrices(symbolList);

    const response: any = {
      currency,
      timestamp: new Date().toISOString(),
      prices: {}
    };

    // Build response object
    symbolList.forEach(symbol => {
      const priceData = prices.get(symbol);
      if (priceData) {
        response.prices[symbol] = {
          price: priceData.price,
          symbol: priceData.symbol,
          lastUpdated: priceData.lastUpdated,
          source: priceData.source,
          ...(include24hChange && { change24h: priceData.change24h }),
          ...(includeMarketCap && priceData.marketCap && { marketCap: priceData.marketCap }),
          ...(priceData.volume24h && { volume24h: priceData.volume24h })
        };
      } else {
        response.prices[symbol] = {
          error: 'Price not available',
          symbol
        };
      }
    });

    // Add summary statistics
    const availablePrices = Array.from(prices.values());
    if (availablePrices.length > 0) {
      response.summary = {
        totalRequested: symbolList.length,
        available: availablePrices.length,
        unavailable: symbolList.length - availablePrices.length
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching token prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token prices' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbols, currency = 'usd', include24hChange = true, includeMarketCap = true } = body;

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid symbols array' },
        { status: 400 }
      );
    }

    // Limit to 20 symbols to prevent abuse
    if (symbols.length > 20) {
      return NextResponse.json(
        { error: 'Maximum 20 symbols allowed per request' },
        { status: 400 }
      );
    }

    const symbolList = symbols.map((s: string) => s.trim().toUpperCase());
    const prices = await priceOracle.getMultipleTokenPrices(symbolList);

    const response: any = {
      currency,
      timestamp: new Date().toISOString(),
      prices: {}
    };

    // Build response object
    symbolList.forEach(symbol => {
      const priceData = prices.get(symbol);
      if (priceData) {
        response.prices[symbol] = {
          price: priceData.price,
          symbol: priceData.symbol,
          lastUpdated: priceData.lastUpdated,
          source: priceData.source,
          ...(include24hChange && { change24h: priceData.change24h }),
          ...(includeMarketCap && priceData.marketCap && { marketCap: priceData.marketCap }),
          ...(priceData.volume24h && { volume24h: priceData.volume24h })
        };
      } else {
        response.prices[symbol] = {
          error: 'Price not available',
          symbol
        };
      }
    });

    // Add summary statistics
    const availablePrices = Array.from(prices.values());
    if (availablePrices.length > 0) {
      response.summary = {
        totalRequested: symbolList.length,
        available: availablePrices.length,
        unavailable: symbolList.length - availablePrices.length
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching token prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token prices' },
      { status: 500 }
    );
  }
} 