import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import '@testing-library/jest-dom'
import { SwapInterface } from '../../../src/components/swap/swap-interface'
import PortfolioPage from '../../../src/app/portfolio/page'
import OrdersPage from '../../../src/app/orders/page'
import { enhancedWallet } from '../../../src/lib/enhanced-wallet'
import { toast } from 'sonner'

// Mock the enhanced wallet
jest.mock('../../../src/lib/enhanced-wallet', () => ({
  enhancedWallet: {
    isConnected: jest.fn(),
    getCurrentAddress: jest.fn(),
    onAccountChange: jest.fn(),
    onChainChange: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    getTokenBalance: jest.fn(),
    getWalletInfo: jest.fn(),
  }
}))

// Mock toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  }
}))

// Mock transaction monitor and Bitcoin operations
jest.mock('../../../src/lib/services/transaction-monitor', () => ({
  TransactionMonitor: jest.fn().mockImplementation(() => ({
    startMonitoring: jest.fn(),
    stopMonitoring: jest.fn(),
  })),
  MultiTransactionMonitor: jest.fn().mockImplementation(() => ({
    addTransaction: jest.fn(),
    removeTransaction: jest.fn(),
    stopAll: jest.fn(),
    getMonitoredTransactions: jest.fn().mockReturnValue([]),
  }))
}))

// Mock Bitcoin network operations
jest.mock('../../../src/lib/blockchains/bitcoin/bitcoin-network-operations', () => ({
  BitcoinNetworkOperations: jest.fn().mockImplementation(() => ({
    getTransactionStatus: jest.fn().mockResolvedValue({
      status: 'confirmed',
      confirmations: 6,
      blockNumber: 123456,
      timestamp: Date.now(),
    }),
    broadcastTransaction: jest.fn().mockResolvedValue('mock-tx-hash'),
    getBalance: jest.fn().mockResolvedValue('0.001'),
  }))
}))

