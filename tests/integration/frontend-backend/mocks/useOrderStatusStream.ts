export const useOrderStatusStream = jest.fn(() => ({
  isConnected: true,
  lastUpdate: new Date().toISOString(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
})) 