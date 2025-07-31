import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface PriceUpdate {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
}

export interface OrderUpdate {
  orderId: string;
  status: 'pending' | 'processing' | 'confirmed' | 'failed';
  timestamp: string;
  gasUsed?: number;
  blockNumber?: number;
  transactionHash?: string;
}

export interface PortfolioUpdate {
  totalValue: number;
  assets: Array<{
    symbol: string;
    balance: number;
    value: number;
    change24h: number;
  }>;
  timestamp: string;
}

export interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  priceImpact: number;
  gasEstimate: number;
  route: any[];
}

export interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  connect: () => void;
  disconnect: () => void;
  subscribeToPrices: (symbols: string[]) => void;
  unsubscribeFromPrices: (symbols: string[]) => void;
  subscribeToOrder: (orderId: string) => void;
  unsubscribeFromOrder: (orderId: string) => void;
  subscribeToPortfolio: (address: string) => void;
  unsubscribeFromPortfolio: (address: string) => void;
  requestSwapQuote: (data: {
    fromToken: string;
    toToken: string;
    amount: string;
    fromAddress: string;
    chainId?: number;
  }) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 1000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getWebSocketUrl = useCallback(() => {
    return process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001';
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

      const url = getWebSocketUrl();
      const socket = io(url, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: false, // We'll handle reconnection manually
      });

      socket.on('connect', () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        reconnectAttemptsRef.current = 0;
      });

      socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        setIsConnected(false);
        setIsConnecting(false);

        // Handle reconnection
        if (reason === 'io server disconnect') {
          // Server disconnected us, try to reconnect
          if (reconnectAttemptsRef.current < reconnectAttempts) {
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttemptsRef.current++;
              connect();
            }, reconnectDelay * reconnectAttemptsRef.current);
          }
        }
      });

      socket.on('connect_error', (err) => {
        console.error('WebSocket connection error:', err);
        setError(err);
        setIsConnecting(false);
        setIsConnected(false);
      });

      socket.on('error', (err) => {
        console.error('WebSocket error:', err);
        setError(err);
      });

      socketRef.current = socket;
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError(err as Error);
      setIsConnecting(false);
    }
  }, [getWebSocketUrl, reconnectAttempts, reconnectDelay]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setError(null);
    reconnectAttemptsRef.current = 0;
  }, []);

  const subscribeToPrices = useCallback((symbols: string[]) => {
    if (!socketRef.current?.connected) {
      console.warn('WebSocket not connected, cannot subscribe to prices');
      return;
    }

    socketRef.current.emit('subscribe-prices', symbols);
  }, []);

  const unsubscribeFromPrices = useCallback((symbols: string[]) => {
    if (!socketRef.current?.connected) {
      return;
    }

    // Leave the price room
    const room = `prices:${symbols.join(',')}`;
    socketRef.current.emit('leave-room', room);
  }, []);

  const subscribeToOrder = useCallback((orderId: string) => {
    if (!socketRef.current?.connected) {
      console.warn('WebSocket not connected, cannot subscribe to order');
      return;
    }

    socketRef.current.emit('subscribe-orders', orderId);
  }, []);

  const unsubscribeFromOrder = useCallback((orderId: string) => {
    if (!socketRef.current?.connected) {
      return;
    }

    // Leave the order room
    const room = `orders:${orderId}`;
    socketRef.current.emit('leave-room', room);
  }, []);

  const subscribeToPortfolio = useCallback((address: string) => {
    if (!socketRef.current?.connected) {
      console.warn('WebSocket not connected, cannot subscribe to portfolio');
      return;
    }

    socketRef.current.emit('subscribe-portfolio', address);
  }, []);

  const unsubscribeFromPortfolio = useCallback((address: string) => {
    if (!socketRef.current?.connected) {
      return;
    }

    // Leave the portfolio room
    const room = `portfolio:${address}`;
    socketRef.current.emit('leave-room', room);
  }, []);

  const requestSwapQuote = useCallback((data: {
    fromToken: string;
    toToken: string;
    amount: string;
    fromAddress: string;
    chainId?: number;
  }) => {
    if (!socketRef.current?.connected) {
      console.warn('WebSocket not connected, cannot request swap quote');
      return;
    }

    socketRef.current.emit('get-swap-quote', data);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    subscribeToPrices,
    unsubscribeFromPrices,
    subscribeToOrder,
    unsubscribeFromOrder,
    subscribeToPortfolio,
    unsubscribeFromPortfolio,
    requestSwapQuote,
  };
} 