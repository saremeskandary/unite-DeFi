'use client';

import React, { useEffect, useState } from 'react';
import { useWebSocketContext } from '@/components/providers/websocket-provider';
import { OrderUpdate } from '@/hooks/useWebSocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ExternalLink,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderStatusLiveProps {
  orderId: string;
  className?: string;
  showDetails?: boolean;
  autoRefresh?: boolean;
}

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    progress: 25,
  },
  processing: {
    label: 'Processing',
    icon: Loader2,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    progress: 50,
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 border-green-200',
    progress: 100,
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    color: 'bg-red-100 text-red-800 border-red-200',
    progress: 0,
  },
};

export function OrderStatusLive({
  orderId,
  className,
  showDetails = true,
  autoRefresh = true,
}: OrderStatusLiveProps) {
  const [orderData, setOrderData] = useState<OrderUpdate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const {
    isConnected,
    subscribeToOrder,
    unsubscribeFromOrder,
  } = useWebSocketContext();

  useEffect(() => {
    if (!orderId) {
      return;
    }

    const handleOrderUpdate = (update: OrderUpdate) => {
      setOrderData(update);
      setLastUpdate(new Date());
      setIsLoading(false);
      setError(null);
    };

    if (isConnected) {
      subscribeToOrder(orderId, handleOrderUpdate);
    } else {
      // Fallback to polling if WebSocket is not connected
      fetchOrderStatus();
    }

    return () => {
      if (isConnected) {
        unsubscribeFromOrder(orderId);
      }
    };
  }, [orderId, isConnected, subscribeToOrder, unsubscribeFromOrder]);

  const fetchOrderStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order status');
      }

      const data = await response.json();
      setOrderData({
        orderId: data.orderId,
        status: data.status,
        timestamp: data.timestamp,
        gasUsed: data.gasUsed,
        blockNumber: data.blockNumber,
        transactionHash: data.transactionHash,
      });
      setLastUpdate(new Date());
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStatus = () => {
    fetchOrderStatus();
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatBlockNumber = (blockNumber?: number) => {
    if (!blockNumber) return '--';
    return `#${blockNumber.toLocaleString()}`;
  };

  const formatGasUsed = (gasUsed?: number) => {
    if (!gasUsed) return '--';
    return gasUsed.toLocaleString();
  };

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  };

  if (error) {
    return (
      <Card className={cn('border-red-200 bg-red-50', className)}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-red-600 text-sm">Failed to load order status: {error.message}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshStatus}
            className="mt-2"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading && !orderData) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm text-gray-600">Loading order status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!orderData) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <p className="text-sm text-gray-600">Order not found</p>
        </CardContent>
      </Card>
    );
  }

  const statusConfig = getStatusConfig(orderData.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Order {orderId.slice(0, 8)}...
          </CardTitle>
          <div className="flex items-center space-x-2">
            {!isConnected && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                <span className="text-xs text-yellow-600">Offline</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshStatus}
              disabled={isLoading}
            >
              <RefreshCw className={cn('w-3 h-3', isLoading && 'animate-spin')} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center space-x-2">
          <Badge
            variant="outline"
            className={cn('font-medium', statusConfig.color)}
          >
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusConfig.label}
          </Badge>
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              Updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Progress</span>
            <span>{statusConfig.progress}%</span>
          </div>
          <Progress value={statusConfig.progress} className="h-2" />
        </div>

        {/* Order Details */}
        {showDetails && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Timestamp:</span>
              <span className="font-mono">{formatTimestamp(orderData.timestamp)}</span>
            </div>
            
            {orderData.blockNumber && (
              <div className="flex justify-between">
                <span className="text-gray-600">Block:</span>
                <span className="font-mono">{formatBlockNumber(orderData.blockNumber)}</span>
              </div>
            )}
            
            {orderData.gasUsed && (
              <div className="flex justify-between">
                <span className="text-gray-600">Gas Used:</span>
                <span className="font-mono">{formatGasUsed(orderData.gasUsed)}</span>
              </div>
            )}
            
            {orderData.transactionHash && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Transaction:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={() => window.open(`https://etherscan.io/tx/${orderData.transactionHash}`, '_blank')}
                >
                  {orderData.transactionHash.slice(0, 8)}...
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 