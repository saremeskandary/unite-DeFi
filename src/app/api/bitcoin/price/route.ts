import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const currency = searchParams.get('currency') || 'usd';

    // Try to fetch real Bitcoin price from CoinGecko with timeout
    let bitcoinData: any = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${currency}&include_24hr_change=true&include_market_cap=true`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        bitcoinData = data.bitcoin;
      }
    } catch (error) {
      console.warn('CoinGecko API unavailable, using fallback data:', error);
    }

    // Fallback data if API fails
    if (!bitcoinData) {
      bitcoinData = {
        usd: 43250.50,
        usd_24h_change: 2.45,
        usd_market_cap: 850000000000
      };
    }

    return NextResponse.json({
      price: bitcoinData[currency],
      change24h: bitcoinData[`${currency}_24h_change`],
      marketCap: bitcoinData[`${currency}_market_cap`],
      currency,
      timestamp: new Date().toISOString(),
      source: bitcoinData.usd ? 'coingecko' : 'fallback'
    });

  } catch (error) {
    console.error('Error fetching Bitcoin price:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Bitcoin price' },
      { status: 500 }
    );
  }
} 