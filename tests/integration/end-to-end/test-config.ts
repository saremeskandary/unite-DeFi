import { setupServer } from 'msw/node'
import { rest } from 'msw'

// Test environment variables
export const TEST_CONFIG = {
  // API endpoints
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',

  // Test wallet addresses
  TEST_ETH_ADDRESS: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  TEST_BTC_ADDRESS: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',

  // Test tokens
  TEST_TOKENS: {
    USDC: { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    BTC: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
    ETH: { symbol: 'ETH', name: 'Ethereum', decimals: 18 }
  },

  // Performance thresholds
  PERFORMANCE_THRESHOLDS: {
    PORTFOLIO_LOAD_TIME: 3000, // 3 seconds
    SWAP_QUOTE_TIME: 2000, // 2 seconds
    SWAP_EXECUTION_TIME: 5000, // 5 seconds
    MEMORY_LIMIT: 100 * 1024 * 1024, // 100MB
    CONCURRENT_REQUESTS: 5
  },

  // Network simulation
  NETWORK_LATENCY: {
    LOW: 100, // 100ms
    MEDIUM: 1000, // 1 second
    HIGH: 5000 // 5 seconds
  }
}

// Mock data generators
export const generateMockPortfolio = (size: 'small' | 'medium' | 'large' = 'medium') => {
  const sizes = {
    small: { tokens: 10, activities: 50 },
    medium: { tokens: 100, activities: 500 },
    large: { tokens: 1000, activities: 5000 }
  }

  const config = sizes[size]

  const topTokens = Array.from({ length: config.tokens }, (_, i) => ({
    symbol: `TOKEN${i}`,
    name: `Token ${i}`,
    balance: (Math.random() * 1000).toFixed(2),
    value: Math.random() * 50000,
    change24h: (Math.random() * 20 - 10).toFixed(2)
  }))

  const recentActivity = Array.from({ length: config.activities }, (_, i) => ({
    id: `order_${i}`,
    type: 'swap',
    fromToken: `TOKEN${i % 10}`,
    toToken: `TOKEN${(i + 1) % 10}`,
    fromAmount: (Math.random() * 1000).toFixed(2),
    toAmount: (Math.random() * 10).toFixed(6),
    status: ['completed', 'pending', 'failed'][i % 3],
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
  }))

  return {
    totalValue: 12450.75,
    totalSwaps: 23,
    totalVolume: 45230.5,
    profitLoss: 1250.3,
    profitLossPercentage: 11.2,
    topTokens,
    recentActivity,
    lastUpdated: new Date().toISOString()
  }
}

export const generateMockOrders = (count: number = 50) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `order_${i}`,
    fromToken: `TOKEN${i % 10}`,
    toToken: `TOKEN${(i + 1) % 10}`,
    fromAmount: (Math.random() * 1000).toFixed(2),
    toAmount: (Math.random() * 10).toFixed(6),
    status: ['completed', 'pending', 'failed'][i % 3],
    transactionHash: `0x${Math.random().toString(36).substr(2, 64)}`,
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: i % 3 === 0 ? new Date().toISOString() : undefined
  }))
}

// API response handlers
export const createApiHandlers = () => [
  // Portfolio API
  rest.get(`${TEST_CONFIG.API_BASE_URL}/api/portfolio`, (req, res, ctx) => {
    const walletAddress = req.url.searchParams.get('walletAddress')
    if (!walletAddress) {
      return res(ctx.status(400), ctx.json({ error: 'Wallet address is required' }))
    }

    return res(ctx.json(generateMockPortfolio('medium')))
  }),

  // Swap quote API
  rest.post(`${TEST_CONFIG.API_BASE_URL}/api/swap/quote`, (req, res, ctx) => {
    const { fromToken, toToken, fromAmount } = req.body as any

    if (!fromToken || !toToken || !fromAmount) {
      return res(ctx.status(400), ctx.json({ error: 'Missing required parameters' }))
    }

    return res(ctx.json({
      fromToken,
      toToken,
      fromAmount,
      toAmount: '0.023',
      rate: '0.000023',
      gasEstimate: '150000',
      gasPrice: '20000000000',
      totalFee: '0.003',
      validUntil: new Date(Date.now() + 30000).toISOString()
    }))
  }),

  // Swap execution API
  rest.post(`${TEST_CONFIG.API_BASE_URL}/api/swap/execute`, (req, res, ctx) => {
    const { fromToken, toToken, fromAmount, toAddress } = req.body as any

    if (!fromToken || !toToken || !fromAmount || !toAddress) {
      return res(ctx.status(400), ctx.json({ error: 'Missing required parameters' }))
    }

    return res(ctx.json({
      success: true,
      order: {
        id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fromToken,
        toToken,
        fromAmount,
        toAmount: '0.023',
        toAddress,
        status: 'pending',
        transactionHash: `0x${Math.random().toString(36).substr(2, 64)}`,
        createdAt: new Date().toISOString()
      }
    }))
  }),

  // Orders API
  rest.get(`${TEST_CONFIG.API_BASE_URL}/api/orders`, (req, res, ctx) => {
    const walletAddress = req.url.searchParams.get('walletAddress')
    if (!walletAddress) {
      return res(ctx.status(400), ctx.json({ error: 'Wallet address is required' }))
    }

    return res(ctx.json(generateMockOrders(50)))
  }),

  // Bitcoin balance API
  rest.get(`${TEST_CONFIG.API_BASE_URL}/api/bitcoin/balance`, (req, res, ctx) => {
    const address = req.url.searchParams.get('address')
    if (!address) {
      return res(ctx.status(400), ctx.json({ error: 'Bitcoin address is required' }))
    }

    return res(ctx.json({
      address,
      balance: '0.25',
      utxos: [
        {
          txid: 'mock_txid_1',
          vout: 0,
          value: 25000000, // 0.25 BTC
          status: { confirmed: true }
        }
      ],
      lastUpdated: new Date().toISOString()
    }))
  })
]

