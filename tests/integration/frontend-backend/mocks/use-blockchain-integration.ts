export const useBlockchainIntegration = jest.fn(() => ({
  isInitializing: false,
  status: {
    ethereum: {
      connected: true,
      account: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      chainId: 1
    },
    bitcoin: {
      connected: true,
      account: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
    }
  },
  initialize: jest.fn(),
  connectEthereum: jest.fn(),
  switchEthereumNetwork: jest.fn(),
  createSwap: jest.fn(),
  fundSwap: jest.fn(),
  redeemSwap: jest.fn(),
  refundSwap: jest.fn(),
  getBalance: jest.fn(),
  monitorSwap: jest.fn(),
})) 