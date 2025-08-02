# API Reference

Complete API documentation for the Unite DeFi cross-chain atomic swap protocol.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Testnet**: `https://testnet-api.unitedefi.com`
- **Mainnet**: `https://api.unitedefi.com`

## Authentication

Most endpoints require authentication via wallet signature. Include the following headers:

```http
Authorization: Bearer <wallet-signature>
Content-Type: application/json
```

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Error Handling

Errors follow this format:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Swap Operations

### Get Swap Quote

Get a quote for a cross-chain swap.

```http
POST /api/swap/quote
```

**Request Body:**

```json
{
  "fromToken": "ETH",
  "toToken": "BTC",
  "amount": "1.0",
  "fromChain": "ethereum",
  "toChain": "bitcoin",
  "slippage": 0.5
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "quoteId": "quote_123",
    "fromToken": "ETH",
    "toToken": "BTC",
    "fromAmount": "1.0",
    "toAmount": "0.00045",
    "rate": "0.00045",
    "slippage": 0.5,
    "estimatedGas": "150000",
    "expiresAt": "2024-01-01T00:05:00Z"
  }
}
```

### Execute Swap

Execute a cross-chain swap.

```http
POST /api/swap/execute
```

**Request Body:**

```json
{
  "quoteId": "quote_123",
  "fromAddress": "0x...",
  "toAddress": "bc1...",
  "slippage": 0.5
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "swapId": "swap_456",
    "status": "pending",
    "fromTxHash": "0x...",
    "estimatedTime": 300
  }
}
```

### Get Swap Status

Get the status of a swap.

```http
GET /api/swap/orders/:swapId
```

**Response:**

```json
{
  "success": true,
  "data": {
    "swapId": "swap_456",
    "status": "completed",
    "fromToken": "ETH",
    "toToken": "BTC",
    "fromAmount": "1.0",
    "toAmount": "0.00045",
    "fromTxHash": "0x...",
    "toTxHash": "txid...",
    "createdAt": "2024-01-01T00:00:00Z",
    "completedAt": "2024-01-01T00:03:00Z"
  }
}
```

## Wallet Operations

### Connect Wallet

Connect a wallet to the application.

```http
POST /api/wallet/connect
```

**Request Body:**

```json
{
  "address": "0x...",
  "signature": "0x...",
  "message": "Connect to Unite DeFi"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "address": "0x...",
    "chainId": 1,
    "connected": true
  }
}
```

### Get Wallet Balance

Get token balances for a wallet.

```http
GET /api/wallet/balance?address=0x...&chain=ethereum
```

**Response:**

```json
{
  "success": true,
  "data": {
    "address": "0x...",
    "chain": "ethereum",
    "balances": {
      "ETH": "1.5",
      "USDC": "1000.0",
      "USDT": "500.0"
    }
  }
}
```

### Disconnect Wallet

Disconnect a wallet.

```http
POST /api/wallet/disconnect
```

**Response:**

```json
{
  "success": true,
  "data": {
    "disconnected": true
  }
}
```

## Market Data

### Get Current Prices

Get current token prices.

```http
GET /api/prices?tokens=ETH,BTC,USDC
```

**Response:**

```json
{
  "success": true,
  "data": {
    "ETH": {
      "USD": 2500.0,
      "BTC": 0.00045
    },
    "BTC": {
      "USD": 45000.0,
      "ETH": 2222.22
    },
    "USDC": {
      "USD": 1.0,
      "ETH": 0.0004
    }
  }
}
```

### Get Price History

Get historical price data.

```http
GET /api/prices/history?token=ETH&period=24h&interval=1h
```

**Response:**

```json
{
  "success": true,
  "data": {
    "token": "ETH",
    "period": "24h",
    "interval": "1h",
    "prices": [
      {
        "timestamp": "2024-01-01T00:00:00Z",
        "price": 2500.0
      }
    ]
  }
}
```

## Order Management

### Get User Orders

Get all orders for a user.

```http
GET /api/orders?address=0x...&status=all&limit=10&offset=0
```

**Response:**

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "orderId": "order_123",
        "status": "completed",
        "fromToken": "ETH",
        "toToken": "BTC",
        "fromAmount": "1.0",
        "toAmount": "0.00045",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 25,
    "limit": 10,
    "offset": 0
  }
}
```

### Cancel Order

Cancel a pending order.

```http
POST /api/orders/:orderId/cancel
```

**Response:**

```json
{
  "success": true,
  "data": {
    "orderId": "order_123",
    "status": "cancelled",
    "cancelledAt": "2024-01-01T00:01:00Z"
  }
}
```

## WebSocket API

### Connection

Connect to WebSocket for real-time updates:

```javascript
const ws = new WebSocket("wss://api.unitedefi.com/ws");

ws.onopen = () => {
  console.log("Connected to WebSocket");
};
```

### Subscribe to Updates

Subscribe to specific updates:

```javascript
// Subscribe to swap updates
ws.send(
  JSON.stringify({
    type: "subscribe",
    channel: "swaps",
    swapId: "swap_456",
  })
);

// Subscribe to price updates
ws.send(
  JSON.stringify({
    type: "subscribe",
    channel: "prices",
    tokens: ["ETH", "BTC"],
  })
);
```

### Message Format

WebSocket messages follow this format:

```json
{
  "type": "update",
  "channel": "swaps",
  "data": {
    "swapId": "swap_456",
    "status": "completed"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Rate Limits

- **Public endpoints**: 100 requests per minute
- **Authenticated endpoints**: 1000 requests per minute
- **WebSocket connections**: 10 concurrent connections per IP

## Error Codes

| Code                      | Description                   |
| ------------------------- | ----------------------------- |
| `INVALID_SIGNATURE`       | Invalid wallet signature      |
| `INSUFFICIENT_BALANCE`    | Insufficient token balance    |
| `QUOTE_EXPIRED`           | Quote has expired             |
| `SLIPPAGE_EXCEEDED`       | Price slippage exceeded limit |
| `NETWORK_ERROR`           | Network connection error      |
| `INVALID_ADDRESS`         | Invalid wallet address        |
| `ORDER_NOT_FOUND`         | Order not found               |
| `ORDER_ALREADY_COMPLETED` | Order already completed       |

## SDK Examples

### JavaScript/TypeScript

```typescript
import { UniteDeFiAPI } from "@unitedefi/sdk";

const api = new UniteDeFiAPI({
  baseUrl: "https://api.unitedefi.com",
  apiKey: "your-api-key",
});

// Get quote
const quote = await api.getQuote({
  fromToken: "ETH",
  toToken: "BTC",
  amount: "1.0",
});

// Execute swap
const swap = await api.executeSwap({
  quoteId: quote.quoteId,
  fromAddress: "0x...",
  toAddress: "bc1...",
});
```

## Related Documentation

- [Error Handling Guide](./ERROR_HANDLING.md) - Detailed error handling
- [WebSocket API](./WEBSOCKET_API.md) - Real-time communication
- [SDK Documentation](../integrations/sdk/) - Client libraries
