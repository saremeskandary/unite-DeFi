import crypto from 'crypto';

export interface SecretStats {
  totalSecrets: number;
  averageLength: number;
  uniqueCount: number;
  entropyScore: number;
}

export interface SecretHashStorage {
  [secret: string]: {
    hash: string;
    expiresAt?: number;
  };
}

/**
 * Partial Fill Manager
 * Handles multiple secret generation and hash management for partial fill orders
 */
export class PartialFillManager {
  private secretStorage: SecretHashStorage = {};
  private readonly MAX_SECRETS = 1000;

  /**
   * Generate multiple cryptographically secure secrets
   */
  async generateMultipleSecrets(count: number): Promise<string[]> {
    if (count < 0 || count > this.MAX_SECRETS) {
      throw new Error(`Invalid secret count. Must be between 0 and ${this.MAX_SECRETS}`);
    }

    const secrets: string[] = [];
    for (let i = 0; i < count; i++) {
      const secret = crypto.randomBytes(32).toString('hex');
      secrets.push(secret);
    }

    return secrets;
  }

  /**
   * Generate hash160 for each secret (Bitcoin standard)
   */
  async generateSecretHashes(secrets: string[]): Promise<string[]> {
    return secrets.map(secret => {
      const secretBuffer = Buffer.from(secret, 'hex');
      const sha256Hash = crypto.createHash('sha256').update(secretBuffer).digest();
      const hash160 = crypto.createHash('ripemd160').update(sha256Hash).digest();
      return hash160.toString('hex');
    });
  }

  /**
   * Create mapping between secrets and their hashes
   */
  async createSecretToHashMap(secrets: string[]): Promise<Map<string, string>> {
    const hashes = await this.generateSecretHashes(secrets);
    const secretToHashMap = new Map<string, string>();

    secrets.forEach((secret, index) => {
      secretToHashMap.set(secret, hashes[index]);
    });

    return secretToHashMap;
  }

  /**
   * Store secret hashes for later retrieval
   */
  async storeSecretHashes(secrets: string[], hashes: string[]): Promise<void> {
    secrets.forEach((secret, index) => {
      this.secretStorage[secret] = {
        hash: hashes[index]
      };
    });
  }

  /**
   * Store secret hashes with expiration
   */
  async storeSecretHashesWithExpiration(
    secrets: string[],
    hashes: string[],
    expirationMs: number
  ): Promise<void> {
    const expiresAt = Date.now() + expirationMs;

    secrets.forEach((secret, index) => {
      this.secretStorage[secret] = {
        hash: hashes[index],
        expiresAt
      };
    });
  }

  /**
   * Retrieve stored secret hashes
   */
  async getSecretHashes(secrets: string[]): Promise<(string | null)[]> {
    return secrets.map(secret => {
      const stored = this.secretStorage[secret];
      if (!stored) return null;

      // Check expiration
      if (stored.expiresAt && Date.now() > stored.expiresAt) {
        delete this.secretStorage[secret];
        return null;
      }

      return stored.hash;
    });
  }

  /**
   * Validate secret hash for known secret
   */
  async validateSecretHash(secret: string, hash: string): Promise<boolean> {
    const expectedHash = await this.generateSecretHashes([secret]);
    return expectedHash[0] === hash;
  }

  /**
   * Get statistics about secrets
   */
  async getSecretStats(secrets: string[]): Promise<SecretStats> {
    const totalSecrets = secrets.length;
    const averageLength = secrets.reduce((sum, secret) => sum + secret.length, 0) / totalSecrets;
    const uniqueCount = new Set(secrets).size;

    // Calculate entropy score (simplified)
    const entropyScore = Math.min(1.0, uniqueCount / totalSecrets);

    return {
      totalSecrets,
      averageLength,
      uniqueCount,
      entropyScore
    };
  }

  /**
   * Rotate secrets - invalidate old ones and replace with new ones
   */
  async rotateSecrets(oldSecrets: string[], newSecrets: string[]): Promise<void> {
    // Remove old secrets from storage
    oldSecrets.forEach(secret => {
      delete this.secretStorage[secret];
    });

    // Store new secrets
    const newHashes = await this.generateSecretHashes(newSecrets);
    await this.storeSecretHashes(newSecrets, newHashes);
  }

  /**
   * Clean up expired secrets
   */
  async cleanupExpiredSecrets(): Promise<void> {
    const now = Date.now();
    Object.keys(this.secretStorage).forEach(secret => {
      const stored = this.secretStorage[secret];
      if (stored.expiresAt && now > stored.expiresAt) {
        delete this.secretStorage[secret];
      }
    });
  }
} 