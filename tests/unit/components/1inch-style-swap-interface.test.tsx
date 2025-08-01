import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { OneInchStyleSwapInterface } from '@/components/swap/1inch-style-swap-interface'
import { enhancedWallet } from '@/lib/enhanced-wallet'

// Mock dependencies
jest.mock('@/lib/enhanced-wallet')
jest.mock('sonner', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn()
    }
}))

const mockEnhancedWallet = enhancedWallet as jest.Mocked<typeof enhancedWallet>

describe('OneInchStyleSwapInterface', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        // Mock wallet methods
        mockEnhancedWallet.isConnected.mockReturnValue(false)
        mockEnhancedWallet.getCurrentAddress.mockReturnValue(null)
        mockEnhancedWallet.connect.mockResolvedValue()
        mockEnhancedWallet.getWalletInfo.mockResolvedValue({
            address: '0x123...',
            chainId: 1,
            tokens: [
                { symbol: 'WETH', name: 'Wrapped Ethereum', balance: '1.5', price: 2000, value: 3000 },
                { symbol: 'USDC', name: 'USD Coin', balance: '1000', price: 1, value: 1000 }
            ]
        })
        mockEnhancedWallet.onAccountChange.mockImplementation(() => { })
        mockEnhancedWallet.onChainChange.mockImplementation(() => { })
    })

    it('renders the swap interface with default state', () => {
        render(<OneInchStyleSwapInterface />)

        expect(screen.getByText('Swap')).toBeInTheDocument()
        expect(screen.getByText('You Pay')).toBeInTheDocument()
        expect(screen.getByText('You Receive')).toBeInTheDocument()
        expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
    })

    it('shows default tokens (WETH and USDC)', () => {
        render(<OneInchStyleSwapInterface />)

        expect(screen.getByText('WETH')).toBeInTheDocument()
        expect(screen.getByText('USDC')).toBeInTheDocument()
        expect(screen.getByText('Ethereum')).toBeInTheDocument()
    })

    it('opens token selector when clicking on token', async () => {
        render(<OneInchStyleSwapInterface />)

        // Click on the "You Pay" token
        const fromTokenButton = screen.getByText('WETH').closest('button')
        fireEvent.click(fromTokenButton!)

        await waitFor(() => {
            expect(screen.getByText('Select You Pay')).toBeInTheDocument()
        })
    })

    it('opens wallet selector when clicking connect wallet', async () => {
        render(<OneInchStyleSwapInterface />)

        const connectButton = screen.getByText('Connect Wallet')
        fireEvent.click(connectButton)

        await waitFor(() => {
            expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
            expect(screen.getByText('1inch Wallet')).toBeInTheDocument()
            expect(screen.getByText('WalletConnect')).toBeInTheDocument()
        })
    })

    it('connects wallet successfully', async () => {
        render(<OneInchStyleSwapInterface />)

        // Open wallet selector
        const connectButton = screen.getByText('Connect Wallet')
        fireEvent.click(connectButton)

        // Click on a wallet option
        await waitFor(() => {
            const walletOption = screen.getByText('Browser Wallet')
            fireEvent.click(walletOption)
        })

        await waitFor(() => {
            expect(mockEnhancedWallet.connect).toHaveBeenCalled()
        })
    })

    it('shows swap button when wallet is connected and amounts are entered', async () => {
        mockEnhancedWallet.isConnected.mockReturnValue(true)
        mockEnhancedWallet.getCurrentAddress.mockReturnValue('0x123...')

        render(<OneInchStyleSwapInterface />)

        // Enter amount
        const amountInput = screen.getByPlaceholderText('0.0')
        fireEvent.change(amountInput, { target: { value: '1.0' } })

        await waitFor(() => {
            expect(screen.getByText('Swap')).toBeInTheDocument()
        })
    })

    it('shows quote information when amount is entered', async () => {
        mockEnhancedWallet.isConnected.mockReturnValue(true)
        mockEnhancedWallet.getCurrentAddress.mockReturnValue('0x123...')

        render(<OneInchStyleSwapInterface />)

        // Enter amount
        const amountInput = screen.getByPlaceholderText('0.0')
        fireEvent.change(amountInput, { target: { value: '1.0' } })

        await waitFor(() => {
            expect(screen.getByText('Rate')).toBeInTheDocument()
            expect(screen.getByText('Price Impact')).toBeInTheDocument()
            expect(screen.getByText('Minimum received')).toBeInTheDocument()
            expect(screen.getByText('Network Fee')).toBeInTheDocument()
        })
    })

    it('shows high price impact warning when impact is high', async () => {
        mockEnhancedWallet.isConnected.mockReturnValue(true)
        mockEnhancedWallet.getCurrentAddress.mockReturnValue('0x123...')

        render(<OneInchStyleSwapInterface />)

        // Enter amount (this will trigger a high price impact in the mock)
        const amountInput = screen.getByPlaceholderText('0.0')
        fireEvent.change(amountInput, { target: { value: '1000.0' } })

        await waitFor(() => {
            expect(screen.getByText(/High price impact!/)).toBeInTheDocument()
        })
    })

    it('opens settings dialog when settings button is clicked', async () => {
        render(<OneInchStyleSwapInterface />)

        const settingsButton = screen.getByRole('button', { name: /settings/i })
        fireEvent.click(settingsButton)

        await waitFor(() => {
            expect(screen.getByText('Settings')).toBeInTheDocument()
            expect(screen.getByText('Slippage tolerance')).toBeInTheDocument()
        })
    })

    it('allows slippage adjustment', async () => {
        render(<OneInchStyleSwapInterface />)

        // Open settings
        const settingsButton = screen.getByRole('button', { name: /settings/i })
        fireEvent.click(settingsButton)

        await waitFor(() => {
            const autoButton = screen.getByText('Auto')
            const onePercentButton = screen.getByText('1%')

            fireEvent.click(onePercentButton)
            expect(onePercentButton).toHaveClass('bg-primary')
        })
    })

    it('swaps tokens when swap button is clicked', async () => {
        mockEnhancedWallet.isConnected.mockReturnValue(true)
        mockEnhancedWallet.getCurrentAddress.mockReturnValue('0x123...')

        const onOrderCreated = jest.fn()
        render(<OneInchStyleSwapInterface onOrderCreated={onOrderCreated} />)

        // Enter amount
        const amountInput = screen.getByPlaceholderText('0.0')
        fireEvent.change(amountInput, { target: { value: '1.0' } })

        // Click swap
        await waitFor(() => {
            const swapButton = screen.getByText('Swap')
            fireEvent.click(swapButton)
        })

        await waitFor(() => {
            expect(onOrderCreated).toHaveBeenCalled()
        })
    })

    it('shows Bitcoin flow when Bitcoin is selected', async () => {
        mockEnhancedWallet.isConnected.mockReturnValue(true)
        mockEnhancedWallet.getCurrentAddress.mockReturnValue('0x123...')

        render(<OneInchStyleSwapInterface />)

        // Change to Bitcoin token
        const toTokenButton = screen.getByText('USDC').closest('button')
        fireEvent.click(toTokenButton!)

        await waitFor(() => {
            const bitcoinOption = screen.getByText('BTC')
            fireEvent.click(bitcoinOption)
        })

        // Enter amount and try to swap
        const amountInput = screen.getByPlaceholderText('0.0')
        fireEvent.change(amountInput, { target: { value: '1.0' } })

        await waitFor(() => {
            const swapButton = screen.getByText('Swap')
            fireEvent.click(swapButton)
        })

        // Should trigger Bitcoin flow
        await waitFor(() => {
            // The Bitcoin flow UI should be rendered
            expect(screen.getByText('Bitcoin Swap Flow')).toBeInTheDocument()
        })
    })

    it('filters tokens by search', async () => {
        render(<OneInchStyleSwapInterface />)

        // Open token selector
        const fromTokenButton = screen.getByText('WETH').closest('button')
        fireEvent.click(fromTokenButton!)

        await waitFor(() => {
            const searchInput = screen.getByPlaceholderText('Search tokens...')
            fireEvent.change(searchInput, { target: { value: 'USDC' } })

            expect(screen.getByText('USDC')).toBeInTheDocument()
            expect(screen.queryByText('WETH')).not.toBeInTheDocument()
        })
    })

    it('filters tokens by network', async () => {
        render(<OneInchStyleSwapInterface />)

        // Open token selector
        const fromTokenButton = screen.getByText('WETH').closest('button')
        fireEvent.click(fromTokenButton!)

        await waitFor(() => {
            const networkButton = screen.getByText('All Networks')
            fireEvent.click(networkButton)

            // Should show network options
            expect(screen.getByText('Ethereum')).toBeInTheDocument()
        })
    })

    it('shows network badges for multi-chain tokens', async () => {
        render(<OneInchStyleSwapInterface />)

        // Open token selector
        const fromTokenButton = screen.getByText('WETH').closest('button')
        fireEvent.click(fromTokenButton!)

        await waitFor(() => {
            // USDC should show network count badge
            const usdcToken = screen.getByText('USDC').closest('button')
            expect(usdcToken).toHaveTextContent('8') // USDC supports 8 networks
        })
    })

    it('handles max amount button', async () => {
        mockEnhancedWallet.isConnected.mockReturnValue(true)
        mockEnhancedWallet.getCurrentAddress.mockReturnValue('0x123...')

        render(<OneInchStyleSwapInterface />)

        const maxButton = screen.getByText('Max')
        fireEvent.click(maxButton)

        // Should populate the amount field with max balance
        await waitFor(() => {
            const amountInput = screen.getByPlaceholderText('0.0') as HTMLInputElement
            expect(amountInput.value).toBe('1.485') // 1.5 * 0.99 (reserving for gas)
        })
    })

    it('swaps token positions when swap button is clicked', async () => {
        render(<OneInchStyleSwapInterface />)

        const swapButton = screen.getByRole('button', { name: /swap tokens/i })
        fireEvent.click(swapButton)

        // Should swap WETH and USDC positions
        await waitFor(() => {
            const fromToken = screen.getByText('USDC')
            const toToken = screen.getByText('WETH')
            expect(fromToken).toBeInTheDocument()
            expect(toToken).toBeInTheDocument()
        })
    })

    it('shows loading state during quote fetching', async () => {
        mockEnhancedWallet.isConnected.mockReturnValue(true)
        mockEnhancedWallet.getCurrentAddress.mockReturnValue('0x123...')

        render(<OneInchStyleSwapInterface />)

        // Enter amount
        const amountInput = screen.getByPlaceholderText('0.0')
        fireEvent.change(amountInput, { target: { value: '1.0' } })

        // Should show loading state briefly
        await waitFor(() => {
            expect(screen.getByText('Swap')).toBeInTheDocument()
        })
    })

    it('disables swap button when no amount is entered', () => {
        mockEnhancedWallet.isConnected.mockReturnValue(true)
        mockEnhancedWallet.getCurrentAddress.mockReturnValue('0x123...')

        render(<OneInchStyleSwapInterface />)

        const swapButton = screen.getByText('Enter an amount')
        expect(swapButton).toBeDisabled()
    })

    it('shows permit approval info for high price impact', async () => {
        mockEnhancedWallet.isConnected.mockReturnValue(true)
        mockEnhancedWallet.getCurrentAddress.mockReturnValue('0x123...')

        render(<OneInchStyleSwapInterface />)

        // Enter large amount to trigger high price impact
        const amountInput = screen.getByPlaceholderText('0.0')
        fireEvent.change(amountInput, { target: { value: '1000.0' } })

        await waitFor(() => {
            expect(screen.getByText(/1inch Network uses signed permit approvals/)).toBeInTheDocument()
        })
    })
}) 