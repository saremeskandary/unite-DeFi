import '@testing-library/jest-dom'
import { config } from 'dotenv'

// Load environment variables for testing
config({ path: '.env.test' })

// Global test configuration
beforeAll(() => {
  // Set up Bitcoin testnet configuration
  process.env.BITCOIN_NETWORK = 'testnet'
  process.env.BITCOIN_RPC_URL = process.env.BITCOIN_RPC_URL || 'http://localhost:18332'
  process.env.BITCOIN_RPC_USER = process.env.BITCOIN_RPC_USER || 'test'
  process.env.BITCOIN_RPC_PASS = process.env.BITCOIN_RPC_PASS || 'test'
})

// Global test utilities
global.testUtils = {
  // Generate test secrets and hashes
  generateTestSecret: () => {
    const crypto = require('crypto')
    return crypto.randomBytes(32).toString('hex')
  },

  // Generate test Bitcoin addresses (mock implementation)
  generateTestAddress: () => {
    // Mock Bitcoin address for testing - generate different addresses
    const crypto = require('crypto')
    const randomBytes = crypto.randomBytes(20)
    const base58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    let num = 0n
    for (let i = 0; i < randomBytes.length; i++) {
      num = num * 256n + BigInt(randomBytes[i])
    }
    let str = ''
    while (num > 0) {
      str = base58[Number(num % 58n)] + str
      num = num / 58n
    }
    return '2' + str.padStart(33, '1') // P2SH format
  },

  // Create mock ECPair for testing
  createECPair: () => {
    // Mock ECPair implementation for testing
    const crypto = require('crypto')
    const mockPublicKey = crypto.randomBytes(33)
    return {
      publicKey: mockPublicKey,
      privateKey: crypto.randomBytes(32),
      network: { bech32: 'tb' }
    }
  },

  // Wait for Bitcoin block confirmation
  waitForConfirmation: async (txid: string, confirmations: number = 1) => {
    // Implementation for waiting for Bitcoin confirmations
    return new Promise(resolve => setTimeout(resolve, 1000 * confirmations))
  },

  // Get future block height
  getFutureBlockHeight: async (blocksInFuture: number) => {
    // Mock implementation - in a real test env, this would query the node
    return new Promise(resolve => resolve(100 + blocksInFuture));
  },

  // Mine new blocks
  mineBlocks: async (blockCount: number) => {
    // Mock implementation - in a real test env, this would trigger mining
    return new Promise(resolve => setTimeout(resolve, 100 * blockCount));
  }
}

// Extend global types
declare global {
  var testUtils: {
    generateTestSecret: () => string
    generateTestAddress: () => string
    createECPair: () => any
    waitForConfirmation: (txid: string, confirmations?: number) => Promise<void>
    getFutureBlockHeight: (blocksInFuture: number) => Promise<number>
    mineBlocks: (blockCount: number) => Promise<void>
  }
} 