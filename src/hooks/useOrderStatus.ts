import { useState, useEffect, useCallback } from 'react';
import { OrderMonitor, OrderStatus } from '@/lib/services/order-monitor';

interface UseOrderStatusOptions {
  network?: string;
  autoStart?: boolean;
  pollingInterval?: number;
}

interface UseOrderStatusReturn {
  orderStatus: OrderStatus | null;
  isLoading: boolean;
  error: Error | null;
  isMonitoring: boolean;
  isConnected: boolean;
  startMonitoring: () => Promise<void>;
  stopMonitoring: () => void;
  refreshStatus: () => Promise<void>;
}

export function useOrderStatus(
  orderId: string | null,
  options: UseOrderStatusOptions = {}
): UseOrderStatusReturn {
  const {
    network = 'testnet',
    autoStart = true,
    pollingInterval = 5000,
  } = options;

  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [monitor, setMonitor] = useState<OrderMonitor | null>(null);

  // Initialize monitor when orderId changes
  useEffect(() => {
    if (!orderId) {
      setMonitor(null);
      setOrderStatus(null);
      setError(null);
      return;
    }

    const newMonitor = new OrderMonitor(orderId, network, {
      onStatusUpdate: (status) => {
        setOrderStatus(status);
        setError(null);
      },
      onError: (err) => {
        setError(err);
        console.error('Order monitoring error:', err);
      },
      onComplete: (status) => {
        setOrderStatus(status);
        setIsMonitoring(false);
        setError(null);
      },
    });

    setMonitor(newMonitor);

    // Auto-start monitoring if enabled
    if (autoStart) {
      newMonitor.startMonitoring();
      setIsMonitoring(true);
    }

    return () => {
      newMonitor.stopMonitoring();
    };
  }, [orderId, network, autoStart]);

  // Start monitoring
  const startMonitoring = useCallback(async () => {
    if (!monitor) return;

    try {
      setIsLoading(true);
      setError(null);
      await monitor.startMonitoring();
      setIsMonitoring(true);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [monitor]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (!monitor) return;

    monitor.stopMonitoring();
    setIsMonitoring(false);
  }, [monitor]);

  // Refresh status manually
  const refreshStatus = useCallback(async () => {
    if (!orderId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch current status from API
      const response = await fetch(`/api/orders/${orderId}?network=${network}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order status');
      }

      const status = await response.json();
      setOrderStatus(status);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [orderId, network]);

  return {
    orderStatus,
    isLoading,
    error,
    isMonitoring,
    isConnected,
    startMonitoring,
    stopMonitoring,
    refreshStatus,
  };
}

/**
 * Hook for real-time order status with WebSocket-like updates
 */
export function useRealTimeOrderStatus(
  orderId: string | null,
  options: UseOrderStatusOptions = {}
): UseOrderStatusReturn {
  const {
    network = 'testnet',
    autoStart = true,
  } = options;

  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Set up polling for real-time updates
  useEffect(() => {
    if (!orderId || !autoStart) {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      return;
    }

    setIsMonitoring(true);

    // Initial fetch
    fetchOrderStatus();

    // Set up polling
    const interval = setInterval(fetchOrderStatus, 5000);
    setPollingInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [orderId, network, autoStart]);

  const fetchOrderStatus = async () => {
    if (!orderId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/orders/${orderId}?network=${network}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order status');
      }

      const status = await response.json();
      setOrderStatus(status);

      // Stop monitoring if order is completed or failed
      if (status.status === 'completed' || status.status === 'failed') {
        setIsMonitoring(false);
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const startMonitoring = useCallback(async () => {
    if (!orderId) return;

    try {
      setIsLoading(true);
      setError(null);
      setIsMonitoring(true);
      await fetchOrderStatus();

      // Set up polling
      const interval = setInterval(fetchOrderStatus, 5000);
      setPollingInterval(interval);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [pollingInterval]);

  const refreshStatus = useCallback(async () => {
    await fetchOrderStatus();
  }, []);

  return {
    orderStatus,
    isLoading,
    error,
    isMonitoring,
    isConnected,
    startMonitoring,
    stopMonitoring,
    refreshStatus,
  };
} 