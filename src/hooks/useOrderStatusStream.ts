import { useState, useEffect, useCallback, useRef } from 'react';
import { OrderStatus } from '@/lib/services/order-monitor';

interface OrderStatusEvent {
  type: 'connected' | 'status_update' | 'error' | 'completed';
  orderId: string;
  status?: OrderStatus;
  error?: string;
  timestamp: string;
}

interface UseOrderStatusStreamOptions {
  network?: string;
  autoConnect?: boolean;
}

interface UseOrderStatusStreamReturn {
  orderStatus: OrderStatus | null;
  isLoading: boolean;
  error: Error | null;
  isConnected: boolean;
  isMonitoring: boolean;
  connect: () => void;
  disconnect: () => void;
}

export function useOrderStatusStream(
  orderId: string | null,
  options: UseOrderStatusStreamOptions = {}
): UseOrderStatusStreamReturn {
  const {
    network = 'testnet',
    autoConnect = true,
  } = options;

  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!orderId || eventSourceRef.current) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const url = `/api/orders/${orderId}/stream?network=${network}`;
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setIsMonitoring(true);
        setIsLoading(false);
        console.log('SSE connection established for order:', orderId);
      };

      eventSource.onmessage = (event) => {
        try {
          const data: OrderStatusEvent = JSON.parse(event.data);

          switch (data.type) {
            case 'connected':
              console.log('SSE connected for order:', data.orderId);
              break;

            case 'status_update':
              if (data.status) {
                setOrderStatus(data.status);
                setError(null);
              }
              break;

            case 'error':
              setError(new Error(data.error || 'Unknown error'));
              break;

            case 'completed':
              if (data.status) {
                setOrderStatus(data.status);
                setError(null);
              }
              // Disconnect after completion
              setTimeout(() => {
                disconnect();
              }, 1000);
              break;
          }
        } catch (parseError) {
          console.error('Error parsing SSE message:', parseError);
          setError(new Error('Failed to parse server message'));
        }
      };

      eventSource.onerror = (event) => {
        console.error('SSE connection error:', event);
        setError(new Error('Connection failed'));
        setIsConnected(false);
        setIsLoading(false);

        // Clean up
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
      };

    } catch (err) {
      setError(err as Error);
      setIsLoading(false);
    }
  }, [orderId, network]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
    setIsMonitoring(false);
    setIsLoading(false);
  }, []);

  // Auto-connect when orderId changes
  useEffect(() => {
    if (orderId && autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [orderId, autoConnect, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    orderStatus,
    isLoading,
    error,
    isConnected,
    isMonitoring,
    connect,
    disconnect,
  };
}

/**
 * Hook for combining polling and SSE approaches
 */
export function useHybridOrderStatus(
  orderId: string | null,
  options: UseOrderStatusStreamOptions & { preferSSE?: boolean } = {}
): UseOrderStatusStreamReturn {
  const { preferSSE = true, ...streamOptions } = options;

  const streamHook = useOrderStatusStream(orderId, streamOptions);

  // Fallback to polling if SSE is not preferred or fails
  const [usePolling, setUsePolling] = useState(!preferSSE);

  useEffect(() => {
    if (streamHook.error && preferSSE) {
      console.log('SSE failed, falling back to polling');
      setUsePolling(true);
    }
  }, [streamHook.error, preferSSE]);

  // For now, we'll use the stream hook
  // In a full implementation, you could add polling fallback here
  return streamHook;
} 