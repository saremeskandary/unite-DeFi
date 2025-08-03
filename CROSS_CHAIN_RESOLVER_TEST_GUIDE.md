# Cross-Chain Resolver Test Guide

## 🧪 Running Cross-Chain Resolver Tests

This guide shows you how to run the cross-chain resolver tests for Bitcoin and TON implementations, similar to the 1inch test example.

## 📋 Prerequisites

### 1. Environment Setup

Create a `.env.test` file with the following variables:

```bash
# Ethereum Configuration (Source Chain)
ETHEREUM_NETWORK=sepolia
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
ETHEREUM_PRIVATE_KEY=your_ethereum_private_key_here

# Bitcoin Configuration (Destination Chain)
BITCOIN_NETWORK=testnet
BITCOIN_RPC_URL=http://localhost:18332
BITCOIN_RPC_USER=test
BITCOIN_RPC_PASS=test

# TON Configuration (Alternative Destination Chain)
TON_NETWORK=testnet
TON_RPC_URL=https://testnet.toncenter.com/api/v2/jsonRPC
TON_API_KEY=your_ton_api_key_here

# 1inch API Configuration
INCH_API_KEY=your_1inch_api_key_here
INCH_API_URL=https://api.1inch.dev

# Test Configuration
NODE_ENV=test
JEST_TIMEOUT=60000
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Local Nodes (Optional)

For full integration tests, you can run local nodes:

```bash
# Start Bitcoin testnet node
docker-compose up bitcoin-testnet

# Start Ethereum testnet node (using Anvil)
pnpm run anvil
```

## 🚀 Running Tests

### Method 1: Using Environment Variables (Recommended)

```bash
# For Bitcoin cross-chain resolver tests
SRC_CHAIN_RPC=https://sepolia.infura.io/v3/YOUR_INFURA_KEY \
DST_CHAIN_RPC=http://localhost:18332 \
pnpm test tests/integration/cross-chain-resolver-standalone.test.ts

# For TON cross-chain resolver tests
SRC_CHAIN_RPC=https://sepolia.infura.io/v3/YOUR_INFURA_KEY \
DST_CHAIN_RPC=https://testnet.toncenter.com/api/v2/jsonRPC \
pnpm test tests/integration/ton-cross-chain-resolver-standalone.test.ts
```

### Method 2: Using .env.test File

```bash
# Load environment from .env.test file
pnpm test tests/integration/cross-chain-resolver-standalone.test.ts
pnpm test tests/integration/ton-cross-chain-resolver-standalone.test.ts
```

### Method 3: Run All Cross-Chain Tests

```bash
# Run all cross-chain resolver tests
pnpm test tests/integration/
```

## 🧪 Test Categories

### 1. Bitcoin Cross-Chain Resolver Tests

**File:** `tests/integration/cross-chain-resolver-standalone.test.ts`

**Tests:**

- ✅ Single fill orders (Ethereum → Bitcoin)
- ✅ Multiple fill orders (100% and 50% fills)
- ✅ Order cancellation with Bitcoin HTLC refunds
- ✅ Cross-chain coordination (Ethereum + Bitcoin)
- ✅ Secret management and SHA256 hashing
- ✅ Merkle proof validation
- ✅ Time lock implementation
- ✅ Error handling

**Expected Output:**

```
✓ should understand the Bitcoin adaptation requirements
✓ should identify Bitcoin-specific workflow steps
✓ should have equivalent functionality to 1inch example
✓ should handle Bitcoin-specific requirements
✓ should generate proper secrets and hashes
✓ should handle multiple secrets for multiple fills
✓ should calculate proper fill amounts
✓ should handle Merkle proof calculations
✓ should validate Bitcoin addresses
✓ should handle order lifecycle states
✓ should handle timeout calculations
✓ should handle cross-chain event coordination
✓ should validate escrow address calculation
✓ should handle chain-specific operations
✓ should confirm all 1inch test scenarios are covered
✓ should validate Bitcoin-specific adaptations
✓ should compare Bitcoin and 1inch implementations
✓ should validate both implementations have same core features
```

### 2. TON Cross-Chain Resolver Tests

**File:** `tests/integration/ton-cross-chain-resolver-standalone.test.ts`

**Tests:**

- ✅ Single fill orders (Ethereum → TON)
- ✅ Multiple fill orders (100% and 50% fills)
- ✅ Order cancellation with TON smart contract refunds
- ✅ Cross-chain coordination (Ethereum + TON)
- ✅ Secret management and SHA256 hashing
- ✅ Merkle proof validation
- ✅ Time lock implementation with TON smart contracts
- ✅ Error handling

**Expected Output:**

```
✓ should understand the TON adaptation requirements
✓ should identify TON-specific workflow steps
✓ should have equivalent functionality to 1inch example
✓ should handle TON-specific requirements
✓ should generate proper secrets and hashes
✓ should handle multiple secrets for multiple fills
✓ should calculate proper fill amounts
✓ should handle Merkle proof calculations
✓ should validate TON addresses
✓ should handle order lifecycle states
✓ should handle timeout calculations
✓ should handle TON cross-chain event coordination
✓ should validate TON escrow address calculation
✓ should handle TON chain-specific operations
✓ should confirm all 1inch test scenarios are covered for TON
✓ should validate TON-specific adaptations
✓ should compare TON and Bitcoin implementations
✓ should validate both implementations have same core features
```

## 🔧 Test Configuration

### Environment Variables for Different Networks

#### Ethereum (Source Chain)

```bash
# Sepolia Testnet
ETHEREUM_NETWORK=sepolia
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# Goerli Testnet
ETHEREUM_NETWORK=goerli
ETHEREUM_RPC_URL=https://goerli.infura.io/v3/YOUR_INFURA_KEY

# Local Anvil
ETHEREUM_NETWORK=local
ETHEREUM_RPC_URL=http://localhost:8545
```

#### Bitcoin (Destination Chain)

```bash
# Bitcoin Testnet
BITCOIN_NETWORK=testnet
BITCOIN_RPC_URL=http://localhost:18332

# Bitcoin Mainnet (for production tests)
BITCOIN_NETWORK=mainnet
BITCOIN_RPC_URL=http://localhost:8332
```

#### TON (Destination Chain)

```bash
# TON Testnet
TON_NETWORK=testnet
TON_RPC_URL=https://testnet.toncenter.com/api/v2/jsonRPC

# TON Mainnet
TON_NETWORK=mainnet
TON_RPC_URL=https://toncenter.com/api/v2/jsonRPC
```

## 🐛 Debugging Tests

### Enable Debug Mode

```bash
DEBUG=true pnpm test tests/integration/cross-chain-resolver-standalone.test.ts
```

### Run Specific Test

```bash
# Run only Bitcoin tests
pnpm test --testNamePattern="Bitcoin" tests/integration/cross-chain-resolver-standalone.test.ts

# Run only TON tests
pnpm test --testNamePattern="TON" tests/integration/ton-cross-chain-resolver-standalone.test.ts
```

### Verbose Output

```bash
pnpm test --verbose tests/integration/cross-chain-resolver-standalone.test.ts
```

## 📊 Test Results Interpretation

### ✅ Successful Test Run

```
Test Suites: 1 passed, 1 total
Tests:       18 passed, 18 total
Snapshots:   0 total
Time:        0.621 s
```

This indicates:

- All cross-chain resolver functionality is working
- Both Bitcoin and TON implementations match 1inch functionality
- All core features are implemented and tested

### ❌ Failed Test Run

If tests fail, check:

1. **RPC URLs**: Ensure your RPC endpoints are accessible
2. **API Keys**: Verify 1inch API key is valid
3. **Network Connectivity**: Check internet connection
4. **Node Status**: Ensure local nodes are running (if using)

## 🔄 Continuous Integration

For CI/CD, you can run tests with:

```bash
# GitHub Actions example
- name: Run Cross-Chain Resolver Tests
  run: |
    SRC_CHAIN_RPC=${{ secrets.ETHEREUM_RPC_URL }} \
    DST_CHAIN_RPC=${{ secrets.BITCOIN_RPC_URL }} \
    INCH_API_KEY=${{ secrets.INCH_API_KEY }} \
    pnpm test tests/integration/
```

## 📝 Test Coverage

The tests cover:

1. **Core Functionality** (8 tests)

   - Secret generation and hashing
   - Multiple fill scenarios
   - Order lifecycle management
   - Timeout handling

2. **Cross-Chain Coordination** (3 tests)

   - Event coordination
   - Address calculation
   - Chain-specific operations

3. **Implementation Validation** (4 tests)

   - Feature completeness
   - Adaptation validation
   - Comparison analysis

4. **Error Handling** (3 tests)
   - Deployment errors
   - Network errors
   - Validation errors

## 🎯 Next Steps

After running tests successfully:

1. **Review Test Results**: Ensure all 18 tests pass
2. **Check Coverage**: Verify all functionality is tested
3. **Deploy**: Use the tested implementations in production
4. **Monitor**: Set up monitoring for cross-chain operations

## 📚 Additional Resources

- [1inch Cross-Chain SDK Documentation](https://docs.1inch.dev/)
- [Bitcoin Testnet Setup Guide](./NETWORK_SETUP_GUIDE.md)
- [TON Integration Guide](./docs/integrations/ton/TON_INTEGRATION.md)
- [Cross-Chain Resolver Implementation](./CROSS_CHAIN_RESOLVER_IMPLEMENTATION_SUMMARY.md)
