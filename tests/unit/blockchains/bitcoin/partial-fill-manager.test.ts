import { PartialFillManager } from "@/lib/blockchains/bitcoin/partial-fill-manager";
import { generateTestSecret, generateTestBitcoinAddress } from "../../../setup";

describe("Partial Fill Manager", () => {
  let partialFillManager: PartialFillManager;

  beforeEach(() => {
    partialFillManager = new PartialFillManager();
  });

  describe("PF-SECRET-01: Generate multiple secrets for single swap", () => {
    it("should generate multiple cryptographically secure secrets", async () => {
      const secretCount = 3;
      const secrets = await partialFillManager.generateMultipleSecrets(
        secretCount
      );

      expect(secrets).toHaveLength(secretCount);
      secrets.forEach((secret) => {
        expect(secret).toBeDefined();
        expect(typeof secret).toBe("string");
        expect(secret.length).toBeGreaterThan(32); // Minimum entropy
      });
    });

    it("should ensure all generated secrets are unique", async () => {
      const secretCount = 5;
      const secrets = await partialFillManager.generateMultipleSecrets(
        secretCount
      );

      const uniqueSecrets = new Set(secrets);
      expect(uniqueSecrets.size).toBe(secretCount);
    });

    it("should validate secret format and structure", async () => {
      const secrets = await partialFillManager.generateMultipleSecrets(2);

      secrets.forEach((secret) => {
        // Should be hex string
        expect(secret).toMatch(/^[0-9a-fA-F]+$/);
        // Should have sufficient entropy (at least 32 bytes = 64 hex chars)
        expect(secret.length).toBeGreaterThanOrEqual(64);
      });
    });

    it("should handle edge cases for secret generation", async () => {
      // Test with 1 secret
      const singleSecret = await partialFillManager.generateMultipleSecrets(1);
      expect(singleSecret).toHaveLength(1);

      // Test with 0 secrets (should return empty array)
      const zeroSecrets = await partialFillManager.generateMultipleSecrets(0);
      expect(zeroSecrets).toHaveLength(0);

      // Test with large number of secrets
      const manySecrets = await partialFillManager.generateMultipleSecrets(10);
      expect(manySecrets).toHaveLength(10);
    });

    it("should throw error for invalid secret count", async () => {
      await expect(
        partialFillManager.generateMultipleSecrets(-1)
      ).rejects.toThrow();
      await expect(
        partialFillManager.generateMultipleSecrets(1001)
      ).rejects.toThrow(); // Max limit
    });
  });

  describe("PF-SECRET-02: Hash management for multiple secrets", () => {
    it("should generate hash160 for each secret (Bitcoin standard)", async () => {
      const secrets = await partialFillManager.generateMultipleSecrets(3);
      const secretHashes = await partialFillManager.generateSecretHashes(
        secrets
      );

      expect(secretHashes).toHaveLength(secrets.length);
      secretHashes.forEach((hash) => {
        expect(hash).toMatch(/^[0-9a-fA-F]{40}$/); // 20 bytes = 40 hex chars
      });
    });

    it("should create correct mapping between secrets and hashes", async () => {
      const secrets = ["unique-test-secret-1", "unique-test-secret-2"];
      const secretHashes = await partialFillManager.generateSecretHashes(
        secrets
      );
      const secretToHashMap = await partialFillManager.createSecretToHashMap(
        secrets
      );

      expect(secretToHashMap.size).toBe(secrets.length);
      secrets.forEach((secret, index) => {
        expect(secretToHashMap.get(secret)).toBe(secretHashes[index]);
      });
    });

    it("should validate secret hash format and consistency", async () => {
      // Use a test secret that meets the entropy requirements
      const testSecret =
        "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456";
      const hashes = await partialFillManager.generateSecretHashes([
        testSecret,
      ]);

      expect(hashes[0]).toBeDefined();
      expect(hashes[0]).toMatch(/^[0-9a-fA-F]{40}$/);

      // Same secret should always produce same hash
      const hash2 = await partialFillManager.generateSecretHashes([testSecret]);
      expect(hash2[0]).toBe(hashes[0]);
    });

    it("should handle hash storage and retrieval", async () => {
      const secrets = await partialFillManager.generateMultipleSecrets(2);
      const hashes = await partialFillManager.generateSecretHashes(secrets);

      // Store hashes
      await partialFillManager.storeSecretHashes(secrets, hashes);

      // Retrieve hashes
      const retrievedHashes = await partialFillManager.getSecretHashes(secrets);
      expect(retrievedHashes).toEqual(hashes);
    });

    it("should validate secret hash uniqueness", async () => {
      const secrets = await partialFillManager.generateMultipleSecrets(5);
      const hashes = await partialFillManager.generateSecretHashes(secrets);

      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(hashes.length);
    });

    it("should handle hash validation for known secrets", async () => {
      const testSecret = "known-test-secret-123";
      const hashes = await partialFillManager.generateSecretHashes([
        testSecret,
      ]);

      const isValid = await partialFillManager.validateSecretHash(
        testSecret,
        hashes[0]
      );
      expect(isValid).toBe(true);

      const isInvalid = await partialFillManager.validateSecretHash(
        testSecret,
        "invalid-hash"
      );
      expect(isInvalid).toBe(false);
    });
  });

  describe("PF-SECRET-03: Secret management utilities", () => {
    it("should provide secret statistics and metadata", async () => {
      const secrets = await partialFillManager.generateMultipleSecrets(3);
      const stats = await partialFillManager.getSecretStats(secrets);

      expect(stats.totalSecrets).toBe(3);
      expect(stats.averageLength).toBeGreaterThan(0);
      expect(stats.uniqueCount).toBe(3);
      expect(stats.entropyScore).toBeGreaterThan(0.8); // High entropy
    });

    it("should support secret rotation and replacement", async () => {
      const originalSecrets = await partialFillManager.generateMultipleSecrets(
        2
      );
      const newSecrets = await partialFillManager.generateMultipleSecrets(2);

      await partialFillManager.rotateSecrets(originalSecrets, newSecrets);

      // Verify old secrets are invalidated
      const oldHashes = await partialFillManager.generateSecretHashes(
        originalSecrets
      );
      const oldValid = await partialFillManager.validateSecretHash(
        originalSecrets[0],
        oldHashes[0]
      );
      expect(oldValid).toBe(false);

      // Verify new secrets are valid
      const newHashes = await partialFillManager.generateSecretHashes(
        newSecrets
      );
      const newValid = await partialFillManager.validateSecretHash(
        newSecrets[0],
        newHashes[0]
      );
      expect(newValid).toBe(true);
    });

    it("should handle secret cleanup and expiration", async () => {
      const secrets = await partialFillManager.generateMultipleSecrets(2);
      const hashes = await partialFillManager.generateSecretHashes(secrets);

      // Store with expiration
      await partialFillManager.storeSecretHashesWithExpiration(
        secrets,
        hashes,
        1000
      ); // 1 second

      // Should be available immediately
      const immediate = await partialFillManager.getSecretHashes(secrets);
      expect(immediate).toEqual(hashes);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Should be cleaned up
      const afterExpiration = await partialFillManager.getSecretHashes(secrets);
      expect(afterExpiration).toEqual([null, null]); // Expired
    });
  });
});
