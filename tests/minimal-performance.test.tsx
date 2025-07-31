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

// Setup MSW server for API mocking
const server = setupServer(
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
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Minimal Performance Test', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    jest.clearAllMocks()
  })

  it('should load portfolio efficiently', async () => {
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
  })
}) 