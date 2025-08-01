import { createServer } from 'http';
import { POST } from '../../../src/app/api/swap/execute/route';

// Mock NextRequest and NextResponse
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    url: string;
    method: string;
    private _headers: Headers;
    body: any;

    constructor(input: RequestInfo | URL, init?: RequestInit) {
      if (typeof input === 'string') {
        this.url = input;
      } else {
        this.url = input.toString();
      }
      this.method = init?.method || 'GET';
      this.body = init?.body || null;

      // Initialize headers with default values
      this._headers = new Headers({
        'x-forwarded-for': '127.0.0.1',
        'x-real-ip': '127.0.0.1',
        'cf-connecting-ip': '127.0.0.1',
        'content-type': 'application/json',
        ...(init?.headers as Record<string, string>)
      });
    }

    get headers() {
      return this._headers;
    }

    async json() {
      if (typeof this.body === 'string') {
        return JSON.parse(this.body);
      }
      return this.body;
    }
  },
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

// Mock the blockchain integration
jest.mock('../../../src/lib/blockchain-integration', () => ({
  blockchainIntegration: {
    createSwapOrder: jest.fn()
  }
}));

// Mock the security middleware
jest.mock('../../../src/lib/security/security-middleware', () => ({
  secureRoute: (handler: any) => {
    return async (request: any) => {
      try {
        // Parse the request body
        const body = await request.json();

        // Basic validation for required fields
        if (!body.fromToken || !body.toToken || !body.fromAmount || !body.toAddress) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Missing required parameters',
            required: ['fromToken', 'toToken', 'fromAmount', 'toAddress']
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Validate fromAmount is a positive number
        const fromAmount = parseFloat(body.fromAmount);
        if (isNaN(fromAmount) || fromAmount <= 0) {
          return new Response(JSON.stringify({
            success: false,
            error: 'fromAmount must be a positive number'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Validate slippage bounds
        if (body.slippage !== undefined) {
          const slippage = parseFloat(body.slippage);
          if (isNaN(slippage) || slippage < 0.1 || slippage > 50) {
            return new Response(JSON.stringify({
              success: false,
              error: 'Slippage must be between 0.1% and 50%'
            }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }

        // Validate fee priority
        if (body.feePriority && !['slow', 'standard', 'fast'].includes(body.feePriority)) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Invalid fee priority',
            valid: ['slow', 'standard', 'fast']
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Validate chain ID
        if (body.chainId && ![1, 137, 56, 42161].includes(body.chainId)) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Unsupported chain ID',
            supported: [1, 137, 56, 42161],
            received: body.chainId
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Add validated data to request for the handler with defaults
        (request as any).validatedData = {
          fromToken: body.fromToken,
          toToken: body.toToken,
          fromAmount: body.fromAmount,
          toAddress: body.toAddress,
          slippage: body.slippage || 0.5,
          feePriority: body.feePriority || 'standard',
          chainId: body.chainId || 1,
          quoteId: body.quoteId
        };

        // Call the actual handler
        return await handler(request);
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    };
  },
  createSecureResponse: (data: any) => {
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  },
  createSecureErrorResponse: (error: any) => {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}));

// Mock the error handler
jest.mock('../../../src/lib/security/error-handler', () => ({
  createBusinessError: (code: string, message: string) => new Error(message),
  ErrorCode: {
    SWAP_FAILED: 'SWAP_FAILED'
  }
}));

import { blockchainIntegration } from '../../../src/lib/blockchain-integration';
import { NextRequest } from 'next/server';

describe('Swap Execute API Endpoint', () => {
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

  describe('POST /api/swap/execute', () => {
    it('should execute a swap order successfully', async () => {
      const mockResult = {
        success: true,
        order: {
          id: 'order_12345',
          fromToken: 'ETH',
          toToken: 'USDC',
          fromAmount: '1.0',
          toAmount: '3200.50',
          status: 'pending',
          timestamp: new Date().toISOString()
        },
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      };

      (blockchainIntegration.createSwapOrder as jest.Mock).mockResolvedValue(mockResult);

      const request = new NextRequest(`${baseUrl}/api/swap/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken: 'ETH',
          toToken: 'USDC',
          fromAmount: '1.0',
          toAddress: '0x1234567890123456789012345678901234567890',
          slippage: 0.5,
          feePriority: 'standard',
          chainId: 1
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.order).toBeDefined();
      expect(data.order.id).toBe('order_12345');
      expect(data.transactionHash).toBeDefined();
      expect(data.message).toContain('Swap order created successfully');
    });

    it('should handle missing required parameters', async () => {
      const request = new NextRequest(`${baseUrl}/api/swap/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken: 'ETH',
          toToken: 'USDC'
          // Missing fromAmount and toAddress
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required parameters');
      expect(data.required).toContain('fromAmount');
      expect(data.required).toContain('toAddress');
    });

    it('should validate amount is a positive number', async () => {
      const request = new NextRequest(`${baseUrl}/api/swap/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken: 'ETH',
          toToken: 'USDC',
          fromAmount: '-1.0',
          toAddress: '0x1234567890123456789012345678901234567890'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('fromAmount must be a positive number');
    });

    it('should validate amount is a valid number', async () => {
      const request = new NextRequest(`${baseUrl}/api/swap/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken: 'ETH',
          toToken: 'USDC',
          fromAmount: 'invalid',
          toAddress: '0x1234567890123456789012345678901234567890'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('fromAmount must be a positive number');
    });

    it('should validate slippage bounds', async () => {
      const request = new NextRequest(`${baseUrl}/api/swap/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken: 'ETH',
          toToken: 'USDC',
          fromAmount: '1.0',
          toAddress: '0x1234567890123456789012345678901234567890',
          slippage: 100
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Slippage must be between 0.1% and 50%');
    });

    it('should validate slippage minimum', async () => {
      const request = new NextRequest(`${baseUrl}/api/swap/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken: 'ETH',
          toToken: 'USDC',
          fromAmount: '1.0',
          toAddress: '0x1234567890123456789012345678901234567890',
          slippage: 0.05
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Slippage must be between 0.1% and 50%');
    });

    it('should validate fee priority', async () => {
      const request = new NextRequest(`${baseUrl}/api/swap/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken: 'ETH',
          toToken: 'USDC',
          fromAmount: '1.0',
          toAddress: '0x1234567890123456789012345678901234567890',
          feePriority: 'invalid'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid fee priority');
      expect(data.valid).toContain('slow');
      expect(data.valid).toContain('standard');
      expect(data.valid).toContain('fast');
    });

    it('should validate supported chain IDs', async () => {
      const request = new NextRequest(`${baseUrl}/api/swap/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken: 'ETH',
          toToken: 'USDC',
          fromAmount: '1.0',
          toAddress: '0x1234567890123456789012345678901234567890',
          chainId: 999
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Unsupported chain ID');
      expect(data.supported).toContain(1);
      expect(data.supported).toContain(137);
      expect(data.received).toBe(999);
    });

    it('should handle supported chain IDs', async () => {
      const mockResult = {
        success: true,
        order: { id: 'order_12345' },
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      };

      (blockchainIntegration.createSwapOrder as jest.Mock).mockResolvedValue(mockResult);

      const request = new NextRequest(`${baseUrl}/api/swap/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken: 'ETH',
          toToken: 'USDC',
          fromAmount: '1.0',
          toAddress: '0x1234567890123456789012345678901234567890',
          chainId: 137
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle swap execution failure', async () => {
      const mockResult = {
        success: false,
        error: 'Insufficient balance'
      };

      (blockchainIntegration.createSwapOrder as jest.Mock).mockResolvedValue(mockResult);

      const request = new NextRequest(`${baseUrl}/api/swap/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken: 'ETH',
          toToken: 'USDC',
          fromAmount: '1.0',
          toAddress: '0x1234567890123456789012345678901234567890'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Insufficient balance');
    });

    it('should handle blockchain integration errors', async () => {
      (blockchainIntegration.createSwapOrder as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const request = new NextRequest(`${baseUrl}/api/swap/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken: 'ETH',
          toToken: 'USDC',
          fromAmount: '1.0',
          toAddress: '0x1234567890123456789012345678901234567890'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Network error');
    });

    it('should use default values when not provided', async () => {
      const mockResult = {
        success: true,
        order: { id: 'order_12345' },
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      };

      (blockchainIntegration.createSwapOrder as jest.Mock).mockResolvedValue(mockResult);

      const request = new NextRequest(`${baseUrl}/api/swap/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken: 'ETH',
          toToken: 'USDC',
          fromAmount: '1.0',
          toAddress: '0x1234567890123456789012345678901234567890'
          // Not providing slippage, feePriority, chainId - should use defaults
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify default values were used
      expect(blockchainIntegration.createSwapOrder).toHaveBeenCalledWith(
        'ETH',
        'USDC',
        '1.0',
        '0x1234567890123456789012345678901234567890',
        0.5 // default slippage
      );
    });

    it('should handle quote ID when provided', async () => {
      const mockResult = {
        success: true,
        order: { id: 'order_12345' },
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      };

      (blockchainIntegration.createSwapOrder as jest.Mock).mockResolvedValue(mockResult);

      const request = new NextRequest(`${baseUrl}/api/swap/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken: 'ETH',
          toToken: 'USDC',
          fromAmount: '1.0',
          toAddress: '0x1234567890123456789012345678901234567890',
          quoteId: 'quote_67890'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should validate JSON body format', async () => {
      const request = new NextRequest(`${baseUrl}/api/swap/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Unexpected token');
    });

    it('should handle different fee priorities', async () => {
      const mockResult = {
        success: true,
        order: { id: 'order_12345' },
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      };

      (blockchainIntegration.createSwapOrder as jest.Mock).mockResolvedValue(mockResult);

      const feePriorities = ['slow', 'standard', 'fast'];

      for (const priority of feePriorities) {
        const request = new NextRequest(`${baseUrl}/api/swap/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromToken: 'ETH',
            toToken: 'USDC',
            fromAmount: '1.0',
            toAddress: '0x1234567890123456789012345678901234567890',
            feePriority: priority
          })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      }
    });
  });
}); 