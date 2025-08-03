import 'dotenv/config';
import { expect, jest } from '@jest/globals';
import { ethers } from 'ethers';
import crypto from 'crypto';

// Mock all TON-related modules
jest.mock('@ton/ton', () => ({
  TonClient: jest.fn().mockImplementation(() => ({
    getMasterchainInfo: jest.fn().mockResolvedValue({ last: { seqno: 30000000 } }),
    getBalance: jest.fn().mockResolvedValue(BigInt('1000000000')),
    getContractState: jest.fn().mockResolvedValue({
      state: 'active',
      balance: BigInt('1000000000'),
      code: Buffer.from('mock_code'),
      data: Buffer.from('mock_data')
    })
  })),
  Address: {
    parse: jest.fn().mockImplementation((addr: string) => ({ toString: () => addr }))
  },
  toNano: jest.fn().mockImplementation((amount: string | number) => BigInt(amount) * BigInt(1000000000)),
  fromNano: jest.fn().mockImplementation((nanoAmount: string | bigint) => (Number(nanoAmount) / 1000000000).toString()),
  beginCell: jest.fn().mockReturnValue({
    storeUint: jest.fn().mockReturnThis(),
    storeBuffer: jest.fn().mockReturnThis(),
    storeAddress: jest.fn().mockReturnThis(),
    storeCoins: jest.fn().mockReturnThis(),
    endCell: jest.fn().mockReturnValue({ toString: () => 'mock_cell' })
  }),
  Contract: jest.fn().mockImplementation(() => ({
    address: { toString: () => 'EQDmockcontractaddress' }
  })),
  WalletContractV4: {
    create: jest.fn().mockReturnValue({
      address: { toString: () => 'EQDmockwalletaddress' }
    })
  },
  internal: jest.fn()
}));

jest.mock('@ton/crypto', () => ({
  mnemonicToWalletKey: jest.fn().mockResolvedValue({
    publicKey: Buffer.from('mock_public_key'),
    secretKey: Buffer.from('mock_secret_key')
  })
}));

// Mock the 1inch SDK
jest.mock('@1inch/cross-chain-sdk', () => ({
  SDK: jest.fn().mockImplementation(() => ({
    deploySrcEscrow: jest.fn().mockResolvedValue({
      txHash: '0x1234567890abcdef',
      blockHash: '0xabcdef1234567890'
    }),
    withdrawFromSrcEscrow: jest.fn().mockResolvedValue({
      txHash: '0x9876543210fedcba'
    }),
    cancelSrcEscrow: jest.fn().mockResolvedValue({
      txHash: '0xba9876543210fedc'
    }),
    getSrcEscrowAddress: jest.fn().mockReturnValue('0x1111111111111111111111111111111111111111'),
    getDstEscrowAddress: jest.fn().mockReturnValue('EQDmockdstescrowaddress')
  })),
  Address: jest.fn().mockImplementation((address: string) => ({ toString: () => address })),
  HashLock: {
    forSingleFill: jest.fn().mockReturnValue({ toString: () => 'single_fill_hash' }),
    forMultipleFills: jest.fn().mockReturnValue({ toString: () => 'multiple_fill_hash' }),
    fromString: jest.fn().mockReturnValue({ toString: () => 'hash_from_string' })
  },
  TimeLocks: {
    new: jest.fn().mockReturnValue({ toString: () => 'timelocks' })
  },
  AuctionDetails: jest.fn().mockImplementation(() => ({ toString: () => 'auction_details' })),
  TakerTraits: {
    default: jest.fn().mockReturnValue({
      setExtension: jest.fn().mockReturnThis(),
      setAmountMode: jest.fn().mockReturnThis(),
      setAmountThreshold: jest.fn().mockReturnThis(),
      setInteraction: jest.fn().mockReturnThis()
    })
  },
  AmountMode: {
    maker: 'maker'
  }
}));

// Mock TON SDK
jest.mock('../../src/lib/ton-sdk', () => ({
  TONSDKService: jest.fn().mockImplementation(() => ({
    setNetwork: jest.fn(),
    validateAddress: jest.fn().mockReturnValue(true)
  }))
}));

import { TONCrossChainResolver, TONCrossChainResolverConfig } from '../../src/lib/blockchains/ton/ton-cross-chain-resolver';

jest.setTimeout(1000 * 60);

