import { render, screen, waitFor } from '@testing-library/react'
import { http } from 'msw'
import { BlockchainDashboard } from '@/components/blockchain/blockchain-dashboard'
import { setupTestEnvironment, setupBlockchainMocks, server } from './setup'

describe('Multi-Chain Transaction Monitoring', () => {
    setupTestEnvironment()
    setupBlockchainMocks()

    it('should monitor transactions on both chains simultaneously', async () => {
        render(<BlockchainDashboard />)

        // Wait for dashboard to load
        await waitFor(() => {
            expect(screen.getByText(/blockchain dashboard/i)).toBeInTheDocument()
        })

        // Verify both chain statuses are displayed
        expect(screen.getByText(/ethereum/i)).toBeInTheDocument()
        expect(screen.getByText(/bitcoin/i)).toBeInTheDocument()

        // Verify network status information
        expect(screen.getByText(/block height/i)).toBeInTheDocument()
        expect(screen.getByText(/gas price/i)).toBeInTheDocument()
    })

    it('should handle transaction confirmation delays', async () => {
        // Mock delayed confirmation
        server.use(
            http.get('/api/transactions/monitor/:swapId', () => {
                return Response.json({
                    swapId: 'swap_123',
                    status: 'monitoring',
                    transactions: {
                        ethereum: {
                            txHash: '0x1234567890abcdef',
                            status: 'pending',
                            blockNumber: null,
                            confirmations: 0
                        },
                        bitcoin: {
                            txHash: 'abc123def456',
                            status: 'pending',
                            confirmations: 0,
                            blockHeight: null
                        }
                    },
                    lastUpdated: new Date().toISOString()
                })
            })
        )

        render(<BlockchainDashboard />)

        // Verify pending status is displayed
        await waitFor(() => {
            expect(screen.getByText(/pending/i)).toBeInTheDocument()
        })
    })

    it('should handle transaction failures on one chain', async () => {
        // Mock transaction failure
        server.use(
            http.get('/api/transactions/monitor/:swapId', () => {
                return Response.json({
                    swapId: 'swap_123',
                    status: 'failed',
                    transactions: {
                        ethereum: {
                            txHash: '0x1234567890abcdef',
                            status: 'failed',
                            blockNumber: 12345678,
                            confirmations: 0,
                            error: 'Out of gas'
                        },
                        bitcoin: {
                            txHash: 'abc123def456',
                            status: 'confirmed',
                            confirmations: 6,
                            blockHeight: 123456
                        }
                    },
                    lastUpdated: new Date().toISOString()
                })
            })
        )

        render(<BlockchainDashboard />)

        // Verify failure status is displayed
        await waitFor(() => {
            expect(screen.getByText(/failed/i)).toBeInTheDocument()
        })
    })

    it('should handle partial confirmations', async () => {
        // Mock partial confirmation scenario
        server.use(
            http.get('/api/transactions/monitor/:swapId', () => {
                return Response.json({
                    swapId: 'swap_123',
                    status: 'partial_confirmed',
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
            })
        )

        render(<BlockchainDashboard />)

        // Verify partial confirmation status
        await waitFor(() => {
            expect(screen.getByText(/partial_confirmed/i)).toBeInTheDocument()
        })
    })

    it('should handle network timeouts', async () => {
        // Mock network timeout
        server.use(
            http.get('/api/transactions/monitor/:swapId', () => {
                return new Response(JSON.stringify({ error: 'Request timeout' }), { status: 408 })
            })
        )

        render(<BlockchainDashboard />)

        // Verify timeout error handling
        await waitFor(() => {
            expect(screen.getByText(/request timeout/i)).toBeInTheDocument()
        })
    })

    it('should handle invalid swap ID', async () => {
        // Mock invalid swap ID response
        server.use(
            http.get('/api/transactions/monitor/:swapId', () => {
                return new Response(JSON.stringify({ error: 'Swap not found' }), { status: 404 })
            })
        )

        render(<BlockchainDashboard />)

        // Verify not found error handling
        await waitFor(() => {
            expect(screen.getByText(/swap not found/i)).toBeInTheDocument()
        })
    })

    it('should display transaction details correctly', async () => {
        render(<BlockchainDashboard />)

        // Verify transaction details are displayed
        await waitFor(() => {
            expect(screen.getByText(/transaction hash/i)).toBeInTheDocument()
            expect(screen.getByText(/confirmations/i)).toBeInTheDocument()
            expect(screen.getByText(/block number/i)).toBeInTheDocument()
        })
    })

    it('should handle rapid status updates', async () => {
        let callCount = 0
        server.use(
            http.get('/api/transactions/monitor/:swapId', () => {
                callCount++
                const status = callCount === 1 ? 'pending' : 'confirmed'

                return Response.json({
                    swapId: 'swap_123',
                    status,
                    transactions: {
                        ethereum: {
                            txHash: '0x1234567890abcdef',
                            status,
                            blockNumber: callCount === 1 ? null : 12345678,
                            confirmations: callCount === 1 ? 0 : 12
                        },
                        bitcoin: {
                            txHash: 'abc123def456',
                            status: 'confirmed',
                            confirmations: 6,
                            blockHeight: 123456
                        }
                    },
                    lastUpdated: new Date().toISOString()
                })
            })
        )

        render(<BlockchainDashboard />)

        // Verify status updates are handled correctly
        await waitFor(() => {
            expect(screen.getByText(/confirmed/i)).toBeInTheDocument()
        })
    })
}) 