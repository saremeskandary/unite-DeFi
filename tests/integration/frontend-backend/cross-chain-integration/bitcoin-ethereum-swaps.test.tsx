import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { BitcoinSwapInterface } from '@/components/BitcoinSwapInterface'
import { toast } from 'sonner'
import { setupTestEnvironment, setupBlockchainMocks, server } from './setup'

describe('Bitcoin-Ethereum Swaps', () => {
    const user = userEvent.setup()

    setupTestEnvironment()
    setupBlockchainMocks()

    it('should complete Bitcoin to Ethereum swap flow', async () => {
        render(<BitcoinSwapInterface />)

        // Select BTC to ERC20 direction
        const directionSelect = screen.getByLabelText(/swap direction/i)
        await user.selectOptions(directionSelect, 'btc-to-erc20')

        // Fill in swap details
        const btcAmountInput = screen.getByLabelText(/BTC Amount/i)
        await user.type(btcAmountInput, '0.1')

        const erc20AmountInput = screen.getByLabelText(/ERC20 Amount/i)
        await user.type(erc20AmountInput, '2500')

        const erc20AddressInput = screen.getByLabelText(/ERC20 Address/i)
        await user.type(erc20AddressInput, '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')

        const secretInput = screen.getByLabelText(/Secret/i)
        await user.type(secretInput, '0x' + 'a'.repeat(64))

        // Execute swap
        const executeButton = screen.getByRole('button', { name: /execute swap/i })
        await user.click(executeButton)

        // Verify swap initiation
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Swap order submitted successfully!')
        })

        // Verify HTLC creation
        expect(screen.getByText(/htlc address/i)).toBeInTheDocument()
    })

    it('should complete Ethereum to Bitcoin swap flow', async () => {
        render(<BitcoinSwapInterface />)

        // Select ERC20 to BTC direction
        const directionSelect = screen.getByLabelText(/swap direction/i)
        await user.selectOptions(directionSelect, 'erc20-to-btc')

        // Fill in swap details
        const erc20AmountInput = screen.getByLabelText(/ERC20 Amount/i)
        await user.type(erc20AmountInput, '1000')

        const btcAmountInput = screen.getByLabelText(/BTC Amount/i)
        await user.type(btcAmountInput, '0.023')

        const btcAddressInput = screen.getByLabelText(/Bitcoin Address/i)
        await user.type(btcAddressInput, 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh')

        const secretInput = screen.getByLabelText(/Secret/i)
        await user.type(secretInput, '0x' + 'a'.repeat(64))

        // Execute swap
        const executeButton = screen.getByRole('button', { name: /execute swap/i })
        await user.click(executeButton)

        // Verify swap initiation
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Swap order submitted successfully!')
        })

        // Verify Fusion order creation
        expect(screen.getByText(/order hash/i)).toBeInTheDocument()
    })

    it('should handle invalid Bitcoin address format', async () => {
        render(<BitcoinSwapInterface />)

        // Fill in swap details with invalid address
        const erc20AmountInput = screen.getByLabelText(/ERC20 Amount/i)
        await user.type(erc20AmountInput, '1000')

        const btcAmountInput = screen.getByLabelText(/BTC Amount/i)
        await user.type(btcAmountInput, '0.023')

        const btcAddressInput = screen.getByLabelText(/Bitcoin Address/i)
        await user.type(btcAddressInput, 'invalid-address')

        const secretInput = screen.getByLabelText(/Secret/i)
        await user.type(secretInput, '0x' + 'a'.repeat(64))

        // Execute swap
        const executeButton = screen.getByRole('button', { name: /execute swap/i })
        await user.click(executeButton)

        // Verify validation error
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('invalid address'))
        })
    })

    it('should handle missing required parameters', async () => {
        // Mock API to return error for missing parameters
        server.use(
            http.post('/api/swap/bitcoin-ethereum', () => {
                return new Response(JSON.stringify({ error: 'Missing required parameters' }), { status: 400 })
            })
        )

        render(<BitcoinSwapInterface />)

        // Execute swap without filling required fields
        const executeButton = screen.getByRole('button', { name: /execute swap/i })
        await user.click(executeButton)

        // Verify error handling
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Missing required parameters')
        })
    })

    it('should validate minimum swap amounts', async () => {
        render(<BitcoinSwapInterface />)

        // Fill in swap details with very small amounts
        const btcAmountInput = screen.getByLabelText(/BTC Amount/i)
        await user.type(btcAmountInput, '0.000001') // Very small amount

        const erc20AmountInput = screen.getByLabelText(/ERC20 Amount/i)
        await user.type(erc20AmountInput, '1') // Very small amount

        const erc20AddressInput = screen.getByLabelText(/ERC20 Address/i)
        await user.type(erc20AddressInput, '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')

        const secretInput = screen.getByLabelText(/Secret/i)
        await user.type(secretInput, '0x' + 'a'.repeat(64))

        // Execute swap
        const executeButton = screen.getByRole('button', { name: /execute swap/i })
        await user.click(executeButton)

        // Verify minimum amount validation
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('minimum amount'))
        })
    })
}) 