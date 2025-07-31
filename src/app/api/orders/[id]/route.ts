import { NextRequest, NextResponse } from 'next/server';

// Mock order data - in a real implementation, this would fetch from blockchain or database
const MOCK_ORDERS: Record<string, any> = {
  'order-12345': {
    orderId: 'order-12345',
    status: 'confirmed',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    gasUsed: 125000,
    blockNumber: 18543210,
    transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  },
  'order-67890': {
    orderId: 'order-67890',
    status: 'processing',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    gasUsed: null,
    blockNumber: null,
    transactionHash: null,
  },
  'order-11111': {
    orderId: 'order-11111',
    status: 'failed',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    gasUsed: 85000,
    blockNumber: 18543150,
    transactionHash: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
  },
  'order-22222': {
    orderId: 'order-22222',
    status: 'pending',
    timestamp: new Date().toISOString(),
    gasUsed: null,
    blockNumber: null,
    transactionHash: null,
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const network = searchParams.get('network') || 'mainnet';
    const orderId = params.id;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID parameter is required' },
        { status: 400 }
      );
    }

    // Get order data
    let orderData = MOCK_ORDERS[orderId];

    if (!orderData) {
      // Generate mock data for unknown orders
      const statuses = ['pending', 'processing', 'confirmed', 'failed'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      orderData = {
        orderId,
        status: randomStatus,
        timestamp: new Date(Date.now() - Math.random() * 1000 * 60 * 60).toISOString(),
        gasUsed: randomStatus === 'confirmed' || randomStatus === 'failed' 
          ? Math.floor(Math.random() * 200000) + 50000 
          : null,
        blockNumber: randomStatus === 'confirmed' || randomStatus === 'failed'
          ? Math.floor(Math.random() * 1000000) + 18000000
          : null,
        transactionHash: randomStatus === 'confirmed' || randomStatus === 'failed'
          ? `0x${Math.random().toString(16).slice(2, 66).padEnd(64, '0')}`
          : null,
      };
    }

    // Simulate status changes for processing orders
    if (orderData.status === 'processing') {
      const timeSinceUpdate = Date.now() - new Date(orderData.timestamp).getTime();
      if (timeSinceUpdate > 1000 * 60 * 10) { // 10 minutes
        // 50% chance to complete
        if (Math.random() > 0.5) {
          orderData.status = 'confirmed';
          orderData.gasUsed = Math.floor(Math.random() * 200000) + 50000;
          orderData.blockNumber = Math.floor(Math.random() * 1000000) + 18000000;
          orderData.transactionHash = `0x${Math.random().toString(16).slice(2, 66).padEnd(64, '0')}`;
        } else {
          orderData.status = 'failed';
          orderData.gasUsed = Math.floor(Math.random() * 100000) + 30000;
          orderData.blockNumber = Math.floor(Math.random() * 1000000) + 18000000;
          orderData.transactionHash = `0x${Math.random().toString(16).slice(2, 66).padEnd(64, '0')}`;
        }
      }
    }

    // Simulate pending orders starting to process
    if (orderData.status === 'pending') {
      const timeSinceUpdate = Date.now() - new Date(orderData.timestamp).getTime();
      if (timeSinceUpdate > 1000 * 60 * 2) { // 2 minutes
        orderData.status = 'processing';
        orderData.timestamp = new Date().toISOString();
      }
    }

    // Add a small delay to simulate API latency
    await new Promise(resolve => setTimeout(resolve, 100));

    return NextResponse.json({
      ...orderData,
      network,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching order status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order status' },
      { status: 500 }
    );
  }
} 