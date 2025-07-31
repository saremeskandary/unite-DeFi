import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { BlockchainDashboard } from '@/components/blockchain/blockchain-dashboard'
import { toast } from 'sonner'
import { setupTestEnvironment, setupBlockchainMocks, server } from './setup'

describe('Cross-Chain Secret Coordination', () => {
    const user = userEvent.setup()

    setupTestEnvironment()
    setupBlockchainMocks()

    it('should coordinate secret revelation across chains', async () => {
        render(<BlockchainDashboard />)

        // Simulate secret revelation
        const revealButton = screen.getByRole('button', { name: /reveal secret/i })
        await user.click(revealButton)

        // Verify secret revelation process
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('secret revealed'))
        })

        // Verify both chains are updated
        expect(screen.getByText(/ethereum claim/i)).toBeInTheDocument()
        expect(screen.getByText(/bitcoin claim/i)).toBeInTheDocument()
    })

    it('should handle secret revelation failures', async () => {
        // Mock secret revelation failure
        server.use(
            rest.post('/api/swap/:swapId/reveal-secret', (req: any, res: any, ctx: any) => {
                return res(ctx.status(500), ctx.json({ error: 'Secret revelation failed' }))
            })
        )

        render(<BlockchainDashboard />)

        // Attempt secret revelation
        const revealButton = screen.getByRole('button', { name: /reveal secret/i })
        await user.click(revealButton)

        // Verify error handling
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Secret revelation failed')
        })
    })

    it('should validate secret format before revelation', async () => {
        render(<BlockchainDashboard />)

        // Enter invalid secret format
        const secretInput = screen.getByLabelText(/secret/i)
        await user.type(secretInput, 'invalid-secret-format')

        // Attempt secret revelation
        const revealButton = screen.getByRole('button', { name: /reveal secret/i })
        await user.click(revealButton)

        // Verify validation error
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('invalid secret format'))
        })
    })

    it('should handle missing secret parameter', async () => {
        // Mock missing secret error
        server.use(
            rest.post('/api/swap/:swapId/reveal-secret', (req: any, res: any, ctx: any) => {
                return res(ctx.status(400), ctx.json({ error: 'Secret is required' }))
            })
        )

        render(<BlockchainDashboard />)

        // Attempt secret revelation without secret
        const revealButton = screen.getByRole('button', { name: /reveal secret/i })
        await user.click(revealButton)

        // Verify error handling
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Secret is required')
        })
    })

    it('should handle network errors during secret revelation', async () => {
        // Mock network error
        server.use(
            rest.post('/api/swap/:swapId/reveal-secret', (req: any, res: any, ctx: any) => {
                return res(ctx.status(503), ctx.json({ error: 'Service unavailable' }))
            })
        )

        render(<BlockchainDashboard />)

        // Attempt secret revelation
        const revealButton = screen.getByRole('button', { name: /reveal secret/i })
        await user.click(revealButton)

        // Verify network error handling
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Service unavailable')
        })
    })

    it('should handle successful secret revelation with retry', async () => {
        let attemptCount = 0
        server.use(
            rest.post('/api/swap/:swapId/reveal-secret', (req: any, res: any, ctx: any) => {
                attemptCount++
                if (attemptCount === 1) {
                    return res(ctx.status(500), ctx.json({ error: 'Temporary failure' }))
                }
                return res(ctx.json({
                    success: true,
                    swapId: 'swap_123',
                    secretRevealed: true,
                    ethereumClaimTx: '0xabcdef1234567890',
                    bitcoinClaimTx: 'def456abc123',
                    status: 'completed'
                }))
            })
        )

        render(<BlockchainDashboard />)

        // First attempt should fail
        const revealButton = screen.getByRole('button', { name: /reveal secret/i })
        await user.click(revealButton)

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Temporary failure')
        })

        // Retry should succeed
        await user.click(revealButton)

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('secret revealed'))
        })
    })

    it('should display secret revelation status correctly', async () => {
        render(<BlockchainDashboard />)

        // Verify secret revelation UI elements
        expect(screen.getByText(/secret revelation/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /reveal secret/i })).toBeInTheDocument()
    })

    it('should handle concurrent secret revelation attempts', async () => {
        let concurrentAttempts = 0
        server.use(
            rest.post('/api/swap/:swapId/reveal-secret', async (req: any, res: any, ctx: any) => {
                concurrentAttempts++
                // Simulate processing delay
                await new Promise(resolve => setTimeout(resolve, 100))

                if (concurrentAttempts > 1) {
                    return res(ctx.status(409), ctx.json({ error: 'Secret already revealed' }))
                }

                return res(ctx.json({
                    success: true,
                    swapId: 'swap_123',
                    secretRevealed: true,
                    ethereumClaimTx: '0xabcdef1234567890',
                    bitcoinClaimTx: 'def456abc123',
                    status: 'completed'
                }))
            })
        )

        render(<BlockchainDashboard />)

        // Trigger multiple concurrent attempts
        const revealButton = screen.getByRole('button', { name: /reveal secret/i })
        await user.click(revealButton)
        await user.click(revealButton)

        // Verify only one successful revelation
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledTimes(1)
            expect(toast.error).toHaveBeenCalledWith('Secret already revealed')
        })
    })
}) 