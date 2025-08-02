import { TONIntegrationService, tonIntegration } from "./ton-integration";
import { TONSDKService } from "./ton-sdk";

// Mock dependencies
jest.mock("./ton-sdk", () => ({
  tonSDK: {
    setNetwork: jest.fn(),
    isWalletInitialized: jest.fn(),
    getCurrentNetwork: jest.fn(),
    getNetworkStats: jest.fn(),
    getBalance: jest.fn(),
    sendTransaction: jest.fn(),
    getTransaction: jest.fn(),
    estimateFee: jest.fn(),
    getCurrentAddress: jest.fn(),
    initializeWalletFromMnemonic: jest.fn(),
    initializeWalletFromPrivateKey: jest.fn(),
    cleanup: jest.fn(),
  },
  TONSDKService: {
    validateAddress: jest.fn(),
    toNano: jest.fn(),
    fromNano: jest.fn(),
  },
}));

jest.mock("./enhanced-wallet", () => ({
  enhancedWallet: {
    getTokenBalance: jest.fn(),
  },
}));

jest.mock("./price-oracle", () => ({
  priceOracle: {
    getTokenPrice: jest.fn(),
  },
}));

describe("TONIntegrationService", () => {
  let tonIntegrationService: TONIntegrationService;
  let mockTONSDK: jest.Mocked<TONSDKService>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Get mocked TON SDK
    const { tonSDK } = require("./ton-sdk");
    mockTONSDK = tonSDK;

    // Ensure setNetwork doesn't throw by default
    mockTONSDK.setNetwork.mockImplementation(() => {});

    // Create service instance
    tonIntegrationService = new TONIntegrationService();
  });

  afterEach(() => {
    tonIntegrationService.cleanup();
  });

  describe("Initialization", () => {
    test("should initialize with testnet by default", async () => {
      // Wait for initialization
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockTONSDK.setNetwork).toHaveBeenCalledWith("testnet");
    });

    test("should initialize wallet from mnemonic if provided", async () => {
      const originalEnv = process.env.TON_MNEMONIC;
      process.env.TON_MNEMONIC = "test mnemonic phrase here";

      const service = new TONIntegrationService();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockTONSDK.initializeWalletFromMnemonic).toHaveBeenCalledWith([
        "test",
        "mnemonic",
        "phrase",
        "here",
      ]);

      process.env.TON_MNEMONIC = originalEnv;
      service.cleanup();
    });

    test("should initialize wallet from private key if provided", async () => {
      const originalEnv = process.env.TON_PRIVATE_KEY;
      process.env.TON_PRIVATE_KEY =
        "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

      // Mock window object for client-side environment
      if (!(global as any).window) {
        (global as any).window = {};
      }

      // Clear the mock calls from previous tests
      mockTONSDK.initializeWalletFromPrivateKey.mockClear();
      mockTONSDK.setNetwork.mockClear();

      // Create a new service instance after setting the environment variable
      const service = new TONIntegrationService();

      // Wait longer for the async initialization to complete
      await new Promise((resolve) => setTimeout(resolve, 200));

      // The service should have called the private key initialization
      expect(mockTONSDK.initializeWalletFromPrivateKey).toHaveBeenCalledWith(
        expect.any(Buffer)
      );

      process.env.TON_PRIVATE_KEY = originalEnv;
      service.cleanup();
    });

    test("should handle initialization errors gracefully", async () => {
      mockTONSDK.setNetwork.mockImplementation(() => {
        throw new Error("Network error");
      });

      const service = new TONIntegrationService();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(service.isReady()).toBe(false);
      service.cleanup();
    });
  });

  describe("Readiness Check", () => {
    test("should return true when fully initialized", () => {
      mockTONSDK.isWalletInitialized.mockReturnValue(true);

      // Mock internal state
      (tonIntegrationService as any).isInitialized = true;

      expect(tonIntegrationService.isReady()).toBe(true);
    });

    test("should return false when not initialized", () => {
      mockTONSDK.isWalletInitialized.mockReturnValue(false);

      expect(tonIntegrationService.isReady()).toBe(false);
    });
  });

  describe("Network Information", () => {
    test("should get network information", async () => {
      const mockNetwork = {
        name: "TON Testnet",
        chainId: -239,
        isTestnet: true,
      };

      const mockStats = {
        currentBlockHeight: 12345,
        averageBlockTime: 5,
        totalSupply: "5000000000",
      };

      mockTONSDK.getCurrentNetwork.mockReturnValue(mockNetwork);
      mockTONSDK.getNetworkStats.mockResolvedValue(mockStats);

      const networkInfo = await tonIntegrationService.getNetworkInfo();

      expect(networkInfo).toEqual({
        name: "TON Testnet",
        chainId: -239,
        isTestnet: true,
        blockHeight: 12345,
        averageBlockTime: 5,
        totalSupply: "5000000000",
      });
    });

    test("should handle network info errors", async () => {
      mockTONSDK.getCurrentNetwork.mockImplementation(() => {
        throw new Error("Network error");
      });

      await expect(tonIntegrationService.getNetworkInfo()).rejects.toThrow(
        "Failed to get network info: Error: Network error"
      );
    });
  });

  describe("Wallet Balance", () => {
    test("should get wallet balance when ready", async () => {
      const mockBalance = {
        address: "EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t",
        balance: "1000000000",
        balanceFormatted: "1.000000000",
        lastUpdated: "2024-01-01T00:00:00.000Z",
      };

      mockTONSDK.isWalletInitialized.mockReturnValue(true);
      mockTONSDK.getBalance.mockResolvedValue(mockBalance);
      (tonIntegrationService as any).isInitialized = true;

      const balance = await tonIntegrationService.getWalletBalance();

      expect(balance).toEqual(mockBalance);
    });

    test("should throw error when not ready", async () => {
      await expect(tonIntegrationService.getWalletBalance()).rejects.toThrow(
        "TON integration not ready"
      );
    });
  });

  describe("Token Information", () => {
    test("should get TON token info", async () => {
      const mockBalance = {
        address: "EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t",
        balance: "1000000000",
        balanceFormatted: "1.000000000",
        lastUpdated: "2024-01-01T00:00:00.000Z",
      };

      const { priceOracle } = require("./price-oracle");
      priceOracle.getTokenPrice.mockResolvedValue({ price: 2.5 });

      mockTONSDK.isWalletInitialized.mockReturnValue(true);
      mockTONSDK.getBalance.mockResolvedValue(mockBalance);
      (tonIntegrationService as any).isInitialized = true;

      const tokenInfo = await tonIntegrationService.getTokenInfo("TON");

      expect(tokenInfo).toEqual({
        symbol: "TON",
        name: "TON",
        address: "EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t",
        decimals: 9,
        balance: "1000000000",
        balanceFormatted: "1.000000000",
        price: 2.5,
        value: 2.5,
      });
    });

    test("should return null for unsupported tokens", async () => {
      const tokenInfo = await tonIntegrationService.getTokenInfo("UNSUPPORTED");
      expect(tokenInfo).toBeNull();
    });

    test("should handle price oracle errors gracefully", async () => {
      const mockBalance = {
        address: "EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t",
        balance: "1000000000",
        balanceFormatted: "1.000000000",
        lastUpdated: "2024-01-01T00:00:00.000Z",
      };

      const { priceOracle } = require("./price-oracle");
      priceOracle.getTokenPrice.mockRejectedValue(new Error("Price error"));

      mockTONSDK.isWalletInitialized.mockReturnValue(true);
      mockTONSDK.getBalance.mockResolvedValue(mockBalance);
      (tonIntegrationService as any).isInitialized = true;

      const tokenInfo = await tonIntegrationService.getTokenInfo("TON");

      expect(tokenInfo?.price).toBeUndefined();
      expect(tokenInfo?.value).toBeUndefined();
    });
  });

  describe("Transaction Operations", () => {
    beforeEach(() => {
      mockTONSDK.isWalletInitialized.mockReturnValue(true);
      (tonIntegrationService as any).isInitialized = true;
    });

    test("should send transaction", async () => {
      const mockTransactionHash = "test-transaction-hash";
      mockTONSDK.sendTransaction.mockResolvedValue(mockTransactionHash);

      const result = await tonIntegrationService.sendTransaction({
        amount: "1",
        destination: "EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t",
      });

      expect(result).toBe(mockTransactionHash);
    });

    test("should throw error when not ready for transaction", async () => {
      (tonIntegrationService as any).isInitialized = false;

      await expect(
        tonIntegrationService.sendTransaction({
          amount: "1",
          destination: "EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t",
        })
      ).rejects.toThrow("TON integration not ready");
    });
  });

  describe("Swap Order Operations", () => {
    beforeEach(() => {
      mockTONSDK.isWalletInitialized.mockReturnValue(true);
      mockTONSDK.getCurrentAddress.mockReturnValue(
        "EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t"
      );
      mockTONSDK.estimateFee.mockResolvedValue("0.01");
      (tonIntegrationService as any).isInitialized = true;
    });

    test("should create TON swap order", async () => {
      const order = await tonIntegrationService.createTONSwapOrder(
        "TON",
        "ETH",
        "1",
        "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
        0.5
      );

      expect(order).toMatchObject({
        fromToken: "TON",
        toToken: "ETH",
        fromAmount: "1",
        fromAddress: "EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t",
        toAddress: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
        slippage: 0.5,
        status: "pending",
      });
      expect(order.id).toMatch(/^ton_swap_\d+_/);
    });

    test("should execute TON swap order", async () => {
      const mockTransactionHash = "test-transaction-hash";
      mockTONSDK.sendTransaction.mockResolvedValue(mockTransactionHash);

      const order = {
        id: "test-order",
        fromToken: "TON",
        toToken: "ETH",
        fromAmount: "1",
        toAmount: "1",
        fromAddress: "EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t",
        toAddress: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
        slippage: 0.5,
        fee: "0.01",
        status: "pending" as const,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };

      const result = await tonIntegrationService.executeTONSwapOrder(order);

      expect(result).toEqual({
        success: true,
        transactionHash: mockTransactionHash,
      });
    });

    test("should handle swap order execution errors", async () => {
      mockTONSDK.sendTransaction.mockRejectedValue(
        new Error("Transaction failed")
      );

      const order = {
        id: "test-order",
        fromToken: "TON",
        toToken: "ETH",
        fromAmount: "1",
        toAmount: "1",
        fromAddress: "EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t",
        toAddress: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
        slippage: 0.5,
        fee: "0.01",
        status: "pending" as const,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };

      const result = await tonIntegrationService.executeTONSwapOrder(order);

      expect(result).toEqual({
        success: false,
        error: "Failed to send transaction: Error: Transaction failed",
      });
    });
  });

  describe("Transaction Status", () => {
    test("should get transaction status", async () => {
      const mockTransaction = {
        hash: "test-hash",
        from: "sender",
        to: "receiver",
        amount: "1000000000",
        fee: "100000",
        timestamp: 1234567890,
        status: "confirmed" as const,
        confirmations: 1,
      };

      mockTONSDK.getTransaction.mockResolvedValue(mockTransaction);

      const status = await tonIntegrationService.getTransactionStatus(
        "test-hash"
      );

      expect(status).toEqual({
        status: "confirmed",
        confirmations: 1,
        blockNumber: undefined,
      });
    });

    test("should return pending for non-existent transaction", async () => {
      mockTONSDK.getTransaction.mockResolvedValue(null);

      const status = await tonIntegrationService.getTransactionStatus(
        "non-existent-hash"
      );

      expect(status).toEqual({
        status: "pending",
        confirmations: 0,
      });
    });
  });

  describe("Utility Functions", () => {
    test("should validate TON address", () => {
      const { TONSDKService } = require("./ton-sdk");
      TONSDKService.validateAddress.mockReturnValue(true);

      const result = TONIntegrationService.validateAddress("valid-address");
      expect(result).toBe(true);
      expect(TONSDKService.validateAddress).toHaveBeenCalledWith(
        "valid-address"
      );
    });

    test("should convert TON to nano TON", () => {
      const { TONSDKService } = require("./ton-sdk");
      TONSDKService.toNano.mockReturnValue("1000000000");

      const result = TONIntegrationService.toNano("1");
      expect(result).toBe("1000000000");
      expect(TONSDKService.toNano).toHaveBeenCalledWith("1");
    });

    test("should convert nano TON to TON", () => {
      const { TONSDKService } = require("./ton-sdk");
      TONSDKService.fromNano.mockReturnValue("1.000000000");

      const result = TONIntegrationService.fromNano("1000000000");
      expect(result).toBe("1.000000000");
      expect(TONSDKService.fromNano).toHaveBeenCalledWith("1000000000");
    });
  });

  describe("Token Support", () => {
    test("should get supported tokens", () => {
      const tokens = tonIntegrationService.getSupportedTokens();
      expect(tokens).toEqual(["TON"]);
    });

    test("should check if token is supported", () => {
      expect(tonIntegrationService.isTokenSupported("TON")).toBe(true);
      expect(tonIntegrationService.isTokenSupported("ETH")).toBe(false);
      expect(tonIntegrationService.isTokenSupported("ton")).toBe(true); // Case insensitive
    });
  });

  describe("SDK Access", () => {
    test("should get TON SDK instance", () => {
      const sdk = tonIntegrationService.getTONSDK();
      expect(sdk).toBe(mockTONSDK);
    });
  });

  describe("Cleanup", () => {
    test("should cleanup resources", () => {
      tonIntegrationService.cleanup();

      expect(mockTONSDK.cleanup).toHaveBeenCalled();
      expect((tonIntegrationService as any).isInitialized).toBe(false);
    });
  });
});

describe("tonIntegration Singleton", () => {
  test("should export singleton instance", () => {
    expect(tonIntegration).toBeInstanceOf(TONIntegrationService);
  });

  test("should be the same instance across imports", () => {
    const { tonIntegration: tonIntegration2 } = require("./ton-integration");
    expect(tonIntegration).toBe(tonIntegration2);
  });
});
