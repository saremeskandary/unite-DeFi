import { ethers } from 'ethers'

export interface WalletInfo {
  address: string
  balance: string
  chainId: number
  isConnected: boolean
}

export interface WalletProvider {
  name: string
  icon: string
  connect: () => Promise<WalletInfo>
  disconnect: () => Promise<void>
  isAvailable: () => boolean
}

export class WalletError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'WalletError'
  }
}

// MetaMask Provider
export class MetaMaskProvider implements WalletProvider {
  name = 'MetaMask'
  icon = '🦊'

  isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.ethereum?.isMetaMask
  }

  async connect(): Promise<WalletInfo> {
    if (!this.isAvailable()) {
      throw new WalletError('MetaMask is not installed', 'METAMASK_NOT_INSTALLED')
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (!accounts || accounts.length === 0) {
        throw new WalletError('No accounts found', 'NO_ACCOUNTS')
      }

      const address = accounts[0]

      // Get chain ID
      const chainId = await window.ethereum.request({
        method: 'eth_chainId'
      })

      // Get balance
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      })

      return {
        address,
        balance: ethers.formatEther(balance),
        chainId: parseInt(chainId, 16),
        isConnected: true
      }
    } catch (error) {
      if (error instanceof WalletError) {
        throw error
      }
      throw new WalletError(
        error instanceof Error ? error.message : 'Failed to connect to MetaMask',
        'CONNECTION_FAILED'
      )
    }
  }

  async disconnect(): Promise<void> {
    // MetaMask doesn't have a disconnect method, just clear local state
    return Promise.resolve()
  }
}

// WalletConnect Provider (simplified - would need @walletconnect/web3-provider for full implementation)
export class WalletConnectProvider implements WalletProvider {
  name = 'WalletConnect'
  icon = '🔗'

  isAvailable(): boolean {
    return true // WalletConnect is always available as it can be installed
  }

  async connect(): Promise<WalletInfo> {
    throw new WalletError(
      'WalletConnect integration requires @walletconnect/web3-provider. Please install it for full functionality.',
      'NOT_IMPLEMENTED'
    )
  }

  async disconnect(): Promise<void> {
    return Promise.resolve()
  }
}

// Coinbase Wallet Provider
export class CoinbaseWalletProvider implements WalletProvider {
  name = 'Coinbase Wallet'
  icon = '🪙'

  isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.ethereum?.isCoinbaseWallet
  }

  async connect(): Promise<WalletInfo> {
    if (!this.isAvailable()) {
      throw new WalletError('Coinbase Wallet is not installed', 'COINBASE_NOT_INSTALLED')
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (!accounts || accounts.length === 0) {
        throw new WalletError('No accounts found', 'NO_ACCOUNTS')
      }

      const address = accounts[0]

      // Get chain ID
      const chainId = await window.ethereum.request({
        method: 'eth_chainId'
      })

      // Get balance
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      })

      return {
        address,
        balance: ethers.formatEther(balance),
        chainId: parseInt(chainId, 16),
        isConnected: true
      }
    } catch (error) {
      if (error instanceof WalletError) {
        throw error
      }
      throw new WalletError(
        error instanceof Error ? error.message : 'Failed to connect to Coinbase Wallet',
        'CONNECTION_FAILED'
      )
    }
  }

  async disconnect(): Promise<void> {
    return Promise.resolve()
  }
}

// Wallet Manager
export class WalletManager {
  private providers: Map<string, WalletProvider> = new Map()
  private currentWallet: WalletInfo | null = null

  constructor() {
    this.providers.set('metamask', new MetaMaskProvider())
    this.providers.set('walletconnect', new WalletConnectProvider())
    this.providers.set('coinbase', new CoinbaseWalletProvider())
  }

  getProvider(name: string): WalletProvider | undefined {
    return this.providers.get(name)
  }

  getAvailableProviders(): WalletProvider[] {
    return Array.from(this.providers.values()).filter(provider => provider.isAvailable())
  }

  async connect(providerName: string): Promise<WalletInfo> {
    const provider = this.getProvider(providerName)
    if (!provider) {
      throw new WalletError(`Provider ${providerName} not found`, 'PROVIDER_NOT_FOUND')
    }

    if (!provider.isAvailable()) {
      throw new WalletError(`${provider.name} is not available`, 'PROVIDER_NOT_AVAILABLE')
    }

    try {
      this.currentWallet = await provider.connect()
      return this.currentWallet
    } catch (error) {
      throw error
    }
  }

  async disconnect(): Promise<void> {
    if (this.currentWallet) {
      // Try to disconnect from the current provider
      // For now, just clear the local state
      this.currentWallet = null
    }
  }

  getCurrentWallet(): WalletInfo | null {
    return this.currentWallet
  }

  async refreshBalance(): Promise<string | null> {
    if (!this.currentWallet || typeof window === 'undefined' || !window.ethereum) {
      return null
    }

    try {
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [this.currentWallet.address, 'latest']
      })

      const newBalance = ethers.formatEther(balance)
      this.currentWallet.balance = newBalance
      return newBalance
    } catch (error) {
      console.error('Failed to refresh balance:', error)
      return null
    }
  }
}

// Global wallet manager instance
export const walletManager = new WalletManager()

// Event listeners for wallet changes
if (typeof window !== 'undefined' && window.ethereum) {
  window.ethereum.on('accountsChanged', (accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected
      walletManager.disconnect()
    } else {
      // User switched accounts
      walletManager.refreshBalance()
    }
  })

  window.ethereum.on('chainChanged', () => {
    // Refresh wallet info when chain changes
    walletManager.refreshBalance()
  })
}

// Type declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean
      isCoinbaseWallet?: boolean
      request: (args: { method: string; params?: any[] }) => Promise<any>
      on: (event: string, callback: (...args: any[]) => void) => void
      removeListener: (event: string, callback: (...args: any[]) => void) => void
    }
  }
} 