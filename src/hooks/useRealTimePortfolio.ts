import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';
import { PortfolioUpdate } from './useWebSocket';

export interface UseRealTimePortfolioOptions {
  address: string;
  autoSubscribe?: boolean;
  updateInterval?: number;
  network?: string;
}

export interface UseRealTimePortfolioReturn {
  portfolio: PortfolioUpdate | null;
  isLoading: boolean;
  error: Error | null;
  isConnected: boolean;
  subscribe: (address: string) => void;
  unsubscribe: (address: string) => void;
  refresh: () => void;
}

export function useRealTimePortfolio(options: UseRealTimePortfolioOptions): UseRealTimePortfolioReturn {
  const {
    address,
    autoSubscribe = true,
    updateInterval = 60000, // 1 minute
    network = 'testnet',
  } = options;

  const [portfolio, setPortfolio] = useState<PortfolioUpdate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const {
    isConnected,
    subscribeToPortfolio,
    unsubscribeFromPortfolio,
  } = useWebSocket({ autoConnect: true });

  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to portfolio updates
  const subscribe = useCallback((walletAddress: string) => {
    if (!isConnected) {
      console.warn('WebSocket not connected, using fallback polling');
      return;
    }

    subscribeToPortfolio(walletAddress);
  }, [isConnected, subscribeToPortfolio]);

  // Unsubscribe from portfolio updates
  const unsubscribe = useCallback((walletAddress: string) => {
    if (!isConnected) {
      return;
    }

    unsubscribeFromPortfolio(walletAddress);
  }, [isConnected, unsubscribeFromPortfolio]);

  // Fallback polling when WebSocket is not available
  const startFallbackPolling = useCallback(async () => {
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
    }

    const fetchPortfolio = async () => {
      if (!address) return;

      try {
        setIsLoading(true);
        setError(null);

        // Fetch portfolio data from API
        const response = await fetch(`/api/portfolio/${address}?network=${network}`);
        if (!response.ok) {
          throw new Error('Failed to fetch portfolio');
        }

        const portfolioData = await response.json();

        const portfolioUpdate: PortfolioUpdate = {
          totalValue: portfolioData.totalValue,
          assets: portfolioData.assets.map((asset: any) => ({
            symbol: asset.symbol,
            balance: asset.balance,
            value: asset.value,
            change24h: asset.change24h,
          })),
          timestamp: new Date().toISOString(),
        };

        setPortfolio(portfolioUpdate);
        setLastUpdate(new Date());
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    await fetchPortfolio();

    // Set up polling
    fallbackIntervalRef.current = setInterval(fetchPortfolio, updateInterval);
  }, [address, network, updateInterval]);

  // Stop fallback polling
  const stopFallbackPolling = useCallback(() => {
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }
  }, []);

  // Refresh portfolio manually
  const refresh = useCallback(async () => {
    if (isConnected) {
      // Re-subscribe to trigger fresh data
      subscribe(address);
    } else {
      // Use fallback polling
      await startFallbackPolling();
    }
  }, [isConnected, subscribe, address, startFallbackPolling]);

  // Set up WebSocket event listeners
  useEffect(() => {
    if (!isConnected) {
      return;
    }

    // Handle portfolio updates from WebSocket
    const handlePortfolioUpdate = (data: any) => {
      try {
        const portfolioUpdate = data.data as PortfolioUpdate;
        setPortfolio(portfolioUpdate);
        setLastUpdate(new Date());
        setError(null);
      } catch (err) {
        setError(err as Error);
      }
    };

    // In a real implementation, you'd listen to the socket events here
    // For now, we'll use the fallback polling approach
    if (!isConnected) {
      startFallbackPolling();
    }

    return () => {
      stopFallbackPolling();
    };
  }, [isConnected, startFallbackPolling, stopFallbackPolling]);

  // Auto-subscribe when address changes
  useEffect(() => {
    if (autoSubscribe && address) {
      if (isConnected) {
        subscribe(address);
      } else {
        startFallbackPolling();
      }
    }

    return () => {
      if (isConnected) {
        unsubscribe(address);
      } else {
        stopFallbackPolling();
      }
    };
  }, [autoSubscribe, address, isConnected, subscribe, unsubscribe, startFallbackPolling, stopFallbackPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopFallbackPolling();
    };
  }, [stopFallbackPolling]);

  return {
    portfolio,
    isLoading,
    error,
    isConnected,
    subscribe,
    unsubscribe,
    refresh,
  };
} 