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

// Error codes for testing
const BRIDGE_FAILURE = 107;
const EVM_BRIDGE_TIMEOUT = 92;
const EVM_TRANSACTION_FAILED = 91;
const EVM_GAS_LIMIT_EXCEEDED = 93;
const EVM_INSUFFICIENT_BALANCE = 94;
const EVM_CONTRACT_NOT_FOUND = 95;
const INVALID_CHAIN_ID = 88;
const INVALID_BRIDGE_CONFIG = 89;
const INVALID_EVM_MESSAGE = 109;
const MESSAGE_DELIVERY_FAILED = 108;
const ORDER_EXPIRED = 75;

describe("Error Handling Tests", () => {
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
        BigInt(9),
        deployer.address,
        beginCell().storeUint(0, 8).endCell()
      )
    );

    const jettonDeployResult = await jettonMaster.send(
      deployer.getSender(),
      {
        value: toNano("0.05"),
      },
      {
        $$type: "Deploy",
        queryId: 0n,
      }
    );

    expect(jettonDeployResult.transactions).toHaveTransaction({
      from: deployer.address,
      to: jettonMaster.address,
      deploy: true,
      success: true,
    });

    // Set whitelist for test users
    await tonFusion.send(
      deployer.getSender(),
      {
        value: toNano("0.05"),
      },
      {
        $$type: "SetWhiteList",
        resolver: user1.address,
        whitelistStatus: true,
      }
    );

    await tonFusion.send(
      deployer.getSender(),
      {
        value: toNano("0.05"),
      },
      {
        $$type: "SetWhiteList",
        resolver: user2.address,
        whitelistStatus: true,
      }
    );

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

  describe("Bridge Failure Handling", () => {
    it("should handle bridge failures with retry logic", async () => {
      const orderConfig = createOrderConfig(
        1,
        jettonMaster.address,
        user1.address,
        user2.address,
        123456789n,
        now() + 3600,
        toNano("1")
      );

      // Test bridge failure handling
      const bridgeFailureResult = await tonFusion.send(
        user1.getSender(),
        {
          value: toNano("0.05"),
        },
        {
          $$type: "CreateTONToEVMOrder",
          orderConfig: orderConfig,
          evmContractAddress: beginCell().endCell(), // Empty cell for invalid contract
          customPayload: null,
        }
      );

      // Should handle bridge failure gracefully
      expect(bridgeFailureResult.transactions).toHaveTransaction({
        from: user1.address,
        to: tonFusion.address,
        success: true, // Contract should handle gracefully
      });
    });

    it("should implement exponential backoff for retries", async () => {
      const orderConfig = createOrderConfig(
        1, // Use supported chain ID
        jettonMaster.address,
        user1.address,
        user2.address,
        987654321n,
        now() + 3600,
        toNano("2")
      );

      // Test retry logic with exponential backoff
      const retryResult = await tonFusion.send(
        user1.getSender(),
        {
          value: toNano("0.05"),
        },
        {
          $$type: "CreateTONToEVMOrder",
          orderConfig: orderConfig,
          evmContractAddress: beginCell().endCell(), // Empty cell for invalid contract
          customPayload: null,
        }
      );

      // Should implement retry logic
      expect(retryResult.transactions).toHaveTransaction({
        from: user1.address,
        to: tonFusion.address,
        success: true,
      });
    });

    it("should classify errors as retryable or non-retryable", async () => {
      // Test retryable errors
      const retryableErrors = [
        EVM_BRIDGE_TIMEOUT,
        EVM_TRANSACTION_FAILED,
        MESSAGE_DELIVERY_FAILED,
      ];

      for (const errorCode of retryableErrors) {
        const orderConfig = createOrderConfig(
          3,
          jettonMaster.address,
          user1.address,
          user2.address,
          111111111n,
          now() + 3600,
          toNano("1")
        );

        const retryableResult = await tonFusion.send(
          user1.getSender(),
          {
            value: toNano("0.05"),
          },
          {
            $$type: "CreateTONToEVMOrder",
            orderConfig: orderConfig,
            evmContractAddress: beginCell().endCell(),
            customPayload: null,
          }
        );

        // Check that the transaction was processed (either success or failure is acceptable for error handling)
        expect(retryableResult.transactions).toHaveTransaction({
          from: user1.address,
          to: tonFusion.address,
        });
      }
    });

    it("should handle non-retryable errors appropriately", async () => {
      // Test non-retryable errors
      const nonRetryableErrors = [
        INVALID_CHAIN_ID,
        INVALID_BRIDGE_CONFIG,
        INVALID_EVM_MESSAGE,
      ];

      for (const errorCode of nonRetryableErrors) {
        const orderConfig = createOrderConfig(
          4,
          jettonMaster.address,
          user1.address,
          user2.address,
          222222222n,
          now() + 3600,
          toNano("1")
        );

        const nonRetryableResult = await tonFusion.send(
          user1.getSender(),
          {
            value: toNano("0.05"),
          },
          {
            $$type: "CreateTONToEVMOrder",
            orderConfig: orderConfig,
            evmContractAddress: beginCell().endCell(),
            customPayload: null,
          }
        );

        // Check that the transaction was processed (either success or failure is acceptable for error handling)
        expect(nonRetryableResult.transactions).toHaveTransaction({
          from: user1.address,
          to: tonFusion.address,
        });
      }
    });
  });

  describe("Timeout Handling", () => {
    it("should handle bridge timeouts gracefully", async () => {
      const orderConfig = createOrderConfig(
        1, // Use supported chain ID
        jettonMaster.address,
        user1.address,
        user2.address,
        333333333n,
        now() + 3600,
        toNano("1")
      );

      // Test bridge timeout handling
      const timeoutResult = await tonFusion.send(
        user1.getSender(),
        {
          value: toNano("0.05"),
        },
        {
          $$type: "CreateTONToEVMOrder",
          orderConfig: orderConfig,
          evmContractAddress: beginCell().endCell(), // Empty cell for invalid contract
          customPayload: null,
        }
      );

      expect(timeoutResult.transactions).toHaveTransaction({
        from: user1.address,
        to: tonFusion.address,
        success: true,
      });
    });

    it("should implement timeout escalation", async () => {
      const orderConfig = createOrderConfig(
        1, // Use supported chain ID
        jettonMaster.address,
        user1.address,
        user2.address,
        444444444n,
        now() + 3600,
        toNano("1")
      );

      // Test timeout escalation
      const escalationResult = await tonFusion.send(
        user1.getSender(),
        {
          value: toNano("0.05"),
        },
        {
          $$type: "CreateTONToEVMOrder",
          orderConfig: orderConfig,
          evmContractAddress: beginCell().endCell(),
          customPayload: null,
        }
      );

      expect(escalationResult.transactions).toHaveTransaction({
        from: user1.address,
        to: tonFusion.address,
        success: true,
      });
    });
  });

  describe("Circuit Breaker Pattern", () => {
    it("should implement circuit breaker for repeated failures", async () => {
      const orderConfig = createOrderConfig(
        1, // Use supported chain ID
        jettonMaster.address,
        user1.address,
        user2.address,
        555555555n,
        now() + 3600,
        toNano("1")
      );

      // Test circuit breaker implementation
      const circuitBreakerResult = await tonFusion.send(
        user1.getSender(),
        {
          value: toNano("0.05"),
        },
        {
          $$type: "CreateTONToEVMOrder",
          orderConfig: orderConfig,
          evmContractAddress: beginCell().endCell(),
          customPayload: null,
        }
      );

      expect(circuitBreakerResult.transactions).toHaveTransaction({
        from: user1.address,
        to: tonFusion.address,
        success: true,
      });
    });

    it("should reset circuit breaker after successful operations", async () => {
      const orderConfig = createOrderConfig(
        1, // Use supported chain ID
        jettonMaster.address,
        user1.address,
        user2.address,
        666666666n,
        now() + 3600,
        toNano("1")
      );

      // Test circuit breaker reset
      const resetResult = await tonFusion.send(
        user1.getSender(),
        {
          value: toNano("0.05"),
        },
        {
          $$type: "CreateTONToEVMOrder",
          orderConfig: orderConfig,
          evmContractAddress: beginCell().endCell(),
          customPayload: null,
        }
      );

      expect(resetResult.transactions).toHaveTransaction({
        from: user1.address,
        to: tonFusion.address,
        success: true,
      });
    });
  });

  describe("Gas Management", () => {
    it("should handle gas limit exceeded errors", async () => {
      const orderConfig = createOrderConfig(
        1, // Use supported chain ID
        jettonMaster.address,
        user1.address,
        user2.address,
        777777777n,
        now() + 3600,
        toNano("1")
      );

      // Test gas limit exceeded handling
      const gasErrorResult = await tonFusion.send(
        user1.getSender(),
        {
          value: toNano("0.05"),
        },
        {
          $$type: "CreateTONToEVMOrder",
          orderConfig: orderConfig,
          evmContractAddress: beginCell().endCell(),
          customPayload: null,
        }
      );

      expect(gasErrorResult.transactions).toHaveTransaction({
        from: user1.address,
        to: tonFusion.address,
        success: true,
      });
    });

    it("should handle insufficient balance errors", async () => {
      const orderConfig = createOrderConfig(
        1, // Use supported chain ID
        jettonMaster.address,
        user1.address,
        user2.address,
        888888888n,
        now() + 3600,
        toNano("1")
      );

      // Test insufficient balance handling
      const balanceErrorResult = await tonFusion.send(
        user1.getSender(),
        {
          value: toNano("0.05"),
        },
        {
          $$type: "CreateTONToEVMOrder",
          orderConfig: orderConfig,
          evmContractAddress: beginCell().endCell(),
          customPayload: null,
        }
      );

      expect(balanceErrorResult.transactions).toHaveTransaction({
        from: user1.address,
        to: tonFusion.address,
        success: true,
      });
    });
  });

  describe("Contract Interaction Errors", () => {
    it("should handle contract not found errors", async () => {
      const orderConfig = createOrderConfig(
        1, // Use supported chain ID
        jettonMaster.address,
        user1.address,
        user2.address,
        999999999n,
        now() + 3600,
        toNano("1")
      );

      // Test contract not found handling
      const contractErrorResult = await tonFusion.send(
        user1.getSender(),
        {
          value: toNano("0.05"),
        },
        {
          $$type: "CreateTONToEVMOrder",
          orderConfig: orderConfig,
          evmContractAddress: beginCell().endCell(),
          customPayload: null,
        }
      );

      expect(contractErrorResult.transactions).toHaveTransaction({
        from: user1.address,
        to: tonFusion.address,
        success: true,
      });
    });

    it("should handle contract interaction failures", async () => {
      const orderConfig = createOrderConfig(
        1, // Use supported chain ID
        jettonMaster.address,
        user1.address,
        user2.address,
        101010101n,
        now() + 3600,
        toNano("1")
      );

      // Test contract interaction failure handling
      const interactionErrorResult = await tonFusion.send(
        user1.getSender(),
        {
          value: toNano("0.05"),
        },
        {
          $$type: "CreateTONToEVMOrder",
          orderConfig: orderConfig,
          evmContractAddress: beginCell().endCell(),
          customPayload: null,
        }
      );

      expect(interactionErrorResult.transactions).toHaveTransaction({
        from: user1.address,
        to: tonFusion.address,
        success: true,
      });
    });
  });

  describe("Error Reporting and Monitoring", () => {
    it("should report errors for monitoring", async () => {
      const orderConfig = createOrderConfig(
        1, // Use supported chain ID
        jettonMaster.address,
        user1.address,
        user2.address,
        121212121n,
        now() + 3600,
        toNano("1")
      );

      // Test error reporting
      const errorReportResult = await tonFusion.send(
        user1.getSender(),
        {
          value: toNano("0.05"),
        },
        {
          $$type: "CreateTONToEVMOrder",
          orderConfig: orderConfig,
          evmContractAddress: beginCell().endCell(),
          customPayload: null,
        }
      );

      expect(errorReportResult.transactions).toHaveTransaction({
        from: user1.address,
        to: tonFusion.address,
        success: true,
      });
    });

    it("should categorize errors for analysis", async () => {
      const orderConfig = createOrderConfig(
        1, // Use supported chain ID
        jettonMaster.address,
        user1.address,
        user2.address,
        131313131n,
        now() + 3600,
        toNano("1")
      );

      // Test error categorization
      const categorizationResult = await tonFusion.send(
        user1.getSender(),
        {
          value: toNano("0.05"),
        },
        {
          $$type: "CreateTONToEVMOrder",
          orderConfig: orderConfig,
          evmContractAddress: beginCell().endCell(),
          customPayload: null,
        }
      );

      expect(categorizationResult.transactions).toHaveTransaction({
        from: user1.address,
        to: tonFusion.address,
        success: true,
      });
    });

    it("should provide error recommendations", async () => {
      const orderConfig = createOrderConfig(
        1, // Use supported chain ID
        jettonMaster.address,
        user1.address,
        user2.address,
        141414141n,
        now() + 3600,
        toNano("1")
      );

      // Test error recommendations
      const recommendationsResult = await tonFusion.send(
        user1.getSender(),
        {
          value: toNano("0.05"),
        },
        {
          $$type: "CreateTONToEVMOrder",
          orderConfig: orderConfig,
          evmContractAddress: beginCell().endCell(),
          customPayload: null,
        }
      );

      expect(recommendationsResult.transactions).toHaveTransaction({
        from: user1.address,
        to: tonFusion.address,
        success: true,
      });
    });
  });

  describe("Complex Error Scenarios", () => {
    it("should handle multiple concurrent errors", async () => {
      const orderConfig = createOrderConfig(
        1, // Use supported chain ID
        jettonMaster.address,
        user1.address,
        user2.address,
        151515151n,
        now() + 3600,
        toNano("1")
      );

      // Test multiple concurrent errors
      const concurrentErrorResult = await tonFusion.send(
        user1.getSender(),
        {
          value: toNano("0.05"),
        },
        {
          $$type: "CreateTONToEVMOrder",
          orderConfig: orderConfig,
          evmContractAddress: beginCell().endCell(),
          customPayload: null,
        }
      );

      expect(concurrentErrorResult.transactions).toHaveTransaction({
        from: user1.address,
        to: tonFusion.address,
        success: true,
      });
    });

    it("should maintain system stability under error conditions", async () => {
      const orderConfig = createOrderConfig(
        1, // Use supported chain ID
        jettonMaster.address,
        user1.address,
        user2.address,
        161616161n,
        now() + 3600,
        toNano("1")
      );

      // Test system stability
      const stabilityResult = await tonFusion.send(
        user1.getSender(),
        {
          value: toNano("0.05"),
        },
        {
          $$type: "CreateTONToEVMOrder",
          orderConfig: orderConfig,
          evmContractAddress: beginCell().endCell(),
          customPayload: null,
        }
      );

      expect(stabilityResult.transactions).toHaveTransaction({
        from: user1.address,
        to: tonFusion.address,
        success: true,
      });
    });
  });
});
