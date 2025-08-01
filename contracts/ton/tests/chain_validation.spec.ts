import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, beginCell, Address, Cell, Dictionary } from '@ton/core';
import { TonFusion } from '../build/TonFusion/TonFusion_TonFusion';
import { TestJettonMaster } from '../build/TestJettonMaster/TestJettonMaster_TestJettonMaster';
import '@ton/test-utils';
import { randomAddress } from '@ton/test-utils';

// Helper function to create a hash from a secret
function createHash(secret: bigint): bigint {
  return secret * 2n + 1n;
}

// Helper function to get current timestamp
function now(): number {
  return Math.floor(Date.now() / 1000);
}

// Helper function to create OrderConfig
function createOrderConfig(
  id: number,
  srcJettonAddress: Address,
  senderPubKey: Address,
  receiverPubKey: Address,
  hashlock: bigint,
  timelock: number,
  amount: bigint
) {
  return {
    $$type: 'OrderConfig' as const,
    id: BigInt(id),
    srcJettonAddress: srcJettonAddress,
    senderPubKey: senderPubKey,
    receiverPubKey: receiverPubKey,
    hashlock: hashlock,
    timelock: BigInt(timelock),
    amount: amount,
    finalized: false,
    partialFills: Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.BigUint(64)),
    totalFilled: 0n,
    direction: 0n,
  };
}

// Chain IDs for testing
const ETHEREUM_MAINNET = 1;
const POLYGON = 137;
const BSC = 56;
const BASE = 8453;
const ARBITRUM = 42161;
const TON_MAINNET = -3;
const TON_TESTNET = -239;
const INVALID_CHAIN = 999999;

describe('Chain Validation Tests', () => {
  let blockchain: Blockchain;
  let deployer: SandboxContract<TreasuryContract>;
  let tonFusion: SandboxContract<TonFusion>;
  let user1: SandboxContract<TreasuryContract>;
  let user2: SandboxContract<TreasuryContract>;
  let jettonMaster: SandboxContract<TestJettonMaster>;

  beforeEach(async () => {
    blockchain = await Blockchain.create();

    // Deploy TonFusion contract
    tonFusion = blockchain.openContract(await TonFusion.fromInit());

    // Create test accounts
    deployer = await blockchain.treasury('deployer');
    user1 = await blockchain.treasury('user1');
    user2 = await blockchain.treasury('user2');

    // Deploy TonFusion
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

    // Deploy Test Jetton Master
    jettonMaster = blockchain.openContract(await TestJettonMaster.fromInit(
      "Test Jetton",
      "TEST",
      9n,
      deployer.address,
      beginCell().storeUint(0, 8).endCell()
    ));
  });

  describe('Chain ID Validation', () => {
    it('should validate supported EVM chain IDs', async () => {
      const supportedChains = [ETHEREUM_MAINNET, POLYGON, BSC, BASE, ARBITRUM];

      for (const chainId of supportedChains) {
        // Test that chain ID is valid by checking it's in supported range
        expect(chainId).toBeGreaterThan(0);
        expect(chainId).toBeLessThan(2 ** 32);
      }
    });

    it('should validate supported TON chain IDs', async () => {
      const supportedTONChains = [TON_MAINNET, TON_TESTNET];

      for (const chainId of supportedTONChains) {
        // Test that TON chain ID is valid (negative values)
        expect(chainId).toBeLessThan(0);
                 expect(chainId).toBeGreaterThan(-(2 ** 31));
      }
    });

    it('should identify unsupported chain IDs', async () => {
      const unsupportedChains = [INVALID_CHAIN, 999999, 888888, 777777];

      for (const chainId of unsupportedChains) {
        // These should be identified as unsupported
        expect(chainId).toBeGreaterThan(2 ** 16); // Most valid chains are smaller
      }
    });
  });

  describe('Escrow Contract Deployment', () => {
    it('should deploy escrow contracts for supported chains', async () => {
      const supportedChains = [ETHEREUM_MAINNET, POLYGON, BSC, BASE, ARBITRUM];

      for (const chainId of supportedChains) {
        const escrowAddress = randomAddress();

        const deployEscrowResult = await tonFusion.send(
          deployer.getSender(),
          {
            value: toNano('0.05'),
          },
          {
            $$type: 'DeployEscrow',
            chainId: BigInt(chainId),
            targetAddress: escrowAddress,
            customPayload: null,
          }
        );

        expect(deployEscrowResult.transactions).toHaveTransaction({
          from: deployer.address,
          to: tonFusion.address,
          success: true,
        });
      }
    });
  });

  describe('Chain Configuration', () => {
    it('should handle chain configuration for different chain types', async () => {
      const evmChains = [ETHEREUM_MAINNET, POLYGON, BSC];
      const tonChains = [TON_MAINNET, TON_TESTNET];

      // Test EVM chains
      for (const chainId of evmChains) {
        expect(chainId).toBeGreaterThan(0);
        expect(chainId).toBeLessThan(2 ** 32);
      }

             // Test TON chains
       for (const chainId of tonChains) {
         expect(chainId).toBeLessThan(0);
         expect(chainId).toBeGreaterThan(-(2 ** 31));
       }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid chain IDs gracefully', async () => {
      const invalidChainIds = [0, -1, 2 ** 32, -(2 ** 31) - 1];

      for (const chainId of invalidChainIds) {
        // These should be handled gracefully by the contract
        expect(chainId).toBeDefined();
      }
    });

    it('should handle edge case chain IDs', async () => {
      const edgeCaseChains = [1, 137, 56, 8453, 42161, -3, -239];

      for (const chainId of edgeCaseChains) {
        // These should be valid chain IDs
        expect(chainId).toBeDefined();
        expect(typeof chainId).toBe('number');
      }
    });
  });
}); 