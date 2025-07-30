# 🧪 Bitcoin Atomic Swap Testing Structure

This directory contains a comprehensive TDD (Test-Driven Development) structure for testing Bitcoin atomic swaps integrated with 1inch Fusion+. The testing framework follows the detailed testing plan outlined in `docs/BICOIN_SIDE_TESTING_PLAN.md` and uses the official Next.js Jest configuration.

## 📁 Test Structure

```
tests/
├── setup.ts                           # Global test configuration
├── unit/                              # Unit tests for individual components
│   ├── bitcoin/
│   │   ├── htlc-script.test.ts       # HTLC script logic validation
│   │   └── transaction.test.ts        # Transaction building and validation
│   ├── resolver/
│   │   └── resolver-logic.test.ts     # Resolver profitability and bidding
│   └── example.test.ts                # Jest setup verification
├── integration/                       # Integration tests
│   ├── bitcoin/
│   │   └── network-operations.test.ts # Bitcoin network operations
│   └── end-to-end/
│       └── atomic-swap.test.ts        # Complete swap workflows
└── README.md                          # This file
```

## 🚀 Getting Started

### Prerequisites

1. **Bitcoin Testnet Setup**

   ```bash
   # Install Bitcoin Core for testnet
   # Configure testnet RPC access
   # Get testnet BTC from faucet
   ```

2. **Environment Configuration**
   ```bash
   cp env.test.example .env.test
   # Configure Bitcoin RPC credentials
   # Set up Ethereum testnet configuration
   ```

### Running Tests

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run specific test categories
npm run test:btc          # Bitcoin-specific tests
npm run test:integration  # Integration tests
npm run test:unit         # Unit tests

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🧪 Test Categories

### 1. Unit Tests (`tests/unit/`)

**Purpose**: Test individual components in isolation

#### Bitcoin HTLC Script Tests (`bitcoin/htlc-script.test.ts`)

- ✅ **BTC-HTLC-01**: Generate script with secret hash and locktime
- ✅ **BTC-HTLC-02**: Validate output script hash matches generated address
- ✅ **BTC-HTLC-03**: Script supports both redeem and refund paths
- ✅ **BTC-HTLC-04**: Compatibility with BIP199/BIP65

#### Bitcoin Transaction Tests (`bitcoin/transaction.test.ts`)

- ✅ **BTC-REDEEM-01**: Build valid redeem transaction
- ✅ **BTC-REFUND-01**: Build refund transaction after timeout
- ✅ **BTC-UTXO-02**: Fee estimation
- ✅ **BTC-UTXO-03**: Replace-by-Fee (RBF) support
- ✅ **BTC-SEC-01**: Security validation

#### Resolver Logic Tests (`resolver/resolver-logic.test.ts`)

- ✅ **RES-LOGIC-01**: Profitability calculations
- ✅ **RES-LOGIC-02**: Auction bidding strategies
- ✅ **RES-FAIL-01**: Failure handling

### 2. Integration Tests (`tests/integration/`)

**Purpose**: Test component interactions and network operations

#### Bitcoin Network Operations (`bitcoin/network-operations.test.ts`)

- ✅ **BTC-FUND-01**: Fund HTLC address on Bitcoin Testnet
- ✅ **BTC-REDEEM-01**: Build and broadcast redeem transaction
- ✅ **BTC-SECRET-01**: Monitor mempool/blockchain for HTLC redemption
- ✅ **BTC-SECRET-03**: Use secret to complete Ethereum swap
- ✅ **BTC-REFUND-02**: Broadcast refund after timeout
- ✅ **BTC-UTXO-01**: Track UTXO lifecycle
- ✅ **BTC-SEC-ADV-01**: Security and adversarial testing

#### End-to-End Atomic Swap Tests (`end-to-end/atomic-swap.test.ts`)

- ✅ **Scenario A**: User Swaps ERC20 for Native BTC
- ✅ **Scenario B**: User Swaps Native BTC for ERC20
- ✅ **RES-LOGIC-01**: Resolver profitability logic
- ✅ **RES-FAIL-01**: Resolver failure handling
- ✅ **SEC-ADV-02**: Security and adversarial testing

## 🔧 Test Utilities

### Global Test Utils (`tests/setup.ts`)

```typescript
// Generate test secrets and hashes
const secret = global.testUtils.generateTestSecret();

// Generate test Bitcoin addresses
const address = global.testUtils.generateTestAddress();

// Wait for Bitcoin block confirmation
await global.testUtils.waitForConfirmation(txid, confirmations);
```

