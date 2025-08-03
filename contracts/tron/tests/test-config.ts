import { config } from './config'

// Test environment configuration
export const testConfig = {
  // Tron testnet configuration
  tron: {
    shasta: {
      rpcUrl: 'https://api.shasta.trongrid.io',
      chainId: 201910292,
      name: 'Shasta Testnet'
    },
    nile: {
      rpcUrl: 'https://api.nileex.io',
      chainId: 201910292,
      name: 'Nile Testnet'
    },
    mainnet: {
      rpcUrl: 'https://api.trongrid.io',
      chainId: 1,
      name: 'Tron Mainnet'
    }
  },

  // Test tokens on different networks
  tokens: {
    ethereum: {
      USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      WETH: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
    },
    polygon: {
      USDC: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
      USDT: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
      WMATIC: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270'
    },
    tron: {
      USDT: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', // USDT on Tron mainnet
      USDC: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8', // USDC on Tron mainnet
      TRX: 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb'  // Native TRX
    }
  },

  // Test wallet configuration
  wallets: {
    testUser: {
      privateKey: process.env.TEST_USER_PRIVATE_KEY || '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
      address: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8'
    },
    testResolver: {
      privateKey: process.env.TEST_RESOLVER_PRIVATE_KEY || '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
      address: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc'
    }
  },

  // Gas configuration for different networks
  gas: {
    ethereum: {
      maxFeePerGas: '50000000000', // 50 gwei
      maxPriorityFeePerGas: '2000000000' // 2 gwei
    },
    polygon: {
      maxFeePerGas: '30000000000', // 30 gwei
      maxPriorityFeePerGas: '1000000000' // 1 gwei
    },
    tron: {
      // Tron uses energy and bandwidth instead of gas
      energyLimit: 1000000,
      bandwidthLimit: 1000000
    }
  },

  // Timeout configurations
  timeouts: {
    transaction: 60000, // 60 seconds
    block: 30000, // 30 seconds
    test: 120000 // 2 minutes
  }
} as const

// Helper function to get network configuration
export function getNetworkConfig(network: 'ethereum' | 'polygon' | 'tron') {
  switch (network) {
    case 'ethereum':
      return {
        rpcUrl: config.chain.source.url,
        chainId: config.chain.source.chainId,
        tokens: testConfig.tokens.ethereum
      }
    case 'polygon':
      return {
        rpcUrl: config.chain.destination.url,
        chainId: config.chain.destination.chainId,
        tokens: testConfig.tokens.polygon
      }
    case 'tron':
      return {
        rpcUrl: testConfig.tron.nile.rpcUrl,
        chainId: testConfig.tron.nile.chainId,
        tokens: testConfig.tokens.tron
      }
    default:
      throw new Error(`Unsupported network: ${network}`)
  }
}

// Helper function to format addresses consistently
export function formatAddress(address: string): string {
  // Remove 0x prefix if present and convert to lowercase
  const cleanAddress = address.replace(/^0x/i, '').toLowerCase()
  return `0x${cleanAddress}`
}

// Helper function to convert Ethereum address to Tron address format
export function toTronAddress(ethereumAddress: string): string {
  // This is a simplified conversion - in practice, you'd need proper address conversion
  const cleanAddress = ethereumAddress.replace(/^0x/i, '').toLowerCase()
  // Tron addresses start with 'T' and are 34 characters long
  return `T${cleanAddress.slice(0, 33)}`
} 