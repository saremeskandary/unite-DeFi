import { SwapState } from './types'

// In-memory storage for swap state (in production, this would be a database)
const swapDatabase = new Map<string, SwapState>()
const secretDatabase = new Map<string, string>()
const usedSecrets = new Set<string>()

// Validate that secret hasn't been used before
export function validateSecretUniqueness(secret: string): boolean {
  if (usedSecrets.has(secret)) {
    return false
  }
  usedSecrets.add(secret)
  return true
}

// Store swap state
export function storeSwapState(orderId: string, swapState: SwapState): void {
  swapDatabase.set(orderId, swapState)
}

// Get swap state
export function getSwapState(orderId: string): SwapState | undefined {
  return swapDatabase.get(orderId)
}

// Store secret mapping
export function storeSecret(secretHash: string, secret: string): void {
  secretDatabase.set(secretHash, secret)
}

// Get secret by hash
export function getSecret(secretHash: string): string | undefined {
  return secretDatabase.get(secretHash)
}

// Update swap state
export function updateSwapState(orderId: string, updates: Partial<SwapState>): void {
  const existingState = swapDatabase.get(orderId)
  if (existingState) {
    const updatedState = { ...existingState, ...updates }
    swapDatabase.set(orderId, updatedState)
  }
}

// Utility function to reset state for testing
export function resetSwapState(): void {
  swapDatabase.clear()
  secretDatabase.clear()
  usedSecrets.clear()
} 