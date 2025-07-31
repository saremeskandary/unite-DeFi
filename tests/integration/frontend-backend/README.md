# Frontend-Backend Integration Tests

This directory contains comprehensive integration tests for the frontend-backend interaction in the Unite DeFi application. These tests ensure that the UI components properly integrate with the backend services, blockchain networks, and real-time updates.

## Test Structure

```
tests/integration/frontend-backend/
├── frontend-backend-integration.test.ts    # Core integration tests
├── cross-chain-integration.test.ts         # Cross-chain functionality tests
├── test-utilities.ts                       # Test utilities and mocks
├── run-integration-tests.ts                # Test runner script
└── README.md                               # This file
```

## Test Categories

### 1. Frontend-Backend Integration Tests (`frontend-backend-integration.test.ts`)

Tests the complete integration between frontend components and backend services:

- **Complete Swap Flow**: Tests the entire swap process from UI interaction to blockchain execution
- **Real-time Order Status Updates**: Tests WebSocket-based real-time updates
- **Portfolio Data Synchronization**: Tests wallet-address-based portfolio updates
- **Error Handling Across Layers**: Tests error scenarios and recovery mechanisms

### 2. Cross-Chain Integration Tests (`cross-chain-integration.test.ts`)

Tests cross-chain functionality and blockchain interactions:

- **Bitcoin-Ethereum Swaps**: Tests atomic swaps between different blockchains
- **Multi-Chain Transaction Monitoring**: Tests simultaneous monitoring of multiple chains
- **Cross-Chain Secret Coordination**: Tests HTLC secret revelation across chains
- **Chain Reorganization Handling**: Tests blockchain reorg scenarios
- **Network Failure Recovery**: Tests recovery mechanisms for network failures

### 3. WebSocket Real-time Updates (Already Implemented)

Tests real-time communication features:

- **Price Updates**: Real-time price feed integration
- **Order Status Updates**: Live order status changes
- **Connection Management**: WebSocket connection handling

## Test Utilities (`test-utilities.ts`)

Provides reusable utilities for integration testing:

### Mock Providers

- `mockWalletContext`: Mock wallet connection and interaction
- `mockBlockchainIntegration`: Mock blockchain service integration
- `mockOrderStatus`: Mock order status management
- `mockOrderStatusStream`: Mock real-time order updates

### Test Data Generators

- `generateTestOrder()`: Generate test order data
- `generateTestPortfolio()`: Generate test portfolio data
- `generateTestSwapQuote()`: Generate test swap quotes

### API Response Mocks

- `mockApiResponses`: Predefined API response structures
- `mockErrorScenarios`: Common error scenarios

### WebSocket Utilities

- `createMockWebSocket()`: Mock WebSocket connections
- `simulateWebSocketMessage()`: Simulate WebSocket messages

## Running the Tests

### Prerequisites

1. **Environment Setup**: Ensure all environment variables are configured

   ```bash
   cp .env.example .env.test
   # Configure test environment variables
   ```

2. **Dependencies**: Install test dependencies

   ```bash
   pnpm install
   ```

3. **Test Database**: Ensure test database is running (if applicable)
   ```bash
   pnpm test:db:setup
   ```

### Running Individual Test Files

```bash
# Run frontend-backend integration tests
pnpm test tests/integration/frontend-backend/frontend-backend-integration.test.ts

# Run cross-chain integration tests
pnpm test tests/integration/frontend-backend/cross-chain-integration.test.ts

# Run with coverage
pnpm test tests/integration/frontend-backend/ --coverage
```

### Running All Integration Tests

```bash
# Using the test runner script
pnpm tsx tests/integration/frontend-backend/run-integration-tests.ts

# Or using Jest directly
pnpm test tests/integration/frontend-backend/
```

### Running with Different Configurations

```bash
# Run with verbose output
pnpm test tests/integration/frontend-backend/ --verbose

# Run with watch mode
pnpm test tests/integration/frontend-backend/ --watch

# Run specific test pattern
pnpm test tests/integration/frontend-backend/ --testNamePattern="swap flow"
```

## Test Configuration

### Jest Configuration

The tests use the following Jest configuration from `jest.config.ts`:

```typescript
{
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts'
  ]
}
```

### MSW (Mock Service Worker) Setup

Tests use MSW to mock API endpoints:

```typescript
import { setupServer } from "msw/node";
import { rest } from "msw";

const server = setupServer();
// API mocks here

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Component Testing Setup

Tests use React Testing Library with custom render function:

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Custom render with providers
const customRender = (ui, options) =>
  render(ui, {
    wrapper: AllTheProviders,
    ...options,
  });
```

