'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { WebSocketMessage, PriceUpdate, OrderUpdate, PortfolioUpdate, SwapQuote } from '@/types/websocket';

interface WebSocketContextType {
    isConnected: boolean;
    isConnecting: boolean;
    error: Error | null;
    connect: () => void;
    disconnect: () => void;
    subscribeToPrices: (symbols: string[], callback: (data: PriceUpdate[]) => void) => void;
    unsubscribeFromPrices: (symbols: string[]) => void;
    subscribeToOrder: (orderId: string, callback: (data: OrderUpdate) => void) => void;
    unsubscribeFromOrder: (orderId: string) => void;
    subscribeToPortfolio: (address: string, callback: (data: PortfolioUpdate) => void) => void;
    unsubscribeFromPortfolio: (address: string) => void;
    requestSwapQuote: (data: {
        fromToken: string;
        toToken: string;
        amount: string;
        fromAddress: string;
        chainId?: number;
    }, callback: (data: SwapQuote) => void) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
    children: React.ReactNode;
    autoConnect?: boolean;
    reconnectAttempts?: number;
    reconnectDelay?: number;
}

export function WebSocketProvider({
    children,
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 1000,
}: WebSocketProviderProps) {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const socketRef = useRef<Socket | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const priceCallbacksRef = useRef<Map<string, (data: PriceUpdate[]) => void>>(new Map());
    const orderCallbacksRef = useRef<Map<string, (data: OrderUpdate) => void>>(new Map());
    const portfolioCallbacksRef = useRef<Map<string, (data: PortfolioUpdate) => void>>(new Map());
    const swapQuoteCallbacksRef = useRef<Map<string, (data: SwapQuote) => void>>(new Map());

    const getWebSocketUrl = () => {
        return process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001';
    };

    const connect = () => {
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

            // Handle price updates
            socket.on('price-update', (data: WebSocketMessage) => {
                try {
                    const priceUpdates: PriceUpdate[] = Object.entries(data.data).map(([symbol, priceData]: [string, any]) => ({
                        symbol,
                        price: priceData.price,
                        change24h: priceData.change24h,
                        volume24h: priceData.volume24h,
                        marketCap: priceData.marketCap,
                    }));

                    // Call all registered callbacks
                    priceCallbacksRef.current.forEach(callback => {
                        callback(priceUpdates);
                    });
                } catch (err) {
                    console.error('Error handling price update:', err);
                }
            });

            // Handle order updates
            socket.on('order-update', (data: WebSocketMessage) => {
                try {
                    const orderUpdate = data.data as OrderUpdate;

                    // Call the specific callback for this order
                    const callback = orderCallbacksRef.current.get(orderUpdate.orderId);
                    if (callback) {
                        callback(orderUpdate);
                    }
                } catch (err) {
                    console.error('Error handling order update:', err);
                }
            });

            // Handle portfolio updates
            socket.on('portfolio-update', (data: WebSocketMessage) => {
                try {
                    const portfolioUpdate = data.data as PortfolioUpdate;

                    // Call the specific callback for this address
                    const callback = portfolioCallbacksRef.current.get(portfolioUpdate.assets[0]?.symbol || '');
                    if (callback) {
                        callback(portfolioUpdate);
                    }
                } catch (err) {
                    console.error('Error handling portfolio update:', err);
                }
            });

            // Handle swap quotes
            socket.on('swap-quote', (data: WebSocketMessage) => {
                try {
                    const swapQuote = data.data as SwapQuote;
                    const quoteId = `${swapQuote.fromToken}-${swapQuote.toToken}-${swapQuote.fromAmount}`;

                    // Call the specific callback for this quote
                    const callback = swapQuoteCallbacksRef.current.get(quoteId);
                    if (callback) {
                        callback(swapQuote);
                    }
                } catch (err) {
                    console.error('Error handling swap quote:', err);
                }
            });

            socketRef.current = socket;
        } catch (err) {
            console.error('Failed to create WebSocket connection:', err);
            setError(err as Error);
            setIsConnecting(false);
        }
    };

    const disconnect = () => {
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
    };

    const subscribeToPrices = (symbols: string[], callback: (data: PriceUpdate[]) => void) => {
        if (!socketRef.current?.connected) {
            console.warn('WebSocket not connected, cannot subscribe to prices');
            return;
        }

        const roomKey = symbols.join(',');
        priceCallbacksRef.current.set(roomKey, callback);
        socketRef.current.emit('subscribe-prices', symbols);
    };

    const unsubscribeFromPrices = (symbols: string[]) => {
        if (!socketRef.current?.connected) {
            return;
        }

        const roomKey = symbols.join(',');
        priceCallbacksRef.current.delete(roomKey);
        const room = `prices:${roomKey}`;
        socketRef.current.emit('leave-room', room);
    };

    const subscribeToOrder = (orderId: string, callback: (data: OrderUpdate) => void) => {
        if (!socketRef.current?.connected) {
            console.warn('WebSocket not connected, cannot subscribe to order');
            return;
        }

        orderCallbacksRef.current.set(orderId, callback);
        socketRef.current.emit('subscribe-orders', orderId);
    };

    const unsubscribeFromOrder = (orderId: string) => {
        if (!socketRef.current?.connected) {
            return;
        }

        orderCallbacksRef.current.delete(orderId);
        const room = `orders:${orderId}`;
        socketRef.current.emit('leave-room', room);
    };

    const subscribeToPortfolio = (address: string, callback: (data: PortfolioUpdate) => void) => {
        if (!socketRef.current?.connected) {
            console.warn('WebSocket not connected, cannot subscribe to portfolio');
            return;
        }

        portfolioCallbacksRef.current.set(address, callback);
        socketRef.current.emit('subscribe-portfolio', address);
    };

    const unsubscribeFromPortfolio = (address: string) => {
        if (!socketRef.current?.connected) {
            return;
        }

        portfolioCallbacksRef.current.delete(address);
        const room = `portfolio:${address}`;
        socketRef.current.emit('leave-room', room);
    };

    const requestSwapQuote = (data: {
        fromToken: string;
        toToken: string;
        amount: string;
        fromAddress: string;
        chainId?: number;
    }, callback: (data: SwapQuote) => void) => {
        if (!socketRef.current?.connected) {
            console.warn('WebSocket not connected, cannot request swap quote');
            return;
        }

        const quoteId = `${data.fromToken}-${data.toToken}-${data.amount}`;
        swapQuoteCallbacksRef.current.set(quoteId, callback);
        socketRef.current.emit('get-swap-quote', data);
    };

    // Auto-connect on mount
    useEffect(() => {
        if (autoConnect) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [autoConnect]);

    const value: WebSocketContextType = {
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

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
}

export function useWebSocketContext() {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocketContext must be used within a WebSocketProvider');
    }
    return context;
} 