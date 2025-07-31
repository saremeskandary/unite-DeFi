import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hash, network } = body;

    if (!hash || !network) {
      return NextResponse.json(
        { error: 'Transaction hash and network are required' },
        { status: 400 }
      );
    }

    // Get transaction status based on network
    const status = await getTransactionStatus(hash, network);

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error fetching transaction status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction status' },
      { status: 500 }
    );
  }
}

async function getTransactionStatus(hash: string, network: string) {
  try {
    // Determine the appropriate API endpoint based on network
    const apiConfig = getApiConfig(network);

    if (!apiConfig) {
      throw new Error(`Unsupported network: ${network}`);
    }

    // Fetch transaction receipt
    const response = await axios.post(apiConfig.rpcUrl, {
      jsonrpc: '2.0',
      method: 'eth_getTransactionReceipt',
      params: [hash],
      id: 1
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    const receipt = response.data.result;

    if (!receipt) {
      // Transaction not found or still pending
      return {
        status: 'pending',
        confirmations: 0,
        requiredConfirmations: apiConfig.requiredConfirmations,
        estimatedTime: apiConfig.estimatedTime
      };
    }

    // Get current block number
    const blockResponse = await axios.post(apiConfig.rpcUrl, {
      jsonrpc: '2.0',
      method: 'eth_blockNumber',
      params: [],
      id: 1
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    const currentBlock = parseInt(blockResponse.data.result, 16);
    const blockNumber = parseInt(receipt.blockNumber, 16);
    const confirmations = currentBlock - blockNumber;

    // Determine transaction status
    let status: 'pending' | 'confirmed' | 'failed' = 'pending';

    if (receipt.status === '0x0') {
      status = 'failed';
    } else if (confirmations >= apiConfig.requiredConfirmations) {
      status = 'confirmed';
    }

    // Calculate gas information
    const gasUsed = receipt.gasUsed ? parseInt(receipt.gasUsed, 16).toString() : undefined;
    const gasPrice = receipt.effectiveGasPrice ?
      (parseInt(receipt.effectiveGasPrice, 16) / 1e9).toString() : undefined;

    const totalFee = gasUsed && gasPrice ?
      ((parseInt(gasUsed) * parseFloat(gasPrice)) / 1e9).toString() : undefined;

    return {
      status,
      confirmations,
      requiredConfirmations: apiConfig.requiredConfirmations,
      estimatedTime: apiConfig.estimatedTime,
      gasUsed,
      gasPrice,
      totalFee,
      blockNumber,
      timestamp: Date.now()
    };

  } catch (error) {
    console.error('Error getting transaction status:', error);

    // Return pending status as fallback
    return {
      status: 'pending',
      confirmations: 0,
      requiredConfirmations: 12,
      estimatedTime: '~2-5 minutes'
    };
  }
}

function getApiConfig(network: string) {
  const configs: { [key: string]: any } = {
    'ethereum': {
      rpcUrl: 'https://eth-mainnet.public.blastapi.io',
      requiredConfirmations: 12,
      estimatedTime: '~2-5 minutes'
    },
    'sepolia': {
      rpcUrl: 'https://eth-sepolia.public.blastapi.io',
      requiredConfirmations: 6,
      estimatedTime: '~1-2 minutes'
    },
    'goerli': {
      rpcUrl: 'https://eth-goerli.public.blastapi.io',
      requiredConfirmations: 6,
      estimatedTime: '~1-2 minutes'
    },
    'polygon': {
      rpcUrl: 'https://polygon-rpc.com',
      requiredConfirmations: 256,
      estimatedTime: '~2-3 minutes'
    },
    'arbitrum': {
      rpcUrl: 'https://arb1.arbitrum.io/rpc',
      requiredConfirmations: 1,
      estimatedTime: '~30 seconds'
    },
    'optimism': {
      rpcUrl: 'https://mainnet.optimism.io',
      requiredConfirmations: 1,
      estimatedTime: '~30 seconds'
    },
    'bsc': {
      rpcUrl: 'https://bsc-dataseed.binance.org',
      requiredConfirmations: 15,
      estimatedTime: '~1-2 minutes'
    },
    'avalanche': {
      rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
      requiredConfirmations: 1,
      estimatedTime: '~30 seconds'
    }
  };

  return configs[network.toLowerCase()];
} 