### Test Environment

- **Network**: Bitcoin Testnet
- **Timeout**: 30 seconds for network operations
- **Coverage**: Excludes UI components and styles
- **Mocking**: Bitcoin RPC calls for unit tests
- **Jest Configuration**: Uses `next/jest` for proper Next.js integration

## 📋 Test Implementation Checklist

### Core Bitcoin HTLC Mechanics

- [ ] HTLC script generation and validation
- [ ] P2SH/P2WSH address generation
- [ ] Redeem path with correct secret
- [ ] Refund path after locktime
- [ ] Script compatibility with BIP standards

### Transaction Building

- [ ] Redeem transaction construction
- [ ] Refund transaction construction
- [ ] Fee estimation and optimization
- [ ] RBF support for stuck transactions
- [ ] Security validation (double-spend, dust)

### Network Operations

- [ ] HTLC funding on testnet
- [ ] Transaction broadcasting and confirmation
- [ ] Secret extraction from transactions
- [ ] UTXO tracking and lifecycle management
- [ ] Mempool monitoring

### End-to-End Workflows

- [ ] ERC20 → BTC swap completion
- [ ] BTC → ERC20 swap completion
- [ ] Timeout and refund scenarios
- [ ] Resolver failure handling
- [ ] Cross-chain secret coordination

### Resolver Logic

- [ ] Profitability calculations
- [ ] Auction bidding strategies
- [ ] Market condition analysis
- [ ] Failure recovery mechanisms
- [ ] Node failover handling

## 🛡️ Security Testing

### Adversarial Scenarios

- [ ] Invalid secret redemption attempts
- [ ] Early refund attempts
- [ ] Secret reuse prevention
- [ ] Double-spend protection
- [ ] Race condition handling

### Edge Cases

- [ ] Dust-level transactions
- [ ] High fee scenarios
- [ ] Network latency simulation
- [ ] Chain reorganization handling
- [ ] Malformed script detection

## 📊 Coverage Goals

| Component            | Target Coverage |
| -------------------- | --------------- |
| HTLC Script Logic    | 100%            |
| Transaction Building | 95%             |
| Network Operations   | 90%             |
| Resolver Logic       | 95%             |
| End-to-End Flows     | 85%             |

## 🔄 TDD Workflow

1. **Write Test First**: Start with failing test for new feature
2. **Implement Minimum Code**: Write code to make test pass
3. **Refactor**: Clean up code while keeping tests green
4. **Repeat**: Continue for next feature

### Example TDD Cycle

```typescript
// 1. Write failing test
describe("New HTLC Feature", () => {
  it("should handle new condition", () => {
    const result = newHtlcFeature(input);
    expect(result).toBe(expectedOutput);
  });
});

// 2. Implement minimum code
function newHtlcFeature(input) {
  return expectedOutput; // Minimal implementation
}

// 3. Add more test cases and refine implementation
```

## 🚨 Common Issues & Solutions

### Bitcoin Testnet Issues

- **No testnet BTC**: Use faucet or mine testnet blocks
- **RPC connection**: Check credentials and network settings
- **Transaction delays**: Increase test timeouts for network operations

### Test Environment Issues

- **Mock data**: Use consistent test fixtures
- **Async operations**: Properly handle promises and timeouts
- **Network isolation**: Mock external API calls in unit tests

### Next.js Jest Integration

- **Configuration**: Uses `next/jest` for proper Next.js integration
- **Transform**: Automatically handles Next.js Compiler transforms
- **Mocking**: Auto-mocks stylesheets, images, and next/font
- **Environment**: Loads `.env` files and `next.config.js`

## 📈 Continuous Integration

### GitHub Actions Workflow

```yaml
name: Bitcoin Atomic Swap Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:coverage
```

## 🤝 Contributing

1. **Follow TDD**: Write tests before implementation
2. **Maintain Coverage**: Keep test coverage above targets
3. **Document Changes**: Update this README for new test categories
4. **Review Tests**: Ensure tests are clear and maintainable

## 📚 Additional Resources

- [Next.js Jest Testing Guide](https://nextjs.org/docs/app/guides/testing/jest)
- [Bitcoin Testnet Guide](https://bitcoin.org/en/bitcoin-core/features/development)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
- [BitcoinJS Library](https://github.com/bitcoinjs/bitcoinjs-lib)
- [1inch Fusion Documentation](https://docs.1inch.io/docs/fusion/introduction)

---

**Note**: This testing structure is designed for hackathon-grade atomic swap implementation. For production use, additional security audits and comprehensive testing would be required.