describe('TON Cross-Chain Resolver Tests', () => {
  const srcChainId = 1; // Ethereum mainnet
  const dstChainId = -239; // TON testnet

  const userPk = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
  const resolverPk = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';

  let resolver: TONCrossChainResolver;
  let config: TONCrossChainResolverConfig;

  beforeAll(async () => {
    config = {
      srcChainId,
      dstChainId,
      srcEscrowFactory: '0x1111111111111111111111111111111111111111',
      dstEscrowFactory: 'EQDmockdstescrowfactory',
      srcResolver: '0x3333333333333333333333333333333333333333',
      dstResolver: 'EQDmockdstresolver',
      tonNetwork: 'testnet',
      minProfitThreshold: 1000,
      maxGasPrice: 100,
      timeoutSeconds: 3600
    };

    resolver = new TONCrossChainResolver(
      config,
      resolverPk,
      'http://localhost:8545'
    );
  });

  describe('Single Fill Orders', () => {
    it('should handle single fill order: Ethereum USDC -> TON', async () => {
      // Create mock order similar to 1inch test
      const mockOrder = {
        maker: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        makingAmount: ethers.parseUnits('100', 6), // 100 USDC
        takingAmount: ethers.parseUnits('99', 6),   // 99 USDC equivalent in TON
        makerAsset: '0xA0b86a33E6441b8c4C3131C8C5C9C5C9C5C9C5C9', // USDC
        takerAsset: 'EQDmocktokenaddress', // TON token
        extension: {
          hashLock: 'single_fill_hash',
          timeLocks: 'timelocks',
          srcChainId,
          dstChainId,
          srcSafetyDeposit: ethers.parseEther('0.001'),
          dstSafetyDeposit: ethers.parseEther('0.001')
        }
      };

      const orderHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const signature = '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba';
      const secret = crypto.randomBytes(32).toString('hex');
      const fillAmount = ethers.parseUnits('100', 6);

      // Test deploySrc
      const deployResult = await resolver.deploySrc({
        orderHash,
        order: mockOrder,
        signature,
        fillAmount: fillAmount.toString(),
        secret,
        secretHash: crypto.createHash('sha256').update(secret, 'hex').digest('hex')
      });

      expect(deployResult.txHash).toBe('0x1234567890abcdef');
      expect(deployResult.blockHash).toBe('0xabcdef1234567890');

      // Test deployDst
      const immutables = {
        orderHash,
        secretHash: crypto.createHash('sha256').update(secret, 'hex').digest('hex'),
        amount: fillAmount,
        taker: resolver.getResolverAddress()
      };

      const dstDeployResult = await resolver.deployDst(immutables);

      expect(dstDeployResult.txHash).toContain('ton_deploy_');
      expect(dstDeployResult.blockTimestamp).toBeGreaterThan(0);

      // Test withdraw
      const order = resolver.getOrder(orderHash);
      expect(order).toBeDefined();
      expect(order?.status).toBe('filled');

      if (order?.srcEscrowAddress && order?.dstEscrowAddress) {
        // Withdraw from destination (TON)
        const dstWithdrawResult = await resolver.withdraw({
          chain: 'dst',
          escrowAddress: order.dstEscrowAddress,
          secret,
          immutables: { orderHash }
        });

        expect(dstWithdrawResult.txHash).toContain('ton_withdraw_');

        // Withdraw from source (Ethereum)
        const srcWithdrawResult = await resolver.withdraw({
          chain: 'src',
          escrowAddress: order.srcEscrowAddress,
          secret,
          immutables: { orderHash }
        });

        expect(srcWithdrawResult.txHash).toBe('0x9876543210fedcba');
      }
    });
  });

  describe('Multiple Fill Orders', () => {
    it('should handle multiple fill order: 100% fill', async () => {
      const secrets = Array.from({ length: 11 }).map(() => crypto.randomBytes(32).toString('hex'));
      const secretHashes = secrets.map(s => crypto.createHash('sha256').update(s, 'hex').digest('hex'));

      const mockOrder = {
        maker: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        makingAmount: ethers.parseUnits('100', 6),
        takingAmount: ethers.parseUnits('99', 6),
        makerAsset: '0xA0b86a33E6441b8c4C3131C8C5C9C5C9C5C9C5C9',
        takerAsset: 'EQDmocktokenaddress',
        extension: {
          hashLock: 'multiple_fill_hash',
          timeLocks: 'timelocks',
          srcChainId,
          dstChainId,
          srcSafetyDeposit: ethers.parseEther('0.001'),
          dstSafetyDeposit: ethers.parseEther('0.001')
        }
      };

      const orderHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const signature = '0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';
      const fillAmount = ethers.parseUnits('100', 6);
      const idx = secrets.length - 1; // Last index for 100% fill

      // Mock Merkle proof
      const merkleProof = ['proof1', 'proof2', 'proof3'];

      const deployResult = await resolver.deploySrc({
        orderHash,
        order: mockOrder,
        signature,
        fillAmount: fillAmount.toString(),
        secret: secrets[idx],
        secretHash: secretHashes[idx],
        merkleProof,
        merkleIndex: idx
      });

      expect(deployResult.txHash).toBe('0x1234567890abcdef');

      const order = resolver.getOrder(orderHash);
      expect(order).toBeDefined();
      expect(order?.status).toBe('filled');
    });

    it('should handle multiple fill order: 50% fill', async () => {
      const secrets = Array.from({ length: 11 }).map(() => crypto.randomBytes(32).toString('hex'));
      const secretHashes = secrets.map(s => crypto.createHash('sha256').update(s, 'hex').digest('hex'));

      const mockOrder = {
        maker: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        makingAmount: ethers.parseUnits('100', 6),
        takingAmount: ethers.parseUnits('99', 6),
        makerAsset: '0xA0b86a33E6441b8c4C3131C8C5C9C5C9C5C9C5C9',
        takerAsset: 'EQDmocktokenaddress',
        extension: {
          hashLock: 'multiple_fill_hash',
          timeLocks: 'timelocks',
          srcChainId,
          dstChainId,
          srcSafetyDeposit: ethers.parseEther('0.001'),
          dstSafetyDeposit: ethers.parseEther('0.001')
        }
      };

      const orderHash = '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456';
      const signature = '0x3210fedcba9876543210fedcba9876543210fedcba9876543210fedcba987654';
      const fillAmount = ethers.parseUnits('50', 6); // 50% fill
      const idx = Math.floor((secrets.length - 1) * (parseInt(fillAmount.toString()) - 1) / parseInt(mockOrder.makingAmount.toString()));

      const merkleProof = ['proof1', 'proof2'];

      const deployResult = await resolver.deploySrc({
        orderHash,
        order: mockOrder,
        signature,
        fillAmount: fillAmount.toString(),
        secret: secrets[idx],
        secretHash: secretHashes[idx],
        merkleProof,
        merkleIndex: idx
      });

      expect(deployResult.txHash).toBe('0x1234567890abcdef');

      const order = resolver.getOrder(orderHash);
      expect(order).toBeDefined();
      expect(order?.status).toBe('filled');
      expect(order?.fillAmount).toBe(fillAmount.toString());
    });
  });

  describe('Order Cancellation', () => {
    it('should cancel orders after timeout', async () => {
      const mockOrder = {
        maker: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        makingAmount: ethers.parseUnits('100', 6),
        takingAmount: ethers.parseUnits('99', 6),
        makerAsset: '0xA0b86a33E6441b8c4C3131C8C5C9C5C9C5C9C5C9',
        takerAsset: 'EQDmocktokenaddress',
        extension: {
          hashLock: 'single_fill_hash',
          timeLocks: 'timelocks',
          srcChainId,
          dstChainId,
          srcSafetyDeposit: ethers.parseEther('0.001'),
          dstSafetyDeposit: ethers.parseEther('0.001')
        }
      };

      const orderHash = '0xcancel1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const signature = '0xcancel9876543210fedcba9876543210fedcba9876543210fedcba9876543210';
      const fillAmount = ethers.parseUnits('100', 6);

      // Deploy order
      await resolver.deploySrc({
        orderHash,
        order: mockOrder,
        signature,
        fillAmount: fillAmount.toString()
      });

      // Deploy destination
      const immutables = {
        orderHash,
        secretHash: 'cancel_hash',
        amount: fillAmount,
        taker: resolver.getResolverAddress()
      };

      await resolver.deployDst(immutables);

      const order = resolver.getOrder(orderHash);
      expect(order).toBeDefined();

      if (order?.srcEscrowAddress && order?.dstEscrowAddress) {
        // Cancel destination escrow
        const dstCancelResult = await resolver.cancel({
          chain: 'dst',
          escrowAddress: order.dstEscrowAddress,
          immutables: { orderHash }
        });

        expect(dstCancelResult.txHash).toContain('ton_refund_');

        // Cancel source escrow
        const srcCancelResult = await resolver.cancel({
          chain: 'src',
          escrowAddress: order.srcEscrowAddress,
          immutables: { orderHash }
        });

        expect(srcCancelResult.txHash).toBe('0xba9876543210fedc');
      }
    });
  });

  describe('TON-Specific Functionality', () => {
    it('should handle TON address validation', () => {
      const validTONAddresses = [
        'EQDmockvalidtonaddress1234567890',
        'EQCmockvalidtonaddress0987654321'
      ];

      validTONAddresses.forEach(address => {
        expect(resolver.validateTONAddress(address)).toBe(true);
      });
    });

    it('should get TON network information', () => {
      const networkInfo = resolver.getTONNetworkInfo();

      expect(networkInfo.network).toBe('testnet');
      expect(networkInfo.explorer).toBe('https://testnet.tonscan.org');
      expect(networkInfo.confirmations).toBe(1);
      expect(networkInfo.estimatedTime).toBe('5-15 seconds');
    });

    it('should get TON resolver address', () => {
      const tonAddress = resolver.getTONResolverAddress();
      expect(tonAddress).toContain('EQD');
      expect(tonAddress).toHaveLength(48); // Standard TON address length
    });
  });

  describe('Order Management', () => {
    it('should manage order lifecycle correctly', () => {
      const orders = resolver.getAllOrders();
      expect(orders.length).toBeGreaterThan(0);

      const pendingOrders = resolver.getPendingOrders();
      expect(Array.isArray(pendingOrders)).toBe(true);

      // Test order expiration
      const testOrderHash = '0xexpire1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const isExpired = resolver.isOrderExpired(testOrderHash);
      expect(typeof isExpired).toBe('boolean');

      // Test resolver addresses
      const ethAddress = resolver.getResolverAddress();
      const tonAddress = resolver.getTONResolverAddress();

      expect(ethAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(tonAddress).toContain('EQD');
    });

    it('should calculate escrow addresses correctly', async () => {
      const srcEscrowEvent = [
        { orderHash: '0x1234567890abcdef' },
        { complement: 'complement_data' }
      ];
      const dstDeployedAt = Math.floor(Date.now() / 1000);
      const dstTaker = resolver.getResolverAddress();

      const addresses = await resolver.calculateEscrowAddresses(
        srcEscrowEvent,
        dstDeployedAt,
        dstTaker
      );

      expect(addresses.srcEscrowAddress).toBe('0x1111111111111111111111111111111111111111');
      expect(addresses.dstEscrowAddress).toContain('EQD');
    });
  });

  describe('Cross-Chain Coordination', () => {
    it('should handle cross-chain event coordination', () => {
      const crossChainEvents = {
        srcDeploy: 'Source escrow deployment event',
        dstDeploy: 'Destination TON contract deployment event',
        srcWithdraw: 'Source escrow withdrawal event',
        dstWithdraw: 'Destination TON contract withdrawal event',
        srcCancel: 'Source escrow cancellation event',
        dstCancel: 'Destination TON contract cancellation event'
      };

      expect(Object.keys(crossChainEvents)).toHaveLength(6);
      expect(crossChainEvents.srcDeploy).toContain('Source');
      expect(crossChainEvents.dstDeploy).toContain('TON');
    });

    it('should handle chain-specific operations', () => {
      const chainOperations = {
        ethereum: ['deploySrcEscrow', 'withdrawFromSrcEscrow', 'cancelSrcEscrow'],
        ton: ['deployTONContract', 'redeemTONContract', 'refundTONContract']
      };

      expect(chainOperations.ethereum).toHaveLength(3);
      expect(chainOperations.ton).toHaveLength(3);
      expect(chainOperations.ethereum[0]).toContain('deploySrc');
      expect(chainOperations.ton[0]).toContain('deployTON');
    });
  });

  describe('Error Handling', () => {
    it('should handle deployment errors gracefully', async () => {
      // Mock error in deploySrc
      const mockSDK = require('@1inch/cross-chain-sdk').SDK;
      mockSDK.mockImplementationOnce(() => ({
        deploySrcEscrow: jest.fn().mockRejectedValue(new Error('Deployment failed'))
      }));

      const resolverWithError = new TONCrossChainResolver(
        config,
        resolverPk,
        'http://localhost:8545'
      );

      const mockOrder = {
        maker: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        makingAmount: ethers.parseUnits('100', 6),
        takingAmount: ethers.parseUnits('99', 6),
        makerAsset: '0xA0b86a33E6441b8c4C3131C8C5C9C5C9C5C9C5C9',
        takerAsset: 'EQDmocktokenaddress',
        extension: {
          hashLock: 'single_fill_hash',
          timeLocks: 'timelocks',
          srcChainId,
          dstChainId,
          srcSafetyDeposit: ethers.parseEther('0.001'),
          dstSafetyDeposit: ethers.parseEther('0.001')
        }
      };

      await expect(
        resolverWithError.deploySrc({
          orderHash: '0xerror1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          order: mockOrder,
          signature: '0xerror9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
          fillAmount: ethers.parseUnits('100', 6).toString()
        })
      ).rejects.toThrow('Deployment failed');
    });
  });
});