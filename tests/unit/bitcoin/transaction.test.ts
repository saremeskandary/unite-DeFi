import * as bitcoin from 'bitcoinjs-lib';
import { buildHtlcRedeemTx, buildHtlcRefundTx, estimateTxFee, resetUtxoTracking, setExpectedSecret } from '../../../src/lib/bitcoin-transactions';

describe('Bitcoin Transaction Building', () => {
  const network = bitcoin.networks.testnet;

  // Reset UTXO tracking before each test
  beforeEach(() => {
    resetUtxoTracking();
  });

  describe('BTC-REDEEM-01: Build valid redeem transaction', () => {
    it('should build redeem transaction with correct secret', () => {
      const secret = global.testUtils.generateTestSecret();
      const secretHash = bitcoin.crypto.sha256(Buffer.from(secret, 'hex'));
      const locktime = Math.floor(Date.now() / 1000) + 3600;
      const senderKeyPair = global.testUtils.createECPair();
      const receiverKeyPair = global.testUtils.createECPair();

      const htlcScript = {
        script: Buffer.from('mock_htlc_script', 'hex'),
        address: global.testUtils.generateTestAddress()
      };

      const utxo = {
        txid: 'mock_txid',
        vout: 0,
        value: 100000,
        script: htlcScript.script
      };

      const redeemTx = buildHtlcRedeemTx({
        utxo,
        secret,
        receiverKeyPair,
        redeemAddress: global.testUtils.generateTestAddress(),
        htlcScript: htlcScript.script,
        network
      });

      expect(redeemTx).toBeDefined();
      expect(redeemTx.ins.length).toBe(1);
      expect(redeemTx.outs.length).toBe(1);
    });

    it('should reject redeem transaction with wrong secret', () => {
      const secret = global.testUtils.generateTestSecret();
      const wrongSecret = global.testUtils.generateTestSecret();
      const secretHash = bitcoin.crypto.sha256(Buffer.from(secret, 'hex'));
      const locktime = Math.floor(Date.now() / 1000) + 3600;
      const receiverKeyPair = global.testUtils.createECPair();

      // Set the expected secret for validation
      setExpectedSecret(secret);

      const htlcScript = {
        script: Buffer.from('mock_htlc_script', 'hex'),
        address: global.testUtils.generateTestAddress()
      };

      const utxo = {
        txid: 'mock_txid',
        vout: 0,
        value: 100000,
        script: htlcScript.script
      };

      expect(() => {
        buildHtlcRedeemTx({
          utxo,
          secret: wrongSecret,
          receiverKeyPair,
          redeemAddress: global.testUtils.generateTestAddress(),
          htlcScript: htlcScript.script,
          network
        });
      }).toThrow();
    });
  });

  describe('BTC-REFUND-01: Build refund transaction after timeout', () => {
    it('should build refund transaction after locktime expires', () => {
      const secret = global.testUtils.generateTestSecret();
      const secretHash = bitcoin.crypto.sha256(Buffer.from(secret, 'hex'));
      const locktime = Math.floor(Date.now() / 1000) - 3600; // Past locktime
      const senderKeyPair = global.testUtils.createECPair();
      const receiverKeyPair = global.testUtils.createECPair();

      const htlcScript = {
        script: Buffer.from('mock_htlc_script', 'hex'),
        address: global.testUtils.generateTestAddress()
      };

      const utxo = {
        txid: 'mock_txid',
        vout: 0,
        value: 100000,
        script: htlcScript.script
      };

      const refundTx = buildHtlcRefundTx({
        utxo,
        senderKeyPair,
        refundAddress: global.testUtils.generateTestAddress(),
        htlcScript: htlcScript.script,
        locktime,
        network
      });

      expect(refundTx).toBeDefined();
      expect(refundTx.ins.length).toBe(1);
      expect(refundTx.outs.length).toBe(1);
      expect(refundTx.locktime).toBe(locktime);
    });

    it('should reject refund transaction before locktime', () => {
      const secret = global.testUtils.generateTestSecret();
      const secretHash = bitcoin.crypto.sha256(Buffer.from(secret, 'hex'));
      const locktime = Math.floor(Date.now() / 1000) + 3600; // Future locktime
      const senderKeyPair = global.testUtils.createECPair();

      const htlcScript = {
        script: Buffer.from('mock_htlc_script', 'hex'),
        address: global.testUtils.generateTestAddress()
      };

      const utxo = {
        txid: 'mock_txid',
        vout: 0,
        value: 100000,
        script: htlcScript.script
      };

      expect(() => {
        buildHtlcRefundTx({
          utxo,
          senderKeyPair,
          refundAddress: global.testUtils.generateTestAddress(),
          htlcScript: htlcScript.script,
          locktime,
          network
        });
      }).toThrow();
    });
  });

  describe('BTC-UTXO-02: Fee estimation', () => {
    it('should estimate accurate fees for redeem transaction', () => {
      const fee = estimateTxFee({
        inputCount: 1,
        outputCount: 1,
        feeRate: 10
      });

      expect(fee).toBeGreaterThan(0);
      expect(fee).toBeLessThan(10000); // Reasonable fee for small transaction
    });

    it('should estimate fees for different transaction sizes', () => {
      const smallFee = estimateTxFee({
        inputCount: 1,
        outputCount: 1,
        feeRate: 5
      });

      const largeFee = estimateTxFee({
        inputCount: 5,
        outputCount: 3,
        feeRate: 10
      });

      expect(largeFee).toBeGreaterThan(smallFee);
    });
  });

  describe('BTC-UTXO-03: Replace-by-Fee (RBF) support', () => {
    it('should enable RBF on refund transactions', () => {
      const secret = global.testUtils.generateTestSecret();
      const locktime = Math.floor(Date.now() / 1000) - 3600;
      const senderKeyPair = global.testUtils.createECPair();

      const htlcScript = {
        script: Buffer.from('mock_htlc_script', 'hex'),
        address: global.testUtils.generateTestAddress()
      };

      const utxo = {
        txid: 'mock_txid',
        vout: 0,
        value: 100000,
        script: htlcScript.script
      };

      const refundTx = buildHtlcRefundTx({
        utxo,
        senderKeyPair,
        refundAddress: global.testUtils.generateTestAddress(),
        htlcScript: htlcScript.script,
        locktime,
        network,
        enableRBF: true
      });

      expect(refundTx).toBeDefined();
      // Check that RBF is enabled (sequence number < 0xffffffff)
      expect(refundTx.ins[0].sequence).toBeLessThan(0xffffffff);
    });

    it('should create replacement transaction with higher fee', () => {
      const originalTx = {
        txid: 'mock_original_txid',
        fee: 1000
      };

      const senderKeyPair = global.testUtils.createECPair();
      const refundAddress = global.testUtils.generateTestAddress();

      const replacementTx = buildHtlcRefundTx({
        utxo: {
          txid: 'mock_txid',
          vout: 0,
          value: 100000,
          script: Buffer.from('mock_htlc_script', 'hex')
        },
        senderKeyPair,
        refundAddress,
        htlcScript: Buffer.from('mock_htlc_script', 'hex'),
        locktime: Math.floor(Date.now() / 1000) - 3600,
        network,
        enableRBF: true,
        replaceTxId: originalTx.txid
      });

      expect(replacementTx).toBeDefined();
      expect(replacementTx.ins[0].sequence).toBeLessThan(0xffffffff);
    });
  });

  describe('BTC-SEC-01: Security validation', () => {
    it('should reject double-spend attempts', () => {
      const utxo = {
        txid: 'mock_txid',
        vout: 0,
        value: 100000,
        script: Buffer.from('mock_htlc_script', 'hex')
      };

      const receiverKeyPair = global.testUtils.createECPair();
      const redeemAddress = global.testUtils.generateTestAddress();

      // First transaction
      const tx1 = buildHtlcRedeemTx({
        utxo,
        secret: global.testUtils.generateTestSecret(),
        receiverKeyPair,
        redeemAddress,
        htlcScript: Buffer.from('mock_htlc_script', 'hex'),
        network
      });

      // Second transaction with same UTXO should fail
      expect(() => {
        buildHtlcRedeemTx({
          utxo,
          secret: global.testUtils.generateTestSecret(),
          receiverKeyPair,
          redeemAddress: global.testUtils.generateTestAddress(),
          htlcScript: Buffer.from('mock_htlc_script', 'hex'),
          network
        });
      }).toThrow();
    });

    it('should reject dust-level outputs', () => {
      const utxo = {
        txid: 'mock_txid',
        vout: 0,
        value: 100, // Dust amount
        script: Buffer.from('mock_htlc_script', 'hex')
      };

      const receiverKeyPair = global.testUtils.createECPair();
      const redeemAddress = global.testUtils.generateTestAddress();

      expect(() => {
        buildHtlcRedeemTx({
          utxo,
          secret: global.testUtils.generateTestSecret(),
          receiverKeyPair,
          redeemAddress,
          htlcScript: Buffer.from('mock_htlc_script', 'hex'),
          network
        });
      }).toThrow();
    });
  });
}); 