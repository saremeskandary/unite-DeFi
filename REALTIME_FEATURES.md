# Real-Time Features Documentation

This document describes the real-time WebSocket features implemented in the Unite DeFi platform.

## 🚀 Overview

The platform now includes comprehensive real-time functionality powered by WebSocket connections, providing live updates for:

- **Real-time Price Updates**: Live cryptocurrency price feeds
- **Live Order Status**: Real-time order monitoring and status updates
- **Portfolio Updates**: Live portfolio value and asset tracking
- **Push Notifications**: Browser notifications for important events

## 📡 WebSocket Architecture

### Server-Side Implementation

The WebSocket server is implemented using Socket.IO and provides the following features:

- **Connection Management**: Automatic reconnection with exponential backoff
- **Room-based Subscriptions**: Efficient broadcasting to specific clients
- **Event-driven Updates**: Real-time data streaming
- **Fallback Support**: Graceful degradation when WebSocket is unavailable

### Client-Side Implementation

The client uses a React-based architecture with:

- **WebSocket Provider**: Global WebSocket context for the entire app
- **Specialized Hooks**: Custom hooks for different types of real-time data
- **Fallback Polling**: Automatic fallback to REST API when WebSocket is down
- **Error Handling**: Comprehensive error handling and recovery

## 🛠️ Setup Instructions

### 1. Start the WebSocket Server

```bash
# Start the WebSocket server
pnpm websocket

# Or for development with auto-restart
pnpm websocket:dev
```

The server will start on port 3001 by default. You can change this by setting the `WEBSOCKET_PORT` environment variable.

### 2. Configure Environment Variables

Add the following to your `.env.local`:

```env
NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:3001
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

### 3. Test Real-Time Features

Visit `/test-realtime` to test all real-time features:

```bash
pnpm dev
# Then navigate to http://localhost:3000/test-realtime
```

## 📊 Available Real-Time Features

### 1. Real-Time Price Ticker

**Component**: `PriceTicker`

**Features**:

- Live price updates every 30 seconds
- 24h price change indicators
- Volume and market cap data
- Add/remove symbols dynamically
- Offline indicator when WebSocket is disconnected

**Usage**:

```tsx
import { PriceTicker } from "@/components/ui/price-ticker";

<PriceTicker
  symbols={["BTC", "ETH", "USDC"]}
  showChange={true}
  showVolume={true}
  compact={false}
/>;
```

### 2. Live Order Status

**Component**: `OrderStatusLive`

**Features**:

- Real-time order status updates every 10 seconds
- Progress indicators with visual feedback
- Transaction details (gas used, block number, hash)
- Status badges with appropriate colors
- Manual refresh capability

**Usage**:

```tsx
import { OrderStatusLive } from "@/components/ui/order-status-live";

<OrderStatusLive orderId="order-12345" showDetails={true} autoRefresh={true} />;
```

### 3. Real-Time Portfolio

**Component**: `PortfolioLive`

**Features**:

- Live portfolio value updates every minute
- Asset allocation visualization
- Individual asset performance tracking
- Total portfolio change indicators
- Top assets display with configurable limits

**Usage**:

```tsx
import { PortfolioLive } from "@/components/ui/portfolio-live";

<PortfolioLive
  address="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
  showAssets={true}
  maxAssets={5}
  autoRefresh={true}
/>;
```

### 4. Push Notifications

**Hook**: `usePushNotifications`

**Features**:

- Browser notification support
- Toast notifications as fallback
- Configurable notification types
- Action buttons for notifications
- Permission management

**Usage**:

```tsx
import { usePushNotifications } from "@/hooks/usePushNotifications";

const {
  isSupported,
  isEnabled,
  subscribe,
  showPriceAlert,
  showOrderUpdate,
  showPortfolioUpdate,
  showSwapComplete,
} = usePushNotifications();

// Enable notifications
await subscribe();

// Show notifications
showPriceAlert("BTC", 45000, 2.5);
showOrderUpdate("order-123", "confirmed", "Transaction successful");
```

## 🔧 Custom Hooks

### useWebSocket

Base WebSocket hook providing connection management and core functionality.

```tsx
import { useWebSocket } from "@/hooks/useWebSocket";

const {
  isConnected,
  isConnecting,
  error,
  connect,
  disconnect,
  subscribeToPrices,
  subscribeToOrder,
  subscribeToPortfolio,
} = useWebSocket();
```

### useRealTimePrices

Specialized hook for real-time price updates with fallback polling.

```tsx
import { useRealTimePrices } from "@/hooks/useRealTimePrices";

