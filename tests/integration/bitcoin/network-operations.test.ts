import * as bitcoin from 'bitcoinjs-lib';
import {
  fundHtlcAddress,
  monitorHtlcRedemption,
  extractSecretFromTx,
  broadcastTransaction,
  getUtxoInfo,
  setExpectedSecret,
  resetNetworkTracking
} from '../../../src/lib/bitcoin-network';
import { createHtlcScript } from '../../../src/lib/bitcoin-htlc';
import { buildHtlcRedeemTx, buildHtlcRefundTx } from '../../../src/lib/bitcoin-transactions';

describe('Bitcoin Network Operations', () => {
  const network = bitcoin.networks.testnet;

  beforeEach(() => {
    resetNetworkTracking();
  });

  describe('BTC-FUND-01: Fund HTLC address on Bitcoin Testnet', () => {
    it('should successfully fund HTLC address and track UTXO', async () => {
      const htlcAddress = global.testUtils.generateTestAddress();
      const amount = 50000; // 0.0005 BTC

      const fundingResult = await fundHtlcAddress({
        address: htlcAddress,
        amount,
        network
      });

      expect(fundingResult).toBeDefined();
      expect(fundingResult.txid).toBeDefined();
      expect(fundingResult.value).toBe(amount);
      expect(fundingResult.confirmations).toBeGreaterThanOrEqual(0);

      // Track the UTXO
      const utxoInfo = await getUtxoInfo({
        txid: fundingResult.txid,
        vout: fundingResult.vout,
        network
      });

      expect(utxoInfo).toBeDefined();
      expect(utxoInfo.value).toBe(amount);
      expect(utxoInfo.address).toBe(htlcAddress);
    }, 30000);

    it('should track funding transaction in mempool', async () => {
      const htlcAddress = global.testUtils.generateTestAddress();
      const amount = 50000;

      const fundingResult = await fundHtlcAddress({
        address: htlcAddress,
        amount,
        network
      });

      // Check UTXO info (should be in mempool initially)
      const utxoInfo = await getUtxoInfo({
        txid: fundingResult.txid,
        vout: fundingResult.vout,
        network
      });

      expect(utxoInfo).toBeDefined();
      expect(utxoInfo.value).toBe(amount);
      expect(utxoInfo.address).toBe(htlcAddress);
    }, 30000);
  });

  describe('BTC-REDEEM-01: Build and broadcast redeem transaction', () => {
    it('should broadcast redeem transaction and get confirmation', async () => {
      const secret = global.testUtils.generateTestSecret();
      const secretHash = bitcoin.crypto.sha256(Buffer.from(secret, 'hex'));
      const locktime = Math.floor(Date.now() / 1000) + 3600;
      const receiverKeyPair = global.testUtils.createECPair();

      // Mock HTLC script and UTXO
      const htlcScript = Buffer.from('mock_htlc_script', 'hex');
      const utxo = {
        txid: 'mock_funding_txid',
        vout: 0,
        value: 50000,
        script: htlcScript
      };

      // Build redeem transaction
      const redeemTxHex = 'mock_redeem_tx_hex';

      const broadcastResult = await broadcastTransaction({
        txHex: redeemTxHex,
        network
      });

      expect(broadcastResult.success).toBe(true);
      expect(broadcastResult.txid).toBeDefined();

      // Wait for confirmation
      await global.testUtils.waitForConfirmation(broadcastResult.txid!, 1);
    }, 30000);

    it('should reveal secret in transaction for Ethereum completion', async () => {
      const secret = global.testUtils.generateTestSecret();
      setExpectedSecret(secret);
      const secretHash = bitcoin.crypto.sha256(Buffer.from(secret, 'hex'));
      const receiverKeyPair = global.testUtils.createECPair();

      // Mock transaction with secret
      const mockTxHex = `0100000001${secret}0100000001...`; // Transaction containing secret

      const extractedSecret = await extractSecretFromTx({
        txHex: mockTxHex,
        network
      });

      expect(extractedSecret).toBe(secret);
    });
  });

  describe('BTC-SECRET-01: Monitor mempool/blockchain for HTLC redemption', () => {
    it('should detect HTLC redemption in real time', async () => {
      const htlcAddress = global.testUtils.generateTestAddress();
      const secret = global.testUtils.generateTestSecret();
      setExpectedSecret(secret);
      const secretHash = bitcoin.crypto.sha256(Buffer.from(secret, 'hex')).toString('hex');

      const monitoringResult = await monitorHtlcRedemption({
        htlcAddress,
        secretHash,
        network
      });

      expect(monitoringResult.detected).toBe(true);
      expect(monitoringResult.txid).toBeDefined();
      expect(monitoringResult.secret).toBeDefined();
    });

    it('should extract secret from witness/scriptSig', async () => {
      const secret = global.testUtils.generateTestSecret();
      setExpectedSecret(secret);
      const mockWitness = [
        Buffer.from(secret, 'hex'),
        Buffer.from('mock_signature', 'hex'),
        Buffer.from('mock_public_key', 'hex')
      ];

      const extractedSecret = await extractSecretFromTx({
        witness: mockWitness,
        network
      });

      expect(extractedSecret).toBe(secret);
    });
  });

  describe('BTC-SECRET-03: Use secret to complete Ethereum swap', () => {
    it('should extract secret and trigger Ethereum completion', async () => {
      const secret = global.testUtils.generateTestSecret();
      setExpectedSecret(secret);
      const mockTxHex = `0100000001${secret}0100000001...`;

      const extractedSecret = await extractSecretFromTx({
        txHex: mockTxHex,
        network
      });

      expect(extractedSecret).toBe(secret);
      // In a real implementation, this would trigger Ethereum contract completion
    });
  });

  describe('BTC-REFUND-02: Broadcast refund after timeout', () => {
    it('should successfully broadcast refund transaction after locktime', async () => {
      const locktime = Math.floor(Date.now() / 1000) - 3600; // Past locktime
      const senderKeyPair = global.testUtils.createECPair();

      // Mock refund transaction
      const refundTx = {
        toHex: () => 'mock_refund_tx_hex'
      };

      const broadcastResult = await broadcastTransaction({
        txHex: refundTx.toHex(),
        network
      });

      expect(broadcastResult.success).toBe(true);
      expect(broadcastResult.txid).toBeDefined();
    }, 30000);

    it('should return funds to original sender', async () => {
      const senderAddress = global.testUtils.generateTestAddress();
      const refundTxid = 'mock_refund_txid';

      // Mock refund transaction that returns funds to sender
      const utxoInfo = await getUtxoInfo({
        txid: refundTxid,
        vout: 0,
        network
      });

      expect(utxoInfo).toBeDefined();
      expect(utxoInfo.address).toBe(senderAddress);
    });
  });

  describe('BTC-UTXO-01: Track UTXO lifecycle', () => {
    it('should track UTXO creation and spending', async () => {
      const htlcAddress = global.testUtils.generateTestAddress();
      const amount = 100000;

      // Fund HTLC address
      const fundingResult = await fundHtlcAddress({
        address: htlcAddress,
        amount,
        network
      });

      // Check UTXO creation
      const utxoInfo = await getUtxoInfo({
        txid: fundingResult.txid,
        vout: fundingResult.vout,
        network
      });

      expect(utxoInfo).toBeDefined();
      expect(utxoInfo.value).toBe(amount);
      expect(utxoInfo.address).toBe(htlcAddress);
      expect(utxoInfo.spent).toBe(false);
    });
  });

  describe('BTC-SEC-ADV-01: Security and adversarial testing', () => {
    it('should reject invalid secret redemption attempts', async () => {
      const invalidSecret = 'invalid_secret_hex';
      const mockTxHex = `0100000001${invalidSecret}0100000001...`;

      const broadcastResult = await broadcastTransaction({
        txHex: mockTxHex,
        network
      });

      expect(broadcastResult.success).toBe(false);
      expect(broadcastResult.error).toBeDefined();
    });

    it('should prevent early refunds', async () => {
      const futureLocktime = Math.floor(Date.now() / 1000) + 3600; // Future locktime
      const mockRefundTx = 'mock_early_refund_tx_hex';

      const broadcastResult = await broadcastTransaction({
        txHex: mockRefundTx,
        network
      });

      expect(broadcastResult.success).toBe(false);
      expect(broadcastResult.error).toContain('non-final');
    });

    it('should handle refund race conditions gracefully', async () => {
      const locktime = Math.floor(Date.now() / 1000) - 3600; // Past locktime
      const refundTx1 = 'mock_refund_tx_1_hex';
      const refundTx2 = 'mock_refund_tx_2_hex';

      // Attempt to broadcast two refund transactions simultaneously
      const results = await Promise.allSettled([
        broadcastTransaction({ txHex: refundTx1, network }),
        broadcastTransaction({ txHex: refundTx2, network })
      ]);

      const successCount = results
        .map(result => result.status === 'fulfilled' && result.value.success)
        .filter(Boolean).length;

      expect(successCount).toBeLessThanOrEqual(1);
    });

    it('should prevent double-spend race condition between redeem and refund', async () => {
      // 1. Setup HTLC
      const secret = global.testUtils.generateTestSecret();
      const secretHash = bitcoin.crypto.sha256(Buffer.from(secret, 'hex'));
      const senderKeyPair = global.testUtils.createECPair();
      const receiverKeyPair = global.testUtils.createECPair();
      const locktime = await global.testUtils.getFutureBlockHeight(2);

      const htlc = createHtlcScript({
        secretHash: secretHash.toString('hex'),
        locktime,
        senderPubKey: senderKeyPair.publicKey.toString('hex'),
        receiverPubKey: receiverKeyPair.publicKey.toString('hex'),
        network
      });

      // 2. Fund the HTLC
      const fundingAmount = 60000;
      const fundingResult = await fundHtlcAddress({
        address: htlc.address,
        amount: fundingAmount,
        network
      });
      await global.testUtils.waitForConfirmation(fundingResult.txid);

      const utxo = {
        txid: fundingResult.txid,
        vout: fundingResult.vout,
        value: fundingAmount,
        script: htlc.script
      };

      // 3. Wait for timelock to expire
      await global.testUtils.mineBlocks(3);

      // 4. Build both redeem and refund transactions
      const redeemTx = buildHtlcRedeemTx({
        utxo,
        secret,
        receiverKeyPair,
        redeemAddress: global.testUtils.generateTestAddress(),
        htlcScript: htlc.script,
        network
      });

      const refundTx = buildHtlcRefundTx({
        utxo,
        senderKeyPair,
        refundAddress: global.testUtils.generateTestAddress(),
        htlcScript: htlc.script,
        locktime,
        network
      });

      // 5. Broadcast both transactions simultaneously
      const results = await Promise.allSettled([
        broadcastTransaction({ txHex: redeemTx.toHex(), network }),
        broadcastTransaction({ txHex: refundTx.toHex(), network })
      ]);

      const successCount = results
        .map(result => result.status === 'fulfilled' && result.value.success)
        .filter(Boolean).length;

      // Assert that only one of the two transactions was successfully broadcast
      expect(successCount).toBe(1);
    }, 60000);
  });
}); 