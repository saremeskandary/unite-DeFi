import { EthereumProviderService } from '../../../src/lib/blockchains/ethereum/ethereum-provider';
import { EthereumHTLCService } from '../../../src/lib/blockchains/ethereum/ethereum-htlc';
import { ethers } from 'ethers';

// Mock window.ethereum for testing
const mockEthereum = {
  request: jest.fn(),
  on: jest.fn(),
  removeAllListeners: jest.fn(),
  isMetaMask: true
};

Object.defineProperty(window, 'ethereum', {
  value: mockEthereum,
  writable: true
});

describe('Ethereum Integration Tests', () => {
  let ethereumProvider: EthereumProviderService;
  let htlcService: EthereumHTLCService;
  let mockProvider: any;
  let mockSigner: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock provider and signer
    mockProvider = {
      send: jest.fn(),
      getSigner: jest.fn(),
      listAccounts: jest.fn(),
      getBalance: jest.fn(),
      getTransactionReceipt: jest.fn(),
      getBlockNumber: jest.fn(),
      waitForTransaction: jest.fn()
    };

    mockSigner = {
      getAddress: jest.fn(),
      sendTransaction: jest.fn()
    };

    // Mock ethers.BrowserProvider constructor using jest.spyOn
    jest.spyOn(ethers, 'BrowserProvider').mockImplementation(() => mockProvider as any);
    mockProvider.getSigner.mockResolvedValue(mockSigner);

    ethereumProvider = new EthereumProviderService();
    htlcService = ethereumProvider.getHTLCService();
  });

  describe('ETH-PROVIDER-01: Ethereum Provider Initialization', () => {
    it('should initialize provider successfully', async () => {
      // Mock successful provider initialization
      mockProvider.send.mockResolvedValueOnce(['0x1234567890123456789012345678901234567890']);
      mockProvider.send.mockResolvedValueOnce('0x1'); // chainId
      mockSigner.getAddress.mockResolvedValue('0x1234567890123456789012345678901234567890');

      const result = await ethereumProvider.initializeProvider();

      expect(result.connected).toBe(true);
      expect(result.account).toBe('0x1234567890123456789012345678901234567890');
      expect(result.chainId).toBe(1);
    }, 10000);

    it('should handle provider not found error', async () => {
      // Mock no ethereum provider
      Object.defineProperty(window, 'ethereum', {
        value: undefined,
        writable: true
      });

      const result = await ethereumProvider.initializeProvider();

      expect(result.connected).toBe(false);
      expect(result.account).toBeNull();
      expect(result.chainId).toBeNull();
      expect(result.network).toBeNull();
    });

    it('should handle no accounts error', async () => {
      mockProvider.send.mockResolvedValueOnce([]); // No accounts

      const result = await ethereumProvider.initializeProvider();

      expect(result.connected).toBe(false);
      expect(result.account).toBeNull();
      expect(result.chainId).toBeNull();
      expect(result.network).toBeNull();
    });
  });

  describe('ETH-NETWORK-01: Network Switching', () => {
    beforeEach(async () => {
      // Mock successful provider initialization
      mockProvider.send.mockResolvedValueOnce(['0x1234567890123456789012345678901234567890']);
      mockProvider.send.mockResolvedValueOnce('0x1');
      mockSigner.getAddress.mockResolvedValue('0x1234567890123456789012345678901234567890');
      await ethereumProvider.initializeProvider();
    });

    it('should switch to Sepolia testnet successfully', async () => {
      mockProvider.send.mockResolvedValueOnce(undefined); // Switch successful

      const result = await ethereumProvider.switchNetwork(11155111);

      expect(result.success).toBe(true);
      expect(mockProvider.send).toHaveBeenCalledWith('wallet_switchEthereumChain', [
        { chainId: '0xaa36a7' }
      ]);
    });

    it('should handle network switch error', async () => {
      const error = new Error('User rejected');
      (error as any).code = 4001;
      mockProvider.send.mockRejectedValueOnce(error);

      const result = await ethereumProvider.switchNetwork(11155111);

      expect(result.success).toBe(false);
      expect(result.error).toContain('User rejected');
    });

    it('should add network if it does not exist', async () => {
      const error = new Error('Chain does not exist');
      (error as any).code = 4902;
      mockProvider.send.mockRejectedValueOnce(error);
      mockProvider.send.mockResolvedValueOnce(undefined); // Add network successful

      const result = await ethereumProvider.switchNetwork(137); // Polygon

      expect(result.success).toBe(true);
      expect(mockProvider.send).toHaveBeenCalledWith('wallet_addEthereumChain', [
        expect.objectContaining({
          chainId: '0x89',
          chainName: 'Polygon Mainnet'
        })
      ]);
    });
  });

  describe('ETH-BALANCE-01: Balance and Transaction Management', () => {
    beforeEach(async () => {
      mockProvider.send.mockResolvedValueOnce(['0x1234567890123456789012345678901234567890']);
      mockProvider.send.mockResolvedValueOnce('0x1');
      mockSigner.getAddress.mockResolvedValue('0x1234567890123456789012345678901234567890');
      await ethereumProvider.initializeProvider();
    });

    it('should get account balance successfully', async () => {
      // Mock balance response
      mockProvider.getBalance.mockResolvedValueOnce(ethers.parseEther('1.0'));

      const balance = await ethereumProvider.getBalance();

      expect(balance).toBe('1.0');
    });

    it('should send transaction successfully', async () => {
      // Mock transaction response
      const mockTx = {
        hash: '0x1234567890abcdef',
        wait: jest.fn().mockResolvedValue({
          hash: '0x1234567890abcdef',
          status: 1,
          confirmations: 1
        })
      };
      mockSigner.sendTransaction.mockResolvedValueOnce(mockTx);

      const result = await ethereumProvider.sendTransaction(
        '0x9876543210987654321098765432109876543210',
        '0.1'
      );

      expect(result.success).toBe(true);
      expect(result.hash).toBe('0x1234567890abcdef');
    });

    it('should handle transaction failure', async () => {
      const error = new Error('Insufficient funds');
      mockSigner.sendTransaction.mockRejectedValueOnce(error);

      const result = await ethereumProvider.sendTransaction(
        '0x9876543210987654321098765432109876543210',
        '1000.0'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient funds');
    });
  });

  describe('ETH-HTLC-01: HTLC Contract Interactions', () => {
    let mockContract: any;

    beforeEach(() => {
      // Mock contract
      mockContract = {
        newContract: jest.fn(),
        withdraw: jest.fn(),
        refund: jest.fn(),
        getContract: jest.fn(),
        interface: {
          getEventTopic: jest.fn().mockReturnValue('0x1234567890abcdef')
        }
      };

      // Mock ethers.Contract constructor
      (ethers.Contract as jest.Mock).mockImplementation(() => mockContract);
    });

    it('should create HTLC contract successfully', async () => {
      const mockReceipt = {
        logs: [
          {
            topics: [
              '0x1234567890abcdef',
              '0xcontractid1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
            ]
          }
        ]
      };

      mockContract.newContract.mockResolvedValue({
        wait: jest.fn().mockResolvedValue(mockReceipt)
      });

      const result = await htlcService.createHTLC({
        secretHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        recipient: '0x9876543210987654321098765432109876543210',
        locktime: Math.floor(Date.now() / 1000) + 3600,
        amount: ethers.parseEther('0.1').toString(),
        signer: mockSigner,
        contractAddress: '0xabcdef1234567890abcdef1234567890abcdef12'
      });

      expect(result.success).toBe(true);
      expect(result.contractId).toBe('0xcontractid1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
    });

    it('should withdraw from HTLC successfully', async () => {
      const mockReceipt = {
        hash: '0xwithdrawtxhash1234567890abcdef1234567890abcdef1234567890abcdef'
      };

      mockContract.withdraw.mockResolvedValue({
        wait: jest.fn().mockResolvedValue(mockReceipt)
      });

      const result = await htlcService.withdrawHTLC({
        contractId: '0xcontractid1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        preimage: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        signer: mockSigner,
        contractAddress: '0xabcdef1234567890abcdef1234567890abcdef12'
      });

      expect(result.success).toBe(true);
      expect(result.txHash).toBe('0xwithdrawtxhash1234567890abcdef1234567890abcdef1234567890abcdef');
    });

    it('should get HTLC status successfully', async () => {
      const mockSwap = {
        hashlock: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        recipient: '0x9876543210987654321098765432109876543210',
        sender: '0x1234567890123456789012345678901234567890',
        locktime: BigInt(Math.floor(Date.now() / 1000) + 3600),
        amount: BigInt(ethers.parseEther('0.1')),
        withdrawn: false,
        refunded: false
      };

      mockContract.getContract.mockResolvedValue(mockSwap);

      // Mock provider for HTLC service
      const mockHTLCProvider = {
        getContract: jest.fn().mockReturnValue(mockContract)
      };

      // Create a new HTLC service instance with mocked provider
      const testHTLCService = new EthereumHTLCService(mockHTLCProvider as any);

      const status = await testHTLCService.getHTLCStatus(
        '0xcontractid1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        '0xabcdef1234567890abcdef1234567890abcdef12'
      );

      expect(status).toBeDefined();
      expect(status?.exists).toBe(true);
      expect(status?.withdrawn).toBe(false);
      expect(status?.refunded).toBe(false);
    });

    it('should generate secret and hash correctly', () => {
      const secret = htlcService.generateSecret();
      const secretHash = htlcService.generateSecretHash(secret);

      expect(secret).toBeDefined();
      expect(secretHash).toBeDefined();
      expect(secret.length).toBeGreaterThan(0);
      expect(secretHash.length).toBeGreaterThan(0);
    });

    it('should calculate contract ID correctly', () => {
      const sender = '0x1234567890123456789012345678901234567890';
      const recipient = '0x9876543210987654321098765432109876543210';
      const hashlock = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const locktime = Math.floor(Date.now() / 1000) + 3600;

      const contractId = htlcService.calculateContractId(sender, recipient, hashlock, locktime);

      expect(contractId).toBeDefined();
      expect(contractId.length).toBeGreaterThan(0);
      expect(contractId.startsWith('0x')).toBe(true);
    });
  });

  describe('ETH-MONITORING-01: Transaction Monitoring', () => {
    beforeEach(async () => {
      mockProvider.send.mockResolvedValueOnce(['0x1234567890123456789012345678901234567890']);
      mockProvider.send.mockResolvedValueOnce('0x1');
      mockSigner.getAddress.mockResolvedValue('0x1234567890123456789012345678901234567890');
      await ethereumProvider.initializeProvider();
    });

    it('should get transaction status successfully', async () => {
      const mockReceipt = {
        hash: '0x1234567890abcdef',
        status: 1,
        confirmations: 6,
        blockNumber: 12345,
        gasUsed: '21000',
        gasPrice: '20000000000'
      };

      mockProvider.getTransactionReceipt.mockResolvedValueOnce(mockReceipt);
      mockProvider.getBlockNumber.mockResolvedValueOnce(12350); // Current block

      const status = await ethereumProvider.getTransactionStatus('0x1234567890abcdef');

      expect(status.status).toBe('confirmed');
      expect(status.confirmations).toBe(6);
      expect(status.blockNumber).toBe(12345);
      expect(status.gasUsed).toBe('21000');
    });

    it('should handle pending transaction', async () => {
      mockProvider.getTransactionReceipt.mockResolvedValueOnce(null); // No receipt yet

      const status = await ethereumProvider.getTransactionStatus('0x1234567890abcdef');

      expect(status.status).toBe('pending');
      expect(status.confirmations).toBe(0);
    });

    it('should handle failed transaction', async () => {
      const mockReceipt = {
        hash: '0x1234567890abcdef',
        status: 0, // Failed
        confirmations: 1,
        blockNumber: 12345
      };

      mockProvider.getTransactionReceipt.mockResolvedValueOnce(mockReceipt);

      const status = await ethereumProvider.getTransactionStatus('0x1234567890abcdef');

      expect(status.status).toBe('failed');
      expect(status.confirmations).toBe(1);
    });
  });

  describe('ETH-EVENTS-01: Event Handling', () => {
    it('should register account change listener', () => {
      const callback = jest.fn();
      ethereumProvider.onAccountsChanged(callback);

      expect(mockEthereum.on).toHaveBeenCalledWith('accountsChanged', callback);
    });

    it('should register chain change listener', () => {
      const callback = jest.fn();
      ethereumProvider.onChainChanged(callback);

      expect(mockEthereum.on).toHaveBeenCalledWith('chainChanged', callback);
    });

    it('should remove all listeners', () => {
      ethereumProvider.removeListeners();

      expect(mockEthereum.removeAllListeners).toHaveBeenCalled();
    });
  });
}); 