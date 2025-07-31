import { NextRequest, NextResponse } from 'next/server';

// Mock portfolio data - in a real implementation, this would fetch from blockchain APIs
const MOCK_PORTFOLIOS: Record<string, any> = {
  '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6': {
    totalValue: 125000 + Math.random() * 25000,
    assets: [
      {
        symbol: 'ETH',
        balance: 15.5 + Math.random() * 5,
        value: 45000 + Math.random() * 10000,
        change24h: 2.5 + Math.random() * 8,
      },
      {
        symbol: 'BTC',
        balance: 0.8 + Math.random() * 0.5,
        value: 36000 + Math.random() * 8000,
        change24h: -1.2 + Math.random() * 6,
      },
      {
        symbol: 'USDC',
        balance: 25000 + Math.random() * 10000,
        value: 25000 + Math.random() * 10000,
        change24h: 0.01 + Math.random() * 0.02,
      },
      {
        symbol: 'SOL',
        balance: 150 + Math.random() * 50,
        value: 18000 + Math.random() * 5000,
        change24h: 5.8 + Math.random() * 12,
      },
      {
        symbol: 'MATIC',
        balance: 5000 + Math.random() * 2000,
        value: 1000 + Math.random() * 500,
        change24h: 3.2 + Math.random() * 10,
      },
    ],
  },
  '0x1234567890123456789012345678901234567890': {
    totalValue: 75000 + Math.random() * 15000,
    assets: [
      {
        symbol: 'ETH',
        balance: 8.2 + Math.random() * 3,
        value: 24000 + Math.random() * 6000,
        change24h: 1.8 + Math.random() * 6,
      },
      {
        symbol: 'USDT',
        balance: 30000 + Math.random() * 15000,
        value: 30000 + Math.random() * 15000,
        change24h: 0.02 + Math.random() * 0.03,
      },
      {
        symbol: 'LINK',
        balance: 800 + Math.random() * 300,
        value: 12000 + Math.random() * 4000,
        change24h: 4.5 + Math.random() * 10,
      },
      {
        symbol: 'DOT',
        balance: 1200 + Math.random() * 500,
        value: 9000 + Math.random() * 3000,
        change24h: 2.1 + Math.random() * 8,
      },
    ],
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const network = searchParams.get('network') || 'mainnet';
    const address = params.address;

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    // Validate address format (basic check)
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address format' },
        { status: 400 }
      );
    }

    // Get portfolio data
    let portfolioData = MOCK_PORTFOLIOS[address];

    if (!portfolioData) {
      // Generate mock data for unknown addresses
      const totalValue = 50000 + Math.random() * 100000;
      const assets = [
        {
          symbol: 'ETH',
          balance: 5 + Math.random() * 20,
          value: totalValue * 0.4 + Math.random() * totalValue * 0.2,
          change24h: -5 + Math.random() * 20,
        },
        {
          symbol: 'BTC',
          balance: 0.2 + Math.random() * 2,
          value: totalValue * 0.3 + Math.random() * totalValue * 0.2,
          change24h: -3 + Math.random() * 15,
        },
        {
          symbol: 'USDC',
          balance: 10000 + Math.random() * 50000,
          value: totalValue * 0.2 + Math.random() * totalValue * 0.1,
          change24h: 0.01 + Math.random() * 0.02,
        },
        {
          symbol: 'SOL',
          balance: 50 + Math.random() * 200,
          value: totalValue * 0.1 + Math.random() * totalValue * 0.1,
          change24h: 2 + Math.random() * 15,
        },
      ];

      portfolioData = {
        totalValue,
        assets,
      };
    }

    // Add some randomness to simulate real-time updates
    portfolioData.totalValue += (Math.random() - 0.5) * 1000;
    portfolioData.assets.forEach((asset: any) => {
      asset.value += (Math.random() - 0.5) * asset.value * 0.05;
      asset.change24h += (Math.random() - 0.5) * 2;
    });

    // Add a small delay to simulate API latency
    await new Promise(resolve => setTimeout(resolve, 150));

    return NextResponse.json({
      address,
      network,
      totalValue: portfolioData.totalValue,
      assets: portfolioData.assets,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio' },
      { status: 500 }
    );
  }
} 