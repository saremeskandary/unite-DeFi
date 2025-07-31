import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WalletConnection } from '@/components/wallet/wallet-connection'
import { useEnhancedWallet } from '@/hooks/use-enhanced-wallet'

// Mock the enhanced wallet hook
jest.mock('@/hooks/use-enhanced-wallet')
jest.mock('@/lib/enhanced-wallet')

// Mock sonner toast
jest.mock('sonner', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn()
    }
}))

// Mock ethers
jest.mock('ethers', () => ({
    ethers: {
        formatEther: jest.fn((value) => (parseInt(value, 16) / 1e18).toString()),
        parseEther: jest.fn((value) => (parseFloat(value) * 1e18).toString(16)),
        BrowserProvider: jest.fn(),
        JsonRpcSigner: jest.fn()
    }
}))

// Mock window.ethereum
const mockEthereum = {
    isMetaMask: true,
    isCoinbaseWallet: false,
    request: jest.fn(),
    on: jest.fn(),
    removeListener: jest.fn()
}

Object.defineProperty(window, 'ethereum', {
    value: mockEthereum,
    writable: true
})

// Mock clipboard API
Object.assign(navigator, {
    clipboard: {
        writeText: jest.fn()
    }
})

describe('Wallet Component Integration Tests', () => {
    const mockUseEnhancedWallet = useEnhancedWallet as jest.MockedFunction<typeof useEnhancedWallet>

    beforeEach(() => {
        jest.clearAllMocks()

        // Default mock implementation
        mockUseEnhancedWallet.mockReturnValue({
            isConnected: false,
            address: null,
            chainId: null,
            network: null,
            nativeBalance: '0',
            tokens: [],
            totalValue: 0,
            isLoading: false,
            error: null,
            connect: jest.fn(),
            disconnect: jest.fn(),
            switchToSupportedNetwork: jest.fn()
        })
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('Wallet Connection Component', () => {
        it('should render connect button when not connected', () => {
            render(<WalletConnection />)

            expect(screen.getByText(/connect wallet/i)).toBeInTheDocument()
            expect(screen.queryByText(/disconnect/i)).not.toBeInTheDocument()
        })

        it('should render wallet info when connected', () => {
            mockUseEnhancedWallet.mockReturnValue({
                isConnected: true,
                address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
                chainId: 1,
                network: 'Ethereum',
                nativeBalance: '2.5',
                tokens: [],
                totalValue: 2500,
                isLoading: false,
                error: null,
                connect: jest.fn(),
                disconnect: jest.fn(),
                switchToSupportedNetwork: jest.fn()
            })

            render(<WalletConnection />)

            expect(screen.getByText(/0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6/)).toBeInTheDocument()
            expect(screen.getByText(/2.5 ETH/)).toBeInTheDocument()
            expect(screen.getByText(/disconnect/i)).toBeInTheDocument()
        })

        it('should handle connect button click', async () => {
            const mockConnect = jest.fn()
            mockUseEnhancedWallet.mockReturnValue({
                isConnected: false,
                address: null,
                chainId: null,
                network: null,
                nativeBalance: '0',
                tokens: [],
                totalValue: 0,
                isLoading: false,
                error: null,
                connect: mockConnect,
                disconnect: jest.fn(),
                switchToSupportedNetwork: jest.fn()
            })

            render(<WalletConnection />)

            const connectButton = screen.getByText(/connect wallet/i)
            fireEvent.click(connectButton)

            await waitFor(() => {
                expect(mockConnect).toHaveBeenCalled()
            })
        })

        it('should handle disconnect button click', async () => {
            const mockDisconnect = jest.fn()
            mockUseEnhancedWallet.mockReturnValue({
                isConnected: true,
                address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
                chainId: 1,
                network: 'Ethereum',
                nativeBalance: '2.5',
                tokens: [],
                totalValue: 2500,
                isLoading: false,
                error: null,
                connect: jest.fn(),
                disconnect: mockDisconnect,
                switchToSupportedNetwork: jest.fn()
            })

            render(<WalletConnection />)

            const disconnectButton = screen.getByText(/disconnect/i)
            fireEvent.click(disconnectButton)

            await waitFor(() => {
                expect(mockDisconnect).toHaveBeenCalled()
            })
        })

        it('should show loading state during connection', () => {
            mockUseEnhancedWallet.mockReturnValue({
                isConnected: false,
                address: null,
                chainId: null,
                network: null,
                nativeBalance: '0',
                tokens: [],
                totalValue: 0,
                isLoading: true,
                error: null,
                connect: jest.fn(),
                disconnect: jest.fn(),
                switchToSupportedNetwork: jest.fn()
            })

            render(<WalletConnection />)

            expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
            expect(screen.getByText(/connecting/i)).toBeInTheDocument()
        })

        it('should display error message when connection fails', () => {
            mockUseEnhancedWallet.mockReturnValue({
                isConnected: false,
                address: null,
                chainId: null,
                network: null,
                nativeBalance: '0',
                tokens: [],
                totalValue: 0,
                isLoading: false,
                error: 'Failed to connect to wallet',
                connect: jest.fn(),
                disconnect: jest.fn(),
                switchToSupportedNetwork: jest.fn()
            })

            render(<WalletConnection />)

            expect(screen.getByText(/failed to connect to wallet/i)).toBeInTheDocument()
        })

        it('should copy address to clipboard', async () => {
            const mockWriteText = jest.fn().mockResolvedValue(undefined)
            Object.assign(navigator, {
                clipboard: {
                    writeText: mockWriteText
                }
            })

            mockUseEnhancedWallet.mockReturnValue({
                isConnected: true,
                address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
                chainId: 1,
                network: 'Ethereum',
                nativeBalance: '2.5',
                tokens: [],
                totalValue: 2500,
                isLoading: false,
                error: null,
                connect: jest.fn(),
                disconnect: jest.fn(),
                switchToSupportedNetwork: jest.fn()
            })

            render(<WalletConnection />)

            const copyButton = screen.getByLabelText(/copy address/i)
            fireEvent.click(copyButton)

            await waitFor(() => {
                expect(mockWriteText).toHaveBeenCalledWith('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')
            })
        })

        it('should open explorer when explorer button is clicked', () => {
            const mockOpen = jest.fn()
            Object.defineProperty(window, 'open', {
                value: mockOpen,
                writable: true
            })

            mockUseEnhancedWallet.mockReturnValue({
                isConnected: true,
                address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
                chainId: 1,
                network: 'Ethereum',
                nativeBalance: '2.5',
                tokens: [],
                totalValue: 2500,
                isLoading: false,
                error: null,
                connect: jest.fn(),
                disconnect: jest.fn(),
                switchToSupportedNetwork: jest.fn()
            })

            render(<WalletConnection />)

            const explorerButton = screen.getByLabelText(/open explorer/i)
            fireEvent.click(explorerButton)

            expect(mockOpen).toHaveBeenCalledWith(
                'https://etherscan.io/address/0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
                '_blank'
            )
        })

        it('should display token balances when available', () => {
            const mockTokens = [
                {
                    symbol: 'USDC',
                    name: 'USD Coin',
                    balance: '1000.0',
                    balanceRaw: '1000000000',
                    decimals: 6,
                    contractAddress: '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8C',
                    price: 1.0,
                    value: 1000,
                    change24h: 0.1,
                    network: 'Ethereum'
                },
                {
                    symbol: 'WETH',
                    name: 'Wrapped Ethereum',
                    balance: '1.5',
                    balanceRaw: '1500000000000000000',
                    decimals: 18,
                    contractAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                    price: 2000,
                    value: 3000,
                    change24h: -2.5,
                    network: 'Ethereum'
                }
            ]

            mockUseEnhancedWallet.mockReturnValue({
                isConnected: true,
                address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
                chainId: 1,
                network: 'Ethereum',
                nativeBalance: '2.5',
                tokens: mockTokens,
                totalValue: 6500,
                isLoading: false,
                error: null,
                connect: jest.fn(),
                disconnect: jest.fn(),
                switchToSupportedNetwork: jest.fn()
            })

            render(<WalletConnection />)

            expect(screen.getByText(/1000.0 USDC/)).toBeInTheDocument()
            expect(screen.getByText(/1.5 WETH/)).toBeInTheDocument()
            expect(screen.getByText(/\$6,500/)).toBeInTheDocument()
        })

        it('should handle network switching', async () => {
            const mockSwitchNetwork = jest.fn().mockResolvedValue(true)
            mockUseEnhancedWallet.mockReturnValue({
                isConnected: false,
                address: null,
                chainId: null,
                network: null,
                nativeBalance: '0',
                tokens: [],
                totalValue: 0,
                isLoading: false,
                error: 'Unsupported network',
                connect: jest.fn(),
                disconnect: jest.fn(),
                switchToSupportedNetwork: mockSwitchNetwork
            })

            render(<WalletConnection />)

            const connectButton = screen.getByText(/connect wallet/i)
            fireEvent.click(connectButton)

            await waitFor(() => {
                expect(mockSwitchNetwork).toHaveBeenCalled()
            })
        })

        it('should show truncated address', () => {
            mockUseEnhancedWallet.mockReturnValue({
                isConnected: true,
                address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
                chainId: 1,
                network: 'Ethereum',
                nativeBalance: '2.5',
                tokens: [],
                totalValue: 2500,
                isLoading: false,
                error: null,
                connect: jest.fn(),
                disconnect: jest.fn(),
                switchToSupportedNetwork: jest.fn()
            })

            render(<WalletConnection />)

            // Should show truncated address
            expect(screen.getByText(/0x742d\.\.\.4d8b6/)).toBeInTheDocument()
        })

        it('should display network information', () => {
            mockUseEnhancedWallet.mockReturnValue({
                isConnected: true,
                address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
                chainId: 11155111, // Sepolia
                network: 'Sepolia',
                nativeBalance: '2.5',
                tokens: [],
                totalValue: 2500,
                isLoading: false,
                error: null,
                connect: jest.fn(),
                disconnect: jest.fn(),
                switchToSupportedNetwork: jest.fn()
            })

            render(<WalletConnection />)

            expect(screen.getByText(/Sepolia/)).toBeInTheDocument()
        })

        it('should handle clipboard write failure', async () => {
            const mockWriteText = jest.fn().mockRejectedValue(new Error('Clipboard write failed'))
            Object.assign(navigator, {
                clipboard: {
                    writeText: mockWriteText
                }
            })

            mockUseEnhancedWallet.mockReturnValue({
                isConnected: true,
                address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
                chainId: 1,
                network: 'Ethereum',
                nativeBalance: '2.5',
                tokens: [],
                totalValue: 2500,
                isLoading: false,
                error: null,
                connect: jest.fn(),
                disconnect: jest.fn(),
                switchToSupportedNetwork: jest.fn()
            })

            render(<WalletConnection />)

            const copyButton = screen.getByLabelText(/copy address/i)
            fireEvent.click(copyButton)

            await waitFor(() => {
                expect(mockWriteText).toHaveBeenCalled()
            })
        })

        it('should handle connection with unsupported network error', async () => {
            const mockConnect = jest.fn().mockRejectedValue(new Error('Unsupported network'))
            const mockSwitchNetwork = jest.fn().mockResolvedValue(true)

            mockUseEnhancedWallet.mockReturnValue({
                isConnected: false,
                address: null,
                chainId: null,
                network: null,
                nativeBalance: '0',
                tokens: [],
                totalValue: 0,
                isLoading: false,
                error: null,
                connect: mockConnect,
                disconnect: jest.fn(),
                switchToSupportedNetwork: mockSwitchNetwork
            })

            render(<WalletConnection />)

            const connectButton = screen.getByText(/connect wallet/i)
            fireEvent.click(connectButton)

            await waitFor(() => {
                expect(mockConnect).toHaveBeenCalled()
            })
        })
    })
}) 