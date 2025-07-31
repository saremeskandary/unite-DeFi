// Cross-Chain Integration Test Suite
// This module exports all test files for cross-chain integration testing

export * from './setup'
export * from './bitcoin-ethereum-swaps.test'
export * from './transaction-monitoring.test'
export * from './secret-coordination.test'
export * from './chain-reorganization.test'
export * from './network-recovery.test'
export * from './network-status.test'

// Test categories for easy reference
export const TEST_CATEGORIES = {
  SWAPS: 'Bitcoin-Ethereum Swaps',
  MONITORING: 'Transaction Monitoring',
  SECRET_COORDINATION: 'Secret Coordination',
  REORGANIZATION: 'Chain Reorganization',
  RECOVERY: 'Network Recovery',
  STATUS: 'Network Status'
} as const

// Test descriptions for documentation
export const TEST_DESCRIPTIONS = {
  [TEST_CATEGORIES.SWAPS]: 'Tests for Bitcoin-Ethereum cross-chain swap functionality',
  [TEST_CATEGORIES.MONITORING]: 'Tests for multi-chain transaction monitoring',
  [TEST_CATEGORIES.SECRET_COORDINATION]: 'Tests for cross-chain secret revelation coordination',
  [TEST_CATEGORIES.REORGANIZATION]: 'Tests for blockchain reorganization handling',
  [TEST_CATEGORIES.RECOVERY]: 'Tests for network failure recovery mechanisms',
  [TEST_CATEGORIES.STATUS]: 'Tests for network status monitoring and health checks'
} as const 