import {
  calculateSwapProfitability,
  analyzeOrder,
  submitBid,
  handleAuctionWin,
  handleAuctionLoss
} from '../../../src/lib/resolver-logic';

describe('Resolver Logic', () => {
  describe('RES-LOGIC-01: Profitability calculations', () => {
    it('should calculate negative profit for high fees', () => {
      const order = {
        fromToken: 'WBTC',
        toToken: 'BTC',
        amount: '100000000', // 1 WBTC
        userAddress: '0x1234567890123456789012345678901234567890',
        bitcoinFees: 50000, // High Bitcoin fees (0.0005 BTC)
        ethereumFees: 100000, // High Ethereum fees (0.0001 ETH)
        exchangeRate: 1.0 // 1:1 rate
      };

      const profitability = calculateSwapProfitability(order);

      expect(profitability.profitable).toBe(false);
      expect(profitability.netProfit).toBeLessThan(0);
      expect(profitability.reason).toContain('fees');
      expect(profitability.bitcoinCost).toBe(order.bitcoinFees);
      expect(profitability.ethereumCost).toBe(order.ethereumFees);
    });

    it('should calculate positive profit for low fees', () => {
      const order = {
        fromToken: 'WBTC',
        toToken: 'BTC',
        amount: '100000000', // 1 WBTC
        userAddress: '0x1234567890123456789012345678901234567890',
        bitcoinFees: 1000, // Low Bitcoin fees (0.00001 BTC)
        ethereumFees: 5000, // Low Ethereum fees (0.000005 ETH)
        exchangeRate: 1.0 // 1:1 rate
      };

      const profitability = calculateSwapProfitability(order);

      expect(profitability.profitable).toBe(true);
      expect(profitability.netProfit).toBeGreaterThan(0);
      expect(profitability.bitcoinCost).toBe(order.bitcoinFees);
      expect(profitability.ethereumCost).toBe(order.ethereumFees);
    });

    it('should consider exchange rate in profitability', () => {
      const order = {
        fromToken: 'WBTC',
        toToken: 'BTC',
        amount: '100000000', // 1 WBTC
        userAddress: '0x1234567890123456789012345678901234567890',
        bitcoinFees: 1000,
        ethereumFees: 5000,
        exchangeRate: 1.001 // Slight premium
      };

      const profitability = calculateSwapProfitability(order);

      expect(profitability.profitable).toBe(true);
      expect(profitability.exchangeRateBenefit).toBeGreaterThan(0);
    });

    it('should handle different token amounts', () => {
      const smallOrder = {
        fromToken: 'WBTC',
        toToken: 'BTC',
        amount: '1000000', // 0.01 WBTC
        userAddress: '0x1234567890123456789012345678901234567890',
        bitcoinFees: 1000,
        ethereumFees: 5000,
        exchangeRate: 1.0
      };

      const largeOrder = {
        fromToken: 'WBTC',
        toToken: 'BTC',
        amount: '1000000000', // 10 WBTC
        userAddress: '0x1234567890123456789012345678901234567890',
        bitcoinFees: 1000,
        ethereumFees: 5000,
        exchangeRate: 1.0
      };

      const smallProfitability = calculateSwapProfitability(smallOrder);
      const largeProfitability = calculateSwapProfitability(largeOrder);

      expect(smallProfitability.profitable).toBe(false); // Fees too high relative to amount
      expect(largeProfitability.profitable).toBe(true); // Fees reasonable for large amount
    });
  });

  describe('RES-LOGIC-02: Auction bidding', () => {
    it('should analyze order and determine bid strategy', () => {
      const order = {
        fromToken: 'WBTC',
        toToken: 'BTC',
        amount: '100000000',
        userAddress: '0x1234567890123456789012345678901234567890',
        bitcoinFees: 1000,
        ethereumFees: 5000,
        exchangeRate: 1.0,
        timeRemaining: 300 // 5 minutes
      };

      const analysis = analyzeOrder(order);

      expect(analysis.shouldBid).toBeDefined();
      expect(analysis.bidAmount).toBeDefined();
      expect(analysis.bidStrategy).toBeDefined();
      expect(analysis.riskLevel).toBeDefined();
    });

    it('should submit competitive bid within seconds', async () => {
      const order = {
        fromToken: 'WBTC',
        toToken: 'BTC',
        amount: '100000000',
        userAddress: '0x1234567890123456789012345678901234567890',
        bitcoinFees: 1000,
        ethereumFees: 5000,
        exchangeRate: 1.0
      };

      const startTime = Date.now();
      const bidResult = await submitBid(order);
      const endTime = Date.now();

      expect(bidResult.success).toBe(true);
      expect(bidResult.bidId).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle auction win correctly', async () => {
      const order = {
        fromToken: 'WBTC',
        toToken: 'BTC',
        amount: '100000000',
        userAddress: '0x1234567890123456789012345678901234567890',
        bitcoinFees: 1000,
        ethereumFees: 5000,
        exchangeRate: 1.0
      };

      const winResult = await handleAuctionWin({
        orderId: 'test_order_id',
        order,
        bidAmount: '100000000'
      });

      expect(winResult.success).toBe(true);
      expect(winResult.nextAction).toBe('lock_btc');
      expect(winResult.secretHash).toBeDefined();
      expect(winResult.htlcAddress).toBeDefined();
    });

    it('should handle auction loss gracefully', async () => {
      const order = {
        fromToken: 'WBTC',
        toToken: 'BTC',
        amount: '100000000',
        userAddress: '0x1234567890123456789012345678901234567890',
        bitcoinFees: 1000,
        ethereumFees: 5000,
        exchangeRate: 1.0
      };

      const lossResult = await handleAuctionLoss({
        orderId: 'test_order_id',
        order,
        winningBid: '110000000'
      });

      expect(lossResult.success).toBe(true);
      expect(lossResult.action).toBe('continue_monitoring');
      expect(lossResult.learned).toBeDefined();
    });
  });

  describe('RES-FAIL-01: Failure handling', () => {
    it('should handle Bitcoin node failure with failover', async () => {
      const failureResult = await handleAuctionWin({
        orderId: 'test_order_id',
        order: {
          fromToken: 'WBTC',
          toToken: 'BTC',
          amount: '100000000',
          userAddress: '0x1234567890123456789012345678901234567890',
          bitcoinFees: 1000,
          ethereumFees: 5000,
          exchangeRate: 1.0
        },
        bidAmount: '100000000',
        bitcoinNodeFailure: true
      });

      expect(failureResult.success).toBe(true);
      expect(failureResult.backupNode).toBeDefined();
      expect(failureResult.continued).toBe(true);
    });

    it('should handle stuck transactions with RBF', async () => {
      const stuckTxResult = await handleAuctionWin({
        orderId: 'test_order_id',
        order: {
          fromToken: 'WBTC',
          toToken: 'BTC',
          amount: '100000000',
          userAddress: '0x1234567890123456789012345678901234567890',
          bitcoinFees: 1000,
          ethereumFees: 5000,
          exchangeRate: 1.0
        },
        bidAmount: '100000000',
        stuckTransaction: {
          txid: 'stuck_tx_id',
          originalFee: 1000
        }
      });

      expect(stuckTxResult.success).toBe(true);
      expect(stuckTxResult.replacementTxid).toBeDefined();
      expect(stuckTxResult.higherFee).toBe(true);
    });
  });

  describe('Market conditions and timing', () => {
    it('should adjust bid strategy based on market conditions', () => {
      const bullishMarket = {
        fromToken: 'WBTC',
        toToken: 'BTC',
        amount: '100000000',
        userAddress: '0x1234567890123456789012345678901234567890',
        bitcoinFees: 1000,
        ethereumFees: 5000,
        exchangeRate: 1.002, // Slight premium
        marketTrend: 'bullish',
        volatility: 'high'
      };

      const bearishMarket = {
        fromToken: 'WBTC',
        toToken: 'BTC',
        amount: '100000000',
        userAddress: '0x1234567890123456789012345678901234567890',
        bitcoinFees: 1000,
        ethereumFees: 5000,
        exchangeRate: 0.998, // Slight discount
        marketTrend: 'bearish',
        volatility: 'low'
      };

      const bullishAnalysis = analyzeOrder(bullishMarket);
      const bearishAnalysis = analyzeOrder(bearishMarket);

      expect(bullishAnalysis.bidStrategy).toBe('aggressive');
      expect(bearishAnalysis.bidStrategy).toBe('conservative');
    });

    it('should consider time remaining in auction', () => {
      const urgentOrder = {
        fromToken: 'WBTC',
        toToken: 'BTC',
        amount: '100000000',
        userAddress: '0x1234567890123456789012345678901234567890',
        bitcoinFees: 1000,
        ethereumFees: 5000,
        exchangeRate: 1.0,
        timeRemaining: 60 // 1 minute left
      };

      const relaxedOrder = {
        fromToken: 'WBTC',
        toToken: 'BTC',
        amount: '100000000',
        userAddress: '0x1234567890123456789012345678901234567890',
        bitcoinFees: 1000,
        ethereumFees: 5000,
        exchangeRate: 1.0,
        timeRemaining: 1800 // 30 minutes left
      };

      const urgentAnalysis = analyzeOrder(urgentOrder);
      const relaxedAnalysis = analyzeOrder(relaxedOrder);

      expect(urgentAnalysis.bidStrategy).toBe('immediate');
      expect(relaxedAnalysis.bidStrategy).toBe('wait_and_observe');
    });
  });
}); 