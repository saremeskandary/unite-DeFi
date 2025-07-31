import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { WalletConnection } from '@/components/wallet/wallet-connection'
import { SwapInterface } from '@/components/swap/swap-interface'
import { PortfolioPage } from '@/app/portfolio/page'
import { OrdersPage } from '@/app/orders/page'
import { enhancedWallet } from '@/lib/enhanced-wallet'
import { toast } from 'sonner'
import { TransactionMonitor } from '@/lib/services/transaction-monitor'

// Mock the enhanced wallet
jest.mock('@/lib/enhanced-wallet', () => ({
  enhancedWallet: {
    isConnected: jest.fn(),
    getCurrentAddress: jest.fn(),
    onAccountChange: jest.fn(),
    onChainChange: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    getBalance: jest.fn(),
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

// Mock transaction monitor
jest.mock('@/lib/services/transaction-monitor')

// Setup MSW server for API mocking
const server = setupServer(
  // Default successful responses
  rest.get('/api/portfolio', (req, res, ctx) => {
    return res(ctx.json({
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
    }))
  }),

  rest.post('/api/swap/quote', (req, res, ctx) => {
    return res(ctx.json({
      fromToken: 'USDC',
      toToken: 'BTC',
      fromAmount: '100',
      toAmount: '0.023',
      rate: '0.000023',
      gasEstimate: '150000',
      gasPrice: '20000000000',
      totalFee: '0.003',
      validUntil: new Date(Date.now() + 30000).toISOString()
    }))
  }),

  rest.post('/api/swap/execute', (req, res, ctx) => {
    return res(ctx.json({
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
    }))
  }),

  rest.get('/api/orders', (req, res, ctx) => {
    return res(ctx.json([]))
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
      const mockGetBalance = enhancedWallet.getBalance as jest.Mock

      mockIsConnected.mockReturnValue(true)
      mockGetCurrentAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')
      mockGetBalance.mockResolvedValue('50') // Only 50 USDC available

      render(<SwapInterface onOrderCreated={ jest.fn() } />)

      // Wait for wallet connection
      await waitFor(() => {
        expect(screen.getByText('USDC')).toBeInTheDocument()
      })

      // Enter amount larger than balance
      const amountInput = screen.getByPlaceholderText(/enter amount/i)
      await user.type(amountInput, '100')

      // Try to create swap
      const swapButton = screen.getByRole('button', { name: /create swap/i })
      await user.click(swapButton)

      // Verify error message
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Insufficient balance')
      })

      // Verify swap button is disabled
      expect(swapButton).toBeDisabled()
    })

    it('should show balance warning when amount is close to balance', async () => {
      const mockIsConnected = enhancedWallet.isConnected as jest.Mock
      const mockGetCurrentAddress = enhancedWallet.getCurrentAddress as jest.Mock
      const mockGetBalance = enhancedWallet.getBalance as jest.Mock

      mockIsConnected.mockReturnValue(true)
      mockGetCurrentAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')
      mockGetBalance.mockResolvedValue('100') // Exactly 100 USDC available

      render(<SwapInterface onOrderCreated={ jest.fn() } />)

      // Wait for wallet connection
      await waitFor(() => {
        expect(screen.getByText('USDC')).toBeInTheDocument()
      })

      // Enter amount equal to balance
      const amountInput = screen.getByPlaceholderText(/enter amount/i)
      await user.type(amountInput, '100')

      // Verify warning is shown
      await waitFor(() => {
        expect(screen.getByText(/insufficient funds for gas/i)).toBeInTheDocument()
      })
    })
  })

  describe('Network Failure Recovery', () => {
    it('should handle API network failures gracefully', async () => {
      // Override API to simulate network failure
      server.use(
        rest.get('/api/portfolio', (req, res, ctx) => {
          return res.networkError('Failed to connect')
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
        rest.get('/api/portfolio', (req, res, ctx) => {
          return res(ctx.json({
            totalValue: 12450.75,
            totalSwaps: 23,
            totalVolume: 45230.5,
            profitLoss: 1250.3,
            profitLossPercentage: 11.2,
            topTokens: [],
            recentActivity: [],
            lastUpdated: new Date().toISOString()
          }))
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
        rest.post('/api/swap/execute', (req, res, ctx) => {
          return res(ctx.status(503), ctx.json({
            success: false,
            error: 'Blockchain network temporarily unavailable'
          }))
        })
      )

      render(<SwapInterface onOrderCreated={ jest.fn() } />)

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
      const swapButton = screen.getByRole('button', { name: /create swap/i })
      await user.click(swapButton)

      // Verify network error handling
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Blockchain network temporarily unavailable')
      })

      // Verify retry option is available
      expect(screen.getByText(/try again/i)).toBeInTheDocument()
    })
  })

  describe('Transaction Timeout Handling', () => {
    it('should handle transaction timeout gracefully', async () => {
      const mockMonitor = TransactionMonitor as jest.MockedClass<typeof TransactionMonitor>

      // Mock transaction monitor to simulate timeout
      mockMonitor.prototype.startMonitoring = jest.fn()
      mockMonitor.prototype.stopMonitoring = jest.fn()

      const mockIsConnected = enhancedWallet.isConnected as jest.Mock
      const mockGetCurrentAddress = enhancedWallet.getCurrentAddress as jest.Mock

      mockIsConnected.mockReturnValue(true)
      mockGetCurrentAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')

      render(<SwapInterface onOrderCreated={ jest.fn() } />)

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
      const swapButton = screen.getByRole('button', { name: /create swap/i })
      await user.click(swapButton)

      // Simulate transaction timeout
      setTimeout(() => {
        // Simulate timeout callback
        const mockCallbacks = mockMonitor.prototype.startMonitoring.mock.calls[0]?.[0]
        if (mockCallbacks?.onError) {
          mockCallbacks.onError(new Error('Transaction timeout'))
        }
      }, 100)

      // Verify timeout error handling
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Transaction timeout')
      })

      // Verify timeout recovery options
      expect(screen.getByText(/transaction may still be processing/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /check status/i })).toBeInTheDocument()
    })

    it('should provide transaction status checking after timeout', async () => {
      const mockIsConnected = enhancedWallet.isConnected as jest.Mock
      const mockGetCurrentAddress = enhancedWallet.getCurrentAddress as jest.Mock

      mockIsConnected.mockReturnValue(true)
      mockGetCurrentAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')

      render(<SwapInterface onOrderCreated={ jest.fn() } />)

      // Wait for wallet connection
      await waitFor(() => {
        expect(screen.getByText('USDC')).toBeInTheDocument()
      })

      // Simulate timeout scenario
      const checkStatusButton = screen.getByRole('button', { name: /check status/i })
      await user.click(checkStatusButton)

      // Verify status checking
      await waitFor(() => {
        expect(screen.getByText(/checking transaction status/i)).toBeInTheDocument()
      })
    })
  })

  describe('Wallet Disconnection Scenarios', () => {
    it('should handle wallet disconnection during swap process', async () => {
      const mockIsConnected = enhancedWallet.isConnected as jest.Mock
      const mockGetCurrentAddress = enhancedWallet.getCurrentAddress as jest.Mock
      const mockDisconnect = enhancedWallet.disconnect as jest.Mock

      mockIsConnected.mockReturnValue(true)
      mockGetCurrentAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')

      render(<SwapInterface onOrderCreated={ jest.fn() } />)

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

      // Verify disconnection handling
      await waitFor(() => {
        expect(screen.getByText(/wallet disconnected/i)).toBeInTheDocument()
      })

      // Verify swap interface is disabled
      expect(screen.getByRole('button', { name: /create swap/i })).toBeDisabled()
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
        rest.get('/api/portfolio', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Internal server error' }))
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
        rest.post('/api/swap/quote', (req, res, ctx) => {
          return res(ctx.status(503), ctx.json({ error: 'Quote service unavailable' }))
        })
      )

      render(<SwapInterface onOrderCreated={ jest.fn() } />)

      // Wait for wallet connection
      await waitFor(() => {
        expect(screen.getByText('USDC')).toBeInTheDocument()
      })

      // Enter amount
      const amountInput = screen.getByPlaceholderText(/enter amount/i)
      await user.type(amountInput, '50')

      // Verify quote failure handling
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Unable to get quote. Please try again.')
      })

      // Verify retry mechanism
      expect(screen.getByRole('button', { name: /retry quote/i })).toBeInTheDocument()
    })

    it('should handle orders API failure with cached data', async () => {
      // Override orders API to fail
      server.use(
        rest.get('/api/orders', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Orders service unavailable' }))
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
        rest.post('/api/swap/execute', (req, res, ctx) => {
          return res(ctx.status(400), ctx.json({
            success: false,
            error: 'Slippage tolerance exceeded',
            suggestedSlippage: 1.0
          }))
        })
      )

      render(<SwapInterface onOrderCreated={ jest.fn() } />)

      // Wait for wallet connection
      await waitFor(() => {
        expect(screen.getByText('USDC')).toBeInTheDocument()
      })

      // Enter amount and create swap
      const amountInput = screen.getByPlaceholderText(/enter amount/i)
      await user.type(amountInput, '50')

      const addressInput = screen.getByPlaceholderText(/bitcoin address/i)
      await user.type(addressInput, 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh')

      const swapButton = screen.getByRole('button', { name: /create swap/i })
      await user.click(swapButton)

      // Verify helpful error message
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Slippage tolerance exceeded')
      })

      // Verify recovery suggestion
      expect(screen.getByText(/try increasing slippage to 1.0%/i)).toBeInTheDocument()

      // Test automatic recovery
      const adjustSlippageButton = screen.getByRole('button', { name: /adjust slippage/i })
      await user.click(adjustSlippageButton)

      // Verify slippage was adjusted
      await waitFor(() => {
        expect(screen.getByText('1.0%')).toBeInTheDocument()
      })
    })

    it('should provide network-specific error guidance', async () => {
      const mockIsConnected = enhancedWallet.isConnected as jest.Mock
      const mockGetCurrentAddress = enhancedWallet.getCurrentAddress as jest.Mock

      mockIsConnected.mockReturnValue(true)
      mockGetCurrentAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')

      // Override API to return network-specific error
      server.use(
        rest.post('/api/swap/execute', (req, res, ctx) => {
          return res(ctx.status(400), ctx.json({
            success: false,
            error: 'Insufficient gas for transaction',
            estimatedGas: '200000',
            currentGas: '150000'
          }))
        })
      )

      render(<SwapInterface onOrderCreated={ jest.fn() } />)

      // Wait for wallet connection
      await waitFor(() => {
        expect(screen.getByText('USDC')).toBeInTheDocument()
      })

      // Enter amount and create swap
      const amountInput = screen.getByPlaceholderText(/enter amount/i)
      await user.type(amountInput, '50')

      const addressInput = screen.getByPlaceholderText(/bitcoin address/i)
      await user.type(addressInput, 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh')

      const swapButton = screen.getByRole('button', { name: /create swap/i })
      await user.click(swapButton)

      // Verify network-specific error guidance
      await waitFor(() => {
        expect(screen.getByText(/insufficient gas for transaction/i)).toBeInTheDocument()
        expect(screen.getByText(/estimated gas: 200,000/i)).toBeInTheDocument()
        expect(screen.getByText(/current gas: 150,000/i)).toBeInTheDocument()
      })

      // Verify gas adjustment option
      expect(screen.getByRole('button', { name: /increase gas limit/i })).toBeInTheDocument()
    })
  })
}) 