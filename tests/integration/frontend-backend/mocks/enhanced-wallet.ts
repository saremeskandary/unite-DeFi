export const enhancedWallet = {
  isConnected: jest.fn(() => true),
  getCurrentAddress: jest.fn(() => '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'),
  onAccountChange: jest.fn(),
  onChainChange: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  signTransaction: jest.fn(),
  sendTransaction: jest.fn(),
  switchNetwork: jest.fn(),
} 