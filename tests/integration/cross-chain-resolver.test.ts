import 'dotenv/config';
import { expect, jest } from '@jest/globals';
import { ethers } from 'ethers';
import * as bitcoin from 'bitcoinjs-lib';
import crypto from 'crypto';

import { CrossChainResolver, CrossChainResolverConfig } from '../../src/lib/blockchains/bitcoin/cross-chain-resolver';
import { BitcoinHTLCOperations } from '../../src/lib/blockchains/bitcoin/bitcoin-htlc-operations';
import { BitcoinNetworkOperations } from '../../src/lib/blockchains/bitcoin/bitcoin-network-operations';

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
    getDstEscrowAddress: jest.fn().mockReturnValue('0x2222222222222222222222222222222222222222')
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

// Mock Bitcoin operations
jest.mock('../../src/lib/blockchains/bitcoin/bitcoin-htlc-operations');
jest.mock('../../src/lib/blockchains/bitcoin/bitcoin-network-operations');

const mockHTLCOperations = {
  createBitcoinHTLCScript: jest.fn().mockReturnValue({ script: Buffer.from('htlc_script'), address: 'htlc_address' }),
  createHTLCAddress: jest.fn().mockReturnValue('bc1qhtlcaddress'),
  redeemBitcoinHTLC: jest.fn().mockResolvedValue('bitcoin_tx_hash'),
  refundBitcoinHTLC: jest.fn().mockResolvedValue('bitcoin_refund_tx_hash')
};

const mockNetworkOperations = {
  getResolverAddress: jest.fn().mockReturnValue('bc1qresolveraddress'),
  getCurrentBlockHeight: jest.fn().mockResolvedValue(800000),
  fundBitcoinHTLC: jest.fn().mockResolvedValue('bitcoin_funding_tx_hash')
};

(BitcoinHTLCOperations as jest.MockedClass<typeof BitcoinHTLCOperations>).mockImplementation(() => mockHTLCOperations as any);
(BitcoinNetworkOperations as jest.MockedClass<typeof BitcoinNetworkOperations>).mockImplementation(() => mockNetworkOperations as any);

jest.setTimeout(1000 * 60);

describe('Cross-Chain Resolver Tests', () => {
  const srcChainId = 1; // Ethereum mainnet
  const dstChainId = 0; // Bitcoin (custom chain ID)

  const userPk = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
  const resolverPk = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';

  let resolver: CrossChainResolver;
  let config: CrossChainResolverConfig;

  beforeAll(async () => {
    config = {
      srcChainId,
      dstChainId,
      srcEscrowFactory: '0x1111111111111111111111111111111111111111',
      dstEscrowFactory: '0x2222222222222222222222222222222222222222',
      srcResolver: '0x3333333333333333333333333333333333333333',
      dstResolver: '0x4444444444444444444444444444444444444444',
      bitcoinNetwork: bitcoin.networks.testnet,
      minProfitThreshold: 1000,
      maxGasPrice: 100,
      timeoutSeconds: 3600
    };

    resolver = new CrossChainResolver(
      config,
      resolverPk,
      'http://localhost:8545'
    );
  });

  describe('Single Fill Orders', () => {
    it('should handle single fill order: Ethereum USDC -> Bitcoin', async () => {
      // Create mock order similar to 1inch test
      const mockOrder = {
        maker: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        makingAmount: ethers.parseUnits('100', 6), // 100 USDC
        takingAmount: ethers.parseUnits('99', 6),   // 99 USDC equivalent in BTC
        makerAsset: '0xA0b86a33E6441b8c4C3131C8C5C9C5C9C5C9C5C9', // USDC
        takerAsset: '0x0000000000000000000000000000000000000000', // BTC placeholder
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

      expect(dstDeployResult.txHash).toBe('bitcoin_funding_tx_hash');
      expect(dstDeployResult.blockTimestamp).toBeGreaterThan(0);

      // Test withdraw
      const order = resolver.getOrder(orderHash);
      expect(order).toBeDefined();
      expect(order?.status).toBe('filled');

      if (order?.srcEscrowAddress && order?.dstEscrowAddress) {
        // Withdraw from destination (Bitcoin)
        const dstWithdrawResult = await resolver.withdraw({
          chain: 'dst',
          escrowAddress: order.dstEscrowAddress,
          secret,
          immutables: { orderHash }
        });

        expect(dstWithdrawResult.txHash).toBe('bitcoin_tx_hash');

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
        takerAsset: '0x0000000000000000000000000000000000000000',
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
        takerAsset: '0x0000000000000000000000000000000000000000',
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
        takerAsset: '0x0000000000000000000000000000000000000000',
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

        expect(dstCancelResult.txHash).toBe('bitcoin_refund_tx_hash');

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
      const btcAddress = resolver.getBitcoinResolverAddress();

      expect(ethAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(btcAddress).toBe('bc1qresolveraddress');
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
      expect(addresses.dstEscrowAddress).toBe('0x2222222222222222222222222222222222222222');
    });
  });

  describe('Error Handling', () => {
    it('should handle deployment errors gracefully', async () => {
      // Mock error in deploySrc
      const mockSDK = require('@1inch/cross-chain-sdk').SDK;
      mockSDK.mockImplementationOnce(() => ({
        deploySrcEscrow: jest.fn().mockRejectedValue(new Error('Deployment failed'))
      }));

      const resolverWithError = new CrossChainResolver(
        config,
        resolverPk,
        'http://localhost:8545'
      );

      const mockOrder = {
        maker: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        makingAmount: ethers.parseUnits('100', 6),
        takingAmount: ethers.parseUnits('99', 6),
        makerAsset: '0xA0b86a33E6441b8c4C3131C8C5C9C5C9C5C9C5C9',
        takerAsset: '0x0000000000000000000000000000000000000000',
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