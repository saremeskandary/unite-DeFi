import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { OneInchStyleSwapInterface } from '@/components/swap/1inch-style-swap-interface'

// Mock dependencies
jest.mock('@/lib/enhanced-wallet', () => ({
    enhancedWallet: {
        isConnected: jest.fn().mockReturnValue(false),
        getCurrentAddress: jest.fn().mockReturnValue(null),
        connect: jest.fn().mockResolvedValue(),
        getWalletInfo: jest.fn().mockResolvedValue({
            address: '0x123...',
            chainId: 1,
            tokens: []
        }),
        onAccountChange: jest.fn(),
        onChainChange: jest.fn()
    }
}))

jest.mock('sonner', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn()
    }
}))

describe('Network Filtering', () => {
    it('filters tokens by network correctly', async () => {
        render(<OneInchStyleSwapInterface />)

        // Open token selector
        const fromTokenButton = screen.getByText('WETH').closest('button')
        fireEvent.click(fromTokenButton!)

        await waitFor(() => {
            expect(screen.getByText('Select You Pay')).toBeInTheDocument()
        })

        // Click on network filter button
        const networkButton = screen.getByText('All Networks')
        fireEvent.click(networkButton)

        // Should show network dropdown
        await waitFor(() => {
            expect(screen.getByText('Ethereum')).toBeInTheDocument()
            expect(screen.getByText('Bitcoin')).toBeInTheDocument()
            expect(screen.getByText('Polygon')).toBeInTheDocument()
        })

        // Select Bitcoin network
        const bitcoinOption = screen.getByText('Bitcoin')
        fireEvent.click(bitcoinOption)

        // Should filter to show only Bitcoin tokens
        await waitFor(() => {
            expect(screen.getByText('BTC')).toBeInTheDocument()
            expect(screen.queryByText('WETH')).not.toBeInTheDocument()
            expect(screen.queryByText('USDC')).not.toBeInTheDocument()
        })
    })

    it('shows all tokens when "All Networks" is selected', async () => {
        render(<OneInchStyleSwapInterface />)

        // Open token selector
        const fromTokenButton = screen.getByText('WETH').closest('button')
        fireEvent.click(fromTokenButton!)

        await waitFor(() => {
            expect(screen.getByText('Select You Pay')).toBeInTheDocument()
        })

        // Should show all tokens by default
        expect(screen.getByText('WETH')).toBeInTheDocument()
        expect(screen.getByText('USDC')).toBeInTheDocument()
        expect(screen.getByText('BTC')).toBeInTheDocument()
    })
}) 