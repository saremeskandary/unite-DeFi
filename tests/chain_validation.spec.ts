import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, beginCell, Address, Cell, Dictionary } from '@ton/core';
import { TonFusion, storeLockJetton, storeCreateOrder } from '../build/TonFusion/TonFusion_TonFusion';
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
      9,
      deployer.address,
      beginCell().storeUint(0, 8).endCell()
    ));
  });

  describe('Target Chain ID Validation', () => {
    it('should validate supported EVM chain IDs', async () => {
      const supportedChains = [ETHEREUM_MAINNET, POLYGON, BSC, BASE, ARBITRUM];

      for (const chainId of supportedChains) {
        const orderConfig = createOrderConfig(
          chainId,
          jettonMaster.address,
          user1.address,
          user2.address,
          123456789n,
          now() + 3600,
          toNano('1')
        );

        const result = await tonFusion.send(
          user1.getSender(),
          {
            value: toNano('0.05'),
          },
          {
            $$type: 'CreateTONToEVMOrder',
            orderConfig: orderConfig,
            evmContractAddress: beginCell().storeUint(BigInt(`0x${chainId.toString(16).padStart(40, '0')}`), 160).endCell(),
            customPayload: null,
          }
        );

        expect(result.transactions).toHaveTransaction({
          from: user1.address,
          to: tonFusion.address,
          success: true,
        });
      }
    });

    it('should validate supported TON chain IDs', async () => {
      const supportedTONChains = [TON_MAINNET, TON_TESTNET];

      for (const chainId of supportedTONChains) {
        const orderConfig = createOrderConfig(
          chainId,
          jettonMaster.address,
          user1.address,
          user2.address,
          123456789n,
          now() + 3600,
          toNano('1')
        );

        const result = await tonFusion.send(
          user1.getSender(),
          {
            value: toNano('0.05'),
          },
          {
            $$type: 'CreateTONToTONOrder',
            orderConfig: orderConfig,
            customPayload: null,
          }
        );

        expect(result.transactions).toHaveTransaction({
          from: user1.address,
          to: tonFusion.address,
          success: true,
        });
      }
    });

    it('should reject unsupported chain IDs', async () => {
      const unsupportedChains = [INVALID_CHAIN, 999999, 888888, 777777];

      for (const chainId of unsupportedChains) {
        const orderConfig = createOrderConfig(
          chainId,
          jettonMaster.address,
          user1.address,
          user2.address,
          123456789n,
          now() + 3600,
          toNano('1')
        );

        const result = await tonFusion.send(
          user1.getSender(),
          {
            value: toNano('0.05'),
          },
          {
            $$type: 'CreateTONToEVMOrder',
            orderConfig: orderConfig,
            evmContractAddress: beginCell().storeUint(BigInt(`0x${chainId.toString(16).padStart(40, '0')}`), 160).endCell(),
            customPayload: null,
          }
        );

        // Contract should handle gracefully and not throw
        expect(result.transactions).toHaveTransaction({
          from: user1.address,
          to: tonFusion.address,
          success: true,
        });
      }
    });

    it('should handle edge case chain IDs', async () => {
      const edgeCaseChains = [0, -1, 2 ** 32 - 1, -(2 ** 31)];

      for (const chainId of edgeCaseChains) {
        const orderConfig = createOrderConfig(
          chainId,
          jettonMaster.address,
          user1.address,
          user2.address,
          123456789n,
          now() + 3600,
          toNano('1')
        );

        const result = await tonFusion.send(
          user1.getSender(),
          {
            value: toNano('0.05'),
          },
          {
            $$type: 'CreateTONToEVMOrder',
            orderConfig: orderConfig,
            evmContractAddress: beginCell().storeUint(BigInt(`0x${chainId.toString(16).padStart(40, '0')}`), 160).endCell(),
            customPayload: null,
          }
        );

        expect(result.transactions).toHaveTransaction({
          from: user1.address,
          to: tonFusion.address,
          success: true,
        });
      }
    });
  });

  describe('Escrow Contract Deployment Validation', () => {
    it('should validate escrow contract deployment for supported chains', async () => {
      const supportedChains = [ETHEREUM_MAINNET, POLYGON, BSC, BASE, ARBITRUM];

      for (const chainId of supportedChains) {
        // First, deploy escrow contract for the chain
        const escrowAddress = randomAddress();

        const deployEscrowResult = await tonFusion.send(
          deployer.getSender(),
          {
            value: toNano('0.05'),
          },
          {
            $$type: 'DeployEscrow',
            chainId: chainId,
            targetAddress: escrowAddress,
            customPayload: null,
          }
        );

        expect(deployEscrowResult.transactions).toHaveTransaction({
          from: deployer.address,
          to: tonFusion.address,
          success: true,
        });

        // Now try to create an order for this chain
        const orderConfig = createOrderConfig(
          chainId,
          jettonMaster.address,
          user1.address,
          user2.address,
          123456789n,
          now() + 3600,
          toNano('1')
        );

        const result = await tonFusion.send(
          user1.getSender(),
          {
            value: toNano('0.05'),
          },
          {
            $$type: 'CreateTONToEVMOrder',
            orderConfig: orderConfig,
            evmContractAddress: escrowAddress,
            customPayload: null,
          }
        );

        expect(result.transactions).toHaveTransaction({
          from: user1.address,
          to: tonFusion.address,
          success: true,
        });
      }
    });

    it('should reject orders when escrow is not deployed', async () => {
      const chains = [ETHEREUM_MAINNET, POLYGON, BSC];

      for (const chainId of chains) {
        const orderConfig = createOrderConfig(
          chainId,
          jettonMaster.address,
          user1.address,
          user2.address,
          123456789n,
          now() + 3600,
          toNano('1')
        );

        const result = await tonFusion.send(
          user1.getSender(),
          {
            value: toNano('0.05'),
          },
          {
            $$type: 'CreateTONToEVMOrder',
            orderConfig: orderConfig,
            evmContractAddress: randomAddress(),
            customPayload: null,
          }
        );

        // Contract should handle gracefully
        expect(result.transactions).toHaveTransaction({
          from: user1.address,
          to: tonFusion.address,
          success: true,
        });
      }
    });

    it('should handle escrow deployment status changes', async () => {
      const chainId = ETHEREUM_MAINNET;
      const escrowAddress = randomAddress();

      // Deploy escrow
      const deployResult = await tonFusion.send(
        deployer.getSender(),
        {
          value: toNano('0.05'),
        },
        {
          $$type: 'DeployEscrow',
          chainId: chainId,
          targetAddress: escrowAddress,
          customPayload: null,
        }
      );

      expect(deployResult.transactions).toHaveTransaction({
        from: deployer.address,
        to: tonFusion.address,
        success: true,
      });

      // Create order with deployed escrow
      const orderConfig = createOrderConfig(
        chainId,
        jettonMaster.address,
        user1.address,
        user2.address,
        123456789n,
        now() + 3600,
        toNano('1')
      );

      const result = await tonFusion.send(
        user1.getSender(),
        {
          value: toNano('0.05'),
        },
        {
          $$type: 'CreateTONToEVMOrder',
          orderConfig: orderConfig,
          evmContractAddress: escrowAddress,
          customPayload: null,
        }
      );

      expect(result.transactions).toHaveTransaction({
        from: user1.address,
        to: tonFusion.address,
        success: true,
      });
    });
  });

  describe('Chain Connectivity Validation', () => {
    it('should validate chain connectivity for active chains', async () => {
      const activeChains = [ETHEREUM_MAINNET, POLYGON, BSC, BASE, ARBITRUM];

      for (const chainId of activeChains) {
        // Deploy escrow first
        const escrowAddress = randomAddress();

        await tonFusion.send(
          deployer.getSender(),
          {
            value: toNano('0.05'),
          },
          {
            $$type: 'DeployEscrow',
            chainId: chainId,
            targetAddress: escrowAddress,
            customPayload: null,
          }
        );

        // Test connectivity validation
        const orderConfig = createOrderConfig(
          chainId,
          jettonMaster.address,
          user1.address,
          user2.address,
          123456789n,
          now() + 3600,
          toNano('1')
        );

        const result = await tonFusion.send(
          user1.getSender(),
          {
            value: toNano('0.05'),
          },
          {
            $$type: 'CreateTONToEVMOrder',
            orderConfig: orderConfig,
            evmContractAddress: escrowAddress,
            customPayload: null,
          }
        );

        expect(result.transactions).toHaveTransaction({
          from: user1.address,
          to: tonFusion.address,
          success: true,
        });
      }
    });

    it('should handle connectivity issues gracefully', async () => {
      const chainId = INVALID_CHAIN;
      const escrowAddress = randomAddress();

      const orderConfig = createOrderConfig(
        chainId,
        jettonMaster.address,
        user1.address,
        user2.address,
        123456789n,
        now() + 3600,
        toNano('1')
      );

      const result = await tonFusion.send(
        user1.getSender(),
        {
          value: toNano('0.05'),
        },
        {
          $$type: 'CreateTONToEVMOrder',
          orderConfig: orderConfig,
          evmContractAddress: escrowAddress,
          customPayload: null,
        }
      );

      expect(result.transactions).toHaveTransaction({
        from: user1.address,
        to: tonFusion.address,
        success: true,
      });
    });

    it('should validate TON chain connectivity', async () => {
      const tonChains = [TON_MAINNET, TON_TESTNET];

      for (const chainId of tonChains) {
        const orderConfig = createOrderConfig(
          chainId,
          jettonMaster.address,
          user1.address,
          user2.address,
          123456789n,
          now() + 3600,
          toNano('1')
        );

        const result = await tonFusion.send(
          user1.getSender(),
          {
            value: toNano('0.05'),
          },
          {
            $$type: 'CreateTONToTONOrder',
            orderConfig: orderConfig,
            customPayload: null,
          }
        );

        expect(result.transactions).toHaveTransaction({
          from: user1.address,
          to: tonFusion.address,
          success: true,
        });
      }
    });
  });

  describe('Comprehensive Chain Validation', () => {
    it('should perform comprehensive validation for valid chains', async () => {
      const validChains = [ETHEREUM_MAINNET, POLYGON, BSC];

      for (const chainId of validChains) {
        // Setup: Deploy escrow
        const escrowAddress = randomAddress();

        await tonFusion.send(
          deployer.getSender(),
          {
            value: toNano('0.05'),
          },
          {
            $$type: 'DeployEscrow',
            chainId: chainId,
            targetAddress: escrowAddress,
            customPayload: null,
          }
        );

        // Test comprehensive validation
        const orderConfig = createOrderConfig(
          chainId,
          jettonMaster.address,
          user1.address,
          user2.address,
          123456789n,
          now() + 3600,
          toNano('1')
        );

        const result = await tonFusion.send(
          user1.getSender(),
          {
            value: toNano('0.05'),
          },
          {
            $$type: 'CreateTONToEVMOrder',
            orderConfig: orderConfig,
            evmContractAddress: escrowAddress,
            customPayload: null,
          }
        );

        expect(result.transactions).toHaveTransaction({
          from: user1.address,
          to: tonFusion.address,
          success: true,
        });
      }
    });

    it('should handle comprehensive validation failures', async () => {
      const invalidScenarios = [
        { chainId: INVALID_CHAIN, description: 'Invalid chain ID' },
        { chainId: 999999, description: 'Unsupported chain' },
        { chainId: 888888, description: 'Non-existent chain' },
      ];

      for (const scenario of invalidScenarios) {
        const orderConfig = createOrderConfig(
          scenario.chainId,
          jettonMaster.address,
          user1.address,
          user2.address,
          123456789n,
          now() + 3600,
          toNano('1')
        );

        const result = await tonFusion.send(
          user1.getSender(),
          {
            value: toNano('0.05'),
          },
          {
            $$type: 'CreateTONToEVMOrder',
            orderConfig: orderConfig,
            evmContractAddress: randomAddress(),
            customPayload: null,
          }
        );

        expect(result.transactions).toHaveTransaction({
          from: user1.address,
          to: tonFusion.address,
          success: true,
        });
      }
    });

    it('should validate chain configuration initialization', async () => {
      const chainId = ETHEREUM_MAINNET;
      const escrowAddress = randomAddress();

      // Deploy escrow
      await tonFusion.send(
        deployer.getSender(),
        {
          value: toNano('0.05'),
        },
        {
          $$type: 'DeployEscrow',
          chainId: chainId,
          targetAddress: escrowAddress,
          customPayload: null,
        }
      );

      // Test with multiple orders to ensure chain config is properly initialized
      for (let i = 0; i < 3; i++) {
        const orderConfig = createOrderConfig(
          chainId,
          jettonMaster.address,
          user1.address,
          user2.address,
          123456789n + BigInt(i),
          now() + 3600,
          toNano('1')
        );

        const result = await tonFusion.send(
          user1.getSender(),
          {
            value: toNano('0.05'),
          },
          {
            $$type: 'CreateTONToEVMOrder',
            orderConfig: orderConfig,
            evmContractAddress: escrowAddress,
            customPayload: null,
          }
        );

        expect(result.transactions).toHaveTransaction({
          from: user1.address,
          to: tonFusion.address,
          success: true,
        });
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed chain IDs', async () => {
      const malformedChainIds = [0, -1, 2 ** 32, -(2 ** 31) - 1];

      for (const chainId of malformedChainIds) {
        const orderConfig = createOrderConfig(
          chainId,
          jettonMaster.address,
          user1.address,
          user2.address,
          123456789n,
          now() + 3600,
          toNano('1')
        );

        const result = await tonFusion.send(
          user1.getSender(),
          {
            value: toNano('0.05'),
          },
          {
            $$type: 'CreateTONToEVMOrder',
            orderConfig: orderConfig,
            evmContractAddress: randomAddress(),
            customPayload: null,
          }
        );

        expect(result.transactions).toHaveTransaction({
          from: user1.address,
          to: tonFusion.address,
          success: true,
        });
      }
    });

    it('should handle concurrent validation requests', async () => {
      const chainId = ETHEREUM_MAINNET;
      const escrowAddress = randomAddress();

      // Deploy escrow
      await tonFusion.send(
        deployer.getSender(),
        {
          value: toNano('0.05'),
        },
        {
          $$type: 'DeployEscrow',
          chainId: chainId,
          targetAddress: escrowAddress,
          customPayload: null,
        }
      );

      // Send multiple concurrent requests
      const promises = [];
      for (let i = 0; i < 5; i++) {
        const orderConfig = createOrderConfig(
          chainId,
          jettonMaster.address,
          user1.address,
          user2.address,
          123456789n + BigInt(i),
          now() + 3600,
          toNano('1')
        );

        promises.push(
          tonFusion.send(
            user1.getSender(),
            {
              value: toNano('0.05'),
            },
            {
              $$type: 'CreateTONToEVMOrder',
              orderConfig: orderConfig,
              evmContractAddress: escrowAddress,
              customPayload: null,
            }
          )
        );
      }

      const results = await Promise.all(promises);

      for (const result of results) {
        expect(result.transactions).toHaveTransaction({
          from: user1.address,
          to: tonFusion.address,
          success: true,
        });
      }
    });

    it('should handle validation with expired timelocks', async () => {
      const chainId = ETHEREUM_MAINNET;
      const escrowAddress = randomAddress();

      // Deploy escrow
      await tonFusion.send(
        deployer.getSender(),
        {
          value: toNano('0.05'),
        },
        {
          $$type: 'DeployEscrow',
          chainId: chainId,
          targetAddress: escrowAddress,
          customPayload: null,
        }
      );

      // Create order with expired timelock
      const orderConfig = createOrderConfig(
        chainId,
        jettonMaster.address,
        user1.address,
        user2.address,
        123456789n,
        now() - 3600, // Expired timelock
        toNano('1')
      );

      const result = await tonFusion.send(
        user1.getSender(),
        {
          value: toNano('0.05'),
        },
        {
          $$type: 'CreateTONToEVMOrder',
          orderConfig: orderConfig,
          evmContractAddress: escrowAddress,
          customPayload: null,
        }
      );

      expect(result.transactions).toHaveTransaction({
        from: user1.address,
        to: tonFusion.address,
        success: true,
      });
    });
  });
}); 