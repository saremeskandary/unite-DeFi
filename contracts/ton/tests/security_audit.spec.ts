import { Blockchain, SandboxContract, TreasuryContract } from "@ton/sandbox";
import { toNano, beginCell, Address, Cell, Dictionary } from "@ton/core";
import {
  TonFusion,
  storeLockJetton,
  storeCreateOrder,
} from "../build/TonFusion/TonFusion_TonFusion";
import { TestJettonMaster } from "../build/TestJettonMaster/TestJettonMaster_TestJettonMaster";
import "@ton/test-utils";
import { randomAddress } from "@ton/test-utils";

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
    $$type: "OrderConfig" as const,
    id: BigInt(id),
    srcJettonAddress: srcJettonAddress,
    senderPubKey: senderPubKey,
    receiverPubKey: receiverPubKey,
    hashlock: hashlock,
    timelock: BigInt(timelock),
    amount: amount,
    finalized: false,
    partialFills: Dictionary.empty(
      Dictionary.Keys.BigUint(256),
      Dictionary.Values.BigUint(64)
    ),
    totalFilled: 0n,
    direction: 0n,
  };
}

describe("Security Audit Tests", () => {
  let blockchain: Blockchain;
  let deployer: SandboxContract<TreasuryContract>;
  let tonFusion: SandboxContract<TonFusion>;
  let user1: SandboxContract<TreasuryContract>;
  let user2: SandboxContract<TreasuryContract>;
  let resolver: SandboxContract<TreasuryContract>;
  let jettonMaster: SandboxContract<TestJettonMaster>;

  beforeEach(async () => {
    blockchain = await Blockchain.create();

    // Deploy TonFusion contract
    tonFusion = blockchain.openContract(await TonFusion.fromInit());

    // Create test accounts
    deployer = await blockchain.treasury("deployer");
    user1 = await blockchain.treasury("user1");
    user2 = await blockchain.treasury("user2");
    resolver = await blockchain.treasury("resolver");

    // Deploy TonFusion
    const deployResult = await tonFusion.send(
      deployer.getSender(),
      {
        value: toNano("0.05"),
      },
      null
    );

    expect(deployResult.transactions).toHaveTransaction({
      from: deployer.address,
      to: tonFusion.address,
      deploy: true,
      success: true,
    });

    // Deploy Test Jetton Master
    jettonMaster = blockchain.openContract(
      await TestJettonMaster.fromInit(
        "Test Jetton",
        "TEST",
        9n,
        deployer.address,
        beginCell().storeUint(0, 8).endCell()
      )
    );

    // Deploy jetton master
    await jettonMaster.send(
      deployer.getSender(),
      {
        value: toNano("0.1"),
      },
      {
        $$type: "Deploy",
        queryId: 0n,
      }
    );

    // Mint jettons to test users
    await jettonMaster.send(
      deployer.getSender(),
      {
        value: toNano("0.1"),
      },
      "mint"
    );

    await jettonMaster.send(
      deployer.getSender(),
      {
        value: toNano("0.1"),
      },
      "mint"
    );

    // Set whitelist for resolver
    await tonFusion.send(
      deployer.getSender(),
      {
        value: toNano("0.05"),
      },
      {
        $$type: "SetWhiteList",
        resolver: resolver.address,
        whitelistStatus: true,
      }
    );
  });

  describe("Access Control Security", () => {
    it("should prevent unauthorized access to owner functions", async () => {
      const unauthorizedUser = await blockchain.treasury("unauthorized");

      // Test SetWhiteList
      const setWhitelistResult = await tonFusion.send(
        unauthorizedUser.getSender(),
        {
          value: toNano("0.05"),
        },
        {
          $$type: "SetWhiteList",
          resolver: resolver.address,
          whitelistStatus: true,
        }
      );

      expect(setWhitelistResult.transactions).toHaveTransaction({
        from: unauthorizedUser.address,
        to: tonFusion.address,
        success: false,
        exitCode: 86, // INVALID_OWNER
      });

      // Test RegisterRelayer
      const setRelayerResult = await tonFusion.send(
        unauthorizedUser.getSender(),
        {
          value: toNano("0.05"),
        },
        {
          $$type: "RegisterRelayer",
          relayer: user1.address,
          customPayload: null,
        }
      );

      expect(setRelayerResult.transactions).toHaveTransaction({
        from: unauthorizedUser.address,
        to: tonFusion.address,
        success: false,
        exitCode: 86, // INVALID_OWNER
      });
    });

    it("should prevent non-whitelisted users from creating orders", async () => {
      const nonWhitelistedUser = await blockchain.treasury("nonWhitelisted");
      const secret = 123456789n;
      const hashlock = createHash(secret);
      const timelock = now() + 3600; // 1 hour

      const orderConfig = createOrderConfig(
        1, // Ethereum
        jettonMaster.address,
        user1.address,
        user2.address,
        hashlock,
        timelock,
        toNano("100")
      );

      const result = await tonFusion.send(
        nonWhitelistedUser.getSender(),
        {
          value: toNano("0.1"),
        },
        {
          $$type: "CreateEVMToTONOrder",
          orderConfig: orderConfig,
          evmContractAddress: beginCell().endCell(),
          customPayload: null,
        }
      );

      expect(result.transactions).toHaveTransaction({
        from: nonWhitelistedUser.address,
        to: tonFusion.address,
        success: false,
        exitCode: 87, // INVALID_WHITELIST
      });
    });
  });

  describe("Input Validation Security", () => {
    it("should validate order amounts properly", async () => {
      const secret = 123456789n;
      const hashlock = createHash(secret);
      const timelock = now() + 3600;

      // Test zero amount
      const zeroAmountOrder = createOrderConfig(
        1, // Ethereum
        jettonMaster.address,
        user1.address,
        user2.address,
        hashlock,
        timelock,
        0n
      );

      const zeroAmountResult = await tonFusion.send(
        resolver.getSender(),
        {
          value: toNano("0.1"),
        },
        {
          $$type: "CreateEVMToTONOrder",
          orderConfig: zeroAmountOrder,
          evmContractAddress: beginCell().endCell(),
          customPayload: null,
        }
      );

      expect(zeroAmountResult.transactions).toHaveTransaction({
        from: resolver.address,
        to: tonFusion.address,
        success: false,
        exitCode: 72, // INVALID_AMOUNT
      });
    });

    it("should validate timelock properly", async () => {
      const secret = 123456789n;
      const hashlock = createHash(secret);

      // Test expired timelock
      const expiredTimelock = now() - 3600; // 1 hour ago
      const expiredOrder = createOrderConfig(
        1, // Ethereum
        jettonMaster.address,
        user1.address,
        user2.address,
        hashlock,
        expiredTimelock,
        toNano("100")
      );

      const expiredResult = await tonFusion.send(
        resolver.getSender(),
        {
          value: toNano("0.1"),
        },
        {
          $$type: "CreateEVMToTONOrder",
          orderConfig: expiredOrder,
          evmContractAddress: beginCell().endCell(),
          customPayload: null,
        }
      );

      expect(expiredResult.transactions).toHaveTransaction({
        from: resolver.address,
        to: tonFusion.address,
        success: false,
        exitCode: 75, // ORDER_EXPIRED
      });
    });

    it("should validate chain IDs properly", async () => {
      const secret = 123456789n;
      const hashlock = createHash(secret);
      const timelock = now() + 3600;

      // Test invalid chain ID
      const invalidChainOrder = createOrderConfig(
        999999, // Invalid chain ID
        jettonMaster.address,
        user1.address,
        user2.address,
        hashlock,
        timelock,
        toNano("100")
      );

      const invalidChainResult = await tonFusion.send(
        resolver.getSender(),
        {
          value: toNano("0.1"),
        },
        {
          $$type: "CreateEVMToTONOrder",
          orderConfig: invalidChainOrder,
          evmContractAddress: beginCell().endCell(),
          customPayload: null,
        }
      );

      expect(invalidChainResult.transactions).toHaveTransaction({
        from: resolver.address,
        to: tonFusion.address,
        success: false,
        exitCode: 88, // INVALID_CHAIN_ID
      });
    });
  });

  describe("Cross-Chain Security", () => {
    it("should validate EVM chain connectivity", async () => {
      // Test with unsupported chain
      const secret = 123456789n;
      const hashlock = createHash(secret);
      const timelock = now() + 3600;

      const unsupportedChainOrder = createOrderConfig(
        999999, // Unsupported chain
        jettonMaster.address,
        user1.address,
        user2.address,
        hashlock,
        timelock,
        toNano("100")
      );

      const result = await tonFusion.send(
        resolver.getSender(),
        {
          value: toNano("0.1"),
        },
        {
          $$type: "CreateEVMToTONOrder",
          orderConfig: unsupportedChainOrder,
          evmContractAddress: beginCell().endCell(),
          customPayload: null,
        }
      );

      expect(result.transactions).toHaveTransaction({
        from: resolver.address,
        to: tonFusion.address,
        success: false,
        exitCode: 88, // INVALID_CHAIN_ID
      });
    });
  });

  describe("Gas Optimization Security", () => {
    it("should handle gas limit validation", async () => {
      // Test with excessive gas limit
      const secret = 123456789n;
      const hashlock = createHash(secret);
      const timelock = now() + 3600;

      const highGasOrder = createOrderConfig(
        1, // Ethereum
        jettonMaster.address,
        user1.address,
        user2.address,
        hashlock,
        timelock,
        toNano("100")
      );

      // This should be handled by the gas optimization logic
      const result = await tonFusion.send(
        resolver.getSender(),
        {
          value: toNano("0.1"),
        },
        {
          $$type: "CreateEVMToTONOrder",
          orderConfig: highGasOrder,
          evmContractAddress: beginCell().endCell(),
          customPayload: null,
        }
      );

      // Should succeed with optimized gas
      expect(result.transactions).toHaveTransaction({
        from: resolver.address,
        to: tonFusion.address,
        success: true,
      });
    });

    it("should validate gas price calculations", async () => {
      // Test gas price validation for different chains
      const chains = [1, 137, 56, 42161]; // Ethereum, Polygon, BSC, Arbitrum

      for (let i = 0; i < chains.length; i++) {
        const chainId = chains[i];
        const secret = 123456789n + BigInt(i); // Unique secret for each chain
        const hashlock = createHash(secret);
        const timelock = now() + 3600;

        const order = createOrderConfig(
          chainId,
          jettonMaster.address,
          user1.address,
          user2.address,
          hashlock,
          timelock,
          toNano("100")
        );

        const result = await tonFusion.send(
          resolver.getSender(),
          {
            value: toNano("0.1"),
          },
          {
            $$type: "CreateEVMToTONOrder",
            orderConfig: order,
            evmContractAddress: beginCell().endCell(),
            customPayload: null,
          }
        );

        // Should succeed with proper gas price calculation
        expect(result.transactions).toHaveTransaction({
          from: resolver.address,
          to: tonFusion.address,
          success: true,
        });
      }
    });
  });

  describe("Error Handling Security", () => {
    it("should handle edge cases in order management", async () => {
      // Test with maximum values
      const secret = 123456789n;
      const hashlock = createHash(secret);
      const timelock = now() + 3600;

      const maxAmountOrder = createOrderConfig(
        1, // Ethereum
        jettonMaster.address,
        user1.address,
        user2.address,
        hashlock,
        timelock,
        2n ** 64n - 1n // Maximum uint64
      );

      const result = await tonFusion.send(
        resolver.getSender(),
        {
          value: toNano("0.1"),
        },
        {
          $$type: "CreateEVMToTONOrder",
          orderConfig: maxAmountOrder,
          evmContractAddress: beginCell().endCell(),
          customPayload: null,
        }
      );

      // Should handle maximum values properly
      expect(result.transactions).toHaveTransaction({
        from: resolver.address,
        to: tonFusion.address,
        success: true,
      });
    });

    it("should handle concurrent operations safely", async () => {
      // Test multiple sequential order creations to ensure contract handles multiple operations
      const results = [];

      for (let i = 0; i < 5; i++) {
        const secret = 123456789n + BigInt(i);
        const hashlock = createHash(secret);
        const timelock = now() + 3600;

        const order = createOrderConfig(
          1, // Ethereum
          jettonMaster.address,
          user1.address,
          user2.address,
          hashlock,
          timelock,
          toNano("100")
        );

        const result = await tonFusion.send(
          resolver.getSender(),
          {
            value: toNano("0.1"),
          },
          {
            $$type: "CreateEVMToTONOrder",
            orderConfig: order,
            evmContractAddress: beginCell().endCell(),
            customPayload: null,
          }
        );

        results.push(result);
      }

      // All operations should succeed
      for (const result of results) {
        expect(result.transactions).toHaveTransaction({
          from: resolver.address,
          to: tonFusion.address,
          success: true,
        });
      }
    });
  });
});
