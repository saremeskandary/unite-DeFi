export const useOrderStatus = jest.fn(() => ({
  order: {
    id: 'order_123',
    status: 'pending',
    fromToken: 'USDC',
    toToken: 'BTC',
    fromAmount: '1000',
    toAmount: '0.023',
    txHash: '0x1234567890abcdef',
    timestamp: new Date().toISOString(),
  },
  isLoading: false,
  error: null,
  refetch: jest.fn(),
})) 