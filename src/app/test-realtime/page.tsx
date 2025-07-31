'use client';

import React, { useState } from 'react';
import { PriceTicker } from '@/components/ui/price-ticker';
import { OrderStatusLive } from '@/components/ui/order-status-live';
import { PortfolioLive } from '@/components/ui/portfolio-live';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useWebSocketContext } from '@/components/providers/websocket-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Wifi, 
  WifiOff, 
  Bell, 
  BellOff, 
  Play, 
  Pause,
  Zap,
  Activity,
  TrendingUp,
  Wallet,
  Clock
} from 'lucide-react';

export default function TestRealtimePage() {
  const [selectedOrderId, setSelectedOrderId] = useState('order-12345');
  const [selectedAddress, setSelectedAddress] = useState('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6');
  const [priceSymbols, setPriceSymbols] = useState(['BTC', 'ETH', 'USDC', 'USDT']);
  const [newSymbol, setNewSymbol] = useState('');

  const {
    isConnected,
    isConnecting,
    error: wsError,
    connect,
    disconnect,
  } = useWebSocketContext();

  const {
    isSupported: notificationsSupported,
    isEnabled: notificationsEnabled,
    isSubscribed: notificationsSubscribed,
    enable: enableNotifications,
    disable: disableNotifications,
    subscribe: subscribeNotifications,
    unsubscribe: unsubscribeNotifications,
    showPriceAlert,
    showOrderUpdate,
    showPortfolioUpdate,
    showSwapComplete,
  } = usePushNotifications();

  const handleAddSymbol = () => {
    if (newSymbol && !priceSymbols.includes(newSymbol.toUpperCase())) {
      setPriceSymbols([...priceSymbols, newSymbol.toUpperCase()]);
      setNewSymbol('');
    }
  };

  const handleRemoveSymbol = (symbol: string) => {
    setPriceSymbols(priceSymbols.filter(s => s !== symbol));
  };

  const testNotifications = () => {
    showPriceAlert('BTC', 45000, 2.5);
    setTimeout(() => showOrderUpdate('order-12345', 'confirmed', 'Transaction successful'), 1000);
    setTimeout(() => showPortfolioUpdate(125000, 1.8), 2000);
    setTimeout(() => showSwapComplete('ETH', 'BTC', '1.5'), 3000);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Real-Time Features Demo</h1>
        <p className="text-gray-600">
          Test WebSocket connections, real-time updates, and push notifications
        </p>
      </div>

      {/* WebSocket Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>WebSocket Connection</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className="font-medium">
                Status: {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
              </span>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={connect}
                disabled={isConnected || isConnecting}
                size="sm"
              >
                <Play className="w-4 h-4 mr-1" />
                Connect
              </Button>
              <Button
                onClick={disconnect}
                disabled={!isConnected}
                variant="outline"
                size="sm"
              >
                <Pause className="w-4 h-4 mr-1" />
                Disconnect
              </Button>
            </div>
          </div>
          
          {wsError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">Error: {wsError.message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Push Notifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {notificationsSubscribed ? (
                <Bell className="w-4 h-4 text-green-500" />
              ) : (
                <BellOff className="w-4 h-4 text-gray-400" />
              )}
              <span className="font-medium">
                Status: {notificationsSubscribed ? 'Subscribed' : 'Not Subscribed'}
              </span>
            </div>
            <div className="flex space-x-2">
              {notificationsSupported ? (
                <>
                  <Button
                    onClick={subscribeNotifications}
                    disabled={notificationsSubscribed}
                    size="sm"
                  >
                    Enable
                  </Button>
                  <Button
                    onClick={unsubscribeNotifications}
                    disabled={!notificationsSubscribed}
                    variant="outline"
                    size="sm"
                  >
                    Disable
                  </Button>
                </>
              ) : (
                <Badge variant="secondary">Not Supported</Badge>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={testNotifications} size="sm" variant="outline">
              <Zap className="w-4 h-4 mr-1" />
              Test Notifications
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Real-Time Price Ticker */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Real-Time Price Ticker</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Add symbol (e.g., SOL)"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSymbol()}
              className="max-w-xs"
            />
            <Button onClick={handleAddSymbol} size="sm">
              Add
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {priceSymbols.map((symbol) => (
              <Badge
                key={symbol}
                variant="outline"
                className="cursor-pointer hover:bg-red-50"
                onClick={() => handleRemoveSymbol(symbol)}
              >
                {symbol} ×
              </Badge>
            ))}
          </div>
          
          <PriceTicker
            symbols={priceSymbols}
            showChange={true}
            showVolume={true}
            className="border rounded-lg"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-Time Order Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Real-Time Order Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="orderId">Order ID:</Label>
              <Input
                id="orderId"
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="flex-1"
              />
            </div>
            
            <OrderStatusLive
              orderId={selectedOrderId}
              showDetails={true}
              autoRefresh={true}
            />
          </CardContent>
        </Card>

        {/* Real-Time Portfolio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wallet className="w-5 h-5" />
              <span>Real-Time Portfolio</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="address">Wallet Address:</Label>
              <Input
                id="address"
                value={selectedAddress}
                onChange={(e) => setSelectedAddress(e.target.value)}
                className="flex-1"
              />
            </div>
            
            <PortfolioLive
              address={selectedAddress}
              showAssets={true}
              maxAssets={3}
              autoRefresh={true}
            />
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h4 className="font-medium">1. WebSocket Connection</h4>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• Click "Connect" to establish WebSocket connection</li>
              <li>• Watch for real-time updates in price ticker, order status, and portfolio</li>
              <li>• The connection status indicator shows if you're online/offline</li>
            </ul>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h4 className="font-medium">2. Push Notifications</h4>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• Click "Enable" to request notification permissions</li>
              <li>• Click "Test Notifications" to see sample notifications</li>
              <li>• Notifications will appear as browser notifications and toast messages</li>
            </ul>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h4 className="font-medium">3. Real-Time Features</h4>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• <strong>Price Ticker:</strong> Add/remove symbols to watch real-time prices</li>
              <li>• <strong>Order Status:</strong> Enter an order ID to monitor its status</li>
              <li>• <strong>Portfolio:</strong> Enter a wallet address to view real-time portfolio</li>
              <li>• All components show offline indicators when WebSocket is disconnected</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 