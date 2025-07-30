import { useState, useEffect, useCallback } from 'react'
import { walletManager, WalletInfo, WalletError } from '@/lib/wallet'
import { useToast } from '@/hooks/use-toast'

export interface UseWalletReturn {
  wallet: WalletInfo | null
  isConnecting: boolean
  isConnected: boolean
  connect: (providerName: string) => Promise<void>
  disconnect: () => Promise<void>
  refreshBalance: () => Promise<void>
  error: string | null
  clearError: () => void
}

export function useWallet(): UseWalletReturn {
  const [wallet, setWallet] = useState<WalletInfo | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Initialize wallet state from localStorage or existing connection
  useEffect(() => {
    const initializeWallet = async () => {
      try {
        const currentWallet = walletManager.getCurrentWallet()
        if (currentWallet) {
          setWallet(currentWallet)
          // Refresh balance on mount
          await refreshBalance()
        }
      } catch (error) {
        console.error('Failed to initialize wallet:', error)
      }
    }

    initializeWallet()
  }, [])

  const connect = useCallback(async (providerName: string) => {
    setIsConnecting(true)
    setError(null)

    try {
      const walletInfo = await walletManager.connect(providerName)
      setWallet(walletInfo)

      toast({
        title: "Wallet Connected",
        description: `Successfully connected to ${walletInfo.address.slice(0, 6)}...${walletInfo.address.slice(-4)}`,
      })
    } catch (error) {
      const errorMessage = error instanceof WalletError
        ? error.message
        : 'Failed to connect wallet'

      setError(errorMessage)

      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }, [toast])

  const disconnect = useCallback(async () => {
    try {
      await walletManager.disconnect()
      setWallet(null)
      setError(null)

      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected",
      })
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
      setError('Failed to disconnect wallet')
    }
  }, [toast])

  const refreshBalance = useCallback(async () => {
    if (!wallet) return

    try {
      const newBalance = await walletManager.refreshBalance()
      if (newBalance && wallet) {
        setWallet({
          ...wallet,
          balance: newBalance
        })
      }
    } catch (error) {
      console.error('Failed to refresh balance:', error)
    }
  }, [wallet])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Auto-refresh balance every 30 seconds when connected
  useEffect(() => {
    if (!wallet) return

    const interval = setInterval(refreshBalance, 30000)
    return () => clearInterval(interval)
  }, [wallet, refreshBalance])

  return {
    wallet,
    isConnecting,
    isConnected: !!wallet,
    connect,
    disconnect,
    refreshBalance,
    error,
    clearError,
  }
} 