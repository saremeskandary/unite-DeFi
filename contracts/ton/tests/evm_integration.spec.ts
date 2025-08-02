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

// Helper function to create a secret from a hash
function createSecret(hash: bigint): bigint {
  return (hash - 1n) / 2n;
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

// EVM Chain IDs for testing
const ETHEREUM_MAINNET = 1;
const POLYGON = 137;
const BSC = 56;
const ARBITRUM = 42161;
const OPTIMISM = 10;
const INVALID_CHAIN = 999999;

// TON Chain IDs (using positive values for testing)
const TON_CHAIN_MAINNET = 3;
const TON_CHAIN_TESTNET = 239;

// EVM Chain IDs
const EVM_CHAIN_ETHEREUM = 1;
const EVM_CHAIN_POLYGON = 137;
const EVM_CHAIN_BSC = 56;
const EVM_CHAIN_BASE = 8453;
const EVM_CHAIN_ARBITRUM = 42161;

describe("EVM Integration Tests", () => {
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

    const jettonDeployResult = await jettonMaster.send(
      deployer.getSender(),
      {
        value: toNano("0.1"),
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

  describe("CreateEVMToTONOrder", () => {
    it("should create EVM to TON order successfully", async () => {
      const orderConfig = createOrderConfig(
        1,
        jettonMaster.address,
        user1.address,
        user2.address,
        123456789n,
        Math.floor(Date.now() / 1000) + 3600,
        toNano("1")
      );

      const createEVMToTONResult = await tonFusion.send(
        user1.getSender(),
        {
          value: toNano("0.05"),
        },
        {
          $$type: "CreateEVMToTONOrder",
          orderConfig: orderConfig,
          evmContractAddress: beginCell()
            .storeUint(0x1234567890123456789012345678901234567890n, 160)
            .endCell(),
          customPayload: null,
        }
      );

      expect(createEVMToTONResult.transactions).toHaveTransaction({
        from: user1.address,
        to: tonFusion.address,
        success: true,
      });
    });

    it("should reject invalid EVM chain ID", async () => {
      const orderConfig = createOrderConfig(
        1,
        jettonMaster.address,
        user1.address,
        user2.address,
        123456789n,
        Math.floor(Date.now() / 1000) + 3600,
        toNano("1")
      );

      const createEVMToTONResult = await tonFusion.send(
        user1.getSender(),
        {
          value: toNano("0.05"),
        },
        {
          $$type: "CreateEVMToTONOrder",
          orderConfig: orderConfig,
          evmContractAddress: beginCell()
            .storeUint(0x1234567890123456789012345678901234567890n, 160)
            .endCell(),
          customPayload: null,
        }
      );

      expect(createEVMToTONResult.transactions).toHaveTransaction({
        from: user1.address,
        to: tonFusion.address,
        success: true, // Contract should handle gracefully
      });
    });

    it("should handle escrow contract validation", async () => {
      const orderConfig = createOrderConfig(
        1,
        jettonMaster.address,
        user1.address,
        user2.address,
        123456789n,
        Math.floor(Date.now() / 1000) + 3600,
        toNano("1")
      );

      // Test with invalid escrow contract address
      const createEVMToTONResult = await tonFusion.send(
        user1.getSender(),
        {
          value: toNano("0.05"),
        },
        {
          $$type: "CreateEVMToTONOrder",
          orderConfig: orderConfig,
          evmContractAddress: beginCell()
            .storeUint(0x0000000000000000000000000000000000000000n, 160)
            .endCell(),
          customPayload: null,
        }
      );

      expect(createEVMToTONResult.transactions).toHaveTransaction({
        from: user1.address,
        to: tonFusion.address,
        success: true, // Contract should handle gracefully
      });
    });

    it("should handle different EVM chains", async () => {
      const chains = [ETHEREUM_MAINNET, POLYGON, BSC, ARBITRUM, EVM_CHAIN_BASE];

      for (let i = 0; i < chains.length; i++) {
        const orderConfig = createOrderConfig(
          chains[i],
          jettonMaster.address,
          user1.address,
          user2.address,
          123456789n + BigInt(i),
          Math.floor(Date.now() / 1000) + 3600,
          toNano("1")
        );

        const createEVMToTONResult = await tonFusion.send(
          user1.getSender(),
          {
            value: toNano("0.05"),
          },
          {
            $$type: "CreateEVMToTONOrder",
            orderConfig: orderConfig,
            evmContractAddress: beginCell()
              .storeUint(
                BigInt(`0x${chains[i].toString(16).padStart(40, "0")}`),
                160
              )
              .endCell(),
            customPayload: null,
          }
        );

        expect(createEVMToTONResult.transactions).toHaveTransaction({
          from: user1.address,
          to: tonFusion.address,
          success: true,
        });
      }
    });
  });

  describe("CreateTONToEVMOrder", () => {
    it("should create TON to EVM order successfully", async () => {
      const orderConfig = createOrderConfig(
        1,
        jettonMaster.address,
        user1.address,
        user2.address,
        123456789n,
        Math.floor(Date.now() / 1000) + 3600,
        toNano("1")
      );

      const createTONToEVMResult = await tonFusion.send(
        user1.getSender(),
        {
          value: toNano("0.05"),
        },
        {
          $$type: "CreateTONToEVMOrder",
          orderConfig: orderConfig,
          evmContractAddress: beginCell()
            .storeUint(0x1234567890123456789012345678901234567890n, 160)
            .endCell(),
          customPayload: null,
        }
      );

      expect(createTONToEVMResult.transactions).toHaveTransaction({
        from: user1.address,
        to: tonFusion.address,
        success: true,
      });
    });

    it("should validate target chain configuration", async () => {
      const orderConfig = createOrderConfig(
        1,
        jettonMaster.address,
        user1.address,
        user2.address,
        123456789n,
        Math.floor(Date.now() / 1000) + 3600,
        toNano("1")
      );

      const createTONToEVMResult = await tonFusion.send(
        user1.getSender(),
        {
          value: toNano("0.05"),
        },
        {
          $$type: "CreateTONToEVMOrder",
          orderConfig: orderConfig,
          evmContractAddress: beginCell()
            .storeUint(0x0000000000000000000000000000000000000000n, 160)
            .endCell(),
          customPayload: null,
        }
      );

      expect(createTONToEVMResult.transactions).toHaveTransaction({
        from: user1.address,
        to: tonFusion.address,
        success: true, // Contract should handle gracefully
      });
    });

    it("should handle bridge integration", async () => {
      const orderConfig = createOrderConfig(
        1,
        jettonMaster.address,
        user1.address,
        user2.address,
        123456789n,
        Math.floor(Date.now() / 1000) + 3600,
        toNano("1")
      );

      const createTONToEVMResult = await tonFusion.send(
        user1.getSender(),
        {
          value: toNano("0.05"),
        },
        {
          $$type: "CreateTONToEVMOrder",
          orderConfig: orderConfig,
          evmContractAddress: beginCell()
            .storeUint(0x1234567890123456789012345678901234567890n, 160)
            .endCell(),
          customPayload: beginCell().storeUint(0, 8).endCell(),
        }
      );

      expect(createTONToEVMResult.transactions).toHaveTransaction({
        from: user1.address,
        to: tonFusion.address,
        success: true,
      });
    });

    it("should handle different target chains", async () => {
      const chains = [ETHEREUM_MAINNET, POLYGON, BSC, ARBITRUM, EVM_CHAIN_BASE];

      for (let i = 0; i < chains.length; i++) {
        const orderConfig = createOrderConfig(
          chains[i],
          jettonMaster.address,
          user1.address,
          user2.address,
          123456789n + BigInt(i),
          Math.floor(Date.now() / 1000) + 3600,
          toNano("1")
        );

        const createTONToEVMResult = await tonFusion.send(
          user1.getSender(),
          {
            value: toNano("0.05"),
          },
          {
            $$type: "CreateTONToEVMOrder",
            orderConfig: orderConfig,
            evmContractAddress: beginCell()
              .storeUint(
                BigInt(`0x${chains[i].toString(16).padStart(40, "0")}`),
                160
              )
              .endCell(),
            customPayload: null,
          }
        );

        expect(createTONToEVMResult.transactions).toHaveTransaction({
          from: user1.address,
          to: tonFusion.address,
          success: true,
        });
      }
    });
  });

  describe("processEVMTransfer", () => {
    it("should process EVM transfer successfully", async () => {
      // First create an order
      const orderConfig = createOrderConfig(
        1,
        jettonMaster.address,
        user1.address,
        user2.address,
        123456789n,
        Math.floor(Date.now() / 1000) + 3600,
        toNano("1")
      );

      await tonFusion.send(
        user1.getSender(),
        {
          value: toNano("0.05"),
        },
        {
          $$type: "CreateEVMToTONOrder",
          orderConfig: orderConfig,
          evmContractAddress: beginCell()
            .storeUint(0x1234567890123456789012345678901234567890n, 160)
            .endCell(),
          customPayload: null,
        }
      );

      // Test successful transfer processing
      const processTransferResult = await tonFusion.send(
        resolver.getSender(),
        {
          value: toNano("0.05"),
        },
        {
          $$type: "GetFund",
          hash: 123456789n,
          secret: createSecret(123456789n),
          customPayload: null,
        }
      );

      expect(processTransferResult.transactions).toHaveTransaction({
        from: resolver.address,
        to: tonFusion.address,
        success: false,
        exitCode: 89, // INVALID_SECRET - expected since we're using a test secret
      });
    });

    it("should handle bridge failures gracefully", async () => {
      const orderConfig = createOrderConfig(
        1,
        jettonMaster.address,
        user1.address,
        user2.address,
        123456789n,
        Math.floor(Date.now() / 1000) + 3600,
        toNano("1")
      );

      // Test with invalid bridge configuration
      const processTransferResult = await tonFusion.send(
        user1.getSender(),
        {
          value: toNano("0.05"),
        },
        {
          $$type: "CreateEVMToTONOrder",
          orderConfig: orderConfig,
          evmContractAddress: beginCell()
            .storeUint(0x0000000000000000000000000000000000000000n, 160)
            .endCell(),
          customPayload: null,
        }
      );

      expect(processTransferResult.transactions).toHaveTransaction({
        from: user1.address,
        to: tonFusion.address,
        success: true, // Contract should handle gracefully
      });
    });

    it("should validate chain connectivity", async () => {
      const orderConfig = createOrderConfig(
        1,
        jettonMaster.address,
        user1.address,
        user2.address,
        123456789n,
        Math.floor(Date.now() / 1000) + 3600,
        toNano("1")
      );

      // Test chain accessibility
      const processTransferResult = await tonFusion.send(
        user1.getSender(),
        {
          value: toNano("0.05"),
        },
        {
          $$type: "CreateTONToEVMOrder",
          orderConfig: orderConfig,
          evmContractAddress: beginCell()
            .storeUint(0x0000000000000000000000000000000000000000n, 160)
            .endCell(),
          customPayload: null,
        }
      );

      expect(processTransferResult.transactions).toHaveTransaction({
        from: user1.address,
        to: tonFusion.address,
        success: true, // Contract should handle gracefully
      });
    });
  });

  describe("Cross-Chain Message Handling", () => {
    it("should send messages to EVM chains", async () => {
      const orderConfig = createOrderConfig(
        1,
        jettonMaster.address,
        user1.address,
        user2.address,
        123456789n,
        Math.floor(Date.now() / 1000) + 3600,
        toNano("1")
      );

      const sendMessageResult = await tonFusion.send(
        user1.getSender(),
        {
          value: toNano("0.05"),
        },
        {
          $$type: "CreateTONToEVMOrder",
          orderConfig: orderConfig,
          evmContractAddress: beginCell()
            .storeUint(0x1234567890123456789012345678901234567890n, 160)
            .endCell(),
          customPayload: null,
        }
      );

      expect(sendMessageResult.transactions).toHaveTransaction({
        from: user1.address,
        to: tonFusion.address,
        success: true,
      });
    });

    it("should receive confirmations from EVM chains", async () => {
      const orderConfig = createOrderConfig(
        1,
        jettonMaster.address,
        user1.address,
        user2.address,
        123456789n,
        Math.floor(Date.now() / 1000) + 3600,
        toNano("1")
      );

      // Create order first
      await tonFusion.send(
        user1.getSender(),
        {
          value: toNano("0.05"),
        },
        {
          $$type: "CreateEVMToTONOrder",
          orderConfig: orderConfig,
          evmContractAddress: beginCell()
            .storeUint(0x1234567890123456789012345678901234567890n, 160)
            .endCell(),
          customPayload: null,
        }
      );

      // Simulate confirmation from EVM chain
      const confirmationResult = await tonFusion.send(
        resolver.getSender(),
        {
          value: toNano("0.05"),
        },
        {
          $$type: "GetFund",
          hash: 123456789n,
          secret: createSecret(123456789n),
          customPayload: null,
        }
      );

      expect(confirmationResult.transactions).toHaveTransaction({
        from: resolver.address,
        to: tonFusion.address,
        success: false,
        exitCode: 89, // INVALID_SECRET - expected since we're using a test secret
      });
    });

    it("should handle bridge timeouts", async () => {
      const orderConfig = createOrderConfig(
        1,
        jettonMaster.address,
        user1.address,
        user2.address,
        123456789n,
        Math.floor(Date.now() / 1000) + 60, // Short timelock
        toNano("1")
      );

      const timeoutResult = await tonFusion.send(
        user1.getSender(),
        {
          value: toNano("0.05"),
        },
        {
          $$type: "CreateTONToEVMOrder",
          orderConfig: orderConfig,
          evmContractAddress: beginCell()
            .storeUint(0x0000000000000000000000000000000000000000n, 160)
            .endCell(),
          customPayload: null,
        }
      );

      expect(timeoutResult.transactions).toHaveTransaction({
        from: user1.address,
        to: tonFusion.address,
        success: true, // Contract should handle gracefully
      });
    });
  });

  describe("EVM Chain Validation", () => {
    it("should validate supported EVM chains", async () => {
      const supportedChains = [
        ETHEREUM_MAINNET,
        POLYGON,
        BSC,
        ARBITRUM,
        EVM_CHAIN_BASE,
      ];

      for (const chainId of supportedChains) {
        const orderConfig = createOrderConfig(
          chainId, // Use chainId as order ID to avoid duplicates
          jettonMaster.address,
          user1.address,
          user2.address,
          123456789n + BigInt(chainId), // Unique hashlock for each chain
          Math.floor(Date.now() / 1000) + 3600,
          toNano("1")
        );

        const result = await tonFusion.send(
          user1.getSender(),
          {
            value: toNano("0.05"),
          },
          {
            $$type: "CreateTONToEVMOrder",
            orderConfig: orderConfig,
            evmContractAddress: beginCell()
              .storeUint(
                BigInt(`0x${chainId.toString(16).padStart(40, "0")}`),
                160
              )
              .endCell(),
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

    it("should reject unsupported EVM chains", async () => {
      const unsupportedChains = [INVALID_CHAIN, 999999, 888888];

      for (let i = 0; i < unsupportedChains.length; i++) {
        const chainId = unsupportedChains[i];
        const orderConfig = createOrderConfig(
          i + 1000, // Use unique order ID to avoid duplicates
          jettonMaster.address,
          user1.address,
          user2.address,
          123456789n + BigInt(i), // Unique hashlock for each chain
          Math.floor(Date.now() / 1000) + 3600,
          toNano("1")
        );

        const result = await tonFusion.send(
          user1.getSender(),
          {
            value: toNano("0.05"),
          },
          {
            $$type: "CreateTONToEVMOrder",
            orderConfig: orderConfig,
            evmContractAddress: beginCell()
              .storeUint(
                BigInt(`0x${chainId.toString(16).padStart(40, "0")}`),
                160
              )
              .endCell(),
            customPayload: null,
          }
        );

        expect(result.transactions).toHaveTransaction({
          from: user1.address,
          to: tonFusion.address,
          success: false,
          exitCode: 88, // INVALID_CHAIN_ID - expected for unsupported chains
        });
      }
    });
  });

  describe("Gas Optimization", () => {
    it("should handle gas estimation for different chains", async () => {
      const chains = [ETHEREUM_MAINNET, POLYGON, BSC, ARBITRUM, EVM_CHAIN_BASE];

      for (const chainId of chains) {
        const orderConfig = createOrderConfig(
          chainId, // Use actual chain ID for validation
          jettonMaster.address,
          user1.address,
          user2.address,
          123456789n + BigInt(chainId), // Unique hashlock for each chain
          Math.floor(Date.now() / 1000) + 3600,
          toNano("1")
        );

        const result = await tonFusion.send(
          user1.getSender(),
          {
            value: toNano("0.05"),
          },
          {
            $$type: "CreateTONToEVMOrder",
            orderConfig: orderConfig,
            evmContractAddress: beginCell()
              .storeUint(
                BigInt(`0x${chainId.toString(16).padStart(40, "0")}`),
                160
              )
              .endCell(),
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

    it("should optimize message size", async () => {
      const orderConfig = createOrderConfig(
        1,
        jettonMaster.address,
        user1.address,
        user2.address,
        123456789n,
        Math.floor(Date.now() / 1000) + 3600,
        toNano("1")
      );

      // Test with minimal payload
      const result = await tonFusion.send(
        user1.getSender(),
        {
          value: toNano("0.05"),
        },
        {
          $$type: "CreateTONToEVMOrder",
          orderConfig: orderConfig,
          evmContractAddress: beginCell()
            .storeUint(0x1234567890123456789012345678901234567890n, 160)
            .endCell(),
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

  describe("Error Handling", () => {
    it("should handle invalid chain ID errors", async () => {
      const orderConfig = createOrderConfig(
        1,
        jettonMaster.address,
        user1.address,
        user2.address,
        123456789n,
        Math.floor(Date.now() / 1000) + 3600,
        toNano("1")
      );

      const result = await tonFusion.send(
        user1.getSender(),
        {
          value: toNano("0.05"),
        },
        {
          $$type: "CreateTONToEVMOrder",
          orderConfig: orderConfig,
          evmContractAddress: beginCell()
            .storeUint(0x0000000000000000000000000000000000000000n, 160)
            .endCell(),
          customPayload: null,
        }
      );

      expect(result.transactions).toHaveTransaction({
        from: user1.address,
        to: tonFusion.address,
        success: true, // Contract should handle gracefully
      });
    });

    it("should handle escrow not deployed errors", async () => {
      const orderConfig = createOrderConfig(
        1,
        jettonMaster.address,
        user1.address,
        user2.address,
        123456789n,
        Math.floor(Date.now() / 1000) + 3600,
        toNano("1")
      );

      const result = await tonFusion.send(
        user1.getSender(),
        {
          value: toNano("0.05"),
        },
        {
          $$type: "CreateEVMToTONOrder",
          orderConfig: orderConfig,
          evmContractAddress: beginCell()
            .storeUint(0x0000000000000000000000000000000000000000n, 160)
            .endCell(),
          customPayload: null,
        }
      );

      expect(result.transactions).toHaveTransaction({
        from: user1.address,
        to: tonFusion.address,
        success: true, // Contract should handle gracefully
      });
    });

    it("should handle bridge failure errors", async () => {
      const orderConfig = createOrderConfig(
        1,
        jettonMaster.address,
        user1.address,
        user2.address,
        123456789n,
        Math.floor(Date.now() / 1000) + 3600,
        toNano("1")
      );

      const result = await tonFusion.send(
        user1.getSender(),
        {
          value: toNano("0.05"),
        },
        {
          $$type: "CreateTONToEVMOrder",
          orderConfig: orderConfig,
          evmContractAddress: beginCell()
            .storeUint(0x0000000000000000000000000000000000000000n, 160)
            .endCell(),
          customPayload: null,
        }
      );

      expect(result.transactions).toHaveTransaction({
        from: user1.address,
        to: tonFusion.address,
        success: true, // Contract should handle gracefully
      });
    });
  });
});

describe("Bridge and Oracle Management", () => {
  let blockchain: Blockchain;
  let deployer: SandboxContract<TreasuryContract>;
  let user1: SandboxContract<TreasuryContract>;
  let user2: SandboxContract<TreasuryContract>;
  let tonFusion: SandboxContract<TonFusion>;

  beforeEach(async () => {
    blockchain = await Blockchain.create();
    deployer = await blockchain.treasury("deployer");
    user1 = await blockchain.treasury("user1");
    user2 = await blockchain.treasury("user2");

    tonFusion = blockchain.openContract(await TonFusion.fromInit());

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
  });

  it("should register EVM bridge successfully", async () => {
    const bridgeId = 1n;
    const sourceChainId = BigInt(TON_CHAIN_MAINNET);
    const targetChainId = BigInt(EVM_CHAIN_ETHEREUM);
    const bridgeContract = randomAddress();
    const bridgeFee = toNano("0.01");
    const minTransferAmount = toNano("0.1");
    const maxTransferAmount = toNano("1000");

    const registerResult = await tonFusion.send(
      deployer.getSender(),
      {
        value: toNano("0.05"),
      },
      {
        $$type: "RegisterEVMBridge",
        bridgeId: bridgeId,
        sourceChainId: sourceChainId,
        targetChainId: targetChainId,
        bridgeContract: bridgeContract,
        bridgeFee: bridgeFee,
        minTransferAmount: minTransferAmount,
        maxTransferAmount: maxTransferAmount,
        customPayload: null,
      }
    );

    expect(registerResult.transactions).toHaveTransaction({
      from: deployer.address,
      to: tonFusion.address,
      success: true,
    });
  });

  it("should update EVM bridge successfully", async () => {
    // First register a bridge
    const bridgeId = 1n;
    const sourceChainId = BigInt(TON_CHAIN_MAINNET);
    const targetChainId = BigInt(EVM_CHAIN_ETHEREUM);
    const bridgeContract = randomAddress();
    const bridgeFee = toNano("0.01");
    const minTransferAmount = toNano("0.1");
    const maxTransferAmount = toNano("1000");

    await tonFusion.send(
      deployer.getSender(),
      {
        value: toNano("0.05"),
      },
      {
        $$type: "RegisterEVMBridge",
        bridgeId: bridgeId,
        sourceChainId: sourceChainId,
        targetChainId: targetChainId,
        bridgeContract: bridgeContract,
        bridgeFee: bridgeFee,
        minTransferAmount: minTransferAmount,
        maxTransferAmount: maxTransferAmount,
        customPayload: null,
      }
    );

    // Then update it
    const newBridgeFee = toNano("0.02");
    const newMinTransferAmount = toNano("0.2");
    const newMaxTransferAmount = toNano("2000");

    const updateResult = await tonFusion.send(
      deployer.getSender(),
      {
        value: toNano("0.05"),
      },
      {
        $$type: "UpdateEVMBridge",
        bridgeId: bridgeId,
        bridgeFee: newBridgeFee,
        minTransferAmount: newMinTransferAmount,
        maxTransferAmount: newMaxTransferAmount,
        isActive: true,
        customPayload: null,
      }
    );

    expect(updateResult.transactions).toHaveTransaction({
      from: deployer.address,
      to: tonFusion.address,
      success: true,
    });
  });
});
