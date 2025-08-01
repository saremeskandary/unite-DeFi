import { EnhancedWalletService } from './enhanced-wallet';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.ethereum
const ethereumMock = {
  request: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
  isMetaMask: true,
};

Object.defineProperty(window, 'ethereum', {
  value: ethereumMock,
  writable: true,
});

describe('EnhancedWalletService - Persistence', () => {
  let walletService: EnhancedWalletService;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    ethereumMock.request.mockClear();

    // Create a new instance for each test
    walletService = new EnhancedWalletService();
  });

  describe('Connection State Persistence', () => {
    it('should save connection state when connecting', async () => {
      const mockAddress = '0x1234567890123456789012345678901234567890';
      const mockChainId = 1;

      // Mock successful connection
      ethereumMock.request
        .mockResolvedValueOnce([mockAddress]) // eth_requestAccounts
        .mockResolvedValueOnce('0x1'); // eth_chainId

      // Mock getNetwork to return chainId 1
      const mockProvider = {
        send: ethereumMock.request,
        getSigner: jest.fn().mockResolvedValue({}),
        getNetwork: jest.fn().mockResolvedValue({ chainId: BigInt(1) }),
        getBalance: jest.fn().mockResolvedValue(BigInt(0)),
      };

      // Mock the provider
      (walletService as any).provider = mockProvider;

      await walletService.connect();

      // Verify that connection state was saved
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'unite-defi-wallet-connection',
        expect.stringContaining(mockAddress)
      );

      const savedState = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedState.address).toBe(mockAddress);
      expect(savedState.chainId).toBe(mockChainId);
      expect(savedState.timestamp).toBeDefined();
    });

    it('should clear connection state when disconnecting', () => {
      // Set up a connected state
      (walletService as any).currentAddress = '0x1234567890123456789012345678901234567890';
      (walletService as any).currentChainId = 1;

      walletService.disconnect();

      // Verify that connection state was cleared
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('unite-defi-wallet-connection');
      expect(walletService.isConnected()).toBe(false);
    });

    it('should save connection state when account changes', () => {
      const mockAddress = '0x1234567890123456789012345678901234567890';

      // Set up a connected state
      (walletService as any).currentAddress = mockAddress;
      (walletService as any).currentChainId = 1;

      // Simulate account change
      const mockCallback = jest.fn();
      walletService.onAccountChange(mockCallback);

      // Trigger the account change event
      const ethereumOnCall = ethereumMock.on.mock.calls.find(call => call[0] === 'accountsChanged');
      if (ethereumOnCall) {
        const callback = ethereumOnCall[1];
        callback([mockAddress]);
      }

      // Verify that connection state was saved
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'unite-defi-wallet-connection',
        expect.stringContaining(mockAddress)
      );
    });

    it('should save connection state when chain changes', () => {
      const mockChainId = 5; // Goerli

      // Set up a connected state
      (walletService as any).currentAddress = '0x1234567890123456789012345678901234567890';
      (walletService as any).currentChainId = 1;

      // Simulate chain change
      const mockCallback = jest.fn();
      walletService.onChainChange(mockCallback);

      // Trigger the chain change event
      const ethereumOnCall = ethereumMock.on.mock.calls.find(call => call[0] === 'chainChanged');
      if (ethereumOnCall) {
        const callback = ethereumOnCall[1];
        callback('0x5'); // Goerli chain ID
      }

      // Verify that connection state was saved
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'unite-defi-wallet-connection',
        expect.stringContaining('"chainId":5')
      );
    });
  });

  describe('Storage Key Management', () => {
    it('should use the correct storage key', () => {
      expect((walletService as any).STORAGE_KEY).toBe('unite-defi-wallet-connection');
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw an error
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      // Set up a connected state
      (walletService as any).currentAddress = '0x1234567890123456789012345678901234567890';
      (walletService as any).currentChainId = 1;

      // This should not throw an error
      expect(() => {
        (walletService as any).saveConnectionState();
      }).not.toThrow();
    });

    it('should handle localStorage clear errors gracefully', () => {
      // Mock localStorage to throw an error
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      // This should not throw an error
      expect(() => {
        (walletService as any).clearConnectionState();
      }).not.toThrow();
    });

    it('should not cause timeout during restoration', async () => {
      const mockAddress = '0x1234567890123456789012345678901234567890';
      const mockChainId = 1;
      const mockTimestamp = Date.now();

      // Mock saved connection state
      const savedState = {
        address: mockAddress,
        chainId: mockChainId,
        timestamp: mockTimestamp,
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState));

      // Mock that wallet check times out
      ethereumMock.request.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Wallet check timeout')), 100);
        });
      });

      // Create a new instance - this should not hang
      const newWalletService = new EnhancedWalletService();

      // Wait a reasonable amount of time
      await new Promise(resolve => setTimeout(resolve, 200));

      // The service should still be functional even if restoration fails
      expect(newWalletService.isConnected()).toBe(false);
      expect(newWalletService.getCurrentAddress()).toBe(null);
    });
  });
}); 