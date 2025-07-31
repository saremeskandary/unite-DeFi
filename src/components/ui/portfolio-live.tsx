'use client';

import React, { useEffect, useState } from 'react';
import { useWebSocketContext } from '@/components/providers/websocket-provider';
import { PortfolioUpdate } from '@/hooks/useWebSocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  RefreshCw,
  AlertCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PortfolioLiveProps {
  address: string;
  className?: string;
  showAssets?: boolean;
  maxAssets?: number;
  autoRefresh?: boolean;
}

export function PortfolioLive({
  address,
  className,
  showAssets = true,
  maxAssets = 5,
  autoRefresh = true,
}: PortfolioLiveProps) {
  const [portfolioData, setPortfolioData] = useState<PortfolioUpdate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const {
    isConnected,
    subscribeToPortfolio,
    unsubscribeFromPortfolio,
  } = useWebSocketContext();

  useEffect(() => {
    if (!address) {
      return;
    }

    const handlePortfolioUpdate = (update: PortfolioUpdate) => {
      setPortfolioData(update);
      setLastUpdate(new Date());
      setIsLoading(false);
      setError(null);
    };

    if (isConnected) {
      subscribeToPortfolio(address, handlePortfolioUpdate);
    } else {
      // Fallback to polling if WebSocket is not connected
      fetchPortfolio();
    }

    return () => {
      if (isConnected) {
        unsubscribeFromPortfolio(address);
      }
    };
  }, [address, isConnected, subscribeToPortfolio, unsubscribeFromPortfolio]);

  const fetchPortfolio = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/portfolio/${address}`);
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio');
      }

      const data = await response.json();
      setPortfolioData({
        totalValue: data.totalValue,
        assets: data.assets,
        timestamp: new Date().toISOString(),
      });
      setLastUpdate(new Date());
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPortfolio = () => {
    fetchPortfolio();
  };

  const formatValue = (value: number) => {
    if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`;
    } else if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(2)}K`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  };

  const formatChange = (change: number) => {
    const isPositive = change >= 0;
    const sign = isPositive ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const formatBalance = (balance: number, symbol: string) => {
    if (balance >= 1e6) {
      return `${(balance / 1e6).toFixed(2)}M ${symbol}`;
    } else if (balance >= 1e3) {
      return `${(balance / 1e3).toFixed(2)}K ${symbol}`;
    } else {
      return `${balance.toFixed(4)} ${symbol}`;
    }
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="w-3 h-3 text-green-500" />;
    } else if (change < 0) {
      return <TrendingDown className="w-3 h-3 text-red-500" />;
    } else {
      return null;
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

  const getTotalChange = () => {
    if (!portfolioData) return 0;
    
    const totalChange = portfolioData.assets.reduce((acc, asset) => {
      return acc + (asset.change24h * asset.value) / portfolioData.totalValue;
    }, 0);
    
    return totalChange;
  };

  if (error) {
    return (
      <Card className={cn('border-red-200 bg-red-50', className)}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-red-600 text-sm">Failed to load portfolio: {error.message}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshPortfolio}
            className="mt-2"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading && !portfolioData) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm text-gray-600">Loading portfolio...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!portfolioData) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <p className="text-sm text-gray-600">Portfolio not found</p>
        </CardContent>
      </Card>
    );
  }

  const totalChange = getTotalChange();
  const sortedAssets = [...portfolioData.assets]
    .sort((a, b) => b.value - a.value)
    .slice(0, maxAssets);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <Wallet className="w-4 h-4" />
            <span>Portfolio</span>
            <span className="text-xs text-gray-500 font-normal">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
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
              onClick={refreshPortfolio}
              disabled={isLoading}
            >
              <RefreshCw className={cn('w-3 h-3', isLoading && 'animate-spin')} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Total Value */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total Value</span>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold">
                {formatValue(portfolioData.totalValue)}
              </span>
              <Badge
                variant="outline"
                className={cn('text-xs font-medium', getChangeColor(totalChange))}
              >
                <div className="flex items-center space-x-1">
                  {getChangeIcon(totalChange)}
                  <span>{formatChange(totalChange)}</span>
                </div>
              </Badge>
            </div>
          </div>
          
          {lastUpdate && (
            <p className="text-xs text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Assets */}
        {showAssets && sortedAssets.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Top Assets</h4>
            <div className="space-y-2">
              {sortedAssets.map((asset) => {
                const percentage = (asset.value / portfolioData.totalValue) * 100;
                
                return (
                  <div key={asset.symbol} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{asset.symbol}</span>
                        <span className="text-gray-500">
                          {formatBalance(asset.balance, asset.symbol)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono">{formatValue(asset.value)}</span>
                        <Badge
                          variant="outline"
                          className={cn('text-xs', getChangeColor(asset.change24h))}
                        >
                          <div className="flex items-center space-x-1">
                            {getChangeIcon(asset.change24h)}
                            <span>{formatChange(asset.change24h)}</span>
                          </div>
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Allocation</span>
                        <span>{percentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={percentage} className="h-1" />
                    </div>
                  </div>
                );
              })}
            </div>
            
            {portfolioData.assets.length > maxAssets && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => window.open('/portfolio', '_blank')}
              >
                View All {portfolioData.assets.length} Assets
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 