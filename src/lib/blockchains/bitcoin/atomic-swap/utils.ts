// Generate a unique order ID
export function generateOrderId(): string {
  return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Generate a random secret
export function generateSecret(): string {
  return Math.random().toString(36).substr(2, 32)
}

// Create secret hash from secret
export function createSecretHash(secret: string): string {
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(secret).digest('hex')
}

// Mock transaction building functions for testing
export function buildMockRedeemTransaction(secret: string, address: string): string {
  // Create a mock transaction hex for testing
  return `mock_redeem_tx_${secret}_${address}`
}

export function buildMockRefundTransaction(address: string): string {
  // Create a mock transaction hex for testing
  return `mock_refund_tx_${address}`
} 