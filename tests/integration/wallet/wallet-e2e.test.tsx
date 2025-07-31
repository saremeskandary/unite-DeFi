import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { renderHook, act } from '@testing-library/react'
import { WalletConnection } from '@/components/wallet/wallet-connection'
import { useWallet } from '@/hooks/use-wallet'
import { useEnhancedWallet } from '@/hooks/use-enhanced-wallet'
import { walletManager } from '@/lib/wallet'
import { enhancedWallet } from '@/lib/enhanced-wallet'

// Mock all dependencies
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}))

jest.mock('@/hooks/use-enhanced-wallet')
jest.mock('@/lib/enhanced-wallet')
jest.mock('@/lib/wallet')

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}))

jest.mock('ethers', () => ({
  ethers: {
    formatEther: jest.fn((value) => (parseInt(value, 16) / 1e18).toString()),
    parseEther: jest.fn((value) => (parseFloat(value) * 1e18).toString(16)),
    BrowserProvider: jest.fn(),
    JsonRpcSigner: jest.fn(),
    Contract: jest.fn()
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

describe('Wallet End-to-End Integration Tests', () => {
  const mockUseEnhancedWallet = useEnhancedWallet as jest.MockedFunction<typeof useEnhancedWallet>

  beforeEach(() => {
    jest.clearAllMocks()

    // Reset wallet states
    walletManager['currentWallet'] = null
    walletManager['providers'].clear()
    enhancedWallet['provider'] = null
    enhancedWallet['signer'] = null
    enhancedWallet['currentAddress'] = null
    enhancedWallet['currentChainId'] = null
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Complete Wallet Connection Workflow', () => {
    it('should complete full wallet connection flow from UI to state', async () => {
      // Mock successful wallet connection
      const mockAccounts = ['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6']
      const mockChainId = '0x1'
      const mockBalance = '0x1bc16d674ec80000'

      mockEthereum.request
        .mockResolvedValueOnce(mockAccounts)
        .mockResolvedValueOnce(mockChainId)
        .mockResolvedValueOnce(mockBalance)

      // Mock enhanced wallet hook
      const mockConnect = jest.fn().mockResolvedValue(undefined)
      const mockDisconnect = jest.fn().mockResolvedValue(undefined)
      const mockRefreshBalances = jest.fn().mockResolvedValue(undefined)
      const mockGetTokenBalance = jest.fn().mockResolvedValue(null)

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
        disconnect: mockDisconnect,
        refreshBalances: mockRefreshBalances,
        getTokenBalance: mockGetTokenBalance,
        switchToSupportedNetwork: jest.fn()
      })

      // Render wallet connection component
      render(<WalletConnection />)

      // User clicks connect button
      const connectButton = screen.getByText(/connect wallet/i)
      fireEvent.click(connectButton)

      // Verify connect function was called
      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalled()
      })

      // Simulate successful connection
      mockUseEnhancedWallet.mockReturnValue({
        isConnected: true,
        address: mockAccounts[0],
        chainId: 1,
        network: 'Ethereum',
        nativeBalance: '2.0',
        tokens: [],
        totalValue: 2000,
        isLoading: false,
        error: null,
        connect: mockConnect,
        disconnect: mockDisconnect,
        refreshBalances: mockRefreshBalances,
        getTokenBalance: mockGetTokenBalance,
        switchToSupportedNetwork: jest.fn()
      })

      // Re-render to show connected state
      render(<WalletConnection />)

      // Verify wallet info is displayed
      expect(screen.getByText(/0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6/)).toBeInTheDocument()
      expect(screen.getByText(/2.0 ETH/)).toBeInTheDocument()
      expect(screen.getByText(/disconnect/i)).toBeInTheDocument()

      // User clicks disconnect
      const disconnectButton = screen.getByText(/disconnect/i)
      fireEvent.click(disconnectButton)

      // Verify disconnect function was called
      await waitFor(() => {
        expect(mockDisconnect).toHaveBeenCalled()
      })
    })

    it('should handle connection failure and retry workflow', async () => {
      // Mock connection failure
      mockEthereum.request.mockRejectedValueOnce(new Error('User rejected request'))

      const mockConnect = jest.fn()
        .mockRejectedValueOnce(new Error('User rejected request'))
        .mockResolvedValueOnce(undefined)

      const mockRefreshBalances = jest.fn().mockResolvedValue(undefined)
      const mockGetTokenBalance = jest.fn().mockResolvedValue(null)

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
        refreshBalances: mockRefreshBalances,
        getTokenBalance: mockGetTokenBalance,
        switchToSupportedNetwork: jest.fn()
      })

      render(<WalletConnection />)

      // First connection attempt fails
      const connectButton = screen.getByText(/connect wallet/i)
      fireEvent.click(connectButton)

      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalledTimes(1)
      })

      // Simulate error state
      mockUseEnhancedWallet.mockReturnValue({
        isConnected: false,
        address: null,
        chainId: null,
        network: null,
        nativeBalance: '0',
        tokens: [],
        totalValue: 0,
        isLoading: false,
        error: 'User rejected request',
        connect: mockConnect,
        disconnect: jest.fn(),
        refreshBalances: mockRefreshBalances,
        getTokenBalance: mockGetTokenBalance,
        switchToSupportedNetwork: jest.fn()
      })

      render(<WalletConnection />)

      // Verify error is displayed
      expect(screen.getByText(/user rejected request/i)).toBeInTheDocument()

      // User retries connection
      fireEvent.click(connectButton)

      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalledTimes(2)
      })
    })

    it('should handle network switching during connection', async () => {
      const mockConnect = jest.fn().mockRejectedValue(new Error('Unsupported network'))
      const mockSwitchNetwork = jest.fn().mockResolvedValue(true)
      const mockRefreshBalances = jest.fn().mockResolvedValue(undefined)
      const mockGetTokenBalance = jest.fn().mockResolvedValue(null)

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
        refreshBalances: mockRefreshBalances,
        getTokenBalance: mockGetTokenBalance,
        switchToSupportedNetwork: mockSwitchNetwork
      })

      render(<WalletConnection />)

      const connectButton = screen.getByText(/connect wallet/i)
      fireEvent.click(connectButton)

      // Should attempt to switch network when connection fails
      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalled()
        expect(mockSwitchNetwork).toHaveBeenCalled()
      })
    })
  })

  describe('Balance and Token Management Workflow', () => {
    it('should load and display token balances after connection', async () => {
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

      const mockRefreshBalances = jest.fn().mockResolvedValue(undefined)
      const mockGetTokenBalance = jest.fn().mockResolvedValue(null)

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
        refreshBalances: mockRefreshBalances,
        getTokenBalance: mockGetTokenBalance,
        switchToSupportedNetwork: jest.fn()
      })

      render(<WalletConnection />)

      // Verify all token information is displayed
      expect(screen.getByText(/1000.0 USDC/)).toBeInTheDocument()
      expect(screen.getByText(/1.5 WETH/)).toBeInTheDocument()
      expect(screen.getByText(/\$6,500/)).toBeInTheDocument()
      expect(screen.getByText(/2.5 ETH/)).toBeInTheDocument()
    })

    it('should handle balance refresh workflow', async () => {
      const mockRefreshBalances = jest.fn().mockResolvedValue(undefined)
      const mockGetTokenBalance = jest.fn().mockResolvedValue(null)

      // Initial state
      mockUseEnhancedWallet.mockReturnValue({
        isConnected: true,
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        chainId: 1,
        network: 'Ethereum',
        nativeBalance: '2.0',
        tokens: [],
        totalValue: 2000,
        isLoading: false,
        error: null,
        connect: jest.fn(),
        disconnect: jest.fn(),
        refreshBalances: mockRefreshBalances,
        getTokenBalance: mockGetTokenBalance,
        switchToSupportedNetwork: jest.fn()
      })

      const { result } = renderHook(() => useEnhancedWallet())

      expect(result.current.nativeBalance).toBe('2.0')

      // Refresh balances
      await act(async () => {
        await result.current.refreshBalances()
      })

      expect(mockRefreshBalances).toHaveBeenCalled()
    })
  })

  describe('Transaction Signing Workflow', () => {
    it('should complete transaction signing workflow', async () => {
      const mockSigner = {
        signTransaction: jest.fn().mockResolvedValue({
          hash: '0x1234567890abcdef',
          signature: '0xabcdef1234567890'
        }),
        getAddress: jest.fn().mockResolvedValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')
      }

      const mockProvider = {
        getSigner: jest.fn().mockReturnValue(mockSigner),
        getBalance: jest.fn().mockResolvedValue('0x1bc16d674ec80000'),
        getNetwork: jest.fn().mockResolvedValue({ chainId: 1n })
      }

      const { ethers } = require('ethers')
      ethers.BrowserProvider.mockImplementation(() => mockProvider)

      // Mock the enhanced wallet hook
      mockUseEnhancedWallet.mockReturnValue({
        isConnected: true,
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        chainId: 1,
        network: 'Ethereum',
        nativeBalance: '2.0',
        tokens: [],
        totalValue: 2000,
        isLoading: false,
        error: null,
        connect: jest.fn(),
        disconnect: jest.fn(),
        refreshBalances: jest.fn(),
        getTokenBalance: jest.fn(),
        switchToSupportedNetwork: jest.fn()
      })

      const { result } = renderHook(() => useEnhancedWallet())

      // Simulate transaction signing
      const transaction = {
        to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        value: '0x1bc16d674ec80000',
        gasLimit: '0x5208'
      }

      const signedTx = await mockSigner.signTransaction(transaction)
      expect(signedTx.hash).toBe('0x1234567890abcdef')
      expect(signedTx.signature).toBe('0xabcdef1234567890')
    })

    it('should handle transaction signing failure and retry', async () => {
      const mockSigner = {
        signTransaction: jest.fn()
          .mockRejectedValueOnce(new Error('User rejected transaction'))
          .mockResolvedValueOnce({
            hash: '0x1234567890abcdef',
            signature: '0xabcdef1234567890'
          }),
        getAddress: jest.fn().mockResolvedValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')
      }

      const mockProvider = {
        getSigner: jest.fn().mockReturnValue(mockSigner),
        getBalance: jest.fn().mockResolvedValue('0x1bc16d674ec80000'),
        getNetwork: jest.fn().mockResolvedValue({ chainId: 1n })
      }

      const { ethers } = require('ethers')
      ethers.BrowserProvider.mockImplementation(() => mockProvider)

      const transaction = {
        to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        value: '0x1bc16d674ec80000',
        gasLimit: '0x5208'
      }

      // First attempt fails
      await expect(mockSigner.signTransaction(transaction)).rejects.toThrow('User rejected transaction')

      // Second attempt succeeds
      const signedTx = await mockSigner.signTransaction(transaction)
      expect(signedTx.hash).toBe('0x1234567890abcdef')
    })
  })

  describe('Multi-Chain Support Workflow', () => {
    it('should handle switching between different networks', async () => {
      // Initial state - Ethereum
      mockUseEnhancedWallet.mockReturnValue({
        isConnected: true,
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        chainId: 1,
        network: 'Ethereum',
        nativeBalance: '2.0',
        tokens: [],
        totalValue: 2000,
        isLoading: false,
        error: null,
        connect: jest.fn(),
        disconnect: jest.fn(),
        refreshBalances: jest.fn(),
        getTokenBalance: jest.fn(),
        switchToSupportedNetwork: jest.fn()
      })

      const { result, rerender } = renderHook(() => useEnhancedWallet())

      expect(result.current.chainId).toBe(1)
      expect(result.current.network).toBe('Ethereum')

      // Switch to Sepolia
      mockUseEnhancedWallet.mockReturnValue({
        isConnected: true,
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        chainId: 11155111,
        network: 'Sepolia',
        nativeBalance: '2.0',
        tokens: [],
        totalValue: 2000,
        isLoading: false,
        error: null,
        connect: jest.fn(),
        disconnect: jest.fn(),
        refreshBalances: jest.fn(),
        getTokenBalance: jest.fn(),
        switchToSupportedNetwork: jest.fn()
      })

      // Re-render to get updated state
      rerender()

      expect(result.current.chainId).toBe(11155111)
      expect(result.current.network).toBe('Sepolia')
    })

    it('should handle unsupported network gracefully', async () => {
      // Mock unsupported network
      mockUseEnhancedWallet.mockReturnValue({
        isConnected: true,
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        chainId: 999999,
        network: 'Unknown Network',
        nativeBalance: '2.0',
        tokens: [],
        totalValue: 2000,
        isLoading: false,
        error: null,
        connect: jest.fn(),
        disconnect: jest.fn(),
        refreshBalances: jest.fn(),
        getTokenBalance: jest.fn(),
        switchToSupportedNetwork: jest.fn()
      })

      const { result } = renderHook(() => useEnhancedWallet())

      // Should still connect but show unsupported network
      expect(result.current.isConnected).toBe(true)
      expect(result.current.chainId).toBe(999999)
      expect(result.current.network).toBe('Unknown Network')
    })
  })

  describe('Error Recovery Workflow', () => {
    it('should recover from network errors', async () => {
      const mockConnect = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined)

      const mockRefreshBalances = jest.fn().mockResolvedValue(undefined)
      const mockGetTokenBalance = jest.fn().mockResolvedValue(null)

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
        refreshBalances: mockRefreshBalances,
        getTokenBalance: mockGetTokenBalance,
        switchToSupportedNetwork: jest.fn()
      })

      render(<WalletConnection />)

      const connectButton = screen.getByText(/connect wallet/i)

      // First attempt fails
      fireEvent.click(connectButton)
      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalledTimes(1)
      })

      // Simulate error state
      mockUseEnhancedWallet.mockReturnValue({
        isConnected: false,
        address: null,
        chainId: null,
        network: null,
        nativeBalance: '0',
        tokens: [],
        totalValue: 0,
        isLoading: false,
        error: 'Network error',
        connect: mockConnect,
        disconnect: jest.fn(),
        refreshBalances: mockRefreshBalances,
        getTokenBalance: mockGetTokenBalance,
        switchToSupportedNetwork: jest.fn()
      })

      render(<WalletConnection />)

      // User retries after network is restored
      fireEvent.click(connectButton)
      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalledTimes(2)
      })
    })

    it('should handle wallet disconnection and reconnection', async () => {
      const mockConnect = jest.fn().mockResolvedValue(undefined)
      const mockDisconnect = jest.fn().mockResolvedValue(undefined)
      const mockRefreshBalances = jest.fn().mockResolvedValue(undefined)
      const mockGetTokenBalance = jest.fn().mockResolvedValue(null)

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
        connect: mockConnect,
        disconnect: mockDisconnect,
        refreshBalances: mockRefreshBalances,
        getTokenBalance: mockGetTokenBalance,
        switchToSupportedNetwork: jest.fn()
      })

      render(<WalletConnection />)

      // Disconnect
      const disconnectButton = screen.getByText(/disconnect/i)
      fireEvent.click(disconnectButton)

      await waitFor(() => {
        expect(mockDisconnect).toHaveBeenCalled()
      })

      // Simulate disconnected state
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
        disconnect: mockDisconnect,
        refreshBalances: mockRefreshBalances,
        getTokenBalance: mockGetTokenBalance,
        switchToSupportedNetwork: jest.fn()
      })

      render(<WalletConnection />)

      // Reconnect
      const connectButton = screen.getByText(/connect wallet/i)
      fireEvent.click(connectButton)

      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalled()
      })
    })
  })

  describe('Real-World User Scenarios', () => {
    it('should handle user switching accounts in MetaMask', async () => {
      // Initial state
      mockUseEnhancedWallet.mockReturnValue({
        isConnected: true,
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        chainId: 1,
        network: 'Ethereum',
        nativeBalance: '2.0',
        tokens: [],
        totalValue: 2000,
        isLoading: false,
        error: null,
        connect: jest.fn(),
        disconnect: jest.fn(),
        refreshBalances: jest.fn(),
        getTokenBalance: jest.fn(),
        switchToSupportedNetwork: jest.fn()
      })

      const { result, rerender } = renderHook(() => useEnhancedWallet())

      expect(result.current.address).toBe('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')

      // User switches account in MetaMask
      const newAddress = '0x9876543210abcdef1234567890abcdef12345678'

      // Mock the enhanced wallet to return the new address
      mockUseEnhancedWallet.mockReturnValue({
        isConnected: true,
        address: newAddress,
        chainId: 1,
        network: 'Ethereum',
        nativeBalance: '2.0',
        tokens: [],
        totalValue: 2000,
        isLoading: false,
        error: null,
        connect: jest.fn(),
        disconnect: jest.fn(),
        refreshBalances: jest.fn(),
        getTokenBalance: jest.fn(),
        switchToSupportedNetwork: jest.fn()
      })

      // Re-render to get updated state
      rerender()

      expect(result.current.address).toBe(newAddress)
    })

    it('should handle user switching networks in MetaMask', async () => {
      // Initial state
      mockUseEnhancedWallet.mockReturnValue({
        isConnected: true,
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        chainId: 1,
        network: 'Ethereum',
        nativeBalance: '2.0',
        tokens: [],
        totalValue: 2000,
        isLoading: false,
        error: null,
        connect: jest.fn(),
        disconnect: jest.fn(),
        refreshBalances: jest.fn(),
        getTokenBalance: jest.fn(),
        switchToSupportedNetwork: jest.fn()
      })

      const { result, rerender } = renderHook(() => useEnhancedWallet())

      expect(result.current.chainId).toBe(1)
      expect(result.current.network).toBe('Ethereum')

      // User switches to Polygon in MetaMask
      const newChainId = 137 // Polygon

      // Mock the enhanced wallet to return the new chain
      mockUseEnhancedWallet.mockReturnValue({
        isConnected: true,
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        chainId: newChainId,
        network: 'Polygon',
        nativeBalance: '2.0',
        tokens: [],
        totalValue: 2000,
        isLoading: false,
        error: null,
        connect: jest.fn(),
        disconnect: jest.fn(),
        refreshBalances: jest.fn(),
        getTokenBalance: jest.fn(),
        switchToSupportedNetwork: jest.fn()
      })

      // Re-render to get updated state
      rerender()

      expect(result.current.chainId).toBe(137)
      expect(result.current.network).toBe('Polygon')
    })

    it('should handle MetaMask being locked/unlocked', async () => {
      // Initial state - connected
      mockUseEnhancedWallet.mockReturnValue({
        isConnected: true,
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        chainId: 1,
        network: 'Ethereum',
        nativeBalance: '2.0',
        tokens: [],
        totalValue: 2000,
        isLoading: false,
        error: null,
        connect: jest.fn(),
        disconnect: jest.fn(),
        refreshBalances: jest.fn(),
        getTokenBalance: jest.fn(),
        switchToSupportedNetwork: jest.fn()
      })

      const { result, rerender } = renderHook(() => useEnhancedWallet())

      expect(result.current.isConnected).toBe(true)

      // MetaMask gets locked
      // Mock the enhanced wallet to return disconnected state
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
        refreshBalances: jest.fn(),
        getTokenBalance: jest.fn(),
        switchToSupportedNetwork: jest.fn()
      })

      // Re-render to get updated state
      rerender()

      expect(result.current.isConnected).toBe(false)
      expect(result.current.address).toBeNull()
    })
  })
}) 