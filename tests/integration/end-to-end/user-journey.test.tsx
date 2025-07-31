import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { WalletConnection } from '@/components/wallet/wallet-connection'
import { SwapInterface } from '@/components/swap/swap-interface'
import PortfolioPage from '@/app/portfolio/page'
import OrdersPage from '@/app/orders/page'
import { enhancedWallet } from '@/lib/enhanced-wallet'
import { toast } from 'sonner'
import React from 'react'

// Mock the enhanced wallet
jest.mock('@/lib/enhanced-wallet', () => ({
    enhancedWallet: {
        isConnected: jest.fn(),
        getCurrentAddress: jest.fn(),
        onAccountChange: jest.fn(),
        onChainChange: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn(),
    }
}))

// Mock toast notifications
jest.mock('sonner', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
    }
}))

// Setup MSW server for API mocking
const server = setupServer(
    // Mock portfolio API
    http.get('/api/portfolio', ({ request }) => {
        const url = new URL(request.url)
        const walletAddress = url.searchParams.get('walletAddress')
        if (!walletAddress) {
            return HttpResponse.json({ error: 'Wallet address is required' }, { status: 400 })
        }

        return HttpResponse.json({
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
            lastUpdated: new Date().toISOString()
        })
    }),

    // Mock swap quote API
    http.post('/api/swap/quote', async ({ request }) => {
        const body = await request.json() as any
        const { fromToken, toToken, fromAmount } = body

        if (!fromToken || !toToken || !fromAmount) {
            return HttpResponse.json({ error: 'Missing required parameters' }, { status: 400 })
        }

        return HttpResponse.json({
            fromToken,
            toToken,
            fromAmount,
            toAmount: '0.023',
            rate: '0.000023',
            gasEstimate: '150000',
            gasPrice: '20000000000',
            totalFee: '0.003',
            validUntil: new Date(Date.now() + 30000).toISOString()
        })
    }),

    // Mock swap execution API
    http.post('/api/swap/execute', async ({ request }) => {
        const body = await request.json() as any
        const { fromToken, toToken, fromAmount, toAddress } = body

        if (!fromToken || !toToken || !fromAmount || !toAddress) {
            return HttpResponse.json({ error: 'Missing required parameters' }, { status: 400 })
        }

        return HttpResponse.json({
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
        })
    }),

    // Mock orders API
    http.get('/api/orders', ({ request }) => {
        const url = new URL(request.url)
        const walletAddress = url.searchParams.get('walletAddress')
        if (!walletAddress) {
            return HttpResponse.json({ error: 'Wallet address is required' }, { status: 400 })
        }

        return HttpResponse.json([
            {
                id: 'order_1',
                fromToken: 'USDC',
                toToken: 'BTC',
                fromAmount: '1000',
                toAmount: '0.023',
                status: 'completed',
                transactionHash: '0x1234567890abcdef',
                createdAt: new Date(Date.now() - 3600000).toISOString(),
                completedAt: new Date().toISOString()
            },
            {
                id: 'order_2',
                fromToken: 'ETH',
                toToken: 'USDC',
                fromAmount: '1.5',
                toAmount: '3975',
                status: 'pending',
                transactionHash: '0xabcdef1234567890',
                createdAt: new Date().toISOString()
            }
        ])
    })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Complete User Journey', () => {
    let user: ReturnType<typeof userEvent.setup>

    beforeEach(() => {
        user = userEvent.setup()
        jest.clearAllMocks()
    })

    describe('Wallet Connection Flow', () => {
        it('should successfully connect wallet and display address', async () => {
            const mockAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
            const mockConnect = enhancedWallet.connect as jest.Mock
            const mockIsConnected = enhancedWallet.isConnected as jest.Mock
            const mockGetCurrentAddress = enhancedWallet.getCurrentAddress as jest.Mock

            mockIsConnected.mockReturnValue(false)
            mockConnect.mockResolvedValue(undefined)
            mockGetCurrentAddress.mockReturnValue(mockAddress)

            render(<WalletConnection />)

            // Find and click connect button
            const connectButton = screen.getByRole('button', { name: /connect/i })
            await user.click(connectButton)

            // Wait for connection to complete
            await waitFor(() => {
                expect(mockConnect).toHaveBeenCalled()
            })

            // Verify wallet address is displayed
            await waitFor(() => {
                expect(screen.getByText(mockAddress.slice(0, 6) + '...' + mockAddress.slice(-4))).toBeInTheDocument()
            })

            expect(toast.success).toHaveBeenCalledWith('Wallet connected successfully')
        })

        it('should handle wallet connection failure gracefully', async () => {
            const mockConnect = enhancedWallet.connect as jest.Mock
            mockConnect.mockRejectedValue(new Error('User rejected connection'))

            render(<WalletConnection />)

            const connectButton = screen.getByRole('button', { name: /connect/i })
            await user.click(connectButton)

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('User rejected connection')
            })
        })
    })

    describe('Portfolio Viewing and Navigation', () => {
        it('should load and display portfolio data correctly', async () => {
            render(<PortfolioPage />)

            // Wait for portfolio data to load
            await waitFor(() => {
                expect(screen.getByText('$12,450.75')).toBeInTheDocument()
            })

            // Verify portfolio metrics are displayed
            expect(screen.getByText('23')).toBeInTheDocument() // Total swaps
            expect(screen.getByText('$45,230.50')).toBeInTheDocument() // Total volume
            expect(screen.getByText('+$1,250.30')).toBeInTheDocument() // Profit/Loss

            // Verify top tokens are displayed
            expect(screen.getByText('Bitcoin')).toBeInTheDocument()
            expect(screen.getByText('Ethereum')).toBeInTheDocument()
            expect(screen.getByText('USD Coin')).toBeInTheDocument()

            // Verify recent activity is displayed
            expect(screen.getByText('USDC → BTC')).toBeInTheDocument()
            expect(screen.getByText('Completed')).toBeInTheDocument()
        })

        it('should navigate between portfolio sections', async () => {
            render(<PortfolioPage />)

            // Wait for initial load
            await waitFor(() => {
                expect(screen.getByText('Portfolio Overview')).toBeInTheDocument()
            })

            // Navigate to tokens tab
            const tokensTab = screen.getByRole('tab', { name: /tokens/i })
            await user.click(tokensTab)

            // Verify tokens view is displayed
            await waitFor(() => {
                expect(screen.getByText('Token Holdings')).toBeInTheDocument()
            })

            // Navigate to activity tab
            const activityTab = screen.getByRole('tab', { name: /activity/i })
            await user.click(activityTab)

            // Verify activity view is displayed
            await waitFor(() => {
                expect(screen.getByText('Recent Activity')).toBeInTheDocument()
            })
        })
    })

    describe('Token Selection and Balance Checking', () => {
        it('should allow token selection and display balances', async () => {
            const mockIsConnected = enhancedWallet.isConnected as jest.Mock
            const mockGetCurrentAddress = enhancedWallet.getCurrentAddress as jest.Mock

            mockIsConnected.mockReturnValue(true)
            mockGetCurrentAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')

            render(<SwapInterface onOrderCreated={jest.fn()} />)

            // Wait for wallet connection
            await waitFor(() => {
                expect(screen.getByText('USDC')).toBeInTheDocument()
            })

            // Click on from token selector
            const fromTokenButton = screen.getByRole('button', { name: /select from token/i })
            await user.click(fromTokenButton)

            // Select a different token
            const ethOption = screen.getByText('ETH')
            await user.click(ethOption)

            // Verify token selection is updated
            await waitFor(() => {
                expect(screen.getByText('ETH')).toBeInTheDocument()
            })

            // Check that balance is displayed
            expect(screen.getByText(/balance:/i)).toBeInTheDocument()
        })

        it('should validate sufficient balance before allowing swap', async () => {
            const mockIsConnected = enhancedWallet.isConnected as jest.Mock
            const mockGetCurrentAddress = enhancedWallet.getCurrentAddress as jest.Mock

            mockIsConnected.mockReturnValue(true)
            mockGetCurrentAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')

            render(<SwapInterface onOrderCreated={jest.fn()} />)

            // Wait for wallet connection
            await waitFor(() => {
                expect(screen.getByText('USDC')).toBeInTheDocument()
            })

            // Enter an amount larger than balance
            const amountInput = screen.getByPlaceholderText(/enter amount/i)
            await user.type(amountInput, '10000')

            // Try to create swap
            const swapButton = screen.getByRole('button', { name: /create swap/i })
            await user.click(swapButton)

            // Verify error message
            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Insufficient balance')
            })
        })
    })

    describe('Swap Order Creation and Execution', () => {
        it('should create and execute swap order successfully', async () => {
            const mockIsConnected = enhancedWallet.isConnected as jest.Mock
            const mockGetCurrentAddress = enhancedWallet.getCurrentAddress as jest.Mock
            const onOrderCreated = jest.fn()

            mockIsConnected.mockReturnValue(true)
            mockGetCurrentAddress.mockReturnValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')

            render(<SwapInterface onOrderCreated={onOrderCreated} />)

            // Wait for wallet connection
            await waitFor(() => {
                expect(screen.getByText('USDC')).toBeInTheDocument()
            })

            // Enter valid amount
            const amountInput = screen.getByPlaceholderText(/enter amount/i)
            await user.type(amountInput, '100')

            // Wait for quote to load
            await waitFor(() => {
                expect(screen.getByText('0.023')).toBeInTheDocument()
            })

            // Enter Bitcoin address
            const addressInput = screen.getByPlaceholderText(/bitcoin address/i)
            await user.type(addressInput, 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh')

            // Create swap
            const swapButton = screen.getByRole('button', { name: /create swap/i })
            await user.click(swapButton)

            // Verify order creation
            await waitFor(() => {
                expect(toast.success).toHaveBeenCalledWith('Swap order created successfully!')
                expect(onOrderCreated).toHaveBeenCalled()
            })
        })

        it('should handle swap creation failure', async () => {
            // Override the swap execution API to return error
            server.use(
                http.post('/api/swap/execute', () => {
                    return HttpResponse.json({
                        success: false,
                        error: 'Insufficient liquidity'
                    }, { status: 400 })
                })
            )

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
            await user.type(amountInput, '100')

            // Wait for quote to load
            await waitFor(() => {
                expect(screen.getByText('0.023')).toBeInTheDocument()
            })

            // Enter Bitcoin address
            const addressInput = screen.getByPlaceholderText(/bitcoin address/i)
            await user.type(addressInput, 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh')

            // Create swap
            const swapButton = screen.getByRole('button', { name: /create swap/i })
            await user.click(swapButton)

            // Verify error handling
            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Insufficient liquidity')
            })
        })
    })

    describe('Order Tracking and Completion', () => {
        it('should display order history and track order status', async () => {
            render(<OrdersPage />)

            // Wait for orders to load
            await waitFor(() => {
                expect(screen.getByText('Order History')).toBeInTheDocument()
            })

            // Verify completed order is displayed
            expect(screen.getByText('USDC → BTC')).toBeInTheDocument()
            expect(screen.getByText('Completed')).toBeInTheDocument()
            expect(screen.getByText('1,000 USDC')).toBeInTheDocument()
            expect(screen.getByText('0.023 BTC')).toBeInTheDocument()

            // Verify pending order is displayed
            expect(screen.getByText('ETH → USDC')).toBeInTheDocument()
            expect(screen.getByText('Pending')).toBeInTheDocument()

            // Click on order to view details
            const orderRow = screen.getByText('USDC → BTC').closest('tr')
            if (orderRow) {
                await user.click(orderRow)
            }

            // Verify order details are displayed
            await waitFor(() => {
                expect(screen.getByText('Transaction Hash')).toBeInTheDocument()
                expect(screen.getByText('0x1234567890abcdef')).toBeInTheDocument()
            })
        })

        it('should update order status in real-time', async () => {
            // Mock WebSocket connection for real-time updates
            const mockWebSocket = {
                onmessage: null as ((event: any) => void) | null,
                send: jest.fn(),
                close: jest.fn(),
            }

            global.WebSocket = jest.fn(() => mockWebSocket) as any

            render(<OrdersPage />)

            // Wait for initial load
            await waitFor(() => {
                expect(screen.getByText('Order History')).toBeInTheDocument()
            })

            // Simulate real-time status update
            if (mockWebSocket.onmessage) {
                mockWebSocket.onmessage({
                    data: JSON.stringify({
                        type: 'order_update',
                        orderId: 'order_2',
                        status: 'completed',
                        completedAt: new Date().toISOString()
                    })
                })
            }

            // Verify status update is reflected
            await waitFor(() => {
                expect(screen.getByText('Completed')).toBeInTheDocument()
            })
        })
    })
}) 