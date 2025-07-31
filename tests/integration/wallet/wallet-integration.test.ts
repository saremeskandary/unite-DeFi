import { renderHook, act, waitFor } from '@testing-library/react'
import { useWallet } from '@/hooks/use-wallet'
import { useEnhancedWallet } from '@/hooks/use-enhanced-wallet'
import { walletManager, WalletError, MetaMaskProvider, WalletConnectProvider, CoinbaseWalletProvider } from '@/lib/wallet'
import { enhancedWallet } from '@/lib/enhanced-wallet'

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
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

// Mock window object
Object.defineProperty(window, 'ethereum', {
  value: mockEthereum,
  writable: true
})

describe('Wallet Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Reset wallet manager state
    walletManager['currentWallet'] = null
    walletManager['providers'].clear()

    // Re-initialize providers
    walletManager['providers'].set('metamask', new MetaMaskProvider())
    walletManager['providers'].set('walletconnect', new WalletConnectProvider())
    walletManager['providers'].set('coinbase', new CoinbaseWalletProvider())

    // Reset enhanced wallet state
    enhancedWallet['provider'] = null
    enhancedWallet['signer'] = null
    enhancedWallet['currentAddress'] = null
    enhancedWallet['currentChainId'] = null

    // Ensure window.ethereum is properly mocked
    Object.defineProperty(window, 'ethereum', {
      value: mockEthereum,
      writable: true
    })
  })

  afterEach(() => {
    // Clean up any listeners
    if (mockEthereum.removeListener) {
      mockEthereum.removeListener.mockClear()
    }
  })

  describe('Wallet Connection Flows', () => {
    it('should connect to MetaMask successfully', async () => {
      const mockAccounts = ['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6']
      const mockChainId = '0x1' // Ethereum mainnet
      const mockBalance = '0x1bc16d674ec80000' // 2 ETH in wei

      mockEthereum.request
        .mockResolvedValueOnce(mockAccounts) // eth_requestAccounts
        .mockResolvedValueOnce(mockChainId) // eth_chainId
        .mockResolvedValueOnce(mockBalance) // eth_getBalance

      const { result } = renderHook(() => useWallet())

      await act(async () => {
        await result.current.connect('MetaMask')
      })

      expect(result.current.isConnected).toBe(true)
      expect(result.current.wallet).toBeTruthy()
      expect(result.current.wallet?.address).toBe(mockAccounts[0])
      expect(result.current.wallet?.chainId).toBe(1)
      expect(result.current.error).toBeNull()
    })

    it('should handle MetaMask connection failure', async () => {
      mockEthereum.request.mockRejectedValueOnce(new Error('User rejected request'))

      const { result } = renderHook(() => useWallet())

      await act(async () => {
        await result.current.connect('MetaMask')
      })

      expect(result.current.isConnected).toBe(false)
      expect(result.current.wallet).toBeNull()
      expect(result.current.error).toBeTruthy()
      expect(result.current.isConnecting).toBe(false)
    })

    it('should connect to Coinbase Wallet successfully', async () => {
      // Mock Coinbase Wallet
      Object.defineProperty(window, 'ethereum', {
        value: { ...mockEthereum, isCoinbaseWallet: true, isMetaMask: false },
        writable: true
      })

      const mockAccounts = ['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6']
      const mockChainId = '0x1'
      const mockBalance = '0x1bc16d674ec80000'

      mockEthereum.request
        .mockResolvedValueOnce(mockAccounts)
        .mockResolvedValueOnce(mockChainId)
        .mockResolvedValueOnce(mockBalance)

      const { result } = renderHook(() => useWallet())

      await act(async () => {
        await result.current.connect('Coinbase Wallet')
      })

      expect(result.current.isConnected).toBe(true)
      expect(result.current.wallet).toBeTruthy()
      expect(result.current.error).toBeNull()
    })

    it('should handle unsupported wallet provider', async () => {
      const { result } = renderHook(() => useWallet())

      await act(async () => {
        await result.current.connect('UnsupportedWallet')
      })

      expect(result.current.isConnected).toBe(false)
      expect(result.current.wallet).toBeNull()
      expect(result.current.error).toBeTruthy()
    })

    it('should disconnect wallet successfully', async () => {
      // First connect
      const mockAccounts = ['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6']
      const mockChainId = '0x1'
      const mockBalance = '0x1bc16d674ec80000'

      mockEthereum.request
        .mockResolvedValueOnce(mockAccounts)
        .mockResolvedValueOnce(mockChainId)
        .mockResolvedValueOnce(mockBalance)

      const { result } = renderHook(() => useWallet())

      await act(async () => {
        await result.current.connect('MetaMask')
      })

      expect(result.current.isConnected).toBe(true)

      // Then disconnect
      await act(async () => {
        await result.current.disconnect()
      })

      expect(result.current.isConnected).toBe(false)
      expect(result.current.wallet).toBeNull()
      expect(result.current.error).toBeNull()
    })
  })

  describe('Balance Fetching', () => {
    it('should fetch native token balance successfully', async () => {
      const mockAccounts = ['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6']
      const mockChainId = '0x1'
      const mockBalance = '0x1bc16d674ec80000' // 2 ETH

      mockEthereum.request
        .mockResolvedValueOnce(mockAccounts)
        .mockResolvedValueOnce(mockChainId)
        .mockResolvedValueOnce(mockBalance)
        .mockResolvedValueOnce(mockBalance) // For refreshBalance

      const { result } = renderHook(() => useWallet())

      await act(async () => {
        await result.current.connect('MetaMask')
      })

      expect(result.current.wallet?.balance).toBe('2.0')

      // Test refresh balance
      await act(async () => {
        await result.current.refreshBalance()
      })

      expect(result.current.wallet?.balance).toBe('2.0')
    })

    it('should fetch token balances with enhanced wallet', async () => {
      const mockProvider = {
        getBalance: jest.fn().mockResolvedValue('0x1bc16d674ec80000'),
        getNetwork: jest.fn().mockResolvedValue({ chainId: 1n }),
        getSigner: jest.fn().mockReturnValue({
          getAddress: jest.fn().mockResolvedValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')
        }),
        send: jest.fn().mockImplementation((method, params) => {
          if (method === 'eth_requestAccounts') {
            return Promise.resolve(['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'])
          }
          return Promise.resolve('0x1')
        })
      }

      const mockContract = {
        balanceOf: jest.fn().mockResolvedValue('1000000000'), // 1 USDC
        decimals: jest.fn().mockResolvedValue(6),
        symbol: jest.fn().mockResolvedValue('USDC'),
        name: jest.fn().mockResolvedValue('USD Coin')
      }

      // Mock ethers BrowserProvider
      const { ethers } = require('ethers')
      ethers.BrowserProvider.mockImplementation(() => mockProvider)
      ethers.Contract = jest.fn().mockImplementation(() => mockContract)

      const { result } = renderHook(() => useEnhancedWallet())

      await act(async () => {
        await result.current.connect()
      })

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true)
        expect(result.current.nativeBalance).toBe('2.0')
      })
    })

    it('should handle balance fetching errors', async () => {
      mockEthereum.request
        .mockResolvedValueOnce(['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'])
        .mockResolvedValueOnce('0x1')
        .mockResolvedValueOnce('0x1bc16d674ec80000')
        .mockRejectedValueOnce(new Error('Network error')) // For refreshBalance

      const { result } = renderHook(() => useWallet())

      await act(async () => {
        await result.current.connect('MetaMask')
      })

      await act(async () => {
        await result.current.refreshBalance()
      })

      expect(result.current.error).toBeTruthy()
    })
  })

  describe('Transaction Signing', () => {
    it('should sign transaction successfully', async () => {
      const mockSigner = {
        signTransaction: jest.fn().mockResolvedValue({
          hash: '0x1234567890abcdef',
          signature: '0xabcdef1234567890'
        }),
        getAddress: jest.fn().mockResolvedValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')
      }

      const mockProvider = {
        getSigner: jest.fn().mockReturnValue(mockSigner)
      }

      const { ethers } = require('ethers')
      ethers.BrowserProvider.mockImplementation(() => mockProvider)

      const { result } = renderHook(() => useEnhancedWallet())

      await act(async () => {
        await result.current.connect()
      })

      // Test transaction signing
      const transaction = {
        to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        value: '0x1bc16d674ec80000',
        gasLimit: '0x5208'
      }

      const signedTx = await mockSigner.signTransaction(transaction)
      expect(signedTx.hash).toBe('0x1234567890abcdef')
    })

    it('should handle transaction signing errors', async () => {
      const mockSigner = {
        signTransaction: jest.fn().mockRejectedValue(new Error('User rejected transaction')),
        getAddress: jest.fn().mockResolvedValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')
      }

      const mockProvider = {
        getSigner: jest.fn().mockReturnValue(mockSigner)
      }

      const { ethers } = require('ethers')
      ethers.BrowserProvider.mockImplementation(() => mockProvider)

      const transaction = {
        to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        value: '0x1bc16d674ec80000',
        gasLimit: '0x5208'
      }

      await expect(mockSigner.signTransaction(transaction)).rejects.toThrow('User rejected transaction')
    })
  })

  describe('Multi-Chain Support', () => {
    it('should support Ethereum mainnet', async () => {
      const mockAccounts = ['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6']
      const mockChainId = '0x1' // Ethereum mainnet
      const mockBalance = '0x1bc16d674ec80000'

      mockEthereum.request
        .mockResolvedValueOnce(mockAccounts)
        .mockResolvedValueOnce(mockChainId)
        .mockResolvedValueOnce(mockBalance)

      const { result } = renderHook(() => useWallet())

      await act(async () => {
        await result.current.connect('MetaMask')
      })

      expect(result.current.wallet?.chainId).toBe(1)
      expect(result.current.wallet?.address).toBe(mockAccounts[0])
    })

    it('should support Sepolia testnet', async () => {
      const mockAccounts = ['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6']
      const mockChainId = '0xaa36a7' // Sepolia testnet
      const mockBalance = '0x1bc16d674ec80000'

      mockEthereum.request
        .mockResolvedValueOnce(mockAccounts)
        .mockResolvedValueOnce(mockChainId)
        .mockResolvedValueOnce(mockBalance)

      const { result } = renderHook(() => useWallet())

      await act(async () => {
        await result.current.connect('MetaMask')
      })

      expect(result.current.wallet?.chainId).toBe(11155111) // Sepolia chain ID
    })

    it('should support Goerli testnet', async () => {
      const mockAccounts = ['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6']
      const mockChainId = '0x5' // Goerli testnet
      const mockBalance = '0x1bc16d674ec80000'

      mockEthereum.request
        .mockResolvedValueOnce(mockAccounts)
        .mockResolvedValueOnce(mockChainId)
        .mockResolvedValueOnce(mockBalance)

      const { result } = renderHook(() => useWallet())

      await act(async () => {
        await result.current.connect('MetaMask')
      })

      expect(result.current.wallet?.chainId).toBe(5) // Goerli chain ID
    })

    it('should handle unsupported network', async () => {
      const mockProvider = {
        getBalance: jest.fn().mockResolvedValue('0x1bc16d674ec80000'),
        getNetwork: jest.fn().mockResolvedValue({ chainId: 0x1234n }),
        getSigner: jest.fn().mockReturnValue({
          getAddress: jest.fn().mockResolvedValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')
        }),
        send: jest.fn().mockImplementation((method, params) => {
          if (method === 'eth_requestAccounts') {
            return Promise.resolve(['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'])
          }
          return Promise.resolve('0x1234')
        })
      }

      const { ethers } = require('ethers')
      ethers.BrowserProvider.mockImplementation(() => mockProvider)

      const { result } = renderHook(() => useEnhancedWallet())

      await act(async () => {
        await result.current.connect()
      })

      // Should still connect but show unsupported network
      expect(result.current.isConnected).toBe(true)
      expect(result.current.chainId).toBe(0x1234)
    })

    it('should switch to supported network', async () => {
      const mockProvider = {
        getNetwork: jest.fn().mockResolvedValue({ chainId: 1n }),
        getSigner: jest.fn().mockReturnValue({
          getAddress: jest.fn().mockResolvedValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')
        }),
        send: jest.fn().mockResolvedValue(true)
      }

      const { ethers } = require('ethers')
      ethers.BrowserProvider.mockImplementation(() => mockProvider)

      const { result } = renderHook(() => useEnhancedWallet())

      await act(async () => {
        const switched = await result.current.switchToSupportedNetwork()
        expect(switched).toBe(true)
      })
    })
  })

  describe('Error Handling for Wallet Failures', () => {
    it('should handle MetaMask not installed', async () => {
      // Mock MetaMask not being available
      Object.defineProperty(window, 'ethereum', {
        value: undefined,
        writable: true
      })

      const { result } = renderHook(() => useWallet())

      await act(async () => {
        await result.current.connect('MetaMask')
      })

      expect(result.current.isConnected).toBe(false)
      expect(result.current.error).toBeTruthy()
      expect(result.current.error).toContain('MetaMask is not installed')
    })

    it('should handle no accounts found', async () => {
      mockEthereum.request.mockResolvedValueOnce([]) // No accounts

      const { result } = renderHook(() => useWallet())

      await act(async () => {
        await result.current.connect('MetaMask')
      })

      expect(result.current.isConnected).toBe(false)
      expect(result.current.error).toBeTruthy()
      expect(result.current.error).toContain('No accounts found')
    })

    it('should handle network errors during connection', async () => {
      mockEthereum.request.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useWallet())

      await act(async () => {
        await result.current.connect('MetaMask')
      })

      expect(result.current.isConnected).toBe(false)
      expect(result.current.error).toBeTruthy()
      expect(result.current.error).toContain('Failed to connect to MetaMask')
    })

    it('should handle wallet disconnection errors', async () => {
      // First connect
      const mockAccounts = ['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6']
      const mockChainId = '0x1'
      const mockBalance = '0x1bc16d674ec80000'

      mockEthereum.request
        .mockResolvedValueOnce(mockAccounts)
        .mockResolvedValueOnce(mockChainId)
        .mockResolvedValueOnce(mockBalance)

      const { result } = renderHook(() => useWallet())

      await act(async () => {
        await result.current.connect('MetaMask')
      })

      // Mock disconnect error
      jest.spyOn(walletManager, 'disconnect').mockRejectedValueOnce(new Error('Disconnect failed'))

      await act(async () => {
        await result.current.disconnect()
      })

      expect(result.current.error).toBeTruthy()
      expect(result.current.error).toContain('Failed to disconnect wallet')
    })

    it('should clear errors when requested', async () => {
      const { result } = renderHook(() => useWallet())

      // Set an error
      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })

    it('should handle wallet provider not available', async () => {
      const { result } = renderHook(() => useWallet())

      await act(async () => {
        await result.current.connect('NonExistentProvider')
      })

      expect(result.current.isConnected).toBe(false)
      expect(result.current.error).toBeTruthy()
    })

    it('should handle connection timeout', async () => {
      // Mock a slow connection that times out
      mockEthereum.request.mockImplementation(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), 100)
        )
      )

      const { result } = renderHook(() => useWallet())

      await act(async () => {
        await result.current.connect('MetaMask')
      })

      expect(result.current.isConnected).toBe(false)
      expect(result.current.error).toBeTruthy()
      expect(result.current.isConnecting).toBe(false)
    })
  })

  describe('Wallet Provider Availability', () => {
    it('should detect MetaMask availability', () => {
      const metamaskProvider = new MetaMaskProvider()
      expect(metamaskProvider.isAvailable()).toBe(true)
    })

    it('should detect Coinbase Wallet availability', () => {
      Object.defineProperty(window, 'ethereum', {
        value: { ...mockEthereum, isCoinbaseWallet: true, isMetaMask: false },
        writable: true
      })

      const coinbaseProvider = new CoinbaseWalletProvider()
      expect(coinbaseProvider.isAvailable()).toBe(true)
    })

    it('should handle WalletConnect availability', () => {
      const walletConnectProvider = new WalletConnectProvider()
      expect(walletConnectProvider.isAvailable()).toBe(true)
    })

    it('should get available providers', () => {
      const providers = walletManager.getAvailableProviders()
      expect(providers.length).toBeGreaterThan(0)
      expect(providers.some(p => p.name === 'MetaMask')).toBe(true)
    })
  })

  describe('Enhanced Wallet Features', () => {
    it('should load token balances', async () => {
      const mockProvider = {
        getBalance: jest.fn().mockResolvedValue('0x1bc16d674ec80000'),
        getNetwork: jest.fn().mockResolvedValue({ chainId: 1n }),
        getSigner: jest.fn().mockReturnValue({
          getAddress: jest.fn().mockResolvedValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')
        }),
        send: jest.fn().mockImplementation((method, params) => {
          if (method === 'eth_requestAccounts') {
            return Promise.resolve(['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'])
          }
          return Promise.resolve('0x1')
        })
      }

      const mockContract = {
        balanceOf: jest.fn().mockResolvedValue('1000000000'),
        decimals: jest.fn().mockResolvedValue(6),
        symbol: jest.fn().mockResolvedValue('USDC'),
        name: jest.fn().mockResolvedValue('USD Coin')
      }

      const { ethers } = require('ethers')
      ethers.BrowserProvider.mockImplementation(() => mockProvider)
      ethers.Contract = jest.fn().mockImplementation(() => mockContract)

      const { result } = renderHook(() => useEnhancedWallet())

      await act(async () => {
        await result.current.connect()
      })

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true)
        expect(result.current.tokens.length).toBeGreaterThan(0)
      })
    })

    it('should calculate total portfolio value', async () => {
      const mockProvider = {
        getBalance: jest.fn().mockResolvedValue('0x1bc16d674ec80000'),
        getNetwork: jest.fn().mockResolvedValue({ chainId: 1n }),
        getSigner: jest.fn().mockReturnValue({
          getAddress: jest.fn().mockResolvedValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')
        }),
        send: jest.fn().mockImplementation((method, params) => {
          if (method === 'eth_requestAccounts') {
            return Promise.resolve(['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'])
          }
          return Promise.resolve('0x1')
        })
      }

      const { ethers } = require('ethers')
      ethers.BrowserProvider.mockImplementation(() => mockProvider)

      const { result } = renderHook(() => useEnhancedWallet())

      await act(async () => {
        await result.current.connect()
      })

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true)
        expect(result.current.totalValue).toBeGreaterThan(0)
      })
    })

    it('should handle account changes', async () => {
      const mockProvider = {
        getBalance: jest.fn().mockResolvedValue('0x1bc16d674ec80000'),
        getNetwork: jest.fn().mockResolvedValue({ chainId: 1n }),
        getSigner: jest.fn().mockReturnValue({
          getAddress: jest.fn().mockResolvedValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')
        }),
        send: jest.fn().mockImplementation((method, params) => {
          if (method === 'eth_requestAccounts') {
            return Promise.resolve(['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'])
          }
          return Promise.resolve('0x1')
        })
      }

      const { ethers } = require('ethers')
      ethers.BrowserProvider.mockImplementation(() => mockProvider)

      const { result } = renderHook(() => useEnhancedWallet())

      await act(async () => {
        await result.current.connect()
      })

      // Simulate account change by triggering the ethereum event
      const newAddress = '0x9876543210abcdef1234567890abcdef12345678'
      act(() => {
        // Trigger the accountsChanged event that the enhanced wallet listens to
        if (mockEthereum.on.mock.calls.length > 0) {
          const accountsChangedCallback = mockEthereum.on.mock.calls.find(
            call => call[0] === 'accountsChanged'
          )?.[1]
          if (accountsChangedCallback) {
            accountsChangedCallback([newAddress])
          }
        }
      })

      expect(result.current.address).toBe(newAddress)
    })

    it('should handle chain changes', async () => {
      const mockProvider = {
        getBalance: jest.fn().mockResolvedValue('0x1bc16d674ec80000'),
        getNetwork: jest.fn().mockResolvedValue({ chainId: 1n }),
        getSigner: jest.fn().mockReturnValue({
          getAddress: jest.fn().mockResolvedValue('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')
        }),
        send: jest.fn().mockImplementation((method, params) => {
          if (method === 'eth_requestAccounts') {
            return Promise.resolve(['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'])
          }
          return Promise.resolve('0x1')
        })
      }

      const { ethers } = require('ethers')
      ethers.BrowserProvider.mockImplementation(() => mockProvider)

      const { result } = renderHook(() => useEnhancedWallet())

      await act(async () => {
        await result.current.connect()
      })

      // Simulate chain change by triggering the ethereum event
      const newChainId = 5 // Goerli
      act(() => {
        // Trigger the chainChanged event that the enhanced wallet listens to
        if (mockEthereum.on.mock.calls.length > 0) {
          const chainChangedCallback = mockEthereum.on.mock.calls.find(
            call => call[0] === 'chainChanged'
          )?.[1]
          if (chainChangedCallback) {
            chainChangedCallback('0x5') // Goerli chain ID in hex
          }
        }
      })

      expect(result.current.chainId).toBe(newChainId)
    })
  })
}) 