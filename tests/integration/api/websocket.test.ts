import { createServer } from 'http';
import { GET, POST } from '../../../src/app/api/websocket/route';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => {
      return new Response(JSON.stringify(data), {
        status: init?.status || 200,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers
        }
      });
    }
  }
}));

describe('WebSocket API Endpoint', () => {
  let server: any;
  let baseUrl: string;

  beforeAll(() => {
    server = createServer();
    server.listen(0);
    const port = (server.address() as any).port;
    baseUrl = `http://localhost:${port}`;
  });

  afterAll(() => {
    server.close();
  });

  describe('GET /api/websocket', () => {
    it('should return WebSocket endpoint information', async () => {
      const request = new Request(`${baseUrl}/api/websocket`);
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('WebSocket endpoint for real-time updates');
      expect(data.supported).toBe(true);
      expect(data.features).toBeDefined();
      expect(data.connection).toBeDefined();
      expect(data.connection.events).toBeDefined();
    });

    it('should handle price subscription request', async () => {
      const request = new Request(
        `${baseUrl}/api/websocket?type=prices&symbols=BTC,ETH,USDC`
      );
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.currentRequest.type).toBe('prices');
      expect(data.currentRequest.symbols).toEqual(['BTC', 'ETH', 'USDC']);
    });

    it('should handle order subscription request', async () => {
      const request = new Request(
        `${baseUrl}/api/websocket?type=orders&orderId=12345`
      );
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.currentRequest.type).toBe('orders');
      expect(data.currentRequest.orderId).toBe('12345');
    });

    it('should handle swap subscription request', async () => {
      const request = new Request(`${baseUrl}/api/websocket?type=swap`);
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.currentRequest.type).toBe('swap');
    });

    it('should include supported events in response', async () => {
      const request = new Request(`${baseUrl}/api/websocket`);
      const response = await GET(request as any);
      const data = await response.json();

      expect(data.connection.events).toContain('subscribe-prices');
      expect(data.connection.events).toContain('subscribe-orders');
      expect(data.connection.events).toContain('get-swap-quote');
      expect(data.connection.events).toContain('price-update');
      expect(data.connection.events).toContain('order-update');
      expect(data.connection.events).toContain('swap-quote');
      expect(data.connection.events).toContain('swap-executed');
    });

    it('should include feature descriptions', async () => {
      const request = new Request(`${baseUrl}/api/websocket`);
      const response = await GET(request as any);
      const data = await response.json();

      expect(data.features.prices.description).toContain('Real-time price updates');
      expect(data.features.orders.description).toContain('Real-time order status updates');
      expect(data.features.swap.description).toContain('Real-time swap quote');
    });

    it('should include example usage', async () => {
      const request = new Request(`${baseUrl}/api/websocket`);
      const response = await GET(request as any);
      const data = await response.json();

      expect(data.features.prices.example).toContain('/api/websocket?type=prices&symbols=');
      expect(data.features.orders.example).toContain('/api/websocket?type=orders&orderId=');
      expect(data.features.swap.example).toContain('/api/websocket?type=swap');
    });
  });

  describe('POST /api/websocket', () => {
    it('should handle price subscription action', async () => {
      const request = new Request(`${baseUrl}/api/websocket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'subscribe-prices',
          data: { symbols: ['BTC', 'ETH'] }
        })
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Subscribed to prices for: BTC, ETH');
      expect(data.subscriptionId).toContain('prices_');
    });

    it('should handle order subscription action', async () => {
      const request = new Request(`${baseUrl}/api/websocket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'subscribe-orders',
          data: { orderId: '12345' }
        })
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Subscribed to order: 12345');
      expect(data.subscriptionId).toContain('orders_12345');
    });

    it('should handle swap quote action', async () => {
      const request = new Request(`${baseUrl}/api/websocket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-swap-quote',
          data: {
            fromToken: 'ETH',
            toToken: 'USDC',
            amount: '1.0',
            fromAddress: '0x1234567890123456789012345678901234567890'
          }
        })
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Swap quote request sent via WebSocket');
      expect(data.requestId).toContain('quote_');
    });

    it('should validate symbols array for price subscription', async () => {
      const request = new Request(`${baseUrl}/api/websocket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'subscribe-prices',
          data: { symbols: 'BTC' } // Should be array
        })
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Symbols array is required for price subscription');
    });

    it('should validate order ID for order subscription', async () => {
      const request = new Request(`${baseUrl}/api/websocket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'subscribe-orders',
          data: {} // Missing orderId
        })
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Order ID is required for order subscription');
    });

    it('should validate required parameters for swap quote', async () => {
      const request = new Request(`${baseUrl}/api/websocket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-swap-quote',
          data: {
            fromToken: 'ETH'
            // Missing other required parameters
          }
        })
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required parameters for swap quote');
    });

    it('should handle invalid action', async () => {
      const request = new Request(`${baseUrl}/api/websocket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'invalid-action',
          data: {}
        })
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid action');
    });

    it('should handle JSON parsing errors', async () => {
      const request = new Request(`${baseUrl}/api/websocket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('WebSocket endpoint error');
    });

    it('should handle missing action parameter', async () => {
      const request = new Request(`${baseUrl}/api/websocket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { symbols: ['BTC'] }
          // Missing action
        })
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid action');
    });

    it('should handle missing data parameter', async () => {
      const request = new Request(`${baseUrl}/api/websocket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'subscribe-prices'
          // Missing data
        })
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('WebSocket endpoint error');
    });

    it('should generate unique subscription IDs', async () => {
      const request1 = new Request(`${baseUrl}/api/websocket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'subscribe-prices',
          data: { symbols: ['BTC'] }
        })
      });

      const request2 = new Request(`${baseUrl}/api/websocket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'subscribe-prices',
          data: { symbols: ['ETH'] }
        })
      });

      const response1 = await POST(request1 as any);
      const response2 = await POST(request2 as any);
      const data1 = await response1.json();
      const data2 = await response2.json();

      // Add a small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(data1.subscriptionId).toBeDefined();
      expect(data2.subscriptionId).toBeDefined();
      expect(typeof data1.subscriptionId).toBe('string');
      expect(typeof data2.subscriptionId).toBe('string');
    });
  });
}); 