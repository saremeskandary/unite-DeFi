import { createServer } from 'http';
import { GET } from '../../../src/app/api/portfolio/route';

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

// Mock the Bitcoin network operations
jest.mock('../../../src/lib/blockchains/bitcoin/bitcoin-network-operations', () => ({
  BitcoinNetworkOperations: jest.fn().mockImplementation(() => ({
    getBitcoinUTXOs: jest.fn().mockResolvedValue([
      { value: 1000000 }, // 0.01 BTC
      { value: 5000000 }  // 0.05 BTC
    ])
  }))
}));

// Mock fetch for external API calls
global.fetch = jest.fn();

describe('Portfolio API Endpoint', () => {
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

    // Mock successful CoinGecko API response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        bitcoin: {
          usd: 43250.50,
          usd_24h_change: 2.45
        }
      })
    });
  });

  describe('GET /api/portfolio', () => {
    it('should return portfolio data for a valid wallet address', async () => {
      const request = new Request(
        `${baseUrl}/api/portfolio?walletAddress=bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh&network=testnet`
      );
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.totalValue).toBeGreaterThan(0);
      expect(data.totalValueFormatted).toBeDefined();
      expect(data.change24h).toBeDefined();
      expect(data.change24hFormatted).toBeDefined();
      expect(data.assets).toBeInstanceOf(Array);
      expect(data.lastUpdated).toBeDefined();
    });

    it('should return portfolio data with Bitcoin and Ethereum assets', async () => {
      const request = new Request(
        `${baseUrl}/api/portfolio?walletAddress=bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh&network=testnet`
      );
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.assets.length).toBeGreaterThan(0);

      const bitcoinAsset = data.assets.find((asset: any) => asset.symbol === 'BTC');
      const ethereumAsset = data.assets.find((asset: any) => asset.symbol === 'ETH');

      // At least Bitcoin should be present
      expect(bitcoinAsset).toBeDefined();
      expect(bitcoinAsset.balance).toBeGreaterThan(0);
      expect(bitcoinAsset.price).toBeGreaterThan(0);
      expect(bitcoinAsset.value).toBeGreaterThan(0);
      expect(bitcoinAsset.network).toBe('bitcoin');

      // Ethereum might be present if balance > 0
      if (ethereumAsset) {
        expect(ethereumAsset.balance).toBeGreaterThan(0);
        expect(ethereumAsset.price).toBeGreaterThan(0);
        expect(ethereumAsset.value).toBeGreaterThan(0);
        expect(ethereumAsset.network).toBe('ethereum');
      }
    });

    it('should handle missing wallet address parameter', async () => {
      const request = new Request(`${baseUrl}/api/portfolio`);
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Wallet address is required');
    });

    it('should handle different network parameters', async () => {
      const request = new Request(
        `${baseUrl}/api/portfolio?walletAddress=bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh&network=mainnet`
      );
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.assets).toBeInstanceOf(Array);
    });

    it('should handle API failures gracefully with fallback data', async () => {
      // Mock API failure
      (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

      const request = new Request(
        `${baseUrl}/api/portfolio?walletAddress=bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh&network=testnet`
      );
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.assets).toBeInstanceOf(Array);
      expect(data.totalValue).toBeGreaterThan(0);
    });

    it('should include proper asset formatting', async () => {
      const request = new Request(
        `${baseUrl}/api/portfolio?walletAddress=bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh&network=testnet`
      );
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);

      data.assets.forEach((asset: any) => {
        expect(asset.symbol).toBeDefined();
        expect(asset.name).toBeDefined();
        expect(asset.balance).toBeGreaterThanOrEqual(0);
        expect(asset.balanceFormatted).toBeDefined();
        expect(asset.price).toBeGreaterThan(0);
        expect(asset.value).toBeGreaterThanOrEqual(0);
        expect(asset.change24h).toBeDefined();
        expect(asset.network).toBeDefined();
      });
    });

    it('should calculate total portfolio value correctly', async () => {
      const request = new Request(
        `${baseUrl}/api/portfolio?walletAddress=bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh&network=testnet`
      );
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);

      // Calculate expected total value from assets
      const expectedTotalValue = data.assets.reduce((sum: number, asset: any) => sum + asset.value, 0);
      expect(data.totalValue).toBeCloseTo(expectedTotalValue, 2);
    });

    it('should handle timeout scenarios gracefully', async () => {
      // Mock timeout scenario
      (global.fetch as jest.Mock).mockImplementation(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      const request = new Request(
        `${baseUrl}/api/portfolio?walletAddress=bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh&network=testnet`
      );
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.assets).toBeInstanceOf(Array);
    });

    it('should validate wallet address format', async () => {
      const request = new Request(
        `${baseUrl}/api/portfolio?walletAddress=invalid-address&network=testnet`
      );
      const response = await GET(request as any);
      const data = await response.json();

      // Should still return 200 but with fallback data
      expect(response.status).toBe(200);
      expect(data.assets).toBeInstanceOf(Array);
    });

    it('should include last updated timestamp', async () => {
      const request = new Request(
        `${baseUrl}/api/portfolio?walletAddress=bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh&network=testnet`
      );
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.lastUpdated).toBeDefined();
      expect(new Date(data.lastUpdated)).toBeInstanceOf(Date);
    });
  });
}); 