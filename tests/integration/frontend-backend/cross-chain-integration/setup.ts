import { http } from 'msw'
import { setupServer } from 'msw/node'
import { enhancedWallet } from '@/lib/enhanced-wallet'
import { useBlockchainIntegration } from '@/hooks/use-blockchain-integration'
import { toast } from 'sonner'
import * as bitcoin from 'bitcoinjs-lib'

// Mock the enhanced wallet
jest.mock('@/lib/enhanced-wallet', () => ({
  enhancedWallet: {
    isConnected: jest.fn(),
    getCurrentAddress: jest.fn(),
    onAccountChange: jest.fn(),
    onChainChange: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    signTransaction: jest.fn(),
    sendTransaction: jest.fn(),
    switchNetwork: jest.fn(),
  }
}))

// Mock blockchain integration hook
jest.mock('@/hooks/use-blockchain-integration', () => ({
  useBlockchainIntegration: jest.fn()
}))

// Mock toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  }
}))

// Mock Bitcoin.js
jest.mock('bitcoinjs-lib', () => ({
  networks: {
    testnet: { bech32: 'tb' },
    mainnet: { bech32: 'bc' }
  },
  address: {
    toOutputScript: jest.fn(() => Buffer.from('mock-output-script')),
    fromBech32: jest.fn(() => ({ address: 'mock-address' }))
  },
  Transaction: jest.fn().mockImplementation(() => ({
    addInput: jest.fn(),
    addOutput: jest.fn(),
    sign: jest.fn(),
    toHex: jest.fn(() => 'mock-transaction-hex')
  }))
}))

// Setup MSW server for API mocking
export const server = setupServer(
  // Mock Bitcoin-Ethereum swap API
  http.post('/api/swap/bitcoin-ethereum', async ({ request }) => {
    const body = await request.json() as any
    const { fromChain, toChain, fromToken, toToken, fromAmount, toAmount, fromAddress, toAddress } = body

    if (!fromChain || !toChain || !fromToken || !toToken || !fromAmount || !toAmount || !fromAddress || !toAddress) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), { status: 400 })
    }

    return Response.json({
      success: true,
      swapId: 'swap_123',
      htlcAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      secretHash: '0x' + 'a'.repeat(64),
      timelock: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      status: 'initiated',
      fromChain,
      toChain,
      fromToken,
      toToken,
      fromAmount,
      toAmount
    })
  }),

  // Mock multi-chain transaction monitoring
  http.get('/api/transactions/monitor/:swapId', ({ params }) => {
    const { swapId } = params

    return Response.json({
      swapId,
      status: 'monitoring',
      transactions: {
        ethereum: {
          txHash: '0x1234567890abcdef',
          status: 'confirmed',
          blockNumber: 12345678,
          confirmations: 12
        },
        bitcoin: {
          txHash: 'abc123def456',
          status: 'pending',
          confirmations: 2,
          blockHeight: 123456
        }
      },
      lastUpdated: new Date().toISOString()
    })
  }),

  // Mock cross-chain secret coordination
  http.post('/api/swap/:swapId/reveal-secret', async ({ params, request }) => {
    const { swapId } = params
    const body = await request.json() as any
    const { secret } = body

    if (!secret) {
      return new Response(JSON.stringify({ error: 'Secret is required' }), { status: 400 })
    }

    return Response.json({
      success: true,
      swapId,
      secretRevealed: true,
      ethereumClaimTx: '0xabcdef1234567890',
      bitcoinClaimTx: 'def456abc123',
      status: 'completed'
    })
  }),

  // Mock chain reorganization handling
  http.post('/api/swap/:swapId/handle-reorg', async ({ params, request }) => {
    const { swapId } = params
    const body = await request.json() as any
    const { chain, oldBlockHash, newBlockHash } = body

    return Response.json({
      success: true,
      swapId,
      chain,
      reorgHandled: true,
      oldBlockHash,
      newBlockHash,
      status: 'reorg_handled'
    })
  }),

  // Mock network failure recovery
  http.post('/api/swap/:swapId/recover', async ({ params, request }) => {
    const { swapId } = params
    const body = await request.json() as any
    const { recoveryType } = body

    return Response.json({
      success: true,
      swapId,
      recoveryType,
      recovered: true,
      status: 'recovered',
      newTxHash: recoveryType === 'refund' ? '0xrefund123' : '0xclaim456'
    })
  }),

  // Mock Bitcoin network status
  http.get('/api/bitcoin/status', () => {
    return Response.json({
      network: 'testnet',
      blockHeight: 123456,
      difficulty: 1234567,
      mempoolSize: 150,
      averageFee: 5,
      status: 'healthy'
    })
  }),

  // Mock Ethereum network status
  http.get('/api/ethereum/status', () => {
    return Response.json({
      network: 'sepolia',
      blockNumber: 12345678,
      gasPrice: '20000000000',
      baseFee: '15000000000',
      status: 'healthy'
    })
  })
)

// Setup and teardown functions
export const setupTestEnvironment = () => {
  beforeAll(() => {
    server.listen()
  })

  afterEach(() => {
    server.resetHandlers()
    jest.clearAllMocks()
  })

  afterAll(() => {
    server.close()
  })
}

// Common mock setup for blockchain integration
export const setupBlockchainMocks = () => {
  beforeEach(() => {
    const mockUseBlockchainIntegration = useBlockchainIntegration as jest.Mock
    mockUseBlockchainIntegration.mockReturnValue({
      isInitializing: false,
      status: 'connected',
      initialize: jest.fn(),
      connectEthereum: jest.fn(),
      switchEthereumNetwork: jest.fn(),
      createSwap: jest.fn(),
      fundSwap: jest.fn(),
      redeemSwap: jest.fn(),
      refundSwap: jest.fn(),
      getBalance: jest.fn(),
      monitorSwap: jest.fn(),
    })
  })
} 