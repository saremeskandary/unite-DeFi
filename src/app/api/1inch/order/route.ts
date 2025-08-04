import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromTokenAddress, toTokenAddress, amount, walletAddress } = body;

    if (!fromTokenAddress || !toTokenAddress || !amount || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_INCH_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: '1inch API key not configured' },
        { status: 500 }
      );
    }

    // Call 1inch Fusion API to place order
    const response = await fetch(
      'https://api.1inch.dev/fusion/order',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromTokenAddress,
          toTokenAddress,
          amount,
          walletAddress,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('1inch API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to place order with 1inch API', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in 1inch order API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 