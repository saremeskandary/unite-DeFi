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

// Mock the price oracle
jest.mock('../../../src/lib/price-oracle', () => ({
  priceOracle: {
    getMultipleTokenPrices: jest.fn()
  }
}));

import { priceOracle } from '../../../src/lib/price-oracle';

describe('Prices API Endpoint', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/prices', () => {
    it('should return prices for valid symbols', async () => {
      const mockPrices = new Map([
        ['BTC', {
          symbol: 'BTC',
          price: 45000,
          change24h: 2.5,
          marketCap: 850000000000,
          volume24h: 25000000000,
          lastUpdated: new Date().toISOString(),
          source: 'coingecko'
        }],
        ['ETH', {
          symbol: 'ETH',
          price: 3200,
          change24h: -1.2,
          marketCap: 380000000000,
          volume24h: 15000000000,
          lastUpdated: new Date().toISOString(),
          source: 'coingecko'
        }]
      ]);

      (priceOracle.getMultipleTokenPrices as jest.Mock).mockResolvedValue(mockPrices);

      const request = new Request(`${baseUrl}/api/prices?symbols=BTC,ETH`);
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.currency).toBe('usd');
      expect(data.prices.BTC).toBeDefined();
      expect(data.prices.ETH).toBeDefined();
      expect(data.prices.BTC.price).toBe(45000);
      expect(data.prices.ETH.price).toBe(3200);
      expect(data.summary.totalRequested).toBe(2);
      expect(data.summary.available).toBe(2);
    });

    it('should handle missing symbols parameter', async () => {
      const request = new Request(`${baseUrl}/api/prices`);
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required parameter: symbols');
    });

    it('should handle empty symbols list', async () => {
      const request = new Request(`${baseUrl}/api/prices?symbols=`);
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required parameter: symbols');
    });

    it('should limit symbols to 20', async () => {
      const symbols = Array.from({ length: 25 }, (_, i) => `TOKEN${i}`).join(',');
      const request = new Request(`${baseUrl}/api/prices?symbols=${symbols}`);
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Maximum 20 symbols allowed per request');
    });

    it('should handle unavailable symbols', async () => {
      const mockPrices = new Map();
      (priceOracle.getMultipleTokenPrices as jest.Mock).mockResolvedValue(mockPrices);

      const request = new Request(`${baseUrl}/api/prices?symbols=INVALID,ALSO_INVALID`);
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.prices.INVALID.error).toBe('Price not available');
      expect(data.prices.ALSO_INVALID.error).toBe('Price not available');
      // When no prices are available, summary might be undefined
      expect(data.summary).toBeUndefined();
    });

    it('should include optional parameters when requested', async () => {
      const mockPrices = new Map([
        ['BTC', {
          symbol: 'BTC',
          price: 45000,
          change24h: 2.5,
          marketCap: 850000000000,
          volume24h: 25000000000,
          lastUpdated: new Date().toISOString(),
          source: 'coingecko'
        }]
      ]);

      (priceOracle.getMultipleTokenPrices as jest.Mock).mockResolvedValue(mockPrices);

      const request = new Request(
        `${baseUrl}/api/prices?symbols=BTC&include24hChange=true&includeMarketCap=true`
      );
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.prices.BTC.change24h).toBeDefined();
      expect(data.prices.BTC.marketCap).toBeDefined();
    });

    it('should handle different currencies', async () => {
      const mockPrices = new Map([
        ['BTC', {
          symbol: 'BTC',
          price: 42000,
          change24h: 2.5,
          lastUpdated: new Date().toISOString(),
          source: 'coingecko'
        }]
      ]);

      (priceOracle.getMultipleTokenPrices as jest.Mock).mockResolvedValue(mockPrices);

      const request = new Request(`${baseUrl}/api/prices?symbols=BTC&currency=eur`);
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.currency).toBe('eur');
    });

    it('should handle price oracle errors gracefully', async () => {
      (priceOracle.getMultipleTokenPrices as jest.Mock).mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      const request = new Request(`${baseUrl}/api/prices?symbols=BTC`);
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to fetch token prices');
    });
  });

  describe('POST /api/prices', () => {
    it('should handle POST requests with symbols array', async () => {
      const mockPrices = new Map([
        ['BTC', {
          symbol: 'BTC',
          price: 45000,
          change24h: 2.5,
          lastUpdated: new Date().toISOString(),
          source: 'coingecko'
        }]
      ]);

      (priceOracle.getMultipleTokenPrices as jest.Mock).mockResolvedValue(mockPrices);

      const request = new Request(`${baseUrl}/api/prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbols: ['BTC'],
          currency: 'usd',
          include24hChange: true
        })
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.prices.BTC).toBeDefined();
      expect(data.prices.BTC.price).toBe(45000);
    });

    it('should validate symbols array in POST request', async () => {
      const request = new Request(`${baseUrl}/api/prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbols: 'BTC' // Should be array
        })
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing or invalid symbols array');
    });

    it('should handle empty symbols array in POST request', async () => {
      const request = new Request(`${baseUrl}/api/prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbols: []
        })
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing or invalid symbols array');
    });

    it('should limit symbols to 20 in POST request', async () => {
      const symbols = Array.from({ length: 25 }, (_, i) => `TOKEN${i}`);
      const request = new Request(`${baseUrl}/api/prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols })
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Maximum 20 symbols allowed per request');
    });
  });
}); 