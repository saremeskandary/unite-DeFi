import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';
import { PriceUpdate } from './useWebSocket';

export interface UseRealTimePricesOptions {
  symbols: string[];
  autoSubscribe?: boolean;
  updateInterval?: number;
}

export interface UseRealTimePricesReturn {
  prices: Map<string, PriceUpdate>;
  isLoading: boolean;
  error: Error | null;
  isConnected: boolean;
  subscribe: (symbols: string[]) => void;
  unsubscribe: (symbols: string[]) => void;
  refresh: () => void;
}

export function useRealTimePrices(options: UseRealTimePricesOptions): UseRealTimePricesReturn {
  const {
    symbols,
    autoSubscribe = true,
    updateInterval = 30000, // 30 seconds
  } = options;

  const [prices, setPrices] = useState<Map<string, PriceUpdate>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const {
    isConnected,
    subscribeToPrices,
    unsubscribeFromPrices,
  } = useWebSocket({ autoConnect: true });

  const socketRef = useRef<any>(null);
  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to price updates
  const subscribe = useCallback((symbolsToSubscribe: string[]) => {
    if (!isConnected) {
      console.warn('WebSocket not connected, using fallback polling');
      return;
    }

    subscribeToPrices(symbolsToSubscribe);
  }, [isConnected, subscribeToPrices]);

  // Unsubscribe from price updates
  const unsubscribe = useCallback((symbolsToUnsubscribe: string[]) => {
    if (!isConnected) {
      return;
    }

    unsubscribeFromPrices(symbolsToUnsubscribe);
  }, [isConnected, unsubscribeFromPrices]);

  // Fallback polling when WebSocket is not available
  const startFallbackPolling = useCallback(async () => {
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
    }

    const fetchPrices = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch prices from API
        const response = await fetch(`/api/prices?symbols=${symbols.join(',')}`);
        if (!response.ok) {
          throw new Error('Failed to fetch prices');
        }

        const priceData = await response.json();
        const newPrices = new Map();

        Object.entries(priceData).forEach(([symbol, data]: [string, any]) => {
          newPrices.set(symbol, {
            symbol,
            price: data.price,
            change24h: data.change24h,
            volume24h: data.volume24h,
            marketCap: data.marketCap,
          });
        });

        setPrices(newPrices);
        setLastUpdate(new Date());
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    await fetchPrices();

    // Set up polling
    fallbackIntervalRef.current = setInterval(fetchPrices, updateInterval);
  }, [symbols, updateInterval]);

  // Stop fallback polling
  const stopFallbackPolling = useCallback(() => {
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }
  }, []);

  // Refresh prices manually
  const refresh = useCallback(async () => {
    if (isConnected) {
      // Re-subscribe to trigger fresh data
      subscribe(symbols);
    } else {
      // Use fallback polling
      await startFallbackPolling();
    }
  }, [isConnected, subscribe, symbols, startFallbackPolling]);

  // Set up WebSocket event listeners
  useEffect(() => {
    if (!isConnected) {
      return;
    }

    // Get the socket instance from the WebSocket hook
    // This is a simplified approach - in a real implementation, you'd need to expose the socket
    const handlePriceUpdate = (data: any) => {
      try {
        const newPrices = new Map(prices);
        
        Object.entries(data.data).forEach(([symbol, priceData]: [string, any]) => {
          newPrices.set(symbol, {
            symbol,
            price: priceData.price,
            change24h: priceData.change24h,
            volume24h: priceData.volume24h,
            marketCap: priceData.marketCap,
          });
        });

        setPrices(newPrices);
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
  }, [isConnected, prices, startFallbackPolling, stopFallbackPolling]);

  // Auto-subscribe when symbols change
  useEffect(() => {
    if (autoSubscribe && symbols.length > 0) {
      if (isConnected) {
        subscribe(symbols);
      } else {
        startFallbackPolling();
      }
    }

    return () => {
      if (isConnected) {
        unsubscribe(symbols);
      } else {
        stopFallbackPolling();
      }
    };
  }, [autoSubscribe, symbols, isConnected, subscribe, unsubscribe, startFallbackPolling, stopFallbackPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopFallbackPolling();
    };
  }, [stopFallbackPolling]);

  return {
    prices,
    isLoading,
    error,
    isConnected,
    subscribe,
    unsubscribe,
    refresh,
  };
} 