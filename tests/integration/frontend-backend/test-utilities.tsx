import * as React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { ThemeProvider } from '../../../src/components/theme-provider'
import { Toaster } from '../../../src/components/ui/toaster'
import { QueryProvider } from '../../../src/components/providers/query-provider'

// Mock window.matchMedia for next-themes compatibility
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryProvider>
        {children}
        <Toaster />
      </QueryProvider>
    </ThemeProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Mock wallet context
export const mockWalletContext = {
  isConnected: true,
  address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  chainId: 1,
  connect: jest.fn(),
  disconnect: jest.fn(),
  signTransaction: jest.fn(),
  sendTransaction: jest.fn(),
  onAccountChange: jest.fn(),
  onChainChange: jest.fn(),
}

// Mock blockchain integration
export const mockBlockchainIntegration = {
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
}

// Mock order status
export const mockOrderStatus = {
  order: {
    id: 'order_123',
    status: 'pending',
    fromToken: 'USDC',
    toToken: 'BTC',
    fromAmount: '1000',
    toAmount: '0.023',
    txHash: '0x1234567890abcdef',
    timestamp: new Date().toISOString(),
  },
  isLoading: false,
  error: null,
  refetch: jest.fn(),
}

// Mock order status stream
export const mockOrderStatusStream = {
  isConnected: true,
  lastUpdate: new Date().toISOString(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
}

// Test data generators
export const generateTestOrder = (overrides = {}) => ({
  id: `order_${Math.random().toString(36).substr(2, 9)}`,
  status: 'pending',
  fromToken: 'USDC',
  toToken: 'BTC',
  fromAmount: '1000',
  toAmount: '0.023',
  txHash: '0x' + Math.random().toString(16).substr(2, 40),
  timestamp: new Date().toISOString(),
  ...overrides,
})

export const generateTestPortfolio = (overrides = {}) => ({
  totalValue: 12450.75,
  totalSwaps: 23,
  totalVolume: 45230.5,
  profitLoss: 1250.3,
  profitLossPercentage: 11.2,
  topTokens: [
    { symbol: 'BTC', name: 'Bitcoin', balance: '0.25', value: 10812.5, change24h: 2.45 },
    { symbol: 'ETH', name: 'Ethereum', balance: '2.5', value: 6631.875, change24h: -1.23 },
    { symbol: 'USDC', name: 'USD Coin', balance: '1000', value: 1000, change24h: 0 }
  ],
  recentActivity: [
    {
      id: 'order_1',
      type: 'swap',
      fromToken: 'USDC',
      toToken: 'BTC',
      fromAmount: '1000',
      toAmount: '0.023',
      status: 'completed',
      timestamp: new Date().toISOString()
    }
  ],
  lastUpdated: new Date().toISOString(),
  ...overrides,
})

export const generateTestSwapQuote = (overrides = {}) => ({
  fromToken: 'USDC',
  toToken: 'BTC',
  fromAmount: '1000',
  toAmount: '0.023',
  rate: '0.000023',
  gasEstimate: '150000',
  gasPrice: '20000000000',
  totalFee: '0.003',
  validUntil: new Date(Date.now() + 30000).toISOString(),
  ...overrides,
})

// WebSocket mock utilities
export const createMockWebSocket = (overrides = {}) => ({
  onmessage: null as ((event: any) => void) | null,
  onopen: null as (() => void) | null,
  onclose: null as (() => void) | null,
  onerror: null as ((error: any) => void) | null,
  send: jest.fn(),
  close: jest.fn(),
  readyState: 1, // OPEN
  ...overrides,
})

// API response mocks
export const mockApiResponses = {
  portfolio: (walletAddress: string) => ({
    totalValue: 12450.75,
    totalSwaps: 23,
    totalVolume: 45230.5,
    profitLoss: 1250.3,
    profitLossPercentage: 11.2,
    topTokens: [
      { symbol: 'BTC', name: 'Bitcoin', balance: '0.25', value: 10812.5, change24h: 2.45 },
      { symbol: 'ETH', name: 'Ethereum', balance: '2.5', value: 6631.875, change24h: -1.23 },
      { symbol: 'USDC', name: 'USD Coin', balance: '1000', value: 1000, change24h: 0 }
    ],
    recentActivity: [
      {
        id: 'order_1',
        type: 'swap',
        fromToken: 'USDC',
        toToken: 'BTC',
        fromAmount: '1000',
        toAmount: '0.023',
        status: 'completed',
        timestamp: new Date().toISOString()
      }
    ],
    lastUpdated: new Date().toISOString(),
  }),

  swapQuote: (fromToken: string, toToken: string, fromAmount: string) => ({
    fromToken,
    toToken,
    fromAmount,
    toAmount: '0.023',
    rate: '0.000023',
    gasEstimate: '150000',
    gasPrice: '20000000000',
    totalFee: '0.003',
    validUntil: new Date(Date.now() + 30000).toISOString(),
  }),

  swapExecute: (orderData: any) => ({
    success: true,
    order: {
      id: 'order_123',
      ...orderData,
      status: 'pending',
      txHash: '0x1234567890abcdef',
      timestamp: new Date().toISOString(),
    },
  }),

  orderStatus: (orderId: string) => ({
    id: orderId,
    status: 'completed',
    fromToken: 'USDC',
    toToken: 'BTC',
    fromAmount: '1000',
    toAmount: '0.023',
    txHash: '0x1234567890abcdef',
    completedAt: new Date().toISOString(),
  }),
}

// Error scenarios
export const mockErrorScenarios = {
  networkError: new Error('Network request failed'),
  insufficientBalance: new Error('Insufficient balance'),
  invalidAddress: new Error('Invalid address format'),
  transactionFailed: new Error('Transaction failed'),
  rateLimitExceeded: new Error('Rate limit exceeded'),
  walletNotConnected: new Error('Wallet not connected'),
}

// Test helpers
export const waitForElementToBeRemoved = (element: HTMLElement) => {
  return new Promise<void>((resolve) => {
    const observer = new MutationObserver(() => {
      if (!document.contains(element)) {
        observer.disconnect()
        resolve()
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
  })
}

export const simulateWebSocketMessage = (message: any) => {
  const event = new MessageEvent('message', {
    data: JSON.stringify(message),
  })
  return event
}

export const simulateNetworkError = () => {
  const error = new Error('Network request failed')
  error.name = 'NetworkError'
  return error
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render } 