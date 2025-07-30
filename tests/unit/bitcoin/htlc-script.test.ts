import * as bitcoin from 'bitcoinjs-lib';
import { createHtlcScript, validateHtlcScript } from '../../../src/lib/bitcoin-htlc';

describe('Bitcoin HTLC Script Logic', () => {
  const network = bitcoin.networks.testnet;
  
  describe('BTC-HTLC-01: Generate script with secret hash and locktime', () => {
    it('should generate valid HTLC script with correct OP codes', () => {
      const secret = global.testUtils.generateTestSecret();
      const secretHash = bitcoin.crypto.sha256(Buffer.from(secret, 'hex'));
      const locktime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const senderKeyPair = global.testUtils.createECPair();
      const receiverKeyPair = global.testUtils.createECPair();

      const script = createHtlcScript({
        secretHash: secretHash.toString('hex'),
        locktime,
        senderPubKey: senderKeyPair.publicKey.toString('hex'),
        receiverPubKey: receiverKeyPair.publicKey.toString('hex'),
        network
      });

      expect(script).toBeDefined();
      expect(script.script).toBeInstanceOf(Buffer);
      
      // Verify script contains expected OP codes
      const scriptHex = script.script.toString('hex');
      expect(scriptHex).toContain('63'); // OP_IF
      expect(scriptHex).toContain('ac'); // OP_CHECKSIGVERIFY
      expect(scriptHex).toContain('a8'); // OP_SHA256
      expect(scriptHex).toContain('87'); // OP_EQUAL
      expect(scriptHex).toContain('67'); // OP_ELSE
      expect(scriptHex).toContain('b1'); // OP_CHECKLOCKTIMEVERIFY
      expect(scriptHex).toContain('75'); // OP_DROP
      expect(scriptHex).toContain('ac'); // OP_CHECKSIG
      expect(scriptHex).toContain('68'); // OP_ENDIF
    });

    it('should generate different scripts for different parameters', () => {
      const secret1 = global.testUtils.generateTestSecret();
      const secret2 = global.testUtils.generateTestSecret();
      const secretHash1 = bitcoin.crypto.sha256(Buffer.from(secret1, 'hex'));
      const secretHash2 = bitcoin.crypto.sha256(Buffer.from(secret2, 'hex'));
      
      const script1 = createHtlcScript({
        secretHash: secretHash1.toString('hex'),
        locktime: 1000,
        senderPubKey: global.testUtils.createECPair().publicKey.toString('hex'),
        receiverPubKey: global.testUtils.createECPair().publicKey.toString('hex'),
        network
      });

      const script2 = createHtlcScript({
        secretHash: secretHash2.toString('hex'),
        locktime: 2000,
        senderPubKey: global.testUtils.createECPair().publicKey.toString('hex'),
        receiverPubKey: global.testUtils.createECPair().publicKey.toString('hex'),
        network
      });

      expect(script1.script).not.toEqual(script2.script);
    });
  });

  describe('BTC-HTLC-02: Validate output script hash matches generated address', () => {
    it('should generate correct P2SH address from script', () => {
      const secret = global.testUtils.generateTestSecret();
      const secretHash = bitcoin.crypto.sha256(Buffer.from(secret, 'hex'));
      const locktime = Math.floor(Date.now() / 1000) + 3600;
      const senderKeyPair = global.testUtils.createECPair();
      const receiverKeyPair = global.testUtils.createECPair();

      const script = createHtlcScript({
        secretHash: secretHash.toString('hex'),
        locktime,
        senderPubKey: senderKeyPair.publicKey.toString('hex'),
        receiverPubKey: receiverKeyPair.publicKey.toString('hex'),
        network
      });

      expect(script.address).toBeDefined();
      expect(script.address).toMatch(/^[2mn][1-9A-HJ-NP-Za-km-z]{25,34}$/); // P2SH format
      
      // Verify address is valid for testnet
      expect(bitcoin.address.toOutputScript(script.address, network)).toBeDefined();
    });

    it('should generate correct P2WSH address from script', () => {
      const secret = global.testUtils.generateTestSecret();
      const secretHash = bitcoin.crypto.sha256(Buffer.from(secret, 'hex'));
      const locktime = Math.floor(Date.now() / 1000) + 3600;
      const senderKeyPair = global.testUtils.createECPair();
      const receiverKeyPair = global.testUtils.createECPair();

      const script = createHtlcScript({
        secretHash: secretHash.toString('hex'),
        locktime,
        senderPubKey: senderKeyPair.publicKey.toString('hex'),
        receiverPubKey: receiverKeyPair.publicKey.toString('hex'),
        network,
        addressType: 'p2wsh'
      });

      expect(script.address).toBeDefined();
      expect(script.address).toMatch(/^tb1[ac-hj-np-z02-9]{11,90}$/); // P2WSH bech32 format
      
      // Verify address is valid for testnet
      expect(bitcoin.address.toOutputScript(script.address, network)).toBeDefined();
    });
  });

  describe('BTC-HTLC-03: Script supports both redeem and refund paths', () => {
    it('should validate redeem path with correct secret', () => {
      const secret = global.testUtils.generateTestSecret();
      const secretHash = bitcoin.crypto.sha256(Buffer.from(secret, 'hex'));
      const locktime = Math.floor(Date.now() / 1000) + 3600;
      const senderKeyPair = global.testUtils.createECPair();
      const receiverKeyPair = global.testUtils.createECPair();

      const script = createHtlcScript({
        secretHash: secretHash.toString('hex'),
        locktime,
        senderPubKey: senderKeyPair.publicKey.toString('hex'),
        receiverPubKey: receiverKeyPair.publicKey.toString('hex'),
        network
      });

      const isValid = validateHtlcScript({
        script: script.script,
        secret,
        pubKey: receiverKeyPair.publicKey.toString('hex'),
        path: 'redeem'
      });

      expect(isValid).toBe(true);
    });

    it('should validate refund path after locktime', () => {
      const secret = global.testUtils.generateTestSecret();
      const secretHash = bitcoin.crypto.sha256(Buffer.from(secret, 'hex'));
      const locktime = Math.floor(Date.now() / 1000) - 3600; // Past locktime
      const senderKeyPair = global.testUtils.createECPair();
      const receiverKeyPair = global.testUtils.createECPair();

      const script = createHtlcScript({
        secretHash: secretHash.toString('hex'),
        locktime,
        senderPubKey: senderKeyPair.publicKey.toString('hex'),
        receiverPubKey: receiverKeyPair.publicKey.toString('hex'),
        network
      });

      const isValid = validateHtlcScript({
        script: script.script,
        pubKey: senderKeyPair.publicKey.toString('hex'),
        path: 'refund',
        currentTime: Math.floor(Date.now() / 1000)
      });

      expect(isValid).toBe(true);
    });

    it('should reject refund path before locktime', () => {
      const secret = global.testUtils.generateTestSecret();
      const secretHash = bitcoin.crypto.sha256(Buffer.from(secret, 'hex'));
      const locktime = Math.floor(Date.now() / 1000) + 3600; // Future locktime
      const senderKeyPair = global.testUtils.createECPair();
      const receiverKeyPair = global.testUtils.createECPair();

      const script = createHtlcScript({
        secretHash: secretHash.toString('hex'),
        locktime,
        senderPubKey: senderKeyPair.publicKey.toString('hex'),
        receiverPubKey: receiverKeyPair.publicKey.toString('hex'),
        network
      });

      const isValid = validateHtlcScript({
        script: script.script,
        pubKey: senderKeyPair.publicKey.toString('hex'),
        path: 'refund',
        currentTime: Math.floor(Date.now() / 1000)
      });

      expect(isValid).toBe(false);
    });
  });

  describe('BTC-HTLC-04: Compatibility with BIP199/BIP65', () => {
    it('should use CHECKLOCKTIMEVERIFY for timelock', () => {
      const secret = global.testUtils.generateTestSecret();
      const secretHash = bitcoin.crypto.sha256(Buffer.from(secret, 'hex'));
      const locktime = Math.floor(Date.now() / 1000) + 3600;
      const senderKeyPair = global.testUtils.createECPair();
      const receiverKeyPair = global.testUtils.createECPair();

      const script = createHtlcScript({
        secretHash: secretHash.toString('hex'),
        locktime,
        senderPubKey: senderKeyPair.publicKey.toString('hex'),
        receiverPubKey: receiverKeyPair.publicKey.toString('hex'),
        network
      });

      const scriptHex = script.script.toString('hex');
      expect(scriptHex).toContain('b1'); // OP_CHECKLOCKTIMEVERIFY
    });

    it('should support both block height and timestamp locktimes', () => {
      // Test with block height locktime
      const blockHeightLocktime = 2000000;
      const script1 = createHtlcScript({
        secretHash: bitcoin.crypto.sha256(Buffer.from(global.testUtils.generateTestSecret(), 'hex')).toString('hex'),
        locktime: blockHeightLocktime,
        senderPubKey: global.testUtils.createECPair().publicKey.toString('hex'),
        receiverPubKey: global.testUtils.createECPair().publicKey.toString('hex'),
        network
      });

      // Test with timestamp locktime
      const timestampLocktime = Math.floor(Date.now() / 1000) + 3600;
      const script2 = createHtlcScript({
        secretHash: bitcoin.crypto.sha256(Buffer.from(global.testUtils.generateTestSecret(), 'hex')).toString('hex'),
        locktime: timestampLocktime,
        senderPubKey: global.testUtils.createECPair().publicKey.toString('hex'),
        receiverPubKey: global.testUtils.createECPair().publicKey.toString('hex'),
        network
      });

      expect(script1.script).toBeDefined();
      expect(script2.script).toBeDefined();
    });
  });
}); 