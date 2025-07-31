import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { BlockchainDashboard } from '@/components/blockchain/blockchain-dashboard'
import { toast } from 'sonner'
import { setupTestEnvironment, setupBlockchainMocks, server } from './setup'

describe('Chain Reorganization Handling', () => {
    const user = userEvent.setup()

    setupTestEnvironment()
    setupBlockchainMocks()

    it('should handle Bitcoin chain reorganization', async () => {
        render(<BlockchainDashboard />)

        // Simulate chain reorganization
        const reorgButton = screen.getByRole('button', { name: /handle reorg/i })
        await user.click(reorgButton)

        // Verify reorg handling
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('reorg handled'))
        })
    })

    it('should handle Ethereum chain reorganization', async () => {
        render(<BlockchainDashboard />)

        // Simulate Ethereum reorg
        const ethereumReorgButton = screen.getByRole('button', { name: /ethereum reorg/i })
        await user.click(ethereumReorgButton)

        // Verify reorg handling
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('reorg handled'))
        })
    })

    it('should handle deep reorganizations', async () => {
        // Mock deep reorg scenario
        server.use(
            http.post('/api/swap/:swapId/handle-reorg', () => {
                return Response.json({
                    success: true,
                    swapId: 'swap_123',
                    chain: 'bitcoin',
                    reorgHandled: true,
                    oldBlockHash: 'old_hash_123',
                    newBlockHash: 'new_hash_456',
                    status: 'deep_reorg_handled',
                    depth: 10
                })
            })
        )

        render(<BlockchainDashboard />)

        // Handle deep reorg
        const deepReorgButton = screen.getByRole('button', { name: /deep reorg/i })
        await user.click(deepReorgButton)

        // Verify deep reorg handling
        await waitFor(() => {
            expect(screen.getByText(/deep reorg handled/i)).toBeInTheDocument()
        })
    })

    it('should handle reorg detection failures', async () => {
        // Mock reorg detection failure
        server.use(
            http.post('/api/swap/:swapId/handle-reorg', () => {
                return new Response(JSON.stringify({ error: 'Reorg detection failed' }), { status: 500 })
            })
        )

        render(<BlockchainDashboard />)

        // Attempt reorg handling
        const reorgButton = screen.getByRole('button', { name: /handle reorg/i })
        await user.click(reorgButton)

        // Verify error handling
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Reorg detection failed')
        })
    })

    it('should handle invalid block hash parameters', async () => {
        // Mock invalid parameters error
        server.use(
            http.post('/api/swap/:swapId/handle-reorg', () => {
                return new Response(JSON.stringify({ error: 'Invalid block hash parameters' }), { status: 400 })
            })
        )

        render(<BlockchainDashboard />)

        // Attempt reorg handling with invalid parameters
        const reorgButton = screen.getByRole('button', { name: /handle reorg/i })
        await user.click(reorgButton)

        // Verify error handling
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Invalid block hash parameters')
        })
    })

    it('should handle simultaneous reorgs on both chains', async () => {
        // Mock simultaneous reorg scenario
        server.use(
            http.post('/api/swap/:swapId/handle-reorg', async ({ request }) => {
                const body = await request.json()
                const { chain } = body as any
                return Response.json({
                    success: true,
                    swapId: 'swap_123',
                    chain,
                    reorgHandled: true,
                    oldBlockHash: `old_${chain}_hash`,
                    newBlockHash: `new_${chain}_hash`,
                    status: 'simultaneous_reorg_handled'
                })
            })
        )

        render(<BlockchainDashboard />)

        // Handle Bitcoin reorg
        const btcReorgButton = screen.getByRole('button', { name: /bitcoin reorg/i })
        await user.click(btcReorgButton)

        // Handle Ethereum reorg
        const ethReorgButton = screen.getByRole('button', { name: /ethereum reorg/i })
        await user.click(ethReorgButton)

        // Verify both reorgs handled
        await waitFor(() => {
            expect(screen.getByText(/simultaneous_reorg_handled/i)).toBeInTheDocument()
        })
    })

    it('should handle reorg with conflicting transactions', async () => {
        // Mock reorg with conflicts
        server.use(
            http.post('/api/swap/:swapId/handle-reorg', () => {
                return Response.json({
                    success: true,
                    swapId: 'swap_123',
                    chain: 'bitcoin',
                    reorgHandled: true,
                    oldBlockHash: 'old_hash_123',
                    newBlockHash: 'new_hash_456',
                    status: 'reorg_with_conflicts_handled',
                    conflicts: ['tx1', 'tx2'],
                    resolved: true
                })
            })
        )

        render(<BlockchainDashboard />)

        // Handle reorg with conflicts
        const conflictReorgButton = screen.getByRole('button', { name: /conflict reorg/i })
        await user.click(conflictReorgButton)

        // Verify conflict resolution
        await waitFor(() => {
            expect(screen.getByText(/reorg_with_conflicts_handled/i)).toBeInTheDocument()
            expect(screen.getByText(/conflicts resolved/i)).toBeInTheDocument()
        })
    })

    it('should handle reorg timeout scenarios', async () => {
        // Mock reorg timeout
        server.use(
            http.post('/api/swap/:swapId/handle-reorg', async () => {
                // Simulate timeout
                await new Promise(resolve => setTimeout(resolve, 5000))
                return new Response(JSON.stringify({ error: 'Reorg handling timeout' }), { status: 408 })
            })
        )

        render(<BlockchainDashboard />)

        // Attempt reorg handling
        const reorgButton = screen.getByRole('button', { name: /handle reorg/i })
        await user.click(reorgButton)

        // Verify timeout handling
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Reorg handling timeout')
        }, { timeout: 6000 })
    })

    it('should display reorg status correctly', async () => {
        render(<BlockchainDashboard />)

        // Verify reorg handling UI elements
        expect(screen.getByText(/chain reorganization/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /handle reorg/i })).toBeInTheDocument()
    })

    it('should handle reorg with orphaned blocks', async () => {
        // Mock reorg with orphaned blocks
        server.use(
            http.post('/api/swap/:swapId/handle-reorg', () => {
                return Response.json({
                    success: true,
                    swapId: 'swap_123',
                    chain: 'bitcoin',
                    reorgHandled: true,
                    oldBlockHash: 'old_hash_123',
                    newBlockHash: 'new_hash_456',
                    status: 'reorg_with_orphans_handled',
                    orphanedBlocks: 5,
                    orphanedTransactions: 12
                })
            })
        )

        render(<BlockchainDashboard />)

        // Handle reorg with orphans
        const orphanReorgButton = screen.getByRole('button', { name: /orphan reorg/i })
        await user.click(orphanReorgButton)

        // Verify orphan handling
        await waitFor(() => {
            expect(screen.getByText(/reorg_with_orphans_handled/i)).toBeInTheDocument()
            expect(screen.getByText(/5 orphaned blocks/i)).toBeInTheDocument()
        })
    })
}) 