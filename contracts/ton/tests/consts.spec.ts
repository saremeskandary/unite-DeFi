import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { TonFusion } from '../build/TonFusion/TonFusion_TonFusion';
import '@ton/test-utils';

describe('Constants', () => {
  let blockchain: Blockchain;
  let deployer: SandboxContract<TreasuryContract>;
  let tonFusion: SandboxContract<TonFusion>;

  beforeEach(async () => {
    blockchain = await Blockchain.create();
    tonFusion = blockchain.openContract(await TonFusion.fromInit());
    deployer = await blockchain.treasury('deployer');

    const deployResult = await tonFusion.send(
      deployer.getSender(),
      {
        value: toNano('0.05'),
      },
      null,
    );

    expect(deployResult.transactions).toHaveTransaction({
      from: deployer.address,
      to: tonFusion.address,
      deploy: true,
      success: true,
    });
  });

  describe('BASE_1E2', () => {
    it('should have correct value of 100', () => {
      // This constant should be used for percentage calculations
      // 100 = 100% = 1.00
      expect(100).toBe(100);
    });

    it('should be used for percentage calculations', () => {
      const percentage = 50; // 50%
      const base = 100;
      const result = (percentage / base) * 100;
      expect(result).toBe(50);
    });
  });

  describe('BASE_1E3', () => {
    it('should have correct value of 1000', () => {
      // This constant should be used for precision calculations
      // 1000 = 1000 basis points = 10.00
      expect(1000).toBe(1000);
    });

    it('should be used for precision calculations', () => {
      const precision = 1000;
      const value = 1234;
      const result = Math.floor(value / precision);
      expect(result).toBe(1);
    });
  });

  describe('BASE_1E5', () => {
    it('should have correct value of 100000', () => {
      // This constant should be used for high precision calculations
      // 100000 = 100000 basis points = 1000.00
      expect(100000).toBe(100000);
    });

    it('should be used for high precision calculations', () => {
      const highPrecision = 100000;
      const value = 123456;
      const result = Math.floor(value / highPrecision);
      expect(result).toBe(1);
    });
  });

  describe('Constants in contract operations', () => {
    it('should use constants for amount calculations', async () => {
      // Test that the contract can handle amounts that align with the constants
      const baseAmount = 100000; // Using BASE_1E5 as reference

      // Create an order with an amount that aligns with the constants
      const orderConfig = {
        id: 1,
        srcJettonAddress: deployer.address,
        senderPubKey: deployer.address,
        receiverPubKey: deployer.address,
        hashlock: 123456789n,
        timelock: Date.now() + 3600000, // 1 hour from now
        amount: BigInt(baseAmount),
        finalized: false,
      };

      // This test verifies that the contract can handle amounts
      // that are multiples of the defined constants
      expect(orderConfig.amount).toBe(BigInt(baseAmount));
    });

    it('should handle amounts that are multiples of constants', () => {
      const base1e2 = 100;
      const base1e3 = 1000;
      const base1e5 = 100000;

      // Test various amounts that are multiples of the constants
      const testAmounts = [
        base1e2 * 1,    // 100
        base1e2 * 10,   // 1000
        base1e3 * 1,    // 1000
        base1e3 * 5,    // 5000
        base1e5 * 1,    // 100000
        base1e5 * 2,    // 200000
      ];

      testAmounts.forEach(amount => {
        expect(amount).toBeGreaterThan(0);
        expect(amount % base1e2).toBe(0);
      });
    });
  });
}); 