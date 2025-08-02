# 🧪 Frontend Testing Guide

This guide explains how to use the comprehensive test infrastructure in your frontend development workflow for the Unite DeFi Bitcoin atomic swap application.

## 📋 Table of Contents

- [Overview](#overview)
- [Test Infrastructure](#test-infrastructure)
- [Running Tests](#running-tests)
- [Writing Frontend Tests](#writing-frontend-tests)
- [Using Test Utilities](#using-test-utilities)
- [Integration with Development](#integration-with-development)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

The project includes a comprehensive testing framework designed for Bitcoin atomic swaps with 1inch Fusion+. The test infrastructure supports:

- **Unit Tests**: Individual component and logic testing
- **Integration Tests**: Network operations and blockchain interactions
- **End-to-End Tests**: Complete swap workflows
- **Frontend Component Tests**: React component testing with Testing Library

## 🏗️ Test Infrastructure

### Test Structure

```
tests/
├── setup.ts                           # Global test configuration & utilities
├── unit/                              # Unit tests
│   ├── components/                    # React component tests
│   │   └── partial-fill-interface.test.tsx
│   ├── blockchains/                   # Blockchain logic tests
│   │   ├── bitcoin/                   # Bitcoin-specific tests
│   │   └── tron/                      # Tron-specific tests
│   └── resolver/                      # Resolver logic tests
├── integration/                       # Integration tests
│   ├── bitcoin/                       # Bitcoin network operations
│   └── end-to-end/                    # Complete workflows
└── README.md                          # Detailed test documentation
```

### Key Features

- **Jest + Next.js Integration**: Uses `next/jest` for proper Next.js support
- **Testing Library**: React component testing with user-centric approach
- **Global Test Utilities**: Shared utilities for Bitcoin operations
- **Environment Configuration**: Separate test environment setup
- **Coverage Reporting**: Comprehensive coverage analysis

## 🚀 Running Tests

### Basic Commands

```bash
# Install dependencies (if using pnpm)
pnpm install

# Run all tests
pnpm test

# Run specific test categories
pnpm test:unit          # Unit tests only
pnpm test:integration   # Integration tests only
pnpm test:btc           # Bitcoin-specific tests

# Development workflow
pnpm test:watch         # Watch mode for development
pnpm test:coverage      # Generate coverage report
```

### Test Scripts

| Script             | Description                |
| ------------------ | -------------------------- |
| `test`             | Run all tests              |
| `test:watch`       | Run tests in watch mode    |
| `test:coverage`    | Generate coverage report   |
| `test:unit`        | Run unit tests only        |
| `test:integration` | Run integration tests only |
| `test:btc`         | Run Bitcoin-specific tests |

## ✍️ Writing Frontend Tests

### React Component Testing

The project uses React Testing Library for component testing. Here's how to write tests for your frontend components:

#### Basic Component Test

```typescript
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { YourComponent } from "@/components/YourComponent";

describe("YourComponent", () => {
  it("should render correctly", () => {
    render(<YourComponent />);
    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });

  it("should handle user interactions", () => {
    render(<YourComponent />);

    const button = screen.getByRole("button", { name: "Click Me" });
    fireEvent.click(button);

    expect(screen.getByText("Clicked!")).toBeInTheDocument();
  });
});
```

#### Testing with Props and State

```typescript
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SwapInterface } from "@/components/swap/SwapInterface";

describe("SwapInterface", () => {
  const mockOnSwap = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should handle swap amount changes", async () => {
    render(<SwapInterface onSwap={mockOnSwap} />);

    const amountInput = screen.getByLabelText("Amount");
    fireEvent.change(amountInput, { target: { value: "1.5" } });

    await waitFor(() => {
      expect(amountInput).toHaveValue("1.5");
    });
  });

  it("should validate input before allowing swap", () => {
    render(<SwapInterface onSwap={mockOnSwap} />);

    const swapButton = screen.getByRole("button", { name: "Swap" });
    expect(swapButton).toBeDisabled(); // Should be disabled initially

    // Fill required fields
    fireEvent.change(screen.getByLabelText("Amount"), {
      target: { value: "1.0" },
    });
    fireEvent.change(screen.getByLabelText("To Address"), {
      target: { value: "0x123..." },
    });

    expect(swapButton).toBeEnabled();
  });
});
```

### Testing with Mocked Dependencies

```typescript
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PriceOracle } from "@/components/PriceOracle";

// Mock external dependencies
jest.mock("@/lib/price-oracle", () => ({
  getBitcoinPrice: jest.fn().mockResolvedValue(45000),
  getEthereumPrice: jest.fn().mockResolvedValue(3000),
}));

jest.mock("@/lib/blockchains/bitcoin/partial-fill-logic", () => ({
  PartialFillLogic: jest.fn().mockImplementation(() => ({
    createPartialFillOrder: jest.fn().mockResolvedValue({
      orderId: "test-order-123",
      status: "pending",
    }),
  })),
}));

describe("PriceOracle Component", () => {
  it("should display current prices", async () => {
    render(<PriceOracle />);

    await waitFor(() => {
      expect(screen.getByText("$45,000")).toBeInTheDocument();
      expect(screen.getByText("$3,000")).toBeInTheDocument();
    });
  });
});
```

## 🛠️ Using Test Utilities

### Global Test Utilities

The project provides global test utilities in `tests/setup.ts`:

```typescript
// Generate test secrets for HTLC operations
const secret = global.testUtils.generateTestSecret();

// Generate test Bitcoin addresses
const address = global.testUtils.generateTestAddress();

// Create mock key pairs
const keyPair = global.testUtils.createECPair();

// Wait for blockchain confirmations (mocked)
await global.testUtils.waitForConfirmation("txid", 3);

// Get future block heights
const futureHeight = await global.testUtils.getFutureBlockHeight(10);

// Mine blocks (mocked)
await global.testUtils.mineBlocks(5);
```

### Custom Test Utilities

Create custom utilities for your frontend tests:

```typescript
// tests/utils/frontend-test-utils.ts
import { render, RenderOptions } from "@testing-library/react";
import { ThemeProvider } from "@/components/theme-provider";

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <ThemeProvider>{children}</ThemeProvider>;
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from "@testing-library/react";
export { customRender as render };
```

### Testing with Real Data

```typescript
import { global.testUtils } from '@/tests/setup';

describe('Swap with Real Data', () => {
  it('should handle real Bitcoin addresses', () => {
    const testAddress = global.testUtils.generateTestAddress();
    const testSecret = global.testUtils.generateTestSecret();

    // Test your component with real data
    render(<SwapComponent address={testAddress} secret={testSecret} />);

    expect(screen.getByText(testAddress)).toBeInTheDocument();
  });
});
```

## 🔄 Integration with Development

### TDD Workflow for Frontend

1. **Write Test First**

   ```typescript
   describe("NewFeature", () => {
     it("should display user input", () => {
       render(<NewFeature />);
       expect(screen.getByLabelText("User Input")).toBeInTheDocument();
     });
   });
   ```

2. **Implement Component**

   ```typescript
   export function NewFeature() {
     return (
       <div>
         <label htmlFor="user-input">User Input</label>
         <input id="user-input" />
       </div>
     );
   }
   ```

3. **Refactor and Enhance**
   ```typescript
   // Add more tests and improve implementation
   it("should validate input", () => {
     render(<NewFeature />);
     const input = screen.getByLabelText("User Input");
     fireEvent.change(input, { target: { value: "invalid" } });
     expect(screen.getByText("Invalid input")).toBeInTheDocument();
   });
   ```

### Continuous Integration

The tests are designed to run in CI/CD pipelines:

```yaml
# .github/workflows/test.yml
name: Frontend Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: "18"
      - run: pnpm install
      - run: pnpm test:unit
      - run: pnpm test:coverage
```

## 📊 Test Coverage

### Coverage Goals

| Component Type    | Target Coverage |
| ----------------- | --------------- |
| React Components  | 90%             |
| Utility Functions | 95%             |
| Integration Logic | 85%             |
| Error Handling    | 100%            |

### Coverage Commands

```bash
# Generate coverage report
pnpm test:coverage

# View coverage in browser
open coverage/lcov-report/index.html

# Check specific coverage thresholds
pnpm test:coverage --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80,"statements":80}}'
```

## 🎯 Best Practices

### Component Testing

1. **Test User Behavior, Not Implementation**

   ```typescript
   // ✅ Good - Test what user sees
   expect(screen.getByText("Swap Complete")).toBeInTheDocument();

   // ❌ Bad - Test implementation details
   expect(component.state.isComplete).toBe(true);
   ```

2. **Use Semantic Queries**

   ```typescript
   // ✅ Good - Use semantic queries
   screen.getByRole("button", { name: "Submit" });
   screen.getByLabelText("Amount");

   // ❌ Bad - Use implementation queries
   screen.getByTestId("submit-button");
   ```

3. **Test Error States**

   ```typescript
   it("should show error for invalid input", async () => {
     render(<SwapForm />);

     fireEvent.change(screen.getByLabelText("Amount"), {
       target: { value: "-1" },
     });

     await waitFor(() => {
       expect(screen.getByText("Amount must be positive")).toBeInTheDocument();
     });
   });
   ```

### Mocking Strategy

1. **Mock External Dependencies**

   ```typescript
   // Mock API calls
   jest.mock("@/lib/api", () => ({
     fetchSwapQuote: jest.fn().mockResolvedValue({ price: 45000 }),
   }));
   ```

2. **Mock Blockchain Operations**

   ```typescript
   // Mock Bitcoin operations
   jest.mock("@/lib/blockchains/bitcoin", () => ({
     createHTLC: jest.fn().mockResolvedValue({ address: "test-address" }),
   }));
   ```

3. **Use Real Test Data**
   ```typescript
   // Use global test utilities for realistic data
   const testSecret = global.testUtils.generateTestSecret();
   const testAddress = global.testUtils.generateTestAddress();
   ```

## 🚨 Troubleshooting

### Common Issues

#### Test Environment Setup

**Problem**: Tests fail with environment variable errors

```bash
# Solution: Create .env.test file
cp env.test.example .env.test
# Configure test environment variables
```

#### Jest Configuration

**Problem**: Module resolution errors

```bash
# Solution: Check jest.config.ts
# Ensure moduleNameMapper is configured correctly
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
}
```

#### React Testing Library

**Problem**: Component not found in tests

```typescript
// Solution: Use proper queries
// Instead of getByText, try:
screen.getByRole("button");
screen.getByLabelText("Input Label");
screen.getByPlaceholderText("Placeholder");
```

#### Async Operations

**Problem**: Tests fail due to async operations

```typescript
// Solution: Use waitFor for async operations
await waitFor(() => {
  expect(screen.getByText("Loaded")).toBeInTheDocument();
});
```

### Debugging Tests

```bash
# Run specific test file
pnpm test -- --testPathPattern=YourComponent.test.tsx

# Run with verbose output
pnpm test -- --verbose

# Run with debug logging
DEBUG=* pnpm test

# Run single test
pnpm test -- --testNamePattern="should handle user input"
```

### Performance Optimization

```bash
# Run tests in parallel
pnpm test -- --maxWorkers=4

# Run tests with memory optimization
pnpm test -- --maxWorkers=2 --maxOldSpaceSize=4096

# Run tests with specific environment
NODE_ENV=test pnpm test
```

## 📚 Additional Resources

- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Next.js Testing Guide](https://nextjs.org/docs/app/guides/testing/jest)
- [BitcoinJS Library](https://github.com/bitcoinjs/bitcoinjs-lib)
- [Project Test README](./tests/README.md)

---

**Note**: This testing infrastructure is designed for development and hackathon use. For production deployment, additional security audits and comprehensive testing would be required.
