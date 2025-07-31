import { NextRequest, NextResponse } from 'next/server';

// Mock price data - in a real implementation, this would fetch from CoinGecko, CoinMarketCap, etc.
const MOCK_PRICES = {
  BTC: {
    price: 45000 + Math.random() * 2000,
    change24h: -2.5 + Math.random() * 10,
    volume24h: 25000000000 + Math.random() * 5000000000,
    marketCap: 850000000000 + Math.random() * 50000000000,
  },
  ETH: {
    price: 2800 + Math.random() * 200,
    change24h: 1.8 + Math.random() * 8,
    volume24h: 15000000000 + Math.random() * 3000000000,
    marketCap: 350000000000 + Math.random() * 20000000000,
  },
  USDC: {
    price: 1.00,
    change24h: 0.01 + Math.random() * 0.02,
    volume24h: 5000000000 + Math.random() * 1000000000,
    marketCap: 25000000000 + Math.random() * 5000000000,
  },
  USDT: {
    price: 1.00,
    change24h: 0.02 + Math.random() * 0.03,
    volume24h: 80000000000 + Math.random() * 10000000000,
    marketCap: 90000000000 + Math.random() * 10000000000,
  },
  SOL: {
    price: 120 + Math.random() * 20,
    change24h: 5.2 + Math.random() * 15,
    volume24h: 3000000000 + Math.random() * 1000000000,
    marketCap: 50000000000 + Math.random() * 10000000000,
  },
  ADA: {
    price: 0.45 + Math.random() * 0.1,
    change24h: -1.2 + Math.random() * 8,
    volume24h: 1000000000 + Math.random() * 500000000,
    marketCap: 15000000000 + Math.random() * 5000000000,
  },
  DOT: {
    price: 7.5 + Math.random() * 1.5,
    change24h: 2.1 + Math.random() * 10,
    volume24h: 800000000 + Math.random() * 400000000,
    marketCap: 10000000000 + Math.random() * 3000000000,
  },
  LINK: {
    price: 15 + Math.random() * 3,
    change24h: 3.5 + Math.random() * 12,
    volume24h: 1200000000 + Math.random() * 600000000,
    marketCap: 8000000000 + Math.random() * 2000000000,
  },
  MATIC: {
    price: 0.85 + Math.random() * 0.2,
    change24h: 4.2 + Math.random() * 14,
    volume24h: 900000000 + Math.random() * 400000000,
    marketCap: 8000000000 + Math.random() * 2000000000,
  },
  AVAX: {
    price: 35 + Math.random() * 8,
    change24h: 6.8 + Math.random() * 16,
    volume24h: 1500000000 + Math.random() * 700000000,
    marketCap: 12000000000 + Math.random() * 4000000000,
  },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbols = searchParams.get('symbols');

    if (!symbols) {
      return NextResponse.json(
        { error: 'Symbols parameter is required' },
        { status: 400 }
      );
    }

    const symbolList = symbols.split(',').map(s => s.toUpperCase());
    const prices: Record<string, any> = {};

    symbolList.forEach(symbol => {
      if (MOCK_PRICES[symbol as keyof typeof MOCK_PRICES]) {
        prices[symbol] = MOCK_PRICES[symbol as keyof typeof MOCK_PRICES];
      } else {
        // Generate mock data for unknown symbols
        prices[symbol] = {
          price: 10 + Math.random() * 100,
          change24h: -5 + Math.random() * 20,
          volume24h: 100000000 + Math.random() * 1000000000,
          marketCap: 1000000000 + Math.random() * 10000000000,
        };
      }
    });

    // Add a small delay to simulate API latency
    await new Promise(resolve => setTimeout(resolve, 100));

    return NextResponse.json(prices);

  } catch (error) {
    console.error('Error fetching prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbols } = body;

    if (!symbols || !Array.isArray(symbols)) {
      return NextResponse.json(
        { error: 'Symbols array is required' },
        { status: 400 }
      );
    }

    const symbolList = symbols.map((s: string) => s.toUpperCase());
    const prices: Record<string, any> = {};

    symbolList.forEach(symbol => {
      if (MOCK_PRICES[symbol as keyof typeof MOCK_PRICES]) {
        prices[symbol] = MOCK_PRICES[symbol as keyof typeof MOCK_PRICES];
      } else {
        // Generate mock data for unknown symbols
        prices[symbol] = {
          price: 10 + Math.random() * 100,
          change24h: -5 + Math.random() * 20,
          volume24h: 100000000 + Math.random() * 1000000000,
          marketCap: 1000000000 + Math.random() * 10000000000,
        };
      }
    });

    // Add a small delay to simulate API latency
    await new Promise(resolve => setTimeout(resolve, 100));

    return NextResponse.json(prices);

  } catch (error) {
    console.error('Error fetching prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    );
  }
} 