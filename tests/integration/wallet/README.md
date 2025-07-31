# Wallet Integration Tests

This directory contains comprehensive integration tests for wallet functionality in the Unite DeFi application. These tests cover all aspects of wallet integration including connection flows, balance fetching, transaction signing, multi-chain support, and error handling.

## Test Structure

### 1. `wallet-integration.test.ts`

Core wallet integration tests that cover:

- **Wallet Connection Flows**

  - MetaMask connection success/failure
  - Coinbase Wallet connection
  - WalletConnect integration
  - Unsupported wallet handling
  - Disconnection flows

- **Balance Fetching**

  - Native token balance retrieval
  - ERC-20 token balance fetching
  - Balance refresh functionality
  - Error handling for balance fetching

- **Transaction Signing**

  - Transaction signing success
  - User rejection handling
  - Signature validation
  - Gas estimation

- **Multi-Chain Support**

  - Ethereum mainnet support
  - Sepolia testnet support
  - Goerli testnet support
  - Unsupported network handling
  - Network switching

- **Error Handling for Wallet Failures**
  - MetaMask not installed
  - No accounts found
  - Network errors
  - Connection timeouts
  - Disconnection errors
  - Provider availability detection

### 2. `wallet-component.test.tsx`

Component-level integration tests for:

- **Wallet Connection Component**
  - UI state management
  - Button interactions
  - Loading states
  - Error display
  - Address copying
  - Explorer links
  - Token balance display
  - Network switching UI

### 3. `wallet-e2e.test.ts`

End-to-end workflow tests covering:

- **Complete Wallet Connection Workflow**

  - Full connection flow from UI to state
  - Connection failure and retry
  - Network switching during connection

- **Balance and Token Management Workflow**

  - Token balance loading and display
  - Balance refresh workflows
  - Portfolio value calculation

- **Transaction Signing Workflow**

  - Complete transaction signing process
  - Failure and retry scenarios
  - Signature validation

- **Multi-Chain Support Workflow**

  - Network switching between chains
  - Unsupported network handling
  - Chain change detection

- **Error Recovery Workflow**

  - Network error recovery
  - Disconnection and reconnection
  - Error state management

- **Real-World User Scenarios**
  - Account switching in MetaMask
  - Network switching in MetaMask
  - MetaMask lock/unlock handling

## Running the Tests

### Prerequisites

1. Ensure all dependencies are installed:

   ```bash
   pnpm install
   ```

2. Set up test environment variables:
   ```bash
   cp .env.test.example .env.test
   ```

### Running All Wallet Tests

Use the provided test runner script:

```bash
./tests/integration/wallet/run-wallet-tests.sh
```

### Running Individual Test Suites

```bash
# Core wallet integration tests
pnpm test tests/integration/wallet/wallet-integration.test.ts

# Component tests
pnpm test tests/integration/wallet/wallet-component.test.tsx

# End-to-end tests
pnpm test tests/integration/wallet/wallet-e2e.test.ts
```

### Running Specific Test Categories

```bash
# Test only connection flows
pnpm test --testNamePattern="Wallet Connection Flows"

# Test only balance fetching
pnpm test --testNamePattern="Balance Fetching"

# Test only transaction signing
pnpm test --testNamePattern="Transaction Signing"

# Test only multi-chain support
pnpm test --testNamePattern="Multi-Chain Support"

# Test only error handling
pnpm test --testNamePattern="Error Handling for Wallet Failures"
```

## Test Configuration

### Environment Variables

The tests use the following environment variables:

- `NODE_ENV=test` - Sets the environment to test mode
- `TEST_WALLET_INTEGRATION=true` - Enables wallet integration tests
- `JEST_TIMEOUT=30000` - Sets test timeout to 30 seconds for blockchain operations

### Mock Configuration

The tests use comprehensive mocking to simulate:

- **Window.ethereum** - MetaMask and other wallet providers
- **Ethers.js** - Blockchain interactions
- **Clipboard API** - Address copying functionality
- **Toast notifications** - User feedback
- **Network requests** - RPC calls and API interactions

### Test Data

The tests use realistic test data including:

- Valid Ethereum addresses
- Realistic token balances
- Common ERC-20 tokens (USDC, WETH, DAI, etc.)
- Multiple network configurations
- Various error scenarios

## Test Coverage

The wallet integration tests provide comprehensive coverage of:

### Core Functionality

- ✅ Wallet connection and disconnection
- ✅ Balance fetching and display
- ✅ Transaction signing and validation
- ✅ Multi-chain support and switching
- ✅ Error handling and recovery

### User Experience

- ✅ UI state management
- ✅ Loading and error states
- ✅ User interactions and feedback
- ✅ Real-world usage scenarios

### Edge Cases

- ✅ Network failures and recovery
- ✅ User rejections and retries
- ✅ Unsupported networks and wallets
- ✅ Timeout and error scenarios

## Expected Test Results

### Successful Test Run

When all tests pass, you should see output similar to:

```
🚀 Starting Wallet Integration Tests...
=====================================

📋 Running wallet integration tests...
PASS tests/integration/wallet/wallet-integration.test.ts
PASS tests/integration/wallet/wallet-component.test.tsx
PASS tests/integration/wallet/wallet-e2e.test.ts

✅ Wallet Integration Tests Completed!
🎉 All wallet integration tests passed!
```

### Coverage Report

The tests generate a coverage report showing:

- **Statements**: Percentage of code statements executed
- **Branches**: Percentage of conditional branches tested
- **Functions**: Percentage of functions called
- **Lines**: Percentage of lines executed

### Test Results

Detailed test results are saved to:

- `coverage/wallet-integration/test-results.json` - JSON format test results
- `coverage/wallet-integration/lcov-report/` - HTML coverage report

## Troubleshooting

### Common Issues

1. **Test Timeout Errors**

   - Increase `JEST_TIMEOUT` in jest.config.ts
   - Check network connectivity for blockchain operations

2. **Mock Configuration Errors**

   - Ensure all mocks are properly configured
   - Check that window.ethereum is properly mocked

3. **Environment Variable Issues**

   - Verify .env.test file exists and is properly configured
   - Check that NODE_ENV is set to 'test'

4. **Dependency Issues**
   - Run `pnpm install` to ensure all dependencies are installed
   - Clear node_modules and reinstall if necessary

### Debug Mode

To run tests in debug mode with more verbose output:

```bash
pnpm test --verbose --detectOpenHandles tests/integration/wallet/
```

### Individual Test Debugging

To debug a specific test:

```bash
pnpm test --testNamePattern="should connect to MetaMask successfully" --verbose
```

## Contributing

When adding new wallet integration tests:

1. **Follow the existing test structure** - Use the established patterns and naming conventions
2. **Add comprehensive mocking** - Ensure all external dependencies are properly mocked
3. **Test both success and failure scenarios** - Cover edge cases and error conditions
4. **Update this documentation** - Document new test categories and scenarios
5. **Maintain test coverage** - Ensure new functionality is adequately tested

## Integration with CI/CD

These tests are designed to run in CI/CD pipelines:

- **GitHub Actions**: Tests run on every pull request
- **Coverage Reporting**: Results are published to coverage services
- **Failure Reporting**: Detailed error messages for debugging
- **Performance Monitoring**: Test execution time tracking

## Related Documentation

- [Wallet Implementation Guide](../docs/wallet-implementation.md)
- [Testing Best Practices](../docs/testing-best-practices.md)
- [Error Handling Guide](../docs/error-handling.md)
- [Multi-Chain Support](../docs/multi-chain-support.md)