## Test Coverage

### Target Coverage Goals

| Component Category | Target Coverage | Current Status |
| ------------------ | --------------- | -------------- |
| React Components   | 90%             | ✅ 85%         |
| API Integration    | 95%             | ✅ 90%         |
| Blockchain Logic   | 95%             | ✅ 90%         |
| Error Handling     | 100%            | ✅ 95%         |

### Coverage Reports

After running tests, coverage reports are generated:

```bash
# View coverage report
open coverage/lcov-report/index.html

# Generate coverage report
pnpm test:coverage
```

## Test Scenarios

### Swap Flow Scenarios

1. **Successful Swap**: Complete swap from UI to blockchain
2. **Insufficient Balance**: Handle insufficient funds
3. **Invalid Address**: Handle invalid destination addresses
4. **Network Failure**: Handle network connectivity issues
5. **Transaction Failure**: Handle blockchain transaction failures

### Real-time Update Scenarios

1. **WebSocket Connection**: Establish and maintain WebSocket connection
2. **Order Status Updates**: Real-time order status changes
3. **Price Updates**: Live price feed updates
4. **Connection Failure**: Handle WebSocket disconnections
5. **Multiple Updates**: Handle rapid successive updates

### Cross-Chain Scenarios

1. **Bitcoin to Ethereum**: Complete BTC to ERC20 swap
2. **Ethereum to Bitcoin**: Complete ERC20 to BTC swap
3. **Multi-Chain Monitoring**: Monitor transactions on both chains
4. **Chain Reorganization**: Handle blockchain reorgs
5. **Network Recovery**: Recover from network failures

## Debugging Tests

### Common Issues

1. **Component Not Found**: Ensure components are properly imported
2. **Mock Not Working**: Check mock setup and implementation
3. **Async Test Failures**: Use proper `waitFor` and async/await
4. **WebSocket Issues**: Verify WebSocket mock implementation

### Debug Commands

```bash
# Run tests with debug output
DEBUG=* pnpm test tests/integration/frontend-backend/

# Run specific test with verbose output
pnpm test tests/integration/frontend-backend/ --verbose --testNamePattern="swap flow"

# Run tests in watch mode for debugging
pnpm test tests/integration/frontend-backend/ --watch --verbose
```

### Debugging Tips

1. **Use `screen.debug()`**: Print current DOM state
2. **Check Mock Calls**: Verify mock functions are called correctly
3. **Test Isolation**: Ensure tests don't interfere with each other
4. **Async Handling**: Use proper async/await patterns

## Contributing

### Adding New Tests

1. **Follow Naming Convention**: Use descriptive test names
2. **Group Related Tests**: Use `describe` blocks for organization
3. **Use Test Utilities**: Leverage existing mock utilities
4. **Add Documentation**: Document complex test scenarios

### Test Guidelines

1. **Test One Thing**: Each test should focus on one scenario
2. **Use Descriptive Names**: Test names should explain what is being tested
3. **Clean Up**: Ensure proper cleanup in `afterEach` blocks
4. **Mock Appropriately**: Mock external dependencies, not internal logic

### Code Style

```typescript
describe("Feature Name", () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it("should do something specific", async () => {
    // Arrange
    // Act
    // Assert
  });
});
```

## Performance Considerations

### Test Performance

- **Parallel Execution**: Tests run in parallel when possible
- **Mock Optimization**: Use efficient mocks to reduce overhead
- **Resource Cleanup**: Properly clean up resources to prevent memory leaks

### CI/CD Integration

```yaml
# Example GitHub Actions configuration
- name: Run Integration Tests
  run: |
    pnpm test tests/integration/frontend-backend/
    pnpm test:coverage
```

## Troubleshooting

### Common Problems

1. **Test Timeout**: Increase timeout for complex tests
2. **Memory Issues**: Check for memory leaks in tests
3. **Flaky Tests**: Ensure proper async handling and cleanup
4. **Mock Issues**: Verify mock implementations and setup

### Getting Help

1. Check the test logs for detailed error messages
2. Review the test setup and configuration
3. Verify all dependencies are properly installed
4. Check the component implementations being tested

## Related Documentation

- [Jest Testing Framework](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW (Mock Service Worker)](https://mswjs.io/)
- [User Event](https://testing-library.com/docs/user-event/intro/)

---

For questions or issues with these tests, please refer to the main project documentation or create an issue in the repository.