const {
  prices,
  isLoading,
  error,
  isConnected,
  subscribe,
  unsubscribe,
  refresh,
} = useRealTimePrices({
  symbols: ["BTC", "ETH"],
  autoSubscribe: true,
  updateInterval: 30000,
});
```

### useRealTimeOrders

Specialized hook for real-time order status updates.

```tsx
import { useRealTimeOrders } from "@/hooks/useRealTimeOrders";

const {
  orders,
  isLoading,
  error,
  isConnected,
  subscribe,
  unsubscribe,
  refresh,
} = useRealTimeOrders({
  orderIds: ["order-123", "order-456"],
  autoSubscribe: true,
  updateInterval: 10000,
});
```

### useRealTimePortfolio

Specialized hook for real-time portfolio updates.

```tsx
import { useRealTimePortfolio } from "@/hooks/useRealTimePortfolio";

const {
  portfolio,
  isLoading,
  error,
  isConnected,
  subscribe,
  unsubscribe,
  refresh,
} = useRealTimePortfolio({
  address: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  autoSubscribe: true,
  updateInterval: 60000,
});
```

## 📡 WebSocket Events

### Client to Server Events

- `subscribe-prices`: Subscribe to price updates for specific symbols
- `subscribe-orders`: Subscribe to order updates for specific order ID
- `subscribe-portfolio`: Subscribe to portfolio updates for specific address
- `get-swap-quote`: Request swap quote via WebSocket
- `leave-room`: Leave a specific subscription room

### Server to Client Events

- `price-update`: Real-time price updates
- `order-update`: Real-time order status updates
- `portfolio-update`: Real-time portfolio updates
- `swap-quote`: Swap quote responses
- `error`: Error messages

## 🔄 Fallback Strategy

When WebSocket connections are unavailable, the system automatically falls back to:

1. **REST API Polling**: Regular HTTP requests to fetch data
2. **Toast Notifications**: Browser notifications become toast messages
3. **Offline Indicators**: Visual indicators show connection status
4. **Manual Refresh**: Users can manually refresh data

## 🧪 Testing

### Manual Testing

1. Start the WebSocket server: `pnpm websocket`
2. Start the development server: `pnpm dev`
3. Navigate to `/test-realtime`
4. Test each feature:
   - Connect/disconnect WebSocket
   - Enable/disable notifications
   - Add/remove price symbols
   - Monitor order status
   - View portfolio updates

### Automated Testing

The WebSocket functionality includes comprehensive tests:

```bash
# Run all tests
pnpm test

# Run WebSocket-specific tests
pnpm test --testPathPattern=websocket
```

## 🚨 Error Handling

The system handles various error scenarios:

- **Connection Failures**: Automatic reconnection with exponential backoff
- **Network Issues**: Graceful fallback to polling
- **Server Errors**: Error messages and retry mechanisms
- **Permission Denied**: Graceful degradation for notifications

## 📈 Performance Considerations

- **Connection Limits**: Maximum 10 symbols per price subscription
- **Update Intervals**: Configurable update frequencies
- **Memory Management**: Automatic cleanup of unused subscriptions
- **Bandwidth Optimization**: Efficient data serialization

## 🔒 Security

- **CORS Configuration**: Proper CORS setup for production
- **Input Validation**: All inputs are validated server-side
- **Rate Limiting**: Built-in rate limiting for API endpoints
- **Error Sanitization**: Errors are sanitized before sending to clients

## 🚀 Production Deployment

For production deployment:

1. **Set Environment Variables**:

   ```env
   NEXT_PUBLIC_WEBSOCKET_URL=wss://your-domain.com
   NEXT_PUBLIC_FRONTEND_URL=https://your-domain.com
   ```

2. **Configure Reverse Proxy**: Set up nginx or similar to proxy WebSocket connections

3. **Enable SSL**: Use WSS (WebSocket Secure) in production

4. **Monitor Connections**: Implement connection monitoring and logging

## 📚 Additional Resources

- [Socket.IO Documentation](https://socket.io/docs/)
- [WebSocket API Reference](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Browser Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)

## 🤝 Contributing

When adding new real-time features:

1. Follow the existing patterns for hooks and components
2. Implement proper error handling
3. Add fallback mechanisms
4. Include comprehensive tests
5. Update this documentation

---

For questions or issues with real-time features, please refer to the main project documentation or create an issue in the repository.
