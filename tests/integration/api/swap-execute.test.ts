import { createServer } from 'http';
import { POST } from '../../../src/app/api/swap/execute/route';

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

// Mock the blockchain integration
jest.mock('../../../src/lib/blockchain-integration', () => ({
  blockchainIntegration: {
    createSwapOrder: jest.fn()
  }
}));

import { blockchainIntegration } from '../../../src/lib/blockchain-integration';

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

      const request = new Request(`${baseUrl}/api/swap/execute`, {
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

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.order).toBeDefined();
      expect(data.order.id).toBe('order_12345');
      expect(data.transactionHash).toBeDefined();
      expect(data.message).toContain('Swap order created successfully');
    });

    it('should handle missing required parameters', async () => {
      const request = new Request(`${baseUrl}/api/swap/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken: 'ETH',
          toToken: 'USDC'
          // Missing fromAmount and toAddress
        })
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required parameters');
      expect(data.required).toContain('fromAmount');
      expect(data.required).toContain('toAddress');
    });

    it('should validate amount is a positive number', async () => {
      const request = new Request(`${baseUrl}/api/swap/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken: 'ETH',
          toToken: 'USDC',
          fromAmount: '-1.0',
          toAddress: '0x1234567890123456789012345678901234567890'
        })
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('fromAmount must be a positive number');
    });

    it('should validate amount is a valid number', async () => {
      const request = new Request(`${baseUrl}/api/swap/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken: 'ETH',
          toToken: 'USDC',
          fromAmount: 'invalid',
          toAddress: '0x1234567890123456789012345678901234567890'
        })
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('fromAmount must be a positive number');
    });

    it('should validate slippage bounds', async () => {
      const request = new Request(`${baseUrl}/api/swap/execute`, {
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

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Slippage must be between 0.1% and 50%');
    });

    it('should validate slippage minimum', async () => {
      const request = new Request(`${baseUrl}/api/swap/execute`, {
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

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Slippage must be between 0.1% and 50%');
    });

    it('should validate fee priority', async () => {
      const request = new Request(`${baseUrl}/api/swap/execute`, {
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

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid fee priority');
      expect(data.valid).toContain('slow');
      expect(data.valid).toContain('standard');
      expect(data.valid).toContain('fast');
    });

    it('should validate supported chain IDs', async () => {
      const request = new Request(`${baseUrl}/api/swap/execute`, {
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

      const response = await POST(request as any);
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

      const request = new Request(`${baseUrl}/api/swap/execute`, {
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

      const response = await POST(request as any);
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

      const request = new Request(`${baseUrl}/api/swap/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken: 'ETH',
          toToken: 'USDC',
          fromAmount: '1.0',
          toAddress: '0x1234567890123456789012345678901234567890'
        })
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Insufficient balance');
    });

    it('should handle blockchain integration errors', async () => {
      (blockchainIntegration.createSwapOrder as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const request = new Request(`${baseUrl}/api/swap/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken: 'ETH',
          toToken: 'USDC',
          fromAmount: '1.0',
          toAddress: '0x1234567890123456789012345678901234567890'
        })
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to execute swap order');
    });

    it('should use default values when not provided', async () => {
      const mockResult = {
        success: true,
        order: { id: 'order_12345' },
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      };

      (blockchainIntegration.createSwapOrder as jest.Mock).mockResolvedValue(mockResult);

      const request = new Request(`${baseUrl}/api/swap/execute`, {
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

      const response = await POST(request as any);
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

      const request = new Request(`${baseUrl}/api/swap/execute`, {
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

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should validate JSON body format', async () => {
      const request = new Request(`${baseUrl}/api/swap/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to execute swap order');
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
        const request = new Request(`${baseUrl}/api/swap/execute`, {
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

        const response = await POST(request as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      }
    });
  });
}); 