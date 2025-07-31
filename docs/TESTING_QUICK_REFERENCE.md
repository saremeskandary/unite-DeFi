# 🚀 Testing Quick Reference

Quick reference guide for using the test infrastructure in your frontend development.

## 📋 Quick Commands

```bash
# Run all tests
pnpm test

# Run tests in watch mode (development)
pnpm test:watch

# Run specific test categories
pnpm test:unit          # Unit tests only
pnpm test:integration   # Integration tests only
pnpm test:btc           # Bitcoin-specific tests

# Generate coverage report
pnpm test:coverage

# Run specific test file
pnpm test -- --testPathPattern=ComponentName.test.tsx

# Run single test
pnpm test -- --testNamePattern="test description"
```

## 🧪 Test Structure

```
tests/
├── setup.ts                    # Global utilities & config
├── unit/
│   ├── components/            # React component tests
│   ├── blockchains/           # Blockchain logic tests
│   └── resolver/              # Resolver logic tests
└── integration/               # Integration tests
```

## 📝 Common Test Patterns

### React Component Test Template

```typescript
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { YourComponent } from "@/components/YourComponent";

describe("YourComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render correctly", () => {
    render(<YourComponent />);
    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });

  it("should handle user interactions", async () => {
    render(<YourComponent />);

    const button = screen.getByRole("button", { name: "Click Me" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Clicked!")).toBeInTheDocument();
    });
  });
});
```

### Form Testing Pattern

```typescript
describe("Form Component", () => {
  it("should validate and submit form", async () => {
    const mockSubmit = jest.fn();
    render(<FormComponent onSubmit={mockSubmit} />);

    // Fill form
    fireEvent.change(screen.getByLabelText("Amount"), {
      target: { value: "1.5" },
    });
    fireEvent.change(screen.getByLabelText("Address"), {
      target: { value: "0x123..." },
    });

    // Submit
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        amount: "1.5",
        address: "0x123...",
      });
    });
  });
});
```

### API Mocking Pattern

```typescript
// Mock external API
jest.mock("@/lib/api", () => ({
  fetchData: jest.fn().mockResolvedValue({ data: "test" }),
  postData: jest.fn().mockResolvedValue({ success: true }),
}));

describe("API Component", () => {
  it("should fetch and display data", async () => {
    render(<DataComponent />);

    await waitFor(() => {
      expect(screen.getByText("test")).toBeInTheDocument();
    });
  });
});
```

### Error State Testing

```typescript
it("should show error message", async () => {
  // Mock API to throw error
  jest.spyOn(api, "fetchData").mockRejectedValue(new Error("API Error"));

  render(<DataComponent />);

  await waitFor(() => {
    expect(screen.getByText("Error: API Error")).toBeInTheDocument();
  });
});
```

## 🛠️ Global Test Utilities

```typescript
// Generate test data
const secret = global.testUtils.generateTestSecret();
const address = global.testUtils.generateTestAddress();
const keyPair = global.testUtils.createECPair();

// Blockchain operations (mocked)
await global.testUtils.waitForConfirmation("txid", 3);
const futureHeight = await global.testUtils.getFutureBlockHeight(10);
await global.testUtils.mineBlocks(5);
```

## 🎯 Testing Library Queries

### Priority Order (Best to Worst)

1. **getByRole** - Most accessible

   ```typescript
   screen.getByRole("button", { name: "Submit" });
   screen.getByRole("textbox", { name: "Amount" });
   ```

2. **getByLabelText** - Form inputs

   ```typescript
   screen.getByLabelText("Amount");
   screen.getByLabelText("Email Address");
   ```

3. **getByPlaceholderText** - Input placeholders

   ```typescript
   screen.getByPlaceholderText("Enter amount");
   ```

4. **getByText** - Text content

   ```typescript
   screen.getByText("Submit");
   screen.getByText(/error/i); // Case insensitive regex
   ```

5. **getByTestId** - Last resort
   ```typescript
   screen.getByTestId("submit-button");
   ```

## 🔧 Common Assertions

```typescript
// Element presence
expect(element).toBeInTheDocument();
expect(element).not.toBeInTheDocument();

// Text content
expect(element).toHaveTextContent("Expected text");
expect(element).toHaveValue("input value");

// Element state
expect(button).toBeEnabled();
expect(button).toBeDisabled();
expect(checkbox).toBeChecked();

// Function calls
expect(mockFunction).toHaveBeenCalled();
expect(mockFunction).toHaveBeenCalledWith(arg1, arg2);
expect(mockFunction).toHaveBeenCalledTimes(3);

// Async operations
await waitFor(() => {
  expect(element).toBeInTheDocument();
});
```

## 🚨 Common Issues & Solutions

### Module Resolution Errors

```bash
# Check jest.config.ts moduleNameMapper
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
}
```

### Environment Variables

```bash
# Create .env.test file
cp env.test.example .env.test
```

### Async Test Failures

```typescript
// Use waitFor for async operations
await waitFor(() => {
  expect(screen.getByText("Loaded")).toBeInTheDocument();
});
```

### Component Not Found

```typescript
// Try different queries
screen.getByRole("button");
screen.getByLabelText("Input Label");
screen.getByPlaceholderText("Placeholder");
```

## 📊 Coverage Commands

```bash
# Generate coverage
pnpm test:coverage

# View in browser
open coverage/lcov-report/index.html

# Check thresholds
pnpm test:coverage --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80,"statements":80}}'
```

## 🔄 TDD Workflow

1. **Write failing test**
2. **Implement minimum code**
3. **Refactor while keeping tests green**
4. **Repeat**

### Example TDD Cycle

```typescript
// 1. Write failing test
it("should display user input", () => {
  render(<NewComponent />);
  expect(screen.getByLabelText("User Input")).toBeInTheDocument();
});

// 2. Implement minimum code
export function NewComponent() {
  return (
    <div>
      <label htmlFor="user-input">User Input</label>
      <input id="user-input" />
    </div>
  );
}

// 3. Add more tests and refine
```

## 📚 Useful Resources

- [React Testing Library Cheatsheet](https://testing-library.com/docs/react-testing-library/cheatsheet)
- [Jest Matchers](https://jestjs.io/docs/expect)
- [Project Test README](./tests/README.md)
- [Frontend Testing Guide](./FRONTEND_TESTING_GUIDE.md)
