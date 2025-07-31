'use client';

import React, { useEffect, useState } from 'react';
import { useWebSocketContext } from '@/components/providers/websocket-provider';
import { PriceUpdate } from '@/hooks/useWebSocket';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriceTickerProps {
  symbols: string[];
  className?: string;
  showChange?: boolean;
  showVolume?: boolean;
  compact?: boolean;
}

export function PriceTicker({
  symbols,
  className,
  showChange = true,
  showVolume = false,
  compact = false,
}: PriceTickerProps) {
  const [prices, setPrices] = useState<Map<string, PriceUpdate>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const {
    isConnected,
    subscribeToPrices,
    unsubscribeFromPrices,
  } = useWebSocketContext();

  useEffect(() => {
    if (!isConnected || symbols.length === 0) {
      return;
    }

    const handlePriceUpdate = (priceUpdates: PriceUpdate[]) => {
      const newPrices = new Map(prices);
      priceUpdates.forEach(update => {
        newPrices.set(update.symbol, update);
      });
      setPrices(newPrices);
      setIsLoading(false);
      setError(null);
    };

    subscribeToPrices(symbols, handlePriceUpdate);

    return () => {
      unsubscribeFromPrices(symbols);
    };
  }, [isConnected, symbols, subscribeToPrices, unsubscribeFromPrices, prices]);

  const formatPrice = (price: number) => {
    if (price >= 1) {
      return `$${price.toFixed(2)}`;
    } else if (price >= 0.01) {
      return `$${price.toFixed(4)}`;
    } else {
      return `$${price.toFixed(6)}`;
    }
  };

  const formatChange = (change: number) => {
    const isPositive = change >= 0;
    const sign = isPositive ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) {
      return `$${(volume / 1e9).toFixed(1)}B`;
    } else if (volume >= 1e6) {
      return `$${(volume / 1e6).toFixed(1)}M`;
    } else if (volume >= 1e3) {
      return `$${(volume / 1e3).toFixed(1)}K`;
    } else {
      return `$${volume.toFixed(0)}`;
    }
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="w-3 h-3 text-green-500" />;
    } else if (change < 0) {
      return <TrendingDown className="w-3 h-3 text-red-500" />;
    } else {
      return <Minus className="w-3 h-3 text-gray-500" />;
    }
  };

  const getChangeColor = (change: number) => {
    if (change > 0) {
      return 'text-green-600 bg-green-50 border-green-200';
    } else if (change < 0) {
      return 'text-red-600 bg-red-50 border-red-200';
    } else {
      return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (error) {
    return (
      <Card className={cn('border-red-200 bg-red-50', className)}>
        <CardContent className="p-4">
          <p className="text-red-600 text-sm">Failed to load prices: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            {symbols.map((symbol) => (
              <div key={symbol} className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('border-0 shadow-sm', className)}>
      <CardContent className={cn('p-0', compact ? 'p-2' : 'p-4')}>
        <div className={cn(
          'flex items-center space-x-4 overflow-x-auto',
          compact ? 'space-x-2' : 'space-x-4'
        )}>
          {symbols.map((symbol) => {
            const priceData = prices.get(symbol);
            
            if (!priceData) {
              return (
                <div key={symbol} className="flex items-center space-x-2 min-w-0">
                  <span className="font-medium text-sm text-gray-500">{symbol}</span>
                  <span className="text-sm text-gray-400">--</span>
                </div>
              );
            }

            return (
              <div key={symbol} className="flex items-center space-x-2 min-w-0">
                <span className="font-medium text-sm text-gray-900">{symbol}</span>
                <span className="text-sm font-mono text-gray-900">
                  {formatPrice(priceData.price)}
                </span>
                
                {showChange && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs font-medium border',
                      getChangeColor(priceData.change24h)
                    )}
                  >
                    <div className="flex items-center space-x-1">
                      {getChangeIcon(priceData.change24h)}
                      <span>{formatChange(priceData.change24h)}</span>
                    </div>
                  </Badge>
                )}
                
                {showVolume && (
                  <span className="text-xs text-gray-500">
                    Vol: {formatVolume(priceData.volume24h)}
                  </span>
                )}
              </div>
            );
          })}
          
          {!isConnected && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              <span className="text-xs text-yellow-600">Offline</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 