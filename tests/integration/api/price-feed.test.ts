import { createServer } from 'http';
import { GET, POST } from '../../../src/app/api/prices/route';

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

describe('Price Feed API Endpoint', () => {
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

  describe('GET /api/prices', () => {
    it('should return prices for valid symbols', async () => {
      const request = new Request(
        `${baseUrl}/api/prices?symbols=BTC,ETH,USDC`
      );
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.BTC).toBeDefined();
      expect(data.ETH).toBeDefined();
      expect(data.USDC).toBeDefined();
    });

    it('should handle missing symbols parameter', async () => {
      const request = new Request(`${baseUrl}/api/prices`);
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Symbols parameter is required');
    });

    it('should return price data with proper structure', async () => {
      const request = new Request(
        `${baseUrl}/api/prices?symbols=BTC,ETH`
      );
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);

      Object.values(data).forEach((priceData: any) => {
        expect(priceData.price).toBeDefined();
        expect(priceData.price).toBeGreaterThan(0);
        expect(priceData.change24h).toBeDefined();
        expect(typeof priceData.change24h).toBe('number');
        expect(priceData.volume24h).toBeDefined();
        expect(priceData.volume24h).toBeGreaterThan(0);
        expect(priceData.marketCap).toBeDefined();
        expect(priceData.marketCap).toBeGreaterThan(0);
      });
    });

    it('should handle single symbol requests', async () => {
      const request = new Request(
        `${baseUrl}/api/prices?symbols=BTC`
      );
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.BTC).toBeDefined();
      expect(data.BTC.price).toBeGreaterThan(0);
    });

    it('should handle multiple symbols with mixed case', async () => {
      const request = new Request(
        `${baseUrl}/api/prices?symbols=btc,ETH,usdc`
      );
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.BTC).toBeDefined();
      expect(data.ETH).toBeDefined();
      expect(data.USDC).toBeDefined();
    });

    it('should generate mock data for unknown symbols', async () => {
      const request = new Request(
        `${baseUrl}/api/prices?symbols=UNKNOWN,XYZ`
      );
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.UNKNOWN).toBeDefined();
      expect(data.XYZ).toBeDefined();
      expect(data.UNKNOWN.price).toBeGreaterThan(0);
      expect(data.XYZ.price).toBeGreaterThan(0);
    });

    it('should handle empty symbols list', async () => {
      const request = new Request(
        `${baseUrl}/api/prices?symbols=`
      );
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({});
    });

    it('should handle duplicate symbols', async () => {
      const request = new Request(
        `${baseUrl}/api/prices?symbols=BTC,BTC,ETH`
      );
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.BTC).toBeDefined();
      expect(data.ETH).toBeDefined();
    });

    it('should return stable prices for stablecoins', async () => {
      const request = new Request(
        `${baseUrl}/api/prices?symbols=USDC,USDT`
      );
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.USDC.price).toBeCloseTo(1.00, 2);
      expect(data.USDT.price).toBeCloseTo(1.00, 2);
    });

    it('should include realistic price ranges for major cryptocurrencies', async () => {
      const request = new Request(
        `${baseUrl}/api/prices?symbols=BTC,ETH,SOL`
      );
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);

      // Bitcoin should be in a realistic range
      expect(data.BTC.price).toBeGreaterThan(40000);
      expect(data.BTC.price).toBeLessThan(50000);

      // Ethereum should be in a realistic range
      expect(data.ETH.price).toBeGreaterThan(2500);
      expect(data.ETH.price).toBeLessThan(3500);

      // Solana should be in a realistic range
      expect(data.SOL.price).toBeGreaterThan(100);
      expect(data.SOL.price).toBeLessThan(150);
    });

    it('should handle special characters in symbols', async () => {
      const request = new Request(
        `${baseUrl}/api/prices?symbols=BTC-USD,ETH/USD`
      );
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data['BTC-USD']).toBeDefined();
      expect(data['ETH/USD']).toBeDefined();
    });

    it('should simulate API latency', async () => {
      const startTime = Date.now();
      const request = new Request(
        `${baseUrl}/api/prices?symbols=BTC,ETH`
      );
      const response = await GET(request as any);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      // Should have some latency (at least 100ms as per the mock)
      expect(endTime - startTime).toBeGreaterThanOrEqual(50);
    });
  });

  describe('POST /api/prices', () => {
    it('should handle price subscription requests', async () => {
      const subscriptionData = {
        symbols: ['BTC', 'ETH', 'USDC'],
        interval: '1m',
        callback: 'https://example.com/webhook'
      };

      const request = new Request(`${baseUrl}/api/prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscriptionData)
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.subscriptionId).toBeDefined();
      expect(data.symbols).toEqual(['BTC', 'ETH', 'USDC']);
    });

    it('should validate subscription data', async () => {
      const subscriptionData = {
        symbols: ['BTC']
        // Missing required fields
      };

      const request = new Request(`${baseUrl}/api/prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscriptionData)
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should handle invalid JSON in request body', async () => {
      const request = new Request(`${baseUrl}/api/prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should handle empty symbols array', async () => {
      const subscriptionData = {
        symbols: [],
        interval: '1m',
        callback: 'https://example.com/webhook'
      };

      const request = new Request(`${baseUrl}/api/prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscriptionData)
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should validate callback URL format', async () => {
      const subscriptionData = {
        symbols: ['BTC', 'ETH'],
        interval: '1m',
        callback: 'invalid-url'
      };

      const request = new Request(`${baseUrl}/api/prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscriptionData)
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should handle different subscription intervals', async () => {
      const intervals = ['1s', '5s', '10s', '30s', '1m', '5m', '15m', '1h'];

      for (const interval of intervals) {
        const subscriptionData = {
          symbols: ['BTC'],
          interval,
          callback: 'https://example.com/webhook'
        };

        const request = new Request(`${baseUrl}/api/prices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscriptionData)
        });

        const response = await POST(request as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.interval).toBe(interval);
      }
    });

    it('should limit the number of symbols per subscription', async () => {
      const symbols = Array.from({ length: 101 }, (_, i) => `TOKEN${i}`);
      const subscriptionData = {
        symbols,
        interval: '1m',
        callback: 'https://example.com/webhook'
      };

      const request = new Request(`${baseUrl}/api/prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscriptionData)
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });
}); 