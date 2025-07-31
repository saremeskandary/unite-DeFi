import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';
import { OrderUpdate } from './useWebSocket';

export interface UseRealTimeOrdersOptions {
  orderIds: string[];
  autoSubscribe?: boolean;
  updateInterval?: number;
  network?: string;
}

export interface UseRealTimeOrdersReturn {
  orders: Map<string, OrderUpdate>;
  isLoading: boolean;
  error: Error | null;
  isConnected: boolean;
  subscribe: (orderIds: string[]) => void;
  unsubscribe: (orderIds: string[]) => void;
  refresh: () => void;
}

export function useRealTimeOrders(options: UseRealTimeOrdersOptions): UseRealTimeOrdersReturn {
  const {
    orderIds,
    autoSubscribe = true,
    updateInterval = 10000, // 10 seconds
    network = 'testnet',
  } = options;

  const [orders, setOrders] = useState<Map<string, OrderUpdate>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const {
    isConnected,
    subscribeToOrder,
    unsubscribeFromOrder,
  } = useWebSocket({ autoConnect: true });

  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to order updates
  const subscribe = useCallback((orderIdsToSubscribe: string[]) => {
    if (!isConnected) {
      console.warn('WebSocket not connected, using fallback polling');
      return;
    }

    orderIdsToSubscribe.forEach(orderId => {
      subscribeToOrder(orderId);
    });
  }, [isConnected, subscribeToOrder]);

  // Unsubscribe from order updates
  const unsubscribe = useCallback((orderIdsToUnsubscribe: string[]) => {
    if (!isConnected) {
      return;
    }

    orderIdsToUnsubscribe.forEach(orderId => {
      unsubscribeFromOrder(orderId);
    });
  }, [isConnected, unsubscribeFromOrder]);

  // Fallback polling when WebSocket is not available
  const startFallbackPolling = useCallback(async () => {
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
    }

    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const newOrders = new Map();

        // Fetch each order status
        await Promise.all(
          orderIds.map(async (orderId) => {
            try {
              const response = await fetch(`/api/orders/${orderId}?network=${network}`);
              if (response.ok) {
                const orderData = await response.json();
                newOrders.set(orderId, {
                  orderId,
                  status: orderData.status,
                  timestamp: orderData.timestamp,
                  gasUsed: orderData.gasUsed,
                  blockNumber: orderData.blockNumber,
                  transactionHash: orderData.transactionHash,
                });
              }
            } catch (err) {
              console.error(`Failed to fetch order ${orderId}:`, err);
            }
          })
        );

        setOrders(newOrders);
        setLastUpdate(new Date());
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    await fetchOrders();

    // Set up polling
    fallbackIntervalRef.current = setInterval(fetchOrders, updateInterval);
  }, [orderIds, network, updateInterval]);

  // Stop fallback polling
  const stopFallbackPolling = useCallback(() => {
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }
  }, []);

  // Refresh orders manually
  const refresh = useCallback(async () => {
    if (isConnected) {
      // Re-subscribe to trigger fresh data
      subscribe(orderIds);
    } else {
      // Use fallback polling
      await startFallbackPolling();
    }
  }, [isConnected, subscribe, orderIds, startFallbackPolling]);

  // Set up WebSocket event listeners
  useEffect(() => {
    if (!isConnected) {
      return;
    }

    // Handle order updates from WebSocket
    const handleOrderUpdate = (data: any) => {
      try {
        const orderUpdate = data.data as OrderUpdate;
        const newOrders = new Map(orders);

        newOrders.set(orderUpdate.orderId, orderUpdate);
        setOrders(newOrders);
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
  }, [isConnected, orders, startFallbackPolling, stopFallbackPolling]);

  // Auto-subscribe when orderIds change
  useEffect(() => {
    if (autoSubscribe && orderIds.length > 0) {
      if (isConnected) {
        subscribe(orderIds);
      } else {
        startFallbackPolling();
      }
    }

    return () => {
      if (isConnected) {
        unsubscribe(orderIds);
      } else {
        stopFallbackPolling();
      }
    };
  }, [autoSubscribe, orderIds, isConnected, subscribe, unsubscribe, startFallbackPolling, stopFallbackPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopFallbackPolling();
    };
  }, [stopFallbackPolling]);

  return {
    orders,
    isLoading,
    error,
    isConnected,
    subscribe,
    unsubscribe,
    refresh,
  };
} 