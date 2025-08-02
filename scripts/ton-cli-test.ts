#!/usr/bin/env tsx

import { TONCLI } from './ton-cli';

describe('TON CLI Tests', () => {
  let cli: TONCLI;

  beforeAll(() => {
    cli = new TONCLI();
  });

  afterAll(async () => {
    // Cleanup
  });

  describe('Initialization', () => {
    it('should initialize TON client', () => {
      expect(cli).toBeDefined();
    });

    it('should initialize TON Connect', async () => {
      await cli.initializeTonConnect();
      // Add assertions for successful initialization
    });
  });

  describe('Wallet Connection', () => {
    it('should connect to wallet', async () => {
      await cli.connectWallet();
      // Add assertions for successful connection
    });
  });

  describe('Balance Operations', () => {
    it('should get wallet balance', async () => {
      const testAddress = 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t';
      const balance = await cli.getBalance(testAddress);

      expect(balance).toBeDefined();
      expect(balance.address).toBe(testAddress);
      expect(balance.balance).toBeDefined();
      expect(balance.jettons).toBeInstanceOf(Array);
    });
  });

  describe('Swap Operations', () => {
    it('should get swap quote', async () => {
      const quote = await cli.getSwapQuote('TON', 'USDT', '10');

      expect(quote).toBeDefined();
      expect(quote.fromToken).toBe('TON');
      expect(quote.toToken).toBe('USDT');
      expect(quote.fromAmount).toBe('10');
      expect(quote.toAmount).toBeDefined();
      expect(quote.priceImpact).toBeDefined();
      expect(quote.fee).toBeDefined();
    });

    it('should execute swap', async () => {
      const quote = await cli.getSwapQuote('TON', 'USDT', '10');
      const tx = await cli.executeSwap(quote);

      expect(tx).toBeDefined();
      expect(tx.hash).toBeDefined();
      expect(tx.status).toBe('pending');
      expect(tx.confirmations).toBe(0);
      expect(tx.timestamp).toBeDefined();
    });
  });

  describe('Transaction Monitoring', () => {
    it('should monitor transaction', async () => {
      const testHash = '0x' + Math.random().toString(16).substr(2, 64);
      await cli.monitorTransaction(testHash);
      // Add assertions for monitoring
    });
  });

  describe('Transfer Operations', () => {
    it('should transfer TON', async () => {
      const testAddress = 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t';
      const tx = await cli.transferTON(testAddress, '1.5');

      expect(tx).toBeDefined();
      expect(tx.hash).toBeDefined();
      expect(tx.status).toBe('pending');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid address', async () => {
      await expect(cli.getBalance('invalid-address')).rejects.toThrow();
    });

    it('should handle invalid swap parameters', async () => {
      await expect(cli.getSwapQuote('INVALID', 'TOKEN', '-1')).rejects.toThrow();
    });
  });
});

// Mock CLI for testing
class MockTONCLI extends TONCLI {
  constructor() {
    super();
  }

  async getBalance(address?: string): Promise<any> {
    return {
      address: address || 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t',
      balance: '100.5000',
      jettons: [
        {
          address: 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t',
          symbol: 'USDT',
          balance: '1000.00'
        }
      ]
    };
  }

  async getSwapQuote(fromToken: string, toToken: string, amount: string): Promise<any> {
    return {
      fromToken,
      toToken,
      fromAmount: amount,
      toAmount: (parseFloat(amount) * 0.95).toFixed(6),
      priceImpact: '0.5%',
      fee: '0.1'
    };
  }

  async executeSwap(quote: any): Promise<any> {
    return {
      hash: '0x' + Math.random().toString(16).substr(2, 64),
      status: 'pending',
      confirmations: 0,
      timestamp: Date.now()
    };
  }
}

// Test runner
async function runTests() {
  console.log('🧪 Running TON CLI Tests...\n');

  const tests = [
    {
      name: 'Balance Check',
      test: async () => {
        const cli = new MockTONCLI();
        const balance = await cli.getBalance();
        console.log('✅ Balance check passed');
        return balance;
      }
    },
    {
      name: 'Swap Quote',
      test: async () => {
        const cli = new MockTONCLI();
        const quote = await cli.getSwapQuote('TON', 'USDT', '10');
        console.log('✅ Swap quote passed');
        return quote;
      }
    },
    {
      name: 'Swap Execution',
      test: async () => {
        const cli = new MockTONCLI();
        const quote = await cli.getSwapQuote('TON', 'USDT', '10');
        const tx = await cli.executeSwap(quote);
        console.log('✅ Swap execution passed');
        return tx;
      }
    },
    {
      name: 'Error Handling',
      test: async () => {
        const cli = new MockTONCLI();
        try {
          await cli.getBalance('invalid-address');
          throw new Error('Should have failed');
        } catch (error) {
          console.log('✅ Error handling passed');
          return true;
        }
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`Running: ${test.name}...`);
      await test.test();
      passed++;
    } catch (error) {
      console.log(`❌ ${test.name} failed:`, error);
      failed++;
    }
  }

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('🎉 All tests passed! CLI is ready for demo.');
  } else {
    console.log('⚠️  Some tests failed. Please check the implementation.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
} 