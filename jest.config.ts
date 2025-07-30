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
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  // Custom test timeout for Bitcoin network operations
  testTimeout: 30000,
  // Custom test patterns for our Bitcoin atomic swap tests
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
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
  },
  // Transform ignore patterns to handle ES modules
  transformIgnorePatterns: [
    'node_modules/(?!(tiny-secp256k1|ecpair|uint8array-tools)/)'
  ],
  // Extensions to treat as ES modules
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  // Verbose output for debugging
  verbose: true,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config) 