import { createServer } from 'http';
import { GET } from '../../../src/app/api/swap/quote/route';

// Mock NextResponse and NextRequest
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
  },
  NextRequest: jest.fn().mockImplementation((url, init) => ({
    url,
    nextUrl: new URL(url),
    method: init?.method || 'GET',
    headers: init?.headers || {
      get: jest.fn(() => null),
      entries: jest.fn(() => []),
      set: jest.fn(),
      has: jest.fn(() => false)
    },
    json: jest.fn().mockResolvedValue({}),
    text: jest.fn().mockResolvedValue(''),
    clone: jest.fn(function() { return this; })
  }))
}));

// Mock the rate limiter to avoid headers.get issues
jest.mock('../../../src/lib/security/rate-limiter', () => ({
  withRateLimit: jest.fn((handler) => handler),
  rateLimiters: {
    api: { checkLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 100, resetTime: Date.now() + 60000 }) },
    auth: { checkLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 100, resetTime: Date.now() + 60000 }) },
    public: { checkLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 100, resetTime: Date.now() + 60000 }) },
    swap: { checkLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 100, resetTime: Date.now() + 60000 }) },
    websocket: { checkLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 100, resetTime: Date.now() + 60000 }) }
  }
}));

// Mock the price oracle and blockchain integration
jest.mock('../../../src/lib/price-oracle', () => ({
  priceOracle: {
    getSwapQuote: jest.fn(),
    getTokenPrice: jest.fn()
  }
}));

jest.mock('../../../src/lib/blockchain-integration', () => ({
  blockchainIntegration: {
    getFeeOptions: jest.fn(),
    estimateGas: jest.fn()
  }
}));

// Mock the validation middleware to bypass validation for now
jest.mock('../../../src/lib/security/security-middleware', () => ({
  secureRoute: jest.fn((handler) => handler),
  createSecureResponse: jest.fn((data) => new Response(JSON.stringify(data), { status: 200 })),
  createSecureErrorResponse: jest.fn((error) => {
    const status = error.statusCode || 500;
    const message = error.message || 'An unexpected error occurred. Please try again later';
    return new Response(JSON.stringify({ error: message }), { status });
  })
}));

import { priceOracle } from '../../../src/lib/price-oracle';
import { blockchainIntegration } from '../../../src/lib/blockchain-integration';

// Helper function to create a mock NextRequest
function createMockNextRequest(url: string): any {
  const urlObj = new URL(url);
  return {
    url: url,
    nextUrl: urlObj,
    method: 'GET',
    headers: {
      get: jest.fn((name: string) => {
        const headers: Record<string, string> = {
          'x-forwarded-for': '127.0.0.1',
          'user-agent': 'test-agent',
          'content-type': 'application/json'
        };
        return headers[name.toLowerCase()] || null;
      }),
      entries: jest.fn(() => []),
      set: jest.fn(),
      has: jest.fn(() => false)
    },
    json: jest.fn().mockResolvedValue({}),
    text: jest.fn().mockResolvedValue(''),
    clone: jest.fn(function() { return this; })
  };
}

