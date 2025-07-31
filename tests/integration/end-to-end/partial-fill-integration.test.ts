import { PartialFillManager } from '@/lib/blockchains/bitcoin/partial-fill-manager';
import { PartialFillLogic } from '@/lib/blockchains/bitcoin/partial-fill-logic';
import { BitcoinRelayer } from '@/lib/blockchains/bitcoin/bitcoin-relayer';
import { BitcoinResolver } from '@/lib/blockchains/bitcoin/bitcoin-resolver';

describe('Partial Fill Integration', () => {
  let partialFillManager: PartialFillManager;
  let partialFillLogic: PartialFillLogic;
  let bitcoinRelayer: BitcoinRelayer;
  let bitcoinResolver: BitcoinResolver;

  beforeEach(() => {
    partialFillManager = new PartialFillManager();
    partialFillLogic = new PartialFillLogic(partialFillManager);
    bitcoinRelayer = new BitcoinRelayer({
      rpcUrl: process.env.BITCOIN_RPC_URL || 'http://localhost:18332',
      rpcUser: process.env.BITCOIN_RPC_USER || 'test',
      rpcPass: process.env.BITCOIN_RPC_PASS || 'test'
    });
    bitcoinResolver = new BitcoinResolver({
      rpcUrl: process.env.BITCOIN_RPC_URL || 'http://localhost:18332',
      rpcUser: process.env.BITCOIN_RPC_USER || 'test',
      rpcPass: process.env.BITCOIN_RPC_PASS || 'test'
    });
  });

  describe('PF-INTEGRATION-01: Complete partial fill workflow', () => {
    it('should complete full partial fill workflow from creation to execution', async () => {
      // 1. Generate multiple secrets
      const secrets = await partialFillManager.generateMultipleSecrets(3);
      expect(secrets).toHaveLength(3);

      // 2. Create partial fill order
      const orderParams = {
        totalAmount: '1.0',
        partialAmounts: ['0.3', '0.4', '0.3'],
        fromToken: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
        toToken: 'bitcoin',
        userAddress: global.testUtils.generateTestBitcoinAddress(),
        timelock: Math.floor(Date.now() / 1000) + 3600
      };

      const order = await partialFillLogic.createPartialFillOrder(orderParams);
      expect(order.status).toBe('pending');
      expect(order.partialOrders).toHaveLength(3);

      // 3. Assign resolvers
      const resolverAssignments = await partialFillLogic.assignResolvers(order.orderId);
      expect(resolverAssignments).toHaveLength(3);

      // 4. Calculate profitability for each resolver
      const profitabilityChecks = await Promise.all(
        resolverAssignments.map(assignment =>
          bitcoinResolver.calculateProfitability({
            id: assignment.partialOrderId,
            amount: orderParams.partialAmounts[0],
            fee: '0.001',
            exchangeRate: 45000,
            networkFee: '0.0001'
          })
        )
      );

      profitabilityChecks.forEach(check => {
        expect(check.profitable).toBeDefined();
      });

      // 5. Submit bids from profitable resolvers
      const profitableAssignments = resolverAssignments.filter((_, index) =>
        profitabilityChecks[index].profitable
      );

      const bids = await Promise.all(
        profitableAssignments.map(assignment =>
          partialFillLogic.submitResolverBid(assignment.partialOrderId, {
            partialOrderId: assignment.partialOrderId,
            resolverId: assignment.resolverId,
            bidAmount: orderParams.partialAmounts[0],
            fee: '0.001'
          })
        )
      );

      expect(bids.length).toBeGreaterThan(0);

      // 6. Execute partial fills
      const executions = await Promise.all(
        bids.map(bid => {
          // The bid object contains the partialOrderId from the input parameter
          const partialOrderId = bid.partialOrderId;
          return partialFillLogic.executePartialFill(partialOrderId, bid.resolverId);
        })
      );

      executions.forEach(execution => {
        expect(execution.status).toBe('executed');
      });

      // 7. Monitor progress
      const progress = await partialFillLogic.getPartialFillProgress(order.orderId);
      expect(progress.completedParts).toBeGreaterThan(0);
      expect(progress.completionPercentage).toBeGreaterThan(0);

      // 8. Mark order as complete when all parts are done
      if (progress.completionPercentage === 100) {
        await partialFillLogic.markPartialFillComplete(order.orderId);
        const completedOrder = await partialFillLogic.getPartialFillOrder(order.orderId);
        expect(completedOrder.status).toBe('completed');
      }
    }, 30000); // 30 second timeout for integration test

    it('should handle partial fill with some resolver failures', async () => {
      // Create order with 3 parts
      const orderParams = {
        totalAmount: '0.9',
        partialAmounts: ['0.3', '0.3', '0.3'],
        fromToken: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        toToken: 'bitcoin',
        userAddress: global.testUtils.generateTestBitcoinAddress(),
        timelock: Math.floor(Date.now() / 1000) + 3600
      };

      const order = await partialFillLogic.createPartialFillOrder(orderParams);
      const resolverAssignments = await partialFillLogic.assignResolvers(order.orderId);

      // Simulate one resolver failure
      await partialFillLogic.markResolverFailed(resolverAssignments[0].partialOrderId, 'resolver1');

      // Should reassign failed resolver
      const reassignment = await partialFillLogic.reassignFailedResolver(resolverAssignments[0].partialOrderId);
      expect(reassignment.resolverId).not.toBe('resolver1');

      // Continue with remaining resolvers
      const remainingAssignments = [
        reassignment,
        ...resolverAssignments.slice(1)
      ];

      const executions = await Promise.all(
        remainingAssignments.map(assignment =>
          partialFillLogic.executePartialFill(assignment.partialOrderId, assignment.resolverId)
        )
      );

      // Should have successful executions
      const successfulExecutions = executions.filter(exec => exec.status === 'executed');
      expect(successfulExecutions.length).toBeGreaterThan(0);
    });

    it('should handle race conditions between multiple resolvers', async () => {
      const orderParams = {
        totalAmount: '0.4',
        partialAmounts: ['0.2', '0.2'],
        fromToken: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        toToken: 'bitcoin',
        userAddress: global.testUtils.generateTestBitcoinAddress(),
        timelock: Math.floor(Date.now() / 1000) + 3600
      };

      const order = await partialFillLogic.createPartialFillOrder(orderParams);
      const resolverAssignments = await partialFillLogic.assignResolvers(order.orderId);

      // Simulate race condition - multiple resolvers trying to execute same partial order
      const raceCondition = await Promise.allSettled([
        partialFillLogic.executePartialFill(resolverAssignments[0].partialOrderId, 'resolver1'),
        partialFillLogic.executePartialFill(resolverAssignments[0].partialOrderId, 'resolver2'),
        partialFillLogic.executePartialFill(resolverAssignments[0].partialOrderId, 'resolver3')
      ]);

      // Only one should succeed
      const successful = raceCondition.filter(result => result.status === 'fulfilled');
      expect(successful).toHaveLength(1);

      // Failed attempts should be handled gracefully
      const failed = raceCondition.filter(result => result.status === 'rejected');
      failed.forEach(result => {
        if (result.status === 'rejected') {
          expect(String(result.reason)).toContain('already executed');
        }
      });
    });

    it('should provide comprehensive analytics for partial fill orders', async () => {
      const orderParams = {
        totalAmount: '0.6',
        partialAmounts: ['0.2', '0.2', '0.2'],
        fromToken: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        toToken: 'bitcoin',
        userAddress: global.testUtils.generateTestBitcoinAddress(),
        timelock: Math.floor(Date.now() / 1000) + 3600
      };

      const order = await partialFillLogic.createPartialFillOrder(orderParams);
      const resolverAssignments = await partialFillLogic.assignResolvers(order.orderId);

      // Execute some partial fills
      await Promise.all(
        resolverAssignments.slice(0, 2).map(assignment =>
          partialFillLogic.executePartialFill(assignment.partialOrderId, assignment.resolverId)
        )
      );

      // Get analytics
      const analytics = await partialFillLogic.getPartialFillAnalytics(order.orderId);

      expect(analytics).toBeDefined();
      expect(analytics.totalOrders).toBe(1);
      expect(analytics.completedOrders).toBeGreaterThanOrEqual(0);
      expect(analytics.averageExecutionTime).toBeDefined();
      expect(analytics.successRate).toBeDefined();
      expect(analytics.totalFees).toBeDefined();
      expect(analytics.partialFillStats).toBeDefined();
      expect(analytics.partialFillStats.averageParts).toBe(3);
      expect(analytics.partialFillStats.completionRate).toBeDefined();
    });
  });

  describe('PF-INTEGRATION-02: Cross-chain coordination', () => {
    it('should coordinate Bitcoin and Ethereum resolvers for partial fills', async () => {
      const orderParams = {
        totalAmount: '0.5',
        partialAmounts: ['0.25', '0.25'],
        fromToken: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        toToken: 'bitcoin',
        userAddress: global.testUtils.generateTestBitcoinAddress(),
        timelock: Math.floor(Date.now() / 1000) + 3600
      };

      const order = await partialFillLogic.createPartialFillOrder(orderParams);
      const resolverAssignments = await partialFillLogic.assignResolvers(order.orderId);

      // Coordinate with Ethereum resolver
      const coordination = await bitcoinResolver.coordinateWithEthereumResolver(order.orderId);
      expect(coordination.synchronized).toBe(true);

      // Calculate cross-chain profit sharing
      const profitShare = await bitcoinResolver.calculateCrossChainProfitShare(order.orderId);
      expect(profitShare.bitcoinShare).toBeDefined();
      expect(profitShare.ethereumShare).toBeDefined();

      // Execute with coordinated timing
      const timing = await bitcoinResolver.coordinateTiming(order.orderId);
      expect(timing.bitcoinTiming).toBeDefined();
      expect(timing.ethereumTiming).toBeDefined();

      // Execute partial fills with coordination
      const executions = await Promise.all(
        resolverAssignments.map(assignment =>
          partialFillLogic.executePartialFill(assignment.partialOrderId, assignment.resolverId, { crossChainCoordinated: true })
        )
      );

      executions.forEach(execution => {
        expect(execution.status).toBe('executed');
        expect(execution.crossChainCoordinated).toBe(true);
      });
    });

    it('should handle cross-chain failures and recovery', async () => {
      const orderParams = {
        totalAmount: '0.3',
        partialAmounts: ['0.15', '0.15'],
        fromToken: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        toToken: 'bitcoin',
        userAddress: global.testUtils.generateTestBitcoinAddress(),
        timelock: Math.floor(Date.now() / 1000) + 3600
      };

      const order = await partialFillLogic.createPartialFillOrder(orderParams);

      // Simulate Ethereum-side failure
      const recovery = await bitcoinResolver.handleCrossChainFailure(order.orderId, 'ethereum_failure');
      expect(recovery.recovered).toBe(true);
      expect(recovery.fallbackPlan).toBeDefined();

      // Should continue with Bitcoin-only execution
      const resolverAssignments = await partialFillLogic.assignResolvers(order.orderId);
      const executions = await Promise.all(
        resolverAssignments.map(assignment =>
          partialFillLogic.executePartialFill(assignment.partialOrderId, assignment.resolverId, { fallbackMode: true })
        )
      );

      executions.forEach(execution => {
        expect(execution.status).toBe('executed');
        expect(execution.fallbackMode).toBe(true);
      });
    });
  });
}); 