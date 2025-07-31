import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  // Add more setup options before each test is run
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.ts',
    '<rootDir>/tests/integration/frontend-backend/setup.ts'
  ],
  // Custom test timeout for Bitcoin network operations
  testTimeout: 30000,
  // Custom test patterns for our Bitcoin atomic swap tests
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/__tests__/**/*.tsx',
    '**/?(*.)+(spec|test).ts',
    '**/?(*.)+(spec|test).tsx'
  ],
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/app/**/*.ts',
    '!src/components/**/*.ts',
    '!src/styles/**/*.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // Module name mapping for absolute imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@web3icons/react$': '<rootDir>/tests/mocks/web3icons-react-mock.tsx',
    '^@/components/BitcoinSwapInterface$': '<rootDir>/tests/integration/frontend-backend/mocks/BitcoinSwapInterface.tsx',
    '^@/components/swap/swap-interface$': '<rootDir>/tests/integration/frontend-backend/mocks/swap-interface.tsx',
    '^@/app/portfolio/page$': '<rootDir>/tests/integration/frontend-backend/mocks/portfolio-page.tsx',
    '^@/app/orders/page$': '<rootDir>/tests/integration/frontend-backend/mocks/orders-page.tsx',
    '^@/lib/enhanced-wallet$': '<rootDir>/tests/integration/frontend-backend/mocks/enhanced-wallet.ts',
    '^@/hooks/use-blockchain-integration$': '<rootDir>/tests/integration/frontend-backend/mocks/use-blockchain-integration.ts',
    '^@/hooks/useOrderStatus$': '<rootDir>/tests/integration/frontend-backend/mocks/useOrderStatus.ts',
    '^@/hooks/useOrderStatusStream$': '<rootDir>/tests/integration/frontend-backend/mocks/useOrderStatusStream.ts',
    '^@/components/blockchain/blockchain-dashboard$': '<rootDir>/src/components/blockchain/blockchain-dashboard.tsx',
  },
  // Transform ignore patterns to handle ES modules
  transformIgnorePatterns: [
    'node_modules/(?!(tiny-secp256k1|ecpair|uint8array-tools|@web3icons)/)'
  ],
  // Extensions to treat as ES modules
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  // Verbose output for debugging
  verbose: true,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config) 