describe('Swap Quote API Endpoint', () => {
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

  describe('GET /api/swap/quote', () => {
    it('should return a valid swap quote', async () => {
      const mockQuote = {
        fromToken: 'ETH',
        toToken: 'USDC',
        fromAmount: '1.0',
        toAmount: '3200.50',
        rate: 3200.50,
        priceImpact: 0.1,
        gasEstimate: '150000',
        gasCost: 0.003,
        source: '1inch'
      };

      const mockFeeOptions = {
        slow: { gasPrice: 15000000000, gasLimit: 150000 },
        standard: { gasPrice: 20000000000, gasLimit: 150000 },
        fast: { gasPrice: 25000000000, gasLimit: 150000 }
      };

      const mockGasEstimate = {
        gasLimit: 150000,
        gasPrice: 20000000000,
        totalFee: 0.003
      };

      const mockFromPrice = {
        symbol: 'ETH',
        price: 3200,
        change24h: 2.5,
        lastUpdated: new Date().toISOString(),
        source: 'coingecko'
      };

      const mockToPrice = {
        symbol: 'USDC',
        price: 1.0,
        change24h: 0.1,
        lastUpdated: new Date().toISOString(),
        source: 'coingecko'
      };

      (priceOracle.getSwapQuote as jest.Mock).mockResolvedValue(mockQuote);
      (blockchainIntegration.getFeeOptions as jest.Mock).mockResolvedValue(mockFeeOptions);
      (blockchainIntegration.estimateGas as jest.Mock).mockResolvedValue(mockGasEstimate);
      (priceOracle.getTokenPrice as jest.Mock)
        .mockResolvedValueOnce(mockFromPrice)
        .mockResolvedValueOnce(mockToPrice);

      const request = createMockNextRequest(
        `${baseUrl}/api/swap/quote?fromToken=ETH&toToken=USDC&amount=1.0&fromAddress=0x1234567890123456789012345678901234567890&chainId=1`
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.quote.fromToken).toBe('ETH');
      expect(data.quote.toToken).toBe('USDC');
      expect(data.quote.fromAmount).toBe('1.0');
      expect(data.quote.toAmount).toBe('3200.50');
      expect(data.quote.rate).toBe(3200.50);
      expect(data.fees).toBeDefined();
      expect(data.fees.slow).toBeDefined();
      expect(data.fees.standard).toBeDefined();
      expect(data.fees.fast).toBeDefined();
      expect(data.gasEstimate).toBeDefined();
      expect(data.metadata.chainId).toBe(1);
    });

    it('should handle missing required parameters', async () => {
      const request = createMockNextRequest(`${baseUrl}/api/swap/quote?fromToken=ETH&toToken=USDC`);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required parameters');
      expect(data.required).toContain('amount');
      expect(data.required).toContain('fromAddress');
      expect(data.required).toContain('chainId');
    });

    it('should validate amount is a positive number', async () => {
      const request = createMockNextRequest(
        `${baseUrl}/api/swap/quote?fromToken=ETH&toToken=USDC&amount=-1&fromAddress=0x1234567890123456789012345678901234567890&chainId=1`
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Amount must be a positive number');
    });

    it('should validate amount is a valid number', async () => {
      const request = createMockNextRequest(
        `${baseUrl}/api/swap/quote?fromToken=ETH&toToken=USDC&amount=invalid&fromAddress=0x1234567890123456789012345678901234567890&chainId=1`
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Amount must be a positive number');
    });

    it('should validate slippage bounds', async () => {
      const request = createMockNextRequest(
        `${baseUrl}/api/swap/quote?fromToken=ETH&toToken=USDC&amount=1.0&fromAddress=0x1234567890123456789012345678901234567890&chainId=1&slippage=100`
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Slippage must be between 0.1% and 50%');
    });

    it('should validate slippage minimum', async () => {
      const request = createMockNextRequest(
        `${baseUrl}/api/swap/quote?fromToken=ETH&toToken=USDC&amount=1.0&fromAddress=0x1234567890123456789012345678901234567890&chainId=1&slippage=0.05`
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Slippage must be between 0.1% and 50%');
    });

    it('should validate supported chain IDs', async () => {
      const request = createMockNextRequest(
        `${baseUrl}/api/swap/quote?fromToken=ETH&toToken=USDC&amount=1.0&fromAddress=0x1234567890123456789012345678901234567890&chainId=999`
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Unsupported chain ID');
      expect(data.supported).toContain(1);
      expect(data.supported).toContain(137);
      expect(data.received).toBe(999);
    });

    it('should handle supported chain IDs', async () => {
      const mockQuote = {
        fromToken: 'ETH',
        toToken: 'USDC',
        fromAmount: '1.0',
        toAmount: '3200.50',
        rate: 3200.50,
        priceImpact: 0.1,
        gasEstimate: '150000',
        gasCost: 0.003,
        source: '1inch'
      };

      (priceOracle.getSwapQuote as jest.Mock).mockResolvedValue(mockQuote);
      (blockchainIntegration.getFeeOptions as jest.Mock).mockResolvedValue({});
      (blockchainIntegration.estimateGas as jest.Mock).mockResolvedValue({});
      (priceOracle.getTokenPrice as jest.Mock).mockResolvedValue({});

      const request = createMockNextRequest(
        `${baseUrl}/api/swap/quote?fromToken=ETH&toToken=USDC&amount=1.0&fromAddress=0x1234567890123456789012345678901234567890&chainId=137`
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metadata.chainId).toBe(137);
    });

    it('should handle swap quote failure', async () => {
      (priceOracle.getSwapQuote as jest.Mock).mockResolvedValue(null);

      const request = createMockNextRequest(
        `${baseUrl}/api/swap/quote?fromToken=ETH&toToken=USDC&amount=1.0&fromAddress=0x1234567890123456789012345678901234567890&chainId=1`
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('Failed to get swap quote');
    });

    it('should handle price oracle errors', async () => {
      (priceOracle.getSwapQuote as jest.Mock).mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      const request = createMockNextRequest(
        `${baseUrl}/api/swap/quote?fromToken=ETH&toToken=USDC&amount=1.0&fromAddress=0x1234567890123456789012345678901234567890&chainId=1`
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to get swap quote');
    });

    it('should calculate price impact correctly', async () => {
      const mockQuote = {
        fromToken: 'ETH',
        toToken: 'USDC',
        fromAmount: '1.0',
        toAmount: '3200.50',
        rate: 3200.50,
        priceImpact: 0.1,
        gasEstimate: '150000',
        gasCost: 0.003,
        source: '1inch'
      };

      const mockFromPrice = {
        symbol: 'ETH',
        price: 3200,
        change24h: 2.5,
        lastUpdated: new Date().toISOString(),
        source: 'coingecko'
      };

      const mockToPrice = {
        symbol: 'USDC',
        price: 1.0,
        change24h: 0.1,
        lastUpdated: new Date().toISOString(),
        source: 'coingecko'
      };

      (priceOracle.getSwapQuote as jest.Mock).mockResolvedValue(mockQuote);
      (blockchainIntegration.getFeeOptions as jest.Mock).mockResolvedValue({});
      (blockchainIntegration.estimateGas as jest.Mock).mockResolvedValue({});
      (priceOracle.getTokenPrice as jest.Mock)
        .mockResolvedValueOnce(mockFromPrice)
        .mockResolvedValueOnce(mockToPrice);

      const request = createMockNextRequest(
        `${baseUrl}/api/swap/quote?fromToken=ETH&toToken=USDC&amount=1.0&fromAddress=0x1234567890123456789012345678901234567890&chainId=1`
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.quote.priceImpact).toBeDefined();
      expect(typeof data.quote.priceImpact).toBe('number');
    });

    it('should include fee options with estimated times', async () => {
      const mockQuote = {
        fromToken: 'ETH',
        toToken: 'USDC',
        fromAmount: '1.0',
        toAmount: '3200.50',
        rate: 3200.50,
        priceImpact: 0.1,
        gasEstimate: '150000',
        gasCost: 0.003,
        source: '1inch'
      };

      const mockFeeOptions = {
        slow: { gasPrice: 15000000000, gasLimit: 150000 },
        standard: { gasPrice: 20000000000, gasLimit: 150000 },
        fast: { gasPrice: 25000000000, gasLimit: 150000 }
      };

      (priceOracle.getSwapQuote as jest.Mock).mockResolvedValue(mockQuote);
      (blockchainIntegration.getFeeOptions as jest.Mock).mockResolvedValue(mockFeeOptions);
      (blockchainIntegration.estimateGas as jest.Mock).mockResolvedValue({});
      (priceOracle.getTokenPrice as jest.Mock).mockResolvedValue({});

      const request = createMockNextRequest(
        `${baseUrl}/api/swap/quote?fromToken=ETH&toToken=USDC&amount=1.0&fromAddress=0x1234567890123456789012345678901234567890&chainId=1`
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.fees.slow.estimatedTime).toBe('5-10 minutes');
      expect(data.fees.standard.estimatedTime).toBe('2-5 minutes');
      expect(data.fees.fast.estimatedTime).toBe('30 seconds - 2 minutes');
    });

    it('should include quote expiry timestamp', async () => {
      const mockQuote = {
        fromToken: 'ETH',
        toToken: 'USDC',
        fromAmount: '1.0',
        toAmount: '3200.50',
        rate: 3200.50,
        priceImpact: 0.1,
        gasEstimate: '150000',
        gasCost: 0.003,
        source: '1inch'
      };

      (priceOracle.getSwapQuote as jest.Mock).mockResolvedValue(mockQuote);
      (blockchainIntegration.getFeeOptions as jest.Mock).mockResolvedValue({});
      (blockchainIntegration.estimateGas as jest.Mock).mockResolvedValue({});
      (priceOracle.getTokenPrice as jest.Mock).mockResolvedValue({});

      const request = createMockNextRequest(
        `${baseUrl}/api/swap/quote?fromToken=ETH&toToken=USDC&amount=1.0&fromAddress=0x1234567890123456789012345678901234567890&chainId=1`
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metadata.quoteExpiry).toBeDefined();
      expect(new Date(data.metadata.quoteExpiry).getTime()).toBeGreaterThan(Date.now());
    });
  });
}); 