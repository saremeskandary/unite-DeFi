# End-to-End Test Suite

This directory contains comprehensive end-to-end tests for the Unite DeFi application, covering user journeys, error scenarios, and performance testing.

## 📋 Test Overview

The test suite is organized into three main categories:

### 1. User Journey Tests (`user-journey.test.ts`)

Tests the complete user experience from wallet connection to order completion:

- **Wallet Connection Flow**

  - Successful wallet connection and address display
  - Handling connection failures gracefully
  - Network switching and reconnection

- **Portfolio Viewing and Navigation**

  - Loading and displaying portfolio data
  - Navigating between portfolio sections (overview, tokens, activity)
  - Real-time data updates

- **Token Selection and Balance Checking**

  - Token selection interface
  - Balance validation and display
  - Insufficient balance warnings

- **Swap Order Creation and Execution**

  - Quote fetching and display
  - Order creation with validation
  - Transaction execution flow

- **Order Tracking and Completion**
  - Order history display
  - Real-time status updates
  - Order details and transaction information

### 2. Error Scenarios Tests (`error-scenarios.test.ts`)

Tests how the application handles various error conditions:

- **Insufficient Balance Handling**

  - Preventing swaps with insufficient funds
  - Balance warnings and validation
  - Gas fee considerations

- **Network Failure Recovery**

  - API network failures and retry mechanisms
  - Blockchain network issues
  - Fallback data and offline mode

- **Transaction Timeout Handling**

  - Transaction timeout scenarios
  - Status checking and recovery
  - User guidance for stuck transactions

- **Wallet Disconnection Scenarios**

  - Handling wallet disconnections during operations
  - State management during disconnections
  - Reconnection flows

- **API Failure Fallbacks**
  - Service unavailability handling
  - Cached data usage
  - Graceful degradation

### 3. Performance Tests (`performance.test.ts`)

Tests application performance under various conditions:

- **Large Portfolio Loading**

  - Loading portfolios with 1000+ tokens
  - Virtual scrolling implementation
  - Network latency handling

- **Multiple Concurrent Swaps**

  - Handling multiple simultaneous swap requests
  - Queue management and deduplication
  - Memory usage optimization

- **Real-time Update Performance**

  - WebSocket connection management
  - Rapid update handling (100+ updates/second)
  - Debouncing and throttling

- **Memory Usage Optimization**

  - Event listener cleanup
  - Large dataset garbage collection
  - Component re-render optimization

- **Network Latency Handling**
  - High latency scenarios (5+ seconds)
  - Request cancellation
  - Progressive loading

## 🚀 Running the Tests

### Prerequisites

1. Install dependencies:

```bash
pnpm install
```

2. Set up test environment variables:

```bash
cp .env.test.example .env.test
```

3. Ensure the development server is not running (tests use port 3000)

### Running Individual Test Categories

```bash
# Run all end-to-end tests
pnpm test:e2e

# Run specific test categories
pnpm test:e2e:user-journey
pnpm test:e2e:error-scenarios
pnpm test:e2e:performance

# Run with coverage
pnpm test:e2e --coverage
```

### Running All Tests

```bash
# Run unit, integration, and end-to-end tests
pnpm test:all

# Run with detailed reporting
pnpm test:e2e:report
```

### Test Configuration

The tests use the following configuration:

- **Test Environment**: jsdom (simulates browser environment)
- **Timeout**: 30 seconds per test
- **Mock Service Worker**: For API mocking
- **Performance Monitoring**: Built-in performance measurement

## 📊 Test Reports

After running tests, reports are generated in multiple formats:

### HTML Report

Open `test-reports/e2e-test-report.html` in your browser for a visual report with:

- Test summary and metrics
- Individual test results
- Performance data
- Environment information

### JSON Report

`test-reports/e2e-test-report.json` contains structured data for:

- CI/CD integration
- Custom reporting tools
- Data analysis

### Markdown Report

`test-reports/e2e-test-report.md` provides:

- Human-readable summary
- Test categorization
- Environment details

## 🛠️ Test Utilities

### Test Configuration (`test-config.ts`)

Provides utilities for:

- Environment variables and constants
- Mock data generators
- API response handlers
- Performance measurement
- Network simulation
- Error simulation

### Test Runner (`run-tests.ts`)

Automated test execution with:

- Parallel test execution
- Comprehensive reporting
- Performance monitoring
- Error handling and recovery

## 📝 Writing New Tests

### Test Structure

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { rest } from "msw";
import { setupServer } from "msw/node";
import { TEST_CONFIG, createApiHandlers } from "./test-config";

describe("Test Category", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  it("should perform expected behavior", async () => {
    // Test implementation
  });
});
```

### Best Practices

1. **Use Descriptive Test Names**: Test names should clearly describe the scenario being tested
2. **Mock External Dependencies**: Use MSW for API mocking and jest.mock for external libraries
3. **Test User Interactions**: Use `userEvent` for realistic user interactions
4. **Handle Async Operations**: Use `waitFor` for asynchronous operations
5. **Clean Up Resources**: Ensure proper cleanup in `afterEach` and `afterAll` hooks
6. **Performance Considerations**: Measure and assert performance metrics where relevant

### Adding New Test Categories

1. Create a new test file: `new-category.test.ts`
2. Import necessary utilities from `test-config.ts`
3. Set up MSW handlers for required APIs
4. Write comprehensive test cases
5. Add the test file to the test runner in `run-tests.ts`
6. Update this README with the new category

## 🔧 Troubleshooting

### Common Issues

1. **Test Timeouts**

   - Increase timeout in Jest configuration
   - Check for infinite loops or hanging promises
   - Verify API mocks are working correctly

2. **Memory Leaks**

   - Ensure proper cleanup in test teardown
   - Check for unmounted components
   - Monitor memory usage in performance tests

3. **Flaky Tests**

   - Add proper wait conditions
   - Use stable selectors
   - Avoid timing-dependent assertions

4. **API Mock Issues**
   - Verify MSW handlers are correctly configured
   - Check request/response matching
   - Ensure proper error simulation

### Debug Mode

Run tests in debug mode for detailed logging:

```bash
# Enable debug logging
DEBUG=* pnpm test:e2e

# Run specific test with debugging
DEBUG=* pnpm test:e2e:user-journey --verbose
```

## 📈 Performance Benchmarks

The performance tests establish the following benchmarks:

| Metric              | Target   | Current  |
| ------------------- | -------- | -------- |
| Portfolio Load Time | < 3s     | Measured |
| Swap Quote Time     | < 2s     | Measured |
| Memory Usage        | < 100MB  | Measured |
| Concurrent Requests | 5+       | Tested   |
| Real-time Updates   | 100+/sec | Tested   |

## 🤝 Contributing

When adding new tests:

1. Follow the existing test structure and patterns
2. Add comprehensive error scenarios
3. Include performance considerations
4. Update documentation
5. Ensure all tests pass before submitting

## 📚 Additional Resources

- [Testing Library Documentation](https://testing-library.com/)
- [MSW Documentation](https://mswjs.io/)
- [Jest Documentation](https://jestjs.io/)
- [Performance Testing Best Practices](https://web.dev/performance-testing/)
