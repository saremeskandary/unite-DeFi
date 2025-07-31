# Cross-Chain Integration Tests

This directory contains comprehensive integration tests for cross-chain functionality between Bitcoin and Ethereum networks.

## Test Structure

The tests are organized into focused modules, each covering a specific aspect of cross-chain integration:

### 📁 `setup.ts`

Shared test setup, mocks, and MSW server configuration for all cross-chain integration tests.

**Key Features:**

- Common mocks for enhanced wallet, blockchain integration, and Bitcoin.js
- MSW server setup with API endpoint mocks
- Test environment setup and teardown functions
- Shared blockchain integration mock setup

### 📁 `bitcoin-ethereum-swaps.test.tsx`

Tests for Bitcoin-Ethereum cross-chain swap functionality.

**Test Cases:**

- Complete Bitcoin to Ethereum swap flow
- Complete Ethereum to Bitcoin swap flow
- Invalid Bitcoin address format handling
- Missing required parameters validation
- Minimum swap amount validation

### 📁 `transaction-monitoring.test.tsx`

Tests for multi-chain transaction monitoring and status tracking.

**Test Cases:**

- Simultaneous monitoring of both chains
- Transaction confirmation delays
- Transaction failures on one chain
- Partial confirmations
- Network timeouts
- Invalid swap ID handling
- Rapid status updates

### 📁 `secret-coordination.test.tsx`

Tests for cross-chain secret revelation and coordination.

**Test Cases:**

- Secret revelation across chains
- Secret revelation failures
- Secret format validation
- Missing secret parameters
- Network errors during revelation
- Retry mechanisms
- Concurrent revelation attempts

### 📁 `chain-reorganization.test.tsx`

Tests for blockchain reorganization handling.

**Test Cases:**

- Bitcoin chain reorganization
- Ethereum chain reorganization
- Deep reorganizations
- Reorg detection failures
- Invalid block hash parameters
- Simultaneous reorgs on both chains
- Reorgs with conflicting transactions
- Timeout scenarios

### 📁 `network-recovery.test.tsx`

Tests for network failure recovery mechanisms.

**Test Cases:**

- Bitcoin network failure recovery
- Ethereum network failure recovery
- Refund scenarios
- Claim scenarios
- Recovery failures
- Invalid recovery types
- Partial recovery scenarios
- Retry mechanisms
- Timeout scenarios
- Multiple transaction types
- Insufficient funds handling

### 📁 `network-status.test.tsx`

Tests for network status monitoring and health checks.

**Test Cases:**

- Bitcoin network status monitoring
- Ethereum network status monitoring
- Network status failures
- Network timeouts
- Health indicators
- Degraded network status
- Network congestion
- Maintenance scenarios
- Network forks
- Synchronization issues
- Parameter updates
- Statistics updates
- Alerts and warnings

## Running the Tests

### Run All Cross-Chain Integration Tests

```bash
pnpm test tests/integration/frontend-backend/cross-chain-integration
```

### Run Specific Test Categories

```bash
# Bitcoin-Ethereum Swaps
pnpm test tests/integration/frontend-backend/cross-chain-integration/bitcoin-ethereum-swaps.test.tsx

# Transaction Monitoring
pnpm test tests/integration/frontend-backend/cross-chain-integration/transaction-monitoring.test.tsx

# Secret Coordination
pnpm test tests/integration/frontend-backend/cross-chain-integration/secret-coordination.test.tsx

# Chain Reorganization
pnpm test tests/integration/frontend-backend/cross-chain-integration/chain-reorganization.test.tsx

# Network Recovery
pnpm test tests/integration/frontend-backend/cross-chain-integration/network-recovery.test.tsx

# Network Status
pnpm test tests/integration/frontend-backend/cross-chain-integration/network-status.test.tsx
```

### Run Tests with Coverage

```bash
pnpm test:coverage tests/integration/frontend-backend/cross-chain-integration
```

## Test Dependencies

### Required Components

- `BitcoinSwapInterface` - For swap functionality testing
- `BlockchainDashboard` - For monitoring and status testing

### Required Hooks

- `useBlockchainIntegration` - For blockchain interaction testing

### Required Libraries

- `@testing-library/react` - For component testing
- `@testing-library/user-event` - For user interaction testing
- `msw` - For API mocking
- `sonner` - For toast notification testing
- `bitcoinjs-lib` - For Bitcoin functionality testing

## Mock Configuration

The tests use comprehensive mocking to simulate:

- Enhanced wallet functionality
- Blockchain integration hooks
- Bitcoin.js library functions
- API endpoints for all cross-chain operations
- Network status and health checks

## Error Scenarios

Each test module includes comprehensive error handling tests for:

- Network failures
- Invalid parameters
- Timeout scenarios
- Concurrent operations
- Partial failures
- Recovery mechanisms

## Best Practices

1. **Isolation**: Each test file focuses on a specific concern
2. **Comprehensive Coverage**: Tests cover both success and failure scenarios
3. **Realistic Mocking**: API mocks simulate real-world responses
4. **Error Handling**: Extensive error scenario testing
5. **User Interactions**: Tests include realistic user interactions
6. **Async Operations**: Proper handling of asynchronous operations
7. **Timeout Handling**: Tests for network timeouts and delays

## Contributing

When adding new cross-chain integration tests:

1. Create a new test file in this directory
2. Import the shared setup from `setup.ts`
3. Follow the existing naming conventions
4. Include both success and failure scenarios
5. Add comprehensive error handling tests
6. Update this README with new test descriptions
7. Ensure all tests pass before submitting

## Troubleshooting

### Common Issues

1. **MSW Server Not Starting**: Ensure the server is properly configured in `setup.ts`
2. **Mock Not Working**: Check that mocks are properly imported and configured
3. **Async Test Failures**: Ensure proper use of `waitFor` and timeout configurations
4. **Component Not Found**: Verify that required components are properly imported

### Debug Mode

Run tests in debug mode for more detailed output:

```bash
pnpm test:debug tests/integration/frontend-backend/cross-chain-integration
```
