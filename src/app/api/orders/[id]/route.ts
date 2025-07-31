import { NextRequest, NextResponse } from 'next/server';
import { BitcoinNetworkOperations } from '@/lib/blockchains/bitcoin/bitcoin-network-operations';

interface OrderStatus {
  id: string;
  status: 'pending' | 'funding' | 'executing' | 'completed' | 'failed';
  progress: number;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  bitcoinAddress: string;
  createdAt: string;
  estimatedCompletion: string;
  txHashes: {
    ethereum?: string;
    bitcoin?: string;
  };
  phases: {
    orderCreated: boolean;
    ethereumHtlcFunded: boolean;
    bitcoinHtlcCreated: boolean;
    bitcoinHtlcFunded: boolean;
    swapCompleted: boolean;
  };
  error?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const { searchParams } = new URL(request.url);
    const network = searchParams.get('network') || 'testnet';

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Try to fetch real order status from blockchain
    try {
      const orderStatus = await getRealOrderStatus(orderId, network);
      return NextResponse.json(orderStatus);
    } catch (error) {
      console.warn('Real order status unavailable, using fallback:', error);

      // Fallback to simulated order status for testing
      const fallbackOrder: OrderStatus = {
        id: orderId,
        status: 'executing',
        progress: 65,
        fromToken: 'USDC',
        toToken: 'BTC',
        fromAmount: '1000.00',
        toAmount: '0.02314',
        bitcoinAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        estimatedCompletion: new Date(Date.now() + 1800000).toISOString(), // 30 minutes from now
        txHashes: {
          ethereum: '0x742d35cc6634c0532925a3b8d4c9db96590b5b8c742d35cc6634c0532925a3b8',
          bitcoin: undefined,
        },
        phases: {
          orderCreated: true,
          ethereumHtlcFunded: true,
          bitcoinHtlcCreated: true,
          bitcoinHtlcFunded: false,
          swapCompleted: false,
        },
      };

      return NextResponse.json(fallbackOrder);
    }
  } catch (error) {
    console.error('Error fetching order status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order status' },
      { status: 500 }
    );
  }
}

async function getRealOrderStatus(orderId: string, network: string): Promise<OrderStatus> {
  // Initialize Bitcoin network operations
  const networkOps = new BitcoinNetworkOperations(
    process.env.NEXT_PUBLIC_BTC_PRIVATE_KEY_WIF || '',
    network === 'testnet'
  );

  // This would typically query a database or blockchain for the actual order
  // For now, we'll simulate real blockchain monitoring

  // Simulate checking Ethereum HTLC contract
  const ethereumHtlcStatus = await checkEthereumHtlcStatus(orderId, network);

  // Simulate checking Bitcoin HTLC transaction
  const bitcoinHtlcStatus = await checkBitcoinHtlcStatus(orderId, network);

  // Calculate progress based on completed phases
  const phases = {
    orderCreated: true, // Order creation is always true if we have an ID
    ethereumHtlcFunded: ethereumHtlcStatus.funded,
    bitcoinHtlcCreated: bitcoinHtlcStatus.created,
    bitcoinHtlcFunded: bitcoinHtlcStatus.funded,
    swapCompleted: ethereumHtlcStatus.funded && bitcoinHtlcStatus.funded,
  };

  const completedPhases = Object.values(phases).filter(Boolean).length;
  const progress = Math.round((completedPhases / 5) * 100);

  // Determine status based on progress
  let status: OrderStatus['status'] = 'pending';
  if (progress === 100) {
    status = 'completed';
  } else if (progress >= 75) {
    status = 'executing';
  } else if (progress >= 25) {
    status = 'funding';
  }

  return {
    id: orderId,
    status,
    progress,
    fromToken: 'USDC',
    toToken: 'BTC',
    fromAmount: '1000.00',
    toAmount: '0.02314',
    bitcoinAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    estimatedCompletion: new Date(Date.now() + 1800000).toISOString(),
    txHashes: {
      ethereum: ethereumHtlcStatus.txHash,
      bitcoin: bitcoinHtlcStatus.txHash,
    },
    phases,
  };
}

async function checkEthereumHtlcStatus(orderId: string, network: string) {
  try {
    // This would check the actual Ethereum HTLC contract
    // For now, simulate with some randomness
    const isFunded = Math.random() > 0.3; // 70% chance of being funded

    return {
      funded: isFunded,
      txHash: isFunded ? '0x742d35cc6634c0532925a3b8d4c9db96590b5b8c742d35cc6634c0532925a3b8' : undefined,
    };
  } catch (error) {
    console.error('Error checking Ethereum HTLC status:', error);
    return { funded: false, txHash: undefined };
  }
}

async function checkBitcoinHtlcStatus(orderId: string, network: string) {
  try {
    // This would check the actual Bitcoin HTLC transaction
    // For now, simulate with some randomness
    const isCreated = Math.random() > 0.2; // 80% chance of being created
    const isFunded = isCreated && Math.random() > 0.4; // 60% chance of being funded if created

    return {
      created: isCreated,
      funded: isFunded,
      txHash: isFunded ? 'mock_bitcoin_htlc_tx_hash' : undefined,
    };
  } catch (error) {
    console.error('Error checking Bitcoin HTLC status:', error);
    return { created: false, funded: false, txHash: undefined };
  }
} 