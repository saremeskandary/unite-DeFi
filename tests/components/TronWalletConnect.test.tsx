import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { TronWalletConnect } from '@/components/tron/TronWalletConnect'
import { useTronWallet } from '@/hooks/use-tron-wallet'
import { toast } from 'sonner'

// Mock the hooks and dependencies
jest.mock('@/hooks/use-tron-wallet')
jest.mock('sonner')

const mockUseTronWallet = useTronWallet as jest.MockedFunction<typeof useTronWallet>
const mockToast = toast as jest.Mocked<typeof toast>

describe('TronWalletConnect', () => {
    const defaultMockReturn = {
        isConnected: false,
        address: null,
        network: null,
        nativeBalance: '0',
        tokens: [],
        totalValue: 0,
        isLoading: false,
        error: null,
        connect: jest.fn(),
        disconnect: jest.fn(),
        refreshBalances: jest.fn(),
        getTokenBalance: jest.fn(),
        switchNetwork: jest.fn()
    }

    beforeEach(() => {
        jest.clearAllMocks()
        mockUseTronWallet.mockReturnValue(defaultMockReturn)
    })

    it('renders connect button when not connected', () => {
        render(<TronWalletConnect />)

        expect(screen.getByText('Connect Tron')).toBeInTheDocument()
        expect(screen.getByRole('button')).toHaveClass('bg-gradient-to-r from-yellow-500 to-orange-500')
    })

    it('renders compact connect button when compact prop is true', () => {
        render(<TronWalletConnect compact />)

        expect(screen.getByText('Connect')).toBeInTheDocument()
    })

    it('shows loading state when connecting', () => {
        mockUseTronWallet.mockReturnValue({
            ...defaultMockReturn,
            isLoading: true
        })

        render(<TronWalletConnect />)

        expect(screen.getByText('Connecting...')).toBeInTheDocument()
        // The button should be disabled when loading
        const button = screen.getByRole('button')
        expect(button).toHaveClass('disabled:pointer-events-none')
    })

    it('opens dialog when connect button is clicked', () => {
        render(<TronWalletConnect />)

        fireEvent.click(screen.getByText('Connect Tron'))

        expect(screen.getByText('Connect Your Tron Wallet')).toBeInTheDocument()
        expect(screen.getByText('Connect your Tron wallet to start swapping tokens')).toBeInTheDocument()
    })

    it('calls connect function when TronLink button is clicked', async () => {
        const mockConnect = jest.fn()
        mockUseTronWallet.mockReturnValue({
            ...defaultMockReturn,
            connect: mockConnect
        })

        render(<TronWalletConnect />)

        fireEvent.click(screen.getByText('Connect Tron'))
        // Use getAllByText to handle multiple TronLink elements
        const tronLinkButtons = screen.getAllByText('TronLink')
        fireEvent.click(tronLinkButtons[0]) // Click the first one (the button)

        await waitFor(() => {
            expect(mockConnect).toHaveBeenCalled()
        })
    })

    it('shows error message when connection fails', () => {
        mockUseTronWallet.mockReturnValue({
            ...defaultMockReturn,
            error: 'Failed to connect to TronLink'
        })

        render(<TronWalletConnect />)

        fireEvent.click(screen.getByText('Connect Tron'))

        expect(screen.getByText('Failed to connect to TronLink')).toBeInTheDocument()
        expect(screen.getByText('Failed to connect to TronLink')).toHaveClass('text-red-400')
    })

    it('renders connected state with wallet info', () => {
        mockUseTronWallet.mockReturnValue({
            ...defaultMockReturn,
            isConnected: true,
            address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
            network: 'mainnet',
            nativeBalance: '1000000', // 1 TRX
            totalValue: 150.50
        })

        render(<TronWalletConnect />)

        expect(screen.getByText('1000000.0000 TRX')).toBeInTheDocument()
        expect(screen.getByText('$150.50')).toBeInTheDocument()
        expect(screen.getByText('TR7NHq...Lj6t')).toBeInTheDocument()
        expect(screen.getByText('MAINNET')).toBeInTheDocument()
        expect(screen.getByText('Disconnect')).toBeInTheDocument()
    })

    it('renders compact connected state', () => {
        mockUseTronWallet.mockReturnValue({
            ...defaultMockReturn,
            isConnected: true,
            address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
            nativeBalance: '1000000' // 1 TRX
        })

        render(<TronWalletConnect compact />)

        expect(screen.getByText('1000000.000 TRX')).toBeInTheDocument()
        // The address is split across multiple elements, so we check for parts
        expect(screen.getByText(/TR7N/)).toBeInTheDocument()
        expect(screen.getByText(/Lj6t/)).toBeInTheDocument()
        expect(screen.getByText('Disconnect')).toBeInTheDocument()
    })

    it('calls disconnect function when disconnect button is clicked', () => {
        const mockDisconnect = jest.fn()
        mockUseTronWallet.mockReturnValue({
            ...defaultMockReturn,
            isConnected: true,
            address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
            disconnect: mockDisconnect
        })

        render(<TronWalletConnect />)

        fireEvent.click(screen.getByText('Disconnect'))

        expect(mockDisconnect).toHaveBeenCalled()
    })

    it('copies address to clipboard when copy button is clicked', async () => {
        const mockClipboard = {
            writeText: jest.fn().mockResolvedValue(undefined)
        }
        Object.assign(navigator, { clipboard: mockClipboard })

        mockUseTronWallet.mockReturnValue({
            ...defaultMockReturn,
            isConnected: true,
            address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
        })

        render(<TronWalletConnect />)

        const copyButton = screen.getByTitle('Copy address')
        fireEvent.click(copyButton)

        await waitFor(() => {
            expect(mockClipboard.writeText).toHaveBeenCalledWith('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t')
            expect(mockToast.success).toHaveBeenCalledWith('Address copied to clipboard')
        })
    })

    it('opens explorer when explorer button is clicked', () => {
        const mockOpen = jest.fn()
        Object.defineProperty(window, 'open', {
            value: mockOpen,
            writable: true
        })

        mockUseTronWallet.mockReturnValue({
            ...defaultMockReturn,
            isConnected: true,
            address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
            network: 'mainnet'
        })

        render(<TronWalletConnect />)

        const explorerButton = screen.getByTitle('View on Tronscan')
        fireEvent.click(explorerButton)

        expect(mockOpen).toHaveBeenCalledWith(
            'https://tronscan.org/#/address/TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
            '_blank'
        )
    })

    it('shows network selection buttons', () => {
        render(<TronWalletConnect />)

        fireEvent.click(screen.getByText('Connect Tron'))

        expect(screen.getByText('Nile Testnet')).toBeInTheDocument()
        expect(screen.getByText('Shasta Testnet')).toBeInTheDocument()
        expect(screen.getByText('Mainnet')).toBeInTheDocument()
    })

    it('calls switchNetwork when network button is clicked', async () => {
        const mockSwitchNetwork = jest.fn().mockResolvedValue(true)
        mockUseTronWallet.mockReturnValue({
            ...defaultMockReturn,
            switchNetwork: mockSwitchNetwork
        })

        render(<TronWalletConnect />)

        fireEvent.click(screen.getByText('Connect Tron'))
        fireEvent.click(screen.getByText('Mainnet'))

        await waitFor(() => {
            expect(mockSwitchNetwork).toHaveBeenCalledWith('mainnet')
            expect(mockToast.success).toHaveBeenCalledWith('Switched to mainnet network')
        })
    })

    it('shows wallet installation links', () => {
        render(<TronWalletConnect />)

        fireEvent.click(screen.getByText('Connect Tron'))

        // Check for wallet installation links (these are in the list)
        expect(screen.getByText('Tron Wallet')).toBeInTheDocument()
        expect(screen.getByText('WalletConnect')).toBeInTheDocument()
        // TronLink appears multiple times, so we check it exists
        expect(screen.getAllByText('TronLink').length).toBeGreaterThan(0)
    })

    it('handles connection error with toast', async () => {
        const mockConnect = jest.fn().mockRejectedValue(new Error('Connection failed'))
        mockUseTronWallet.mockReturnValue({
            ...defaultMockReturn,
            connect: mockConnect
        })

        render(<TronWalletConnect />)

        fireEvent.click(screen.getByText('Connect Tron'))
        // Use getAllByText to handle multiple TronLink elements
        const tronLinkButtons = screen.getAllByText('TronLink')
        fireEvent.click(tronLinkButtons[0]) // Click the first one (the button)

        await waitFor(() => {
            expect(mockToast.error).toHaveBeenCalledWith('Connection failed')
        })
    })

    it('handles network switch error with toast', async () => {
        const mockSwitchNetwork = jest.fn().mockResolvedValue(false)
        mockUseTronWallet.mockReturnValue({
            ...defaultMockReturn,
            switchNetwork: mockSwitchNetwork
        })

        render(<TronWalletConnect />)

        fireEvent.click(screen.getByText('Connect Tron'))
        fireEvent.click(screen.getByText('Mainnet'))

        await waitFor(() => {
            expect(mockToast.error).toHaveBeenCalledWith('Failed to switch to mainnet network')
        })
    })
})