// Performance measurement utilities
export const measurePerformance = async <T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<{ result: T; duration: number }> => {
  const startTime = performance.now()
  const result = await operation()
  const endTime = performance.now()
  const duration = endTime - startTime

  console.log(`${operationName} took ${duration.toFixed(2)}ms`)

  return { result, duration }
}

export const measureMemoryUsage = (): number => {
  if ((performance as any).memory) {
    return (performance as any).memory.usedJSHeapSize
  }
  return 0
}

// Network simulation utilities
export const simulateNetworkLatency = (latency: number) => {
  return new Promise(resolve => setTimeout(resolve, latency))
}

export const createSlowApiHandler = (
  handler: any,
  latency: number = TEST_CONFIG.NETWORK_LATENCY.MEDIUM
) => {
  return async (req: any, res: any, ctx: any) => {
    await simulateNetworkLatency(latency)
    return handler(req, res, ctx)
  }
}

// Error simulation utilities
export const createErrorHandler = (statusCode: number, errorMessage: string) => {
  return (req: any, res: any, ctx: any) => {
    return res(ctx.status(statusCode), ctx.json({
      success: false,
      error: errorMessage
    }))
  }
}

export const createNetworkErrorHandler = () => {
  return (req: any, res: any, ctx: any) => {
    return res.networkError('Failed to connect')
  }
}

// Test setup utilities
export const setupTestServer = () => {
  const server = setupServer(...createApiHandlers())

  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  return server
}

// Wallet mock utilities
export const createWalletMock = () => ({
  isConnected: jest.fn().mockReturnValue(true),
  getCurrentAddress: jest.fn().mockReturnValue(TEST_CONFIG.TEST_ETH_ADDRESS),
  onAccountChange: jest.fn(),
  onChainChange: jest.fn(),
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn(),
  getBalance: jest.fn().mockResolvedValue('1000'),
  switchToSupportedNetwork: jest.fn().mockResolvedValue(true)
})

// Toast mock utilities
export const createToastMock = () => ({
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
})

// WebSocket mock utilities
export const createWebSocketMock = () => {
  const mockWebSocket = {
    onmessage: null as ((event: any) => void) | null,
    onclose: null as ((event: any) => void) | null,
    send: jest.fn(),
    close: jest.fn(),
  }

  global.WebSocket = jest.fn(() => mockWebSocket) as any

  return mockWebSocket
}

// Test data validation utilities
export const validatePortfolioData = (data: any) => {
  expect(data).toHaveProperty('totalValue')
  expect(data).toHaveProperty('totalSwaps')
  expect(data).toHaveProperty('totalVolume')
  expect(data).toHaveProperty('profitLoss')
  expect(data).toHaveProperty('topTokens')
  expect(data).toHaveProperty('recentActivity')
  expect(Array.isArray(data.topTokens)).toBe(true)
  expect(Array.isArray(data.recentActivity)).toBe(true)
}

export const validateSwapQuote = (quote: any) => {
  expect(quote).toHaveProperty('fromToken')
  expect(quote).toHaveProperty('toToken')
  expect(quote).toHaveProperty('fromAmount')
  expect(quote).toHaveProperty('toAmount')
  expect(quote).toHaveProperty('rate')
  expect(quote).toHaveProperty('gasEstimate')
  expect(quote).toHaveProperty('totalFee')
}

export const validateOrder = (order: any) => {
  expect(order).toHaveProperty('id')
  expect(order).toHaveProperty('fromToken')
  expect(order).toHaveProperty('toToken')
  expect(order).toHaveProperty('fromAmount')
  expect(order).toHaveProperty('toAmount')
  expect(order).toHaveProperty('status')
  expect(order).toHaveProperty('createdAt')
} 