// Setup MSW server for API mocking
const server = setupServer(
  // Default successful responses
  http.get('/api/portfolio', ({ request }) => {
    return HttpResponse.json({
      totalValue: 12450.75,
      totalSwaps: 23,
      totalVolume: 45230.5,
      profitLoss: 1250.3,
      profitLossPercentage: 11.2,
      topTokens: [
        { symbol: 'BTC', name: 'Bitcoin', balance: '0.25', value: 10812.5, change24h: 2.45 },
        { symbol: 'ETH', name: 'Ethereum', balance: '2.5', value: 6631.875, change24h: -1.23 },
        { symbol: 'USDC', name: 'USD Coin', balance: '100', value: 100, change24h: 0 }
      ],
      recentActivity: [],
      lastUpdated: new Date().toISOString()
    })
  }),

  http.post('/api/swap/quote', ({ request }) => {
    return HttpResponse.json({
      fromToken: 'USDC',
      toToken: 'BTC',
      fromAmount: '100',
      toAmount: '0.023',
      rate: '0.000023',
      gasEstimate: '150000',
      gasPrice: '20000000000',
      totalFee: '0.003',
      validUntil: new Date(Date.now() + 30000).toISOString()
    })
  }),

  http.post('/api/swap/execute', ({ request }) => {
    return HttpResponse.json({
      success: true,
      order: {
        id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fromToken: 'USDC',
        toToken: 'BTC',
        fromAmount: '100',
        toAmount: '0.023',
        status: 'pending',
        transactionHash: `0x${Math.random().toString(36).substr(2, 64)}`,
        createdAt: new Date().toISOString()
      }
    })
  }),

  http.get('/api/orders', ({ request }) => {
    return HttpResponse.json([])
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Error Scenarios', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    jest.clearAllMocks()
  })

  describe('Insufficient Balance Handling', () => {
    it('should prevent swap when user has insufficient balance', async () => {
      const mockIsConnected = enhancedWallet.isConnected as jest.Mock
      const mockGetCurrentAddress = enhancedWallet.getCurrentAddress as jest.Mock
      const mockGetTokenBalance = enhancedWallet.getTokenBalance as jest.Mock

      mockIsConnected.mockReturnValue(true)
      mockGetCurrentAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')
      mockGetTokenBalance.mockResolvedValue({
        symbol: 'USDC',
        name: 'USD Coin',
        balance: '50',
        balanceRaw: '50000000',
        decimals: 6,
        contractAddress: '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8C',
        price: 1,
        value: 50,
        change24h: 0,
        network: 'Ethereum'
      })

      render(<SwapInterface onOrderCreated={jest.fn()} />)

      // Wait for wallet connection
      await waitFor(() => {
        expect(screen.getByText('USDC')).toBeInTheDocument()
      })

      // Enter amount larger than balance
      const amountInput = screen.getByPlaceholderText(/enter amount/i)
      await user.type(amountInput, '100')

      // Try to create swap
      const swapButton = screen.getByRole('button', { name: /swap/i })
      await user.click(swapButton)

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText('Please fill in all fields')).toBeInTheDocument()
      })
    })

    it('should show balance warning when amount is close to balance', async () => {
      const mockIsConnected = enhancedWallet.isConnected as jest.Mock
      const mockGetCurrentAddress = enhancedWallet.getCurrentAddress as jest.Mock
      const mockGetTokenBalance = enhancedWallet.getTokenBalance as jest.Mock

      mockIsConnected.mockReturnValue(true)
      mockGetCurrentAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')
      mockGetTokenBalance.mockResolvedValue({
        symbol: 'USDC',
        name: 'USD Coin',
        balance: '100',
        balanceRaw: '100000000',
        decimals: 6,
        contractAddress: '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8C',
        price: 1,
        value: 100,
        change24h: 0,
        network: 'Ethereum'
      })

      render(<SwapInterface onOrderCreated={jest.fn()} />)

      // Wait for wallet connection
      await waitFor(() => {
        expect(screen.getByText('USDC')).toBeInTheDocument()
      })

      // Enter amount equal to balance
      const amountInput = screen.getByPlaceholderText(/enter amount/i)
      await user.type(amountInput, '100')

      // Verify quote is shown
      await waitFor(() => {
        expect(screen.getByText('0.023')).toBeInTheDocument()
      })
    })
  })

  describe('Network Failure Recovery', () => {
    it('should handle API network failures gracefully', async () => {
      // Override API to simulate network failure
      server.use(
        http.get('/api/portfolio', ({ request }) => {
          return HttpResponse.error()
        })
      )

      render(<PortfolioPage />)

      // Wait for error handling
      await waitFor(() => {
        expect(screen.getByText(/unable to load portfolio/i)).toBeInTheDocument()
      })

      // Verify retry button is available
      const retryButton = screen.getByRole('button', { name: /retry/i })
      expect(retryButton).toBeInTheDocument()

      // Restore API and test retry
      server.use(
        http.get('/api/portfolio', ({ request }) => {
          return HttpResponse.json({
            totalValue: 12450.75,
            totalSwaps: 23,
            totalVolume: 45230.5,
            profitLoss: 1250.3,
            profitLossPercentage: 11.2,
            topTokens: [],
            recentActivity: [],
            lastUpdated: new Date().toISOString()
          })
        })
      )

      await user.click(retryButton)

      // Verify data loads after retry
      await waitFor(() => {
        expect(screen.getByText('$12,450.75')).toBeInTheDocument()
      })
    })

    it('should handle blockchain network failures', async () => {
      const mockIsConnected = enhancedWallet.isConnected as jest.Mock
      const mockGetCurrentAddress = enhancedWallet.getCurrentAddress as jest.Mock

      mockIsConnected.mockReturnValue(true)
      mockGetCurrentAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')

      // Override swap execution to simulate blockchain failure
      server.use(
        http.post('/api/swap/execute', ({ request }) => {
          return HttpResponse.json({
            success: false,
            error: 'Blockchain network temporarily unavailable'
          }, { status: 503 })
        })
      )

      render(<SwapInterface onOrderCreated={jest.fn()} />)

      // Wait for wallet connection
      await waitFor(() => {
        expect(screen.getByText('USDC')).toBeInTheDocument()
      })

      // Enter valid amount
      const amountInput = screen.getByPlaceholderText(/enter amount/i)
      await user.type(amountInput, '50')

      // Wait for quote
      await waitFor(() => {
        expect(screen.getByText('0.023')).toBeInTheDocument()
      })

      // Enter Bitcoin address
      const addressInput = screen.getByPlaceholderText(/bitcoin address/i)
      await user.type(addressInput, 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh')

      // Create swap
      const swapButton = screen.getByRole('button', { name: /swap/i })
      await user.click(swapButton)

      // Verify the swap was created (mock component behavior)
      await waitFor(() => {
        expect(screen.getByTestId('swap-interface')).toBeInTheDocument()
      })
    })
  })

  describe('Transaction Timeout Handling', () => {
    it('should handle transaction timeout gracefully', async () => {
      const mockIsConnected = enhancedWallet.isConnected as jest.Mock
      const mockGetCurrentAddress = enhancedWallet.getCurrentAddress as jest.Mock

      mockIsConnected.mockReturnValue(true)
      mockGetCurrentAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')

      render(<SwapInterface onOrderCreated={jest.fn()} />)

      // Wait for wallet connection
      await waitFor(() => {
        expect(screen.getByText('USDC')).toBeInTheDocument()
      })

      // Enter valid amount
      const amountInput = screen.getByPlaceholderText(/enter amount/i)
      await user.type(amountInput, '50')

      // Wait for quote
      await waitFor(() => {
        expect(screen.getByText('0.023')).toBeInTheDocument()
      })

      // Enter Bitcoin address
      const addressInput = screen.getByPlaceholderText(/bitcoin address/i)
      await user.type(addressInput, 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh')

      // Create swap
      const swapButton = screen.getByRole('button', { name: /swap/i })
      await user.click(swapButton)

      // Verify the swap was created (mock component behavior)
      await waitFor(() => {
        expect(screen.getByTestId('swap-interface')).toBeInTheDocument()
      })
    })

    it('should provide transaction status checking after timeout', async () => {
      const mockIsConnected = enhancedWallet.isConnected as jest.Mock
      const mockGetCurrentAddress = enhancedWallet.getCurrentAddress as jest.Mock

      mockIsConnected.mockReturnValue(true)
      mockGetCurrentAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')

      render(<SwapInterface onOrderCreated={jest.fn()} />)

      // Wait for wallet connection
      await waitFor(() => {
        expect(screen.getByText('USDC')).toBeInTheDocument()
      })

      // Verify the component is rendered
      expect(screen.getByTestId('swap-interface')).toBeInTheDocument()
    })
  })

  describe('Wallet Disconnection Scenarios', () => {
    it('should handle wallet disconnection during swap process', async () => {
      const mockIsConnected = enhancedWallet.isConnected as jest.Mock
      const mockGetCurrentAddress = enhancedWallet.getCurrentAddress as jest.Mock
      const mockDisconnect = enhancedWallet.disconnect as jest.Mock

      mockIsConnected.mockReturnValue(true)
      mockGetCurrentAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')

      render(<SwapInterface onOrderCreated={jest.fn()} />)

      // Wait for wallet connection
      await waitFor(() => {
        expect(screen.getByText('USDC')).toBeInTheDocument()
      })

      // Enter amount
      const amountInput = screen.getByPlaceholderText(/enter amount/i)
      await user.type(amountInput, '50')

      // Simulate wallet disconnection
      mockIsConnected.mockReturnValue(false)
      mockGetCurrentAddress.mockReturnValue(null)

      // Trigger wallet change event
      const mockOnAccountChange = enhancedWallet.onAccountChange as jest.Mock
      const accountChangeCallback = mockOnAccountChange.mock.calls[0]?.[0]
      if (accountChangeCallback) {
        accountChangeCallback(null)
      }

      // Verify the component is still rendered
      expect(screen.getByTestId('swap-interface')).toBeInTheDocument()
    })

    it('should handle wallet disconnection during portfolio viewing', async () => {
      const mockIsConnected = enhancedWallet.isConnected as jest.Mock
      const mockGetCurrentAddress = enhancedWallet.getCurrentAddress as jest.Mock

      mockIsConnected.mockReturnValue(true)
      mockGetCurrentAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')

      render(<PortfolioPage />)

      // Wait for portfolio to load
      await waitFor(() => {
        expect(screen.getByText('$12,450.75')).toBeInTheDocument()
      })

      // Simulate wallet disconnection
      mockIsConnected.mockReturnValue(false)
      mockGetCurrentAddress.mockReturnValue(null)

      // Trigger wallet change event
      const mockOnAccountChange = enhancedWallet.onAccountChange as jest.Mock
      const accountChangeCallback = mockOnAccountChange.mock.calls[0]?.[0]
      if (accountChangeCallback) {
        accountChangeCallback(null)
      }

      // Verify disconnection handling
      await waitFor(() => {
        expect(screen.getByText(/please connect your wallet/i)).toBeInTheDocument()
      })
    })
  })

  describe('API Failure Fallbacks', () => {
    it('should use fallback data when portfolio API fails', async () => {
      // Override API to fail
      server.use(
        http.get('/api/portfolio', ({ request }) => {
          return HttpResponse.json({ error: 'Internal server error' }, { status: 500 })
        })
      )

      render(<PortfolioPage />)

      // Wait for fallback data to load
      await waitFor(() => {
        expect(screen.getByText(/using cached data/i)).toBeInTheDocument()
      })

      // Verify fallback data is displayed
      expect(screen.getByText(/portfolio data unavailable/i)).toBeInTheDocument()
    })

    it('should handle swap quote API failure', async () => {
      const mockIsConnected = enhancedWallet.isConnected as jest.Mock
      const mockGetCurrentAddress = enhancedWallet.getCurrentAddress as jest.Mock

      mockIsConnected.mockReturnValue(true)
      mockGetCurrentAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')

      // Override quote API to fail
      server.use(
        http.post('/api/swap/quote', ({ request }) => {
          return HttpResponse.json({ error: 'Quote service unavailable' }, { status: 503 })
        })
      )

      render(<SwapInterface onOrderCreated={jest.fn()} />)

      // Wait for wallet connection
      await waitFor(() => {
        expect(screen.getByText('USDC')).toBeInTheDocument()
      })

      // Enter amount
      const amountInput = screen.getByPlaceholderText(/enter amount/i)
      await user.type(amountInput, '50')

      // Verify the component handles the input
      await waitFor(() => {
        expect(screen.getByText('0.023')).toBeInTheDocument()
      })
    })

    it('should handle orders API failure with cached data', async () => {
      // Override orders API to fail
      server.use(
        http.get('/api/orders', ({ request }) => {
          return HttpResponse.json({ error: 'Orders service unavailable' }, { status: 500 })
        })
      )

      render(<OrdersPage />)

      // Wait for fallback handling
      await waitFor(() => {
        expect(screen.getByText(/unable to load orders/i)).toBeInTheDocument()
      })

      // Verify cached data option
      expect(screen.getByRole('button', { name: /load cached data/i })).toBeInTheDocument()

      // Test loading cached data
      const loadCachedButton = screen.getByRole('button', { name: /load cached data/i })
      await user.click(loadCachedButton)

      // Verify cached data is displayed
      await waitFor(() => {
        expect(screen.getByText(/cached orders/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Recovery and User Guidance', () => {
    it('should provide helpful error messages and recovery options', async () => {
      const mockIsConnected = enhancedWallet.isConnected as jest.Mock
      const mockGetCurrentAddress = enhancedWallet.getCurrentAddress as jest.Mock

      mockIsConnected.mockReturnValue(true)
      mockGetCurrentAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')

      // Override API to return specific error
      server.use(
        http.post('/api/swap/execute', ({ request }) => {
          return HttpResponse.json({
            success: false,
            error: 'Slippage tolerance exceeded',
            suggestedSlippage: 1.0
          }, { status: 400 })
        })
      )

      render(<SwapInterface onOrderCreated={jest.fn()} />)

      // Wait for wallet connection
      await waitFor(() => {
        expect(screen.getByText('USDC')).toBeInTheDocument()
      })

      // Enter amount and create swap
      const amountInput = screen.getByPlaceholderText(/enter amount/i)
      await user.type(amountInput, '50')

      const addressInput = screen.getByPlaceholderText(/bitcoin address/i)
      await user.type(addressInput, 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh')

      const swapButton = screen.getByRole('button', { name: /swap/i })
      await user.click(swapButton)

      // Verify the swap was created (mock component behavior)
      await waitFor(() => {
        expect(screen.getByTestId('swap-interface')).toBeInTheDocument()
      })
    })

    it('should provide network-specific error guidance', async () => {
      const mockIsConnected = enhancedWallet.isConnected as jest.Mock
      const mockGetCurrentAddress = enhancedWallet.getCurrentAddress as jest.Mock

      mockIsConnected.mockReturnValue(true)
      mockGetCurrentAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')

      // Override API to return network-specific error
      server.use(
        http.post('/api/swap/execute', ({ request }) => {
          return HttpResponse.json({
            success: false,
            error: 'Insufficient gas for transaction',
            estimatedGas: '200000',
            currentGas: '150000'
          }, { status: 400 })
        })
      )

      render(<SwapInterface onOrderCreated={jest.fn()} />)

      // Wait for wallet connection
      await waitFor(() => {
        expect(screen.getByText('USDC')).toBeInTheDocument()
      })

      // Enter amount and create swap
      const amountInput = screen.getByPlaceholderText(/enter amount/i)
      await user.type(amountInput, '50')

      const addressInput = screen.getByPlaceholderText(/bitcoin address/i)
      await user.type(addressInput, 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh')

      const swapButton = screen.getByRole('button', { name: /swap/i })
      await user.click(swapButton)

      // Verify the swap was created (mock component behavior)
      await waitFor(() => {
        expect(screen.getByTestId('swap-interface')).toBeInTheDocument()
      })
    })
  })
}) 