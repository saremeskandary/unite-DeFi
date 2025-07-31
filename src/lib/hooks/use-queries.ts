import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MultiChainService } from '../blockchains/multi-chain-service'
import { EthereumProviderService } from '../blockchains/ethereum/ethereum-provider'
import { BitcoinAPIService, BitcoinNetworks } from '../blockchains/bitcoin/bitcoin-api'
import { useAppStore } from '../store'
import { toast } from '../../hooks/use-toast'

// Initialize services
const multiChainService = new MultiChainService()
const ethereumProvider = new EthereumProviderService()
const bitcoinAPI = new BitcoinAPIService(BitcoinNetworks.testnet)

// Query Keys
export const queryKeys = {
  wallet: ['wallet'] as const,
  balance: (address: string) => ['balance', address] as const,
  swaps: ['swaps'] as const,
  swap: (id: string) => ['swap', id] as const,
  bitcoinPrice: ['bitcoin-price'] as const,
  ethereumPrice: ['ethereum-price'] as const,
  networkStatus: ['network-status'] as const,
  supportedTokens: ['supported-tokens'] as const
}

// Wallet Queries
export const useWalletStatus = () => {
  return useQuery({
    queryKey: queryKeys.wallet,
    queryFn: async () => {
      const status = await ethereumProvider.getProviderStatus()
      return status
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000
  })
}

export const useBalance = (address: string) => {
  return useQuery({
    queryKey: queryKeys.balance(address),
    queryFn: async () => {
      const [ethBalance, btcBalance] = await Promise.all([
        ethereumProvider.getBalance(address),
        Promise.resolve('0') // Simplified Bitcoin balance for now
      ])
      return { eth: ethBalance, btc: btcBalance }
    },
    enabled: !!address,
    staleTime: 10000, // 10 seconds
    refetchInterval: 10000
  })
}

// Swap Queries
export const useSwaps = () => {
  return useQuery({
    queryKey: queryKeys.swaps,
    queryFn: async () => {
      // This would typically fetch from your backend API
      // For now, return from store
      const { activeSwaps, swapHistory } = useAppStore.getState()
      return { active: activeSwaps, history: swapHistory }
    },
    staleTime: 5000, // 5 seconds
    refetchInterval: 5000
  })
}

export const useSwap = (id: string) => {
  return useQuery({
    queryKey: queryKeys.swap(id),
    queryFn: async () => {
      const { activeSwaps, swapHistory } = useAppStore.getState()
      const swap = [...activeSwaps, ...swapHistory].find(s => s.id === id)
      if (!swap) throw new Error('Swap not found')
      return swap
    },
    enabled: !!id,
    staleTime: 2000, // 2 seconds
    refetchInterval: 2000
  })
}

// Price Queries
export const useBitcoinPrice = () => {
  return useQuery({
    queryKey: queryKeys.bitcoinPrice,
    queryFn: async () => {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
      const data = await response.json()
      return data.bitcoin.usd
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000
  })
}

export const useEthereumPrice = () => {
  return useQuery({
    queryKey: queryKeys.ethereumPrice,
    queryFn: async () => {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
      const data = await response.json()
      return data.ethereum.usd
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000
  })
}

// Network Status
export const useNetworkStatus = () => {
  return useQuery({
    queryKey: queryKeys.networkStatus,
    queryFn: async () => {
      const [ethStatus, btcStatus] = await Promise.all([
        ethereumProvider.getProviderStatus(),
        Promise.resolve({ connected: true, network: 'testnet' })
      ])
      return { ethereum: ethStatus, bitcoin: btcStatus }
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 60000
  })
}

// Mutations
export const useCreateSwap = () => {
  const queryClient = useQueryClient()
  const { addSwap, addNotification } = useAppStore()

  return useMutation({
    mutationFn: async (params: {
      fromChain: 'ethereum' | 'bitcoin'
      toChain: 'ethereum' | 'bitcoin'
      fromToken: string
      toToken: string
      fromAmount: string
      toAmount: string
      fromAddress: string
      toAddress: string
    }) => {
      const result = await multiChainService.initiateSwap(params)
      if (!result.success) {
        throw new Error(result.error || 'Failed to create swap')
      }
      return result.swap || { id: 'mock-swap', status: 'pending' } as any
    },
    onSuccess: (swap) => {
      addSwap(swap)
      addNotification({
        type: 'success',
        title: 'Swap Created',
        message: `Swap ${swap.id} has been created successfully`
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.swaps })
      toast({
        title: "Swap Created",
        description: `Swap ${swap.id} has been created successfully`,
      })
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Swap Creation Failed',
        message: error.message
      })
      toast({
        title: "Swap Creation Failed",
        description: error.message,
        variant: "destructive",
      })
    }
  })
}

export const useFundSwap = () => {
  const queryClient = useQueryClient()
  const { updateSwap, addNotification } = useAppStore()

  return useMutation({
    mutationFn: async (swapId: string) => {
      const result = await multiChainService.fundSwap(swapId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fund swap')
      }
      return result
    },
    onSuccess: (result, swapId) => {
      updateSwap(swapId, {
        status: 'funded',
        ...(result.txHash && { ethereumTxHash: result.txHash })
      })
      addNotification({
        type: 'success',
        title: 'Swap Funded',
        message: `Swap ${swapId} has been funded successfully`
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.swaps })
      queryClient.invalidateQueries({ queryKey: queryKeys.swap(swapId) })
      toast({
        title: "Swap Funded",
        description: `Swap ${swapId} has been funded successfully`,
      })
    },
    onError: (error, swapId) => {
      addNotification({
        type: 'error',
        title: 'Swap Funding Failed',
        message: error.message
      })
      toast({
        title: "Swap Funding Failed",
        description: error.message,
        variant: "destructive",
      })
    }
  })
}

export const useRedeemSwap = () => {
  const queryClient = useQueryClient()
  const { updateSwap, addNotification } = useAppStore()

  return useMutation({
    mutationFn: async ({ swapId, secret }: { swapId: string; secret: string }) => {
      // Simplified implementation - use fundSwap as placeholder
      const result = await multiChainService.fundSwap(swapId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to redeem swap')
      }
      return result
    },
    onSuccess: (result, { swapId }) => {
      updateSwap(swapId, {
        status: 'completed',
        ...(result.txHash && { bitcoinTxHash: result.txHash })
      })
      addNotification({
        type: 'success',
        title: 'Swap Completed',
        message: `Swap ${swapId} has been completed successfully`
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.swaps })
      queryClient.invalidateQueries({ queryKey: queryKeys.swap(swapId) })
      toast({
        title: "Swap Completed",
        description: `Swap ${swapId} has been completed successfully`,
      })
    },
    onError: (error, { swapId }) => {
      addNotification({
        type: 'error',
        title: 'Swap Redemption Failed',
        message: error.message
      })
      toast({
        title: "Swap Redemption Failed",
        description: error.message,
        variant: "destructive",
      })
    }
  })
}

export const useRefundSwap = () => {
  const queryClient = useQueryClient()
  const { updateSwap, addNotification } = useAppStore()

  return useMutation({
    mutationFn: async (swapId: string) => {
      // Simplified implementation - use fundSwap as placeholder
      const result = await multiChainService.fundSwap(swapId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to refund swap')
      }
      return result
    },
    onSuccess: (result, swapId) => {
      updateSwap(swapId, {
        status: 'refunded',
        ...(result.txHash && { ethereumTxHash: result.txHash })
      })
      addNotification({
        type: 'success',
        title: 'Swap Refunded',
        message: `Swap ${swapId} has been refunded successfully`
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.swaps })
      queryClient.invalidateQueries({ queryKey: queryKeys.swap(swapId) })
      toast({
        title: "Swap Refunded",
        description: `Swap ${swapId} has been refunded successfully`,
      })
    },
    onError: (error, swapId) => {
      addNotification({
        type: 'error',
        title: 'Swap Refund Failed',
        message: error.message
      })
      toast({
        title: "Swap Refund Failed",
        description: error.message,
        variant: "destructive",
      })
    }
  })
} 