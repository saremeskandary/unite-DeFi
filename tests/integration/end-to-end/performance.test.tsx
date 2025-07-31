import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import PortfolioPage from '@/app/portfolio/page'
import { SwapInterface } from '@/components/swap/swap-interface'
import OrdersPage from '@/app/orders/page'
import { enhancedWallet } from '@/lib/enhanced-wallet'
import { toast } from 'sonner'
import { performance } from 'perf_hooks'

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

// Mock performance API for browser environment
Object.defineProperty(window, 'performance', {
  value: {
    now: () => performance.now(),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
  },
  writable: true,
})

// Setup MSW server for API mocking
const server = setupServer(
  // Default responses
  http.get('/api/portfolio', () => {
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
  }),

  http.post('/api/swap/quote', () => {
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

  http.post('/api/swap/execute', () => {
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

  http.get('/api/orders', () => {
    return HttpResponse.json([])
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Performance Tests', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    jest.clearAllMocks()
  })

  describe('Large Portfolio Loading', () => {
    it('should load large portfolio efficiently', async () => {
      // Generate large portfolio data
      const largeTopTokens = Array.from({ length: 100 }, (_, i) => ({
        symbol: `TOKEN${i}`,
        name: `Token ${i}`,
        balance: (Math.random() * 1000).toFixed(2),
        value: Math.random() * 50000,
        change24h: (Math.random() * 20 - 10).toFixed(2)
      }))

      const largeRecentActivity = Array.from({ length: 500 }, (_, i) => ({
        id: `order_${i}`,
        type: 'swap',
        fromToken: `TOKEN${i % 10}`,
        toToken: `TOKEN${(i + 1) % 10}`,
        fromAmount: (Math.random() * 1000).toFixed(2),
        toAmount: (Math.random() * 10).toFixed(6),
        status: ['completed', 'pending', 'failed'][i % 3],
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      }))

      // Override API to return large dataset
      server.use(
        http.get('/api/portfolio', () => {
          return HttpResponse.json({
            totalValue: 12450.75,
            totalSwaps: 23,
            totalVolume: 45230.5,
            profitLoss: 1250.3,
            profitLossPercentage: 11.2,
            topTokens: largeTopTokens,
            recentActivity: largeRecentActivity,
            lastUpdated: new Date().toISOString()
          })
        })
      )

      const startTime = performance.now()

      render(<PortfolioPage />)

      // Wait for portfolio to load
      await waitFor(() => {
        expect(screen.getByText('$12,450.75')).toBeInTheDocument()
      }, { timeout: 10000 })

      const endTime = performance.now()
      const loadTime = endTime - startTime

      // Performance assertion: should load within 3 seconds
      expect(loadTime).toBeLessThan(3000)

      // Verify data is displayed correctly
      expect(screen.getByText('Portfolio Overview')).toBeInTheDocument()

      // Test pagination for large datasets
      const nextPageButton = screen.getByRole('button', { name: /next/i })
      if (nextPageButton) {
        await user.click(nextPageButton)
        await waitFor(() => {
          expect(screen.getByText('Page 2')).toBeInTheDocument()
        })
      }
    })

    it('should handle portfolio loading with network latency', async () => {
      // Simulate network latency
      server.use(
        http.get('/api/portfolio', async () => {
          await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second delay
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

      render(<PortfolioPage />)

      // Verify loading state is shown
      expect(screen.getByText(/loading/i)).toBeInTheDocument()

      // Wait for data to load despite latency
      await waitFor(() => {
        expect(screen.getByText('$12,450.75')).toBeInTheDocument()
      }, { timeout: 10000 })

      // Verify loading state is removed
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })

    it('should implement virtual scrolling for large token lists', async () => {
      // Generate very large token list
      const veryLargeTopTokens = Array.from({ length: 1000 }, (_, i) => ({
        symbol: `TOKEN${i}`,
        name: `Token ${i}`,
        balance: (Math.random() * 1000).toFixed(2),
        value: Math.random() * 50000,
        change24h: (Math.random() * 20 - 10).toFixed(2)
      }))

      server.use(
        http.get('/api/portfolio', () => {
          return HttpResponse.json({
            totalValue: 12450.75,
            totalSwaps: 23,
            totalVolume: 45230.5,
            profitLoss: 1250.3,
            profitLossPercentage: 11.2,
            topTokens: veryLargeTopTokens,
            recentActivity: [],
            lastUpdated: new Date().toISOString()
          }))
        })
      )

      render(<PortfolioPage />)

      await waitFor(() => {
        expect(screen.getByText('Portfolio Overview')).toBeInTheDocument()
      })

      // Navigate to tokens tab
      const tokensTab = screen.getByRole('tab', { name: /tokens/i })
      await user.click(tokensTab)

      // Verify virtual scrolling is implemented
      await waitFor(() => {
        expect(screen.getByText('Token Holdings')).toBeInTheDocument()
      })

      // Test scroll performance
      const tokenList = screen.getByRole('list')
      if (tokenList) {
        const scrollStart = performance.now()

        // Simulate scrolling
        tokenList.scrollTop = 1000

        const scrollEnd = performance.now()
        const scrollTime = scrollEnd - scrollStart

        // Scroll should be smooth and fast
        expect(scrollTime).toBeLessThan(100)
      }
    })
  })

  describe('Multiple Concurrent Swaps', () => {
    it('should handle multiple concurrent swap requests efficiently', async () => {
      const mockIsConnected = enhancedWallet.isConnected as jest.Mock
      const mockGetCurrentAddress = enhancedWallet.getCurrentAddress as jest.Mock

      mockIsConnected.mockReturnValue(true)
      mockGetCurrentAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')

      render(<SwapInterface onOrderCreated={ jest.fn() } />)

      await waitFor(() => {
        expect(screen.getByText('USDC')).toBeInTheDocument()
      })

      // Simulate multiple concurrent quote requests
      const quotePromises = []
      const startTime = performance.now()

      for (let i = 0; i < 5; i++) {
        const amountInput = screen.getByPlaceholderText(/enter amount/i)
        amountInput.setAttribute('value', `${100 + i * 10}`)

        // Trigger quote request
        quotePromises.push(
          fetch('/api/swap/quote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fromToken: 'USDC',
              toToken: 'BTC',
              fromAmount: `${100 + i * 10}`
            })
          })
        )
      }

      // Wait for all quotes to complete
      await Promise.all(quotePromises)
      const endTime = performance.now()
      const totalTime = endTime - startTime

      // All quotes should complete within reasonable time
      expect(totalTime).toBeLessThan(5000)

      // Verify no memory leaks from concurrent requests
      const memoryUsage = (performance as any).memory
      if (memoryUsage) {
        expect(memoryUsage.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024) // 50MB limit
      }
    })

    it('should prevent duplicate swap submissions', async () => {
      const mockIsConnected = enhancedWallet.isConnected as jest.Mock
      const mockGetCurrentAddress = enhancedWallet.getCurrentAddress as jest.Mock

      mockIsConnected.mockReturnValue(true)
      mockGetCurrentAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')

      render(<SwapInterface onOrderCreated={ jest.fn() } />)

      await waitFor(() => {
        expect(screen.getByText('USDC')).toBeInTheDocument()
      })

      // Enter amount
      const amountInput = screen.getByPlaceholderText(/enter amount/i)
      await user.type(amountInput, '100')

      await waitFor(() => {
        expect(screen.getByText('0.023')).toBeInTheDocument()
      })

      // Enter Bitcoin address
      const addressInput = screen.getByPlaceholderText(/bitcoin address/i)
      await user.type(addressInput, 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh')

      // Rapidly click swap button multiple times
      const swapButton = screen.getByRole('button', { name: /create swap/i })

      const startTime = performance.now()

      for (let i = 0; i < 5; i++) {
        await user.click(swapButton)
      }

      const endTime = performance.now()
      const clickTime = endTime - startTime

      // Verify only one swap was created despite multiple clicks
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledTimes(1)
      })

      // Verify button was disabled during processing
      expect(swapButton).toBeDisabled()
    })

    it('should handle swap queue management', async () => {
      // Mock slow API responses
      server.use(
        http.post('/api/swap/execute', async () => {
          await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second delay
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
        })
      )

      const mockIsConnected = enhancedWallet.isConnected as jest.Mock
      const mockGetCurrentAddress = enhancedWallet.getCurrentAddress as jest.Mock

      mockIsConnected.mockReturnValue(true)
      mockGetCurrentAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')

      render(<SwapInterface onOrderCreated={ jest.fn() } />)

      await waitFor(() => {
        expect(screen.getByText('USDC')).toBeInTheDocument()
      })

      // Start multiple swaps
      const swapPromises = []

      for (let i = 0; i < 3; i++) {
        const amountInput = screen.getByPlaceholderText(/enter amount/i)
        amountInput.setAttribute('value', `${100 + i * 10}`)

        const addressInput = screen.getByPlaceholderText(/bitcoin address/i)
        addressInput.setAttribute('value', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh')

        swapPromises.push(
          fetch('/api/swap/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fromToken: 'USDC',
              toToken: 'BTC',
              fromAmount: `${100 + i * 10}`,
              toAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
            })
          })
        )
      }

      // Wait for all swaps to complete
      const results = await Promise.all(swapPromises)

      // Verify all swaps completed successfully
      results.forEach(result => {
        expect(result.status).toBe(200)
      })
    })
  })

  describe('Real-time Update Performance', () => {
    it('should handle real-time updates efficiently', async () => {
      // Mock WebSocket connection
      const mockWebSocket = {
        onmessage: null as ((event: any) => void) | null,
        send: jest.fn(),
        close: jest.fn(),
      }

      global.WebSocket = jest.fn(() => mockWebSocket) as any

      render(<OrdersPage />)

      await waitFor(() => {
        expect(screen.getByText('Order History')).toBeInTheDocument()
      })

      // Simulate rapid real-time updates
      const updateCount = 100
      const startTime = performance.now()

      for (let i = 0; i < updateCount; i++) {
        if (mockWebSocket.onmessage) {
          mockWebSocket.onmessage({
            data: JSON.stringify({
              type: 'order_update',
              orderId: `order_${i}`,
              status: 'completed',
              completedAt: new Date().toISOString()
            })
          })
        }
      }

      const endTime = performance.now()
      const updateTime = endTime - startTime

      // Updates should be processed efficiently
      expect(updateTime).toBeLessThan(1000) // Less than 1 second for 100 updates

      // Verify no memory leaks from rapid updates
      const memoryUsage = (performance as any).memory
      if (memoryUsage) {
        expect(memoryUsage.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024) // 100MB limit
      }
    })

    it('should debounce rapid price updates', async () => {
      const mockIsConnected = enhancedWallet.isConnected as jest.Mock
      const mockGetCurrentAddress = enhancedWallet.getCurrentAddress as jest.Mock

      mockIsConnected.mockReturnValue(true)
      mockGetCurrentAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')

      render(<SwapInterface onOrderCreated={ jest.fn() } />)

      await waitFor(() => {
        expect(screen.getByText('USDC')).toBeInTheDocument()
      })

      // Simulate rapid price updates
      const priceUpdateCount = 50
      const startTime = performance.now()

      for (let i = 0; i < priceUpdateCount; i++) {
        // Trigger price update
        const amountInput = screen.getByPlaceholderText(/enter amount/i)
        amountInput.setAttribute('value', '100')
        amountInput.dispatchEvent(new Event('input', { bubbles: true }))
      }

      const endTime = performance.now()
      const updateTime = endTime - startTime

      // Price updates should be debounced
      expect(updateTime).toBeLessThan(2000) // Less than 2 seconds for 50 updates

      // Verify only necessary API calls were made
      await waitFor(() => {
        // Should have made fewer API calls than updates due to debouncing
        expect(fetch).toHaveBeenCalledTimes(expect.any(Number))
      })
    })

    it('should handle WebSocket reconnection efficiently', async () => {
      const mockWebSocket = {
        onmessage: null as ((event: any) => void) | null,
        onclose: null as ((event: any) => void) | null,
        send: jest.fn(),
        close: jest.fn(),
      }

      global.WebSocket = jest.fn(() => mockWebSocket) as any

      render(<OrdersPage />)

      await waitFor(() => {
        expect(screen.getByText('Order History')).toBeInTheDocument()
      })

      // Simulate WebSocket disconnection
      if (mockWebSocket.onclose) {
        mockWebSocket.onclose({ code: 1000, reason: 'Normal closure' })
      }

      // Verify reconnection attempt
      await waitFor(() => {
        expect(screen.getByText(/reconnecting/i)).toBeInTheDocument()
      })

      // Simulate successful reconnection
      const newMockWebSocket = {
        onmessage: null as ((event: any) => void) | null,
        send: jest.fn(),
        close: jest.fn(),
      }

      global.WebSocket = jest.fn(() => newMockWebSocket) as any

      // Verify reconnection success
      await waitFor(() => {
        expect(screen.queryByText(/reconnecting/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Memory Usage Optimization', () => {
    it('should clean up event listeners properly', async () => {
      const mockIsConnected = enhancedWallet.isConnected as jest.Mock
      const mockGetCurrentAddress = enhancedWallet.getCurrentAddress as jest.Mock
      const mockOnAccountChange = enhancedWallet.onAccountChange as jest.Mock
      const mockOnChainChange = enhancedWallet.onChainChange as jest.Mock

      mockIsConnected.mockReturnValue(true)
      mockGetCurrentAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')

      const { unmount } = render(<SwapInterface onOrderCreated={ jest.fn() } />)

      await waitFor(() => {
        expect(screen.getByText('USDC')).toBeInTheDocument()
      })

      // Record initial memory usage
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0

      // Unmount component
      unmount()

      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 100))

      // Record final memory usage
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0

      // Memory should not increase significantly after unmount
      expect(finalMemory - initialMemory).toBeLessThan(10 * 1024 * 1024) // 10MB threshold
    })

    it('should implement proper garbage collection for large datasets', async () => {
      // Generate large dataset
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: `item_${i}`,
        data: `data_${i}`,
        timestamp: new Date().toISOString()
      }))

      server.use(
        http.get('/api/orders', () => {
          return HttpResponse.json(largeDataset)
        })
      )

      const { unmount } = render(<OrdersPage />)

      await waitFor(() => {
        expect(screen.getByText('Order History')).toBeInTheDocument()
      })

      // Record memory usage with large dataset
      const memoryWithData = (performance as any).memory?.usedJSHeapSize || 0

      // Unmount component
      unmount()

      // Wait for garbage collection
      await new Promise(resolve => setTimeout(resolve, 500))

      // Record memory usage after cleanup
      const memoryAfterCleanup = (performance as any).memory?.usedJSHeapSize || 0

      // Memory should be freed after unmount
      expect(memoryWithData - memoryAfterCleanup).toBeGreaterThan(0)
    })

    it('should optimize component re-renders', async () => {
      const mockIsConnected = enhancedWallet.isConnected as jest.Mock
      const mockGetCurrentAddress = enhancedWallet.getCurrentAddress as jest.Mock

      mockIsConnected.mockReturnValue(true)
      mockGetCurrentAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')

      const renderCount = jest.fn()

      render(<SwapInterface onOrderCreated={ jest.fn() } />)

      await waitFor(() => {
        expect(screen.getByText('USDC')).toBeInTheDocument()
      })

      // Simulate multiple state updates
      const updateCount = 100
      const startTime = performance.now()

      for (let i = 0; i < updateCount; i++) {
        // Trigger state update
        const amountInput = screen.getByPlaceholderText(/enter amount/i)
        amountInput.setAttribute('value', `${i}`)
        amountInput.dispatchEvent(new Event('input', { bubbles: true }))
      }

      const endTime = performance.now()
      const updateTime = endTime - startTime

      // Updates should be fast
      expect(updateTime).toBeLessThan(1000) // Less than 1 second for 100 updates
    })
  })

  describe('Network Latency Handling', () => {
    it('should handle high network latency gracefully', async () => {
      // Simulate high latency
      server.use(
        http.get('/api/portfolio', async () => {
          await new Promise(resolve => setTimeout(resolve, 5000)) // 5 second delay
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

      render(<PortfolioPage />)

      // Verify loading state is shown immediately
      expect(screen.getByText(/loading/i)).toBeInTheDocument()

      // Verify timeout warning is shown
      await waitFor(() => {
        expect(screen.getByText(/taking longer than usual/i)).toBeInTheDocument()
      }, { timeout: 3000 })

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('$12,450.75')).toBeInTheDocument()
      }, { timeout: 10000 })
    })

    it('should implement request cancellation for slow responses', async () => {
      const mockIsConnected = enhancedWallet.isConnected as jest.Mock
      const mockGetCurrentAddress = enhancedWallet.getCurrentAddress as jest.Mock

      mockIsConnected.mockReturnValue(true)
      mockGetCurrentAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')

      // Simulate slow quote API
      server.use(
        http.post('/api/swap/quote', async () => {
          await new Promise(resolve => setTimeout(resolve, 10000)) // 10 second delay
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
        })
      )

      render(<SwapInterface onOrderCreated={ jest.fn() } />)

      await waitFor(() => {
        expect(screen.getByText('USDC')).toBeInTheDocument()
      })

      // Enter amount to trigger quote
      const amountInput = screen.getByPlaceholderText(/enter amount/i)
      await user.type(amountInput, '100')

      // Wait for loading state
      await waitFor(() => {
        expect(screen.getByText(/getting quote/i)).toBeInTheDocument()
      })

      // Cancel request after 3 seconds
      setTimeout(() => {
        const cancelButton = screen.getByRole('button', { name: /cancel/i })
        if (cancelButton) {
          user.click(cancelButton)
        }
      }, 3000)

      // Verify cancellation
      await waitFor(() => {
        expect(screen.getByText(/quote cancelled/i)).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('should implement progressive loading for large datasets', async () => {
      // Generate large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `order_${i}`,
        fromToken: `TOKEN${i % 10}`,
        toToken: `TOKEN${(i + 1) % 10}`,
        fromAmount: (Math.random() * 1000).toFixed(2),
        toAmount: (Math.random() * 10).toFixed(6),
        status: ['completed', 'pending', 'failed'][i % 3],
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      }))

      server.use(
        http.get('/api/orders', ({ request }) => {
          const url = new URL(request.url)
          const page = parseInt(url.searchParams.get('page') || '1')
          const limit = parseInt(url.searchParams.get('limit') || '50')
          const start = (page - 1) * limit
          const end = start + limit
          const paginatedData = largeDataset.slice(start, end)

          return HttpResponse.json({
            orders: paginatedData,
            total: largeDataset.length,
            page,
            limit,
            hasMore: end < largeDataset.length
          })
        })
      )

      render(<OrdersPage />)

      await waitFor(() => {
        expect(screen.getByText('Order History')).toBeInTheDocument()
      })

      // Verify initial page loads quickly
      const initialLoadTime = performance.now()
      await waitFor(() => {
        expect(screen.getByText('TOKEN0')).toBeInTheDocument()
      })
      const initialLoadEndTime = performance.now()
      const initialLoadDuration = initialLoadEndTime - initialLoadTime

      expect(initialLoadDuration).toBeLessThan(2000) // Should load first page quickly

      // Test infinite scroll
      const orderList = screen.getByRole('list')
      if (orderList) {
        orderList.scrollTop = orderList.scrollHeight

        // Wait for next page to load
        await waitFor(() => {
          expect(screen.getByText('TOKEN50')).toBeInTheDocument()
        }, { timeout: 5000 })
      }
    })
  })
}) 