import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { WalletInfo } from '../../types/wallet'
import { CrossChainSwap } from '../blockchains/multi-chain-service'

// Wallet State
interface WalletState {
  wallet: WalletInfo | null
  isConnecting: boolean
  error: string | null
  setWallet: (wallet: WalletInfo | null) => void
  setConnecting: (connecting: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

// Swap State
interface SwapState {
  activeSwaps: CrossChainSwap[]
  swapHistory: CrossChainSwap[]
  currentSwap: CrossChainSwap | null
  isLoading: boolean
  error: string | null
  addSwap: (swap: CrossChainSwap) => void
  updateSwap: (swapId: string, updates: Partial<CrossChainSwap>) => void
  setCurrentSwap: (swap: CrossChainSwap | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

// UI State
interface UIState {
  theme: 'light' | 'dark' | 'system'
  sidebarOpen: boolean
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
    timestamp: number
  }>
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setSidebarOpen: (open: boolean) => void
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

// Combined Store
interface AppState extends WalletState, SwapState, UIState { }

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Wallet State
        wallet: null,
        isConnecting: false,
        error: null,
        setWallet: (wallet) => set({ wallet }),
        setConnecting: (isConnecting) => set({ isConnecting }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),

        // Swap State
        activeSwaps: [],
        swapHistory: [],
        currentSwap: null,
        isLoading: false,
        addSwap: (swap) => set((state) => ({
          activeSwaps: [...state.activeSwaps, swap],
          currentSwap: swap
        })),
        updateSwap: (swapId, updates) => set((state) => ({
          activeSwaps: state.activeSwaps.map(swap =>
            swap.id === swapId ? { ...swap, ...updates } : swap
          ),
          swapHistory: state.swapHistory.map(swap =>
            swap.id === swapId ? { ...swap, ...updates } : swap
          ),
          currentSwap: state.currentSwap?.id === swapId
            ? { ...state.currentSwap, ...updates }
            : state.currentSwap
        })),
        setCurrentSwap: (currentSwap) => set({ currentSwap }),
        setLoading: (isLoading) => set({ isLoading }),

        // UI State
        theme: 'system',
        sidebarOpen: false,
        notifications: [],
        setTheme: (theme) => set({ theme }),
        setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
        addNotification: (notification) => set((state) => ({
          notifications: [
            ...state.notifications,
            {
              ...notification,
              id: Math.random().toString(36).substr(2, 9),
              timestamp: Date.now()
            }
          ]
        })),
        removeNotification: (id) => set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        })),
        clearNotifications: () => set({ notifications: [] })
      }),
      {
        name: 'unite-defi-store',
        partialize: (state) => ({
          wallet: state.wallet,
          theme: state.theme,
          swapHistory: state.swapHistory
        })
      }
    ),
    {
      name: 'unite-defi-store'
    }
  )
) 