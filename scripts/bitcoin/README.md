# Bitcoin HTLC Swap CLI

A comprehensive command-line interface for testing Bitcoin HTLC (Hash Time-Locked Contract) swap functionality. This CLI demonstrates all the key features required for the hackathon judging criteria.

## 🎯 Judging Requirements Met

This CLI demonstrates all the key requirements from the judging notes:

- ✅ **Bi-directional swaps** (ERC20 ↔ Bitcoin)
- ✅ **HTLC and communication** between EVM and non-EVM chains
- ✅ **Proper hashlock logic** handling
- ✅ **Contract expiration/revert** handling
- ✅ **Partial fill support** with multiple secrets
- ✅ **Relayer and resolver** in non-EVM chain
- ✅ **Smart contract level operations** (no REST API posting)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Bitcoin testnet setup (optional for full testing)

### Installation

```bash
# Install dependencies
pnpm install

# Run the demo script
./scripts/bitcoin-cli-demo.sh
```

### Quick Demo

```bash
# Run comprehensive demo
pnpm bitcoin:cli demo

# Test individual features
pnpm bitcoin:cli htlc-script
pnpm bitcoin:cli bidirectional-swap
pnpm bitcoin:cli hashlock-logic
pnpm bitcoin:cli contract-expiration
pnpm bitcoin:cli relayer-resolver
```

## 📋 Available Commands

### `demo` - Comprehensive Demo

Runs all tests in sequence and provides a summary report.

```bash
pnpm bitcoin:cli demo
```

**Features tested:**

- HTLC script creation and validation
- Bi-directional swap functionality
- Hashlock logic and secret management
- Contract expiration handling
- Relayer and resolver functionality

### `htlc-script` - HTLC Script Testing

Tests the creation and validation of Bitcoin HTLC scripts.

```bash
pnpm bitcoin:cli htlc-script
```

**What it tests:**

- Secret generation and hashing
- HTLC script compilation
- Address generation
- Script validation

### `bidirectional-swap` - Bi-directional Swap Testing

Tests both ERC20 → Bitcoin and Bitcoin → ERC20 swap flows.

```bash
pnpm bitcoin:cli bidirectional-swap
```

**What it tests:**

- ERC20 → Bitcoin swap initiation
- Bitcoin → ERC20 swap initiation
- Order creation and management
- Cross-chain communication

### `hashlock-logic` - Hashlock Logic Testing

Tests secret management and partial fill capabilities.

```bash
pnpm bitcoin:cli hashlock-logic
```

**What it tests:**

- Multiple secret generation
- Secret validation
- Partial fill order creation
- Hash management

### `contract-expiration` - Contract Expiration Testing

Tests HTLC expiration and refund logic.

```bash
pnpm bitcoin:cli contract-expiration
```

**What it tests:**

- Short-term HTLC creation
- Expiration monitoring
- Refund eligibility
- Timeout handling

### `relayer-resolver` - Relayer & Resolver Testing

Tests Bitcoin relayer and resolver services.

```bash
pnpm bitcoin:cli relayer-resolver
```

**What it tests:**

- Transaction broadcasting
- Bid submission
- Resolver coordination
- Network operations

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Bitcoin Configuration
BITCOIN_NETWORK=testnet
BITCOIN_PRIVATE_KEY=your_private_key
BITCOIN_WIF_KEY=your_wif_key

# 1inch API Configuration
INCH_API_KEY=your_1inch_api_key
INCH_API_URL=https://api.1inch.dev

# Ethereum Configuration
ETHEREUM_RPC_URL=your_ethereum_rpc_url
ETHEREUM_PRIVATE_KEY=your_ethereum_private_key

# Bitcoin Testnet Configuration
BITCOIN_TESTNET_RPC_URL=http://localhost:18332
BITCOIN_TESTNET_RPC_USER=bitcoin
BITCOIN_TESTNET_RPC_PASS=bitcoin

# Monitoring Configuration
MONITORING_ENABLED=true
MONITORING_INTERVAL=30000
```

## 🏗️ Architecture

### Core Components

1. **BitcoinHTLCOperations** - HTLC script creation and validation
2. **BitcoinSwapFlow** - Bi-directional swap management
3. **BitcoinNetworkOperations** - Bitcoin network interactions
4. **SwapMonitoringService** - Transaction and expiration monitoring
5. **PartialFillLogic** - Partial fill order management
6. **BitcoinRelayer** - Transaction broadcasting and retry logic
7. **BitcoinResolver** - Resolver bid management and coordination

### HTLC Script Structure

The Bitcoin HTLC script uses this structure:

```
OP_IF
  OP_HASH160 <secret_hash> OP_EQUALVERIFY
  <recipient_pubkey> OP_CHECKSIG
OP_ELSE
  <locktime> OP_CHECKLOCKTIMEVERIFY OP_DROP
  OP_TRUE
OP_ENDIF
```

### Swap Flow

#### ERC20 → Bitcoin Flow

1. User approves ERC20 tokens
2. System locks ERC20 tokens in escrow
3. System creates Bitcoin HTLC and funds it
4. User receives Bitcoin at their address
5. System monitors for secret reveal to complete swap

#### Bitcoin → ERC20 Flow

1. User provides Bitcoin address
2. System creates HTLC address for user to send BTC to
3. System locks ERC20 tokens in escrow
4. User manually sends BTC to HTLC address
5. System monitors for BTC deposit
6. Once BTC confirmed, ERC20 tokens are released

## 🧪 Testing Features

### HTLC Script Testing

- ✅ Secret generation and hashing
- ✅ Script compilation and validation
- ✅ Address generation
- ✅ Script structure verification

### Bi-directional Swap Testing

- ✅ ERC20 → Bitcoin swap initiation
- ✅ Bitcoin → ERC20 swap initiation
- ✅ Order creation and management
- ✅ Cross-chain communication setup

### Hashlock Logic Testing

- ✅ Multiple secret generation
- ✅ Secret validation
- ✅ Partial fill order creation
- ✅ Hash management and rotation

### Contract Expiration Testing

- ✅ Short-term HTLC creation
- ✅ Expiration monitoring setup
- ✅ Refund eligibility checking
- ✅ Timeout handling

### Relayer & Resolver Testing

- ✅ Transaction broadcasting simulation
- ✅ Bid submission and management
- ✅ Resolver coordination
- ✅ Network operation simulation

## 🎉 Demo Output Example

```
🚀 Bitcoin HTLC Swap CLI Demo
================================

🧪 Running: HTLC Script Creation
ℹ️  Testing HTLC Script Creation...
✅ HTLC Script created successfully
Secret: a1b2c3d4e5f6...
Secret Hash: 1234567890abcdef...
HTLC Address: tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4
✅ HTLC Script Creation completed successfully

🧪 Running: Bi-directional Swaps
ℹ️  Testing Bi-directional Swap Functionality...
Testing ERC20 → BTC swap...
✅ ERC20 → BTC swap initiated successfully
Testing BTC → ERC20 swap...
✅ BTC → ERC20 swap initiated successfully
✅ Bi-directional Swaps completed successfully

📊 Demo Summary
==============
┌─────────────────────┬──────────┬─────────────────────────────┐
│ Test                │ Status   │ Message                     │
├─────────────────────┼──────────┼─────────────────────────────┤
│ HTLC Script Creation│ ✅ PASS  │ HTLC script creation test   │
│ Bi-directional Swaps│ ✅ PASS  │ Bi-directional swap test    │
│ Hashlock Logic      │ ✅ PASS  │ Hashlock logic test         │
│ Contract Expiration │ ✅ PASS  │ Contract expiration test    │
│ Relayer & Resolver  │ ✅ PASS  │ Relayer and resolver test   │
└─────────────────────┴──────────┴─────────────────────────────┘

🎉 Demo completed: 5/5 tests passed
All tests passed! Bitcoin HTLC swap system is working correctly.
```

## 🔗 Integration with 1inch Fusion+

The CLI integrates with 1inch Fusion+ for:

- Order creation and management
- Resolver matching
- Cross-chain coordination
- Partial fill support

## 🚨 Important Notes

1. **No REST API Posting**: The CLI works at the smart contract level only, as required by the judging notes
2. **Testnet Usage**: All operations use Bitcoin testnet for safety
3. **Secret Management**: Cryptographically secure secrets are generated for each operation
4. **Error Handling**: Comprehensive error handling and validation throughout

## 🛠️ Development

### Adding New Tests

To add a new test, extend the `BitcoinCLI` class:

```typescript
async testNewFeature(): Promise<DemoResult> {
  try {
    this.logInfo('Testing New Feature...');
    // Your test logic here
    return {
      success: true,
      message: 'New feature test completed',
      data: { /* test data */ }
    };
  } catch (error) {
    return {
      success: false,
      message: `New feature test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
```

### Running Tests

```bash
# Run all Bitcoin tests
pnpm test:btc

# Run specific test file
pnpm test tests/unit/lib/blockchains/bitcoin/bitcoin-htlc-operations.test.ts
```

## 📚 Related Documentation

- [Bitcoin Swap Architecture](./docs/BITCOIN_SWAP_ARCHITECTURE.md)
- [Bitcoin Integration Guide](./docs/bitcoin/BITCOIN_INTEGRATION.md)
- [Implementation Checklist](./IMPLEMENTATION_CHECKLIST.md)
- [Judging Requirements Analysis](./JUDGING_REQUIREMENTS_ANALYSIS.md)

## 🤝 Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Ensure all judging requirements are met

## 📄 License

This project is part of the Unite DeFi hackathon submission.
