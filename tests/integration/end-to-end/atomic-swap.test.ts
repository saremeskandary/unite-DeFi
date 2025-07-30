import * as bitcoin from 'bitcoinjs-lib';
import {
  initiateAtomicSwap,
  completeAtomicSwap,
  monitorSwapProgress,
  handleSwapFailure
} from '../../../src/lib/atomic-swap-integration';

describe('End-to-End Atomic Swap Scenarios', () => {
  const network = bitcoin.networks.testnet;

  describe('Scenario A: User Swaps ERC20 for Native BTC', () => {
    it('should complete full swap from ERC20 to BTC', async () => {
      const swapParams = {
        fromToken: 'WBTC',
        toToken: 'BTC',
        amount: '100000000', // 1 WBTC (8 decimals)
        userAddress: '0x1234567890123456789012345678901234567890',
        network
      };

      // Step 1: User creates Fusion order
      const orderResult = await initiateAtomicSwap(swapParams);
      expect(orderResult.success).toBe(true);
      expect(orderResult.orderId!).toBeDefined();
      expect(orderResult.secretHash).toBeDefined();

      // Step 2: Resolver wins auction and locks BTC
      const resolverAction = await completeAtomicSwap({
        orderId: orderResult.orderId!,
        secretHash: orderResult.secretHash,
        action: 'lock_btc'
      });
      expect(resolverAction.success).toBe(true);
      expect(resolverAction.btcAddress).toBeDefined();
      expect(resolverAction.btcAmount).toBeDefined();

      // Step 3: Monitor for BTC lock
      const lockResult = await monitorSwapProgress({
        orderId: orderResult.orderId!,
        checkType: 'btc_lock'
      });
      expect(lockResult.locked).toBe(true);
      expect(lockResult.txid).toBeDefined();

      // Step 4: User reveals secret to claim BTC
      const claimResult = await completeAtomicSwap({
        orderId: orderResult.orderId!,
        action: 'claim_btc',
        secret: orderResult.secret
      });
      expect(claimResult.success).toBe(true);
      expect(claimResult.btcTxid).toBeDefined();

      // Step 5: Resolver claims WBTC using revealed secret
      const finalResult = await completeAtomicSwap({
        orderId: orderResult.orderId!,
        action: 'claim_erc20',
        secret: orderResult.secret
      });
      expect(finalResult.success).toBe(true);
      expect(finalResult.ethTxid).toBeDefined();

      // Verify swap completion
      const swapStatus = await monitorSwapProgress({
        orderId: orderResult.orderId!,
        checkType: 'completion'
      });
      expect(swapStatus.completed).toBe(true);
      expect(swapStatus.userReceivedBtc).toBe(true);
      expect(swapStatus.resolverReceivedWbtc).toBe(true);
    }, 60000);

    it('should handle timeout and refund scenario', async () => {
      const swapParams = {
        fromToken: 'WBTC',
        toToken: 'BTC',
        amount: '50000000', // 0.5 WBTC
        userAddress: '0x1234567890123456789012345678901234567890',
        network
      };

      // Initiate swap
      const orderResult = await initiateAtomicSwap(swapParams);
      expect(orderResult.success).toBe(true);

      // Resolver locks BTC
      const resolverAction = await completeAtomicSwap({
        orderId: orderResult.orderId!,
        secretHash: orderResult.secretHash,
        action: 'lock_btc'
      });
      expect(resolverAction.success).toBe(true);

      // Simulate timeout (user doesn't claim)
      const timeoutResult = await handleSwapFailure({
        orderId: orderResult.orderId!,
        failureType: 'timeout',
        action: 'refund_btc'
      });
      expect(timeoutResult.success).toBe(true);
      expect(timeoutResult.refundTxid).toBeDefined();

      // Verify refund
      const refundStatus = await monitorSwapProgress({
        orderId: orderResult.orderId!,
        checkType: 'refund'
      });
      expect(refundStatus.refunded).toBe(true);
      expect(refundStatus.resolverReceivedBtc).toBe(true);
    }, 60000);
  });

  describe('Scenario B: User Swaps Native BTC for ERC20', () => {
    it('should complete full swap from BTC to ERC20', async () => {
      const swapParams = {
        fromToken: 'BTC',
        toToken: 'WBTC',
        amount: '100000', // 0.001 BTC
        userAddress: '0x1234567890123456789012345678901234567890',
        network
      };

      // Step 1: User creates Fusion order and locks BTC
      const orderResult = await initiateAtomicSwap(swapParams);
      expect(orderResult.success).toBe(true);
      expect(orderResult.btcAddress).toBeDefined();
      expect(orderResult.secretHash).toBeDefined();

      // Step 2: User funds BTC HTLC
      const fundingResult = await completeAtomicSwap({
        orderId: orderResult.orderId!,
        action: 'fund_btc_htlc',
        btcAmount: swapParams.amount
      });
      expect(fundingResult.success).toBe(true);
      expect(fundingResult.fundingTxid).toBeDefined();

      // Step 3: Resolver detects funded HTLC and fills order
      const resolverAction = await completeAtomicSwap({
        orderId: orderResult.orderId!,
        action: 'fill_erc20_order',
        secretHash: orderResult.secretHash
      });
      expect(resolverAction.success).toBe(true);
      expect(resolverAction.ethTxid).toBeDefined();
      expect(resolverAction.secret).toBeDefined(); // Secret revealed on Ethereum

      // Step 4: User claims BTC using revealed secret
      const claimResult = await completeAtomicSwap({
        orderId: orderResult.orderId!,
        action: 'claim_btc_with_secret',
        secret: resolverAction.secret
      });
      expect(claimResult.success).toBe(true);
      expect(claimResult.btcTxid).toBeDefined();

      // Verify swap completion
      const swapStatus = await monitorSwapProgress({
        orderId: orderResult.orderId!,
        checkType: 'completion'
      });
      expect(swapStatus.completed).toBe(true);
      expect(swapStatus.userReceivedWbtc).toBe(true);
      expect(swapStatus.userRedeemedBtc).toBe(true);
    }, 60000);

    it('should handle resolver failure and user refund', async () => {
      const swapParams = {
        fromToken: 'BTC',
        toToken: 'WBTC',
        amount: '50000', // 0.0005 BTC
        userAddress: '0x1234567890123456789012345678901234567890',
        network
      };

      // Initiate swap and fund BTC
      const orderResult = await initiateAtomicSwap(swapParams);
      const fundingResult = await completeAtomicSwap({
        orderId: orderResult.orderId!,
        action: 'fund_btc_htlc',
        btcAmount: swapParams.amount
      });

      // Simulate resolver failure (doesn't fill order)
      const failureResult = await handleSwapFailure({
        orderId: orderResult.orderId!,
        failureType: 'resolver_failure',
        action: 'user_refund_btc'
      });
      expect(failureResult.success).toBe(true);
      expect(failureResult.refundTxid).toBeDefined();

      // Verify user refund
      const refundStatus = await monitorSwapProgress({
        orderId: orderResult.orderId!,
        checkType: 'refund'
      });
      expect(refundStatus.refunded).toBe(true);
      expect(refundStatus.userReceivedBtc).toBe(true);
    }, 60000);
  });

  describe('RES-LOGIC-01: Resolver profitability logic', () => {
    it('should not bid on unprofitable orders', async () => {
      const unprofitableOrder = {
        fromToken: 'WBTC',
        toToken: 'BTC',
        amount: '100000000', // 1 WBTC
        userAddress: '0x1234567890123456789012345678901234567890',
        network,
        bitcoinFees: 50000, // High Bitcoin fees
        ethereumFees: 100000 // High Ethereum fees
      };

      const profitabilityCheck = await initiateAtomicSwap(unprofitableOrder);
      expect(profitabilityCheck.profitable).toBe(false);
      expect(profitabilityCheck.reason).toContain('fees');
    });

    it('should bid on profitable orders', async () => {
      const profitableOrder = {
        fromToken: 'WBTC',
        toToken: 'BTC',
        amount: '100000000', // 1 WBTC
        userAddress: '0x1234567890123456789012345678901234567890',
        network,
        bitcoinFees: 1000, // Low Bitcoin fees
        ethereumFees: 5000 // Low Ethereum fees
      };

      const profitabilityCheck = await initiateAtomicSwap(profitableOrder);
      expect(profitabilityCheck.profitable).toBe(true);
      expect(profitabilityCheck.orderId).toBeDefined();
    });
  });

  describe('RES-FAIL-01: Resolver failure handling', () => {
    it('should handle Bitcoin node failure gracefully', async () => {
      const swapParams = {
        fromToken: 'WBTC',
        toToken: 'BTC',
        amount: '100000000',
        userAddress: '0x1234567890123456789012345678901234567890',
        network
      };

      // Simulate Bitcoin node failure
      const failureResult = await handleSwapFailure({
        orderId: 'test_order_id',
        failureType: 'bitcoin_node_failure',
        action: 'failover_to_backup'
      });

      expect(failureResult.success).toBe(true);
      expect(failureResult.backupNode).toBeDefined();
      expect(failureResult.continued).toBe(true);
    });

    it('should handle stuck transactions with RBF', async () => {
      const stuckTxResult = await handleSwapFailure({
        orderId: 'test_order_id',
        failureType: 'stuck_transaction',
        action: 'replace_by_fee',
        originalTxid: 'stuck_tx_id'
      });

      expect(stuckTxResult.success).toBe(true);
      expect(stuckTxResult.replacementTxid).toBeDefined();
      expect(stuckTxResult.higherFee).toBe(true);
    });
  });

  describe('SEC-ADV-02: Security and adversarial testing', () => {
    it('should prevent secret reuse across chains', async () => {
      const secret = global.testUtils.generateTestSecret();

      // First swap
      const swap1 = await initiateAtomicSwap({
        fromToken: 'WBTC',
        toToken: 'BTC',
        amount: '100000000',
        userAddress: '0x1234567890123456789012345678901234567890',
        network,
        secret
      });

      // Attempt second swap with same secret
      const swap2 = await initiateAtomicSwap({
        fromToken: 'WBTC',
        toToken: 'BTC',
        amount: '100000000',
        userAddress: '0x0987654321098765432109876543210987654321',
        network,
        secret
      });

      expect(swap2.success).toBe(false);
      expect(swap2.error).toContain('secret reuse');
    });

    it('should handle ETH-side failure gracefully', async () => {
      const swapParams = {
        fromToken: 'WBTC',
        toToken: 'BTC',
        amount: '100000000',
        userAddress: '0x1234567890123456789012345678901234567890',
        network
      };

      // Initiate swap
      const orderResult = await initiateAtomicSwap(swapParams);

      // Simulate ETH-side failure
      const failureResult = await handleSwapFailure({
        orderId: orderResult.orderId!,
        failureType: 'ethereum_failure',
        action: 'retry_eth_completion'
      });

      expect(failureResult.success).toBe(true);
      expect(failureResult.retryAttempts).toBeGreaterThan(0);
      expect(failureResult.btcRemainsSafe).toBe(true);
    });
  });
}); 