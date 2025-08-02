# Error Handling System Guide

This document provides a comprehensive guide to the error handling system implemented in the Unite DeFi application.

## Overview

The error handling system provides:

- **Comprehensive error handling** with categorized error types
- **User-friendly error messages** with appropriate severity levels
- **Retry mechanisms** with exponential backoff
- **Error reporting** to external services
- **Fallback states** for different error scenarios

## Architecture

### Core Components

1. **Error Handler (`src/lib/error-handling.ts`)**

   - Central error handling logic
   - Error categorization and parsing
   - Retry mechanisms
   - Error reporting

2. **Error Hooks (`src/hooks/use-error-handler.ts`)**

   - React hooks for error handling
   - Integration with toast notifications
   - Specialized handlers for different error types

3. **Error Boundaries (`src/components/error-boundary-with-fallback.tsx`)**

   - React error boundaries with fallback states
   - Specialized boundaries for different contexts

4. **Error States (`src/components/ui/error-states.tsx`)**

   - User-friendly error state components
   - Contextual error messages and actions

5. **Error Provider (`src/components/providers/error-handling-provider.tsx`)**
   - Global error handling setup
   - Periodic error reporting

## Error Types

The system categorizes errors into the following types:

```typescript
enum ErrorType {
  NETWORK = "NETWORK", // Network connection issues
  BLOCKCHAIN = "BLOCKCHAIN", // Blockchain transaction errors
  WALLET = "WALLET", // Wallet connection issues
  VALIDATION = "VALIDATION", // Input validation errors
  AUTHENTICATION = "AUTHENTICATION", // Authentication failures
  AUTHORIZATION = "AUTHORIZATION", // Authorization failures
  RATE_LIMIT = "RATE_LIMIT", // Rate limiting errors
  TIMEOUT = "TIMEOUT", // Request timeout errors
  UNKNOWN = "UNKNOWN", // Unknown errors
}
```

## Error Severity Levels

```typescript
enum ErrorSeverity {
  LOW = "LOW", // Minor issues, user can continue
  MEDIUM = "MEDIUM", // Moderate issues, may affect functionality
  HIGH = "HIGH", // Significant issues, requires attention
  CRITICAL = "CRITICAL", // Critical issues, application may be unusable
}
```

## Usage Examples

### 1. Using Error Handling Hooks

#### Basic Error Handler

```typescript
import { useErrorHandler } from "@/hooks/use-error-handler";

function MyComponent() {
  const { handleError, handleAsyncError } = useErrorHandler();

  const handleNetworkRequest = async () => {
    await handleAsyncError(
      async () => {
        const response = await fetch("/api/data");
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        return response.json();
      },
      {
        retryConfig: {
          maxAttempts: 3,
          baseDelay: 1000,
        },
        userMessage: "Failed to load data. Please try again.",
      }
    );
  };

  const handleUserAction = () => {
    try {
      // Some operation that might fail
      throw new Error("Something went wrong");
    } catch (error) {
      handleError(error, {
        userMessage: "Action failed. Please try again.",
        severity: "MEDIUM",
      });
    }
  };
}
```

#### Specialized Error Handlers

```typescript
import {
  useNetworkErrorHandler,
  useBlockchainErrorHandler,
  useWalletErrorHandler,
} from "@/hooks/use-error-handler";

function DeFiComponent() {
  const { handleNetworkError } = useNetworkErrorHandler();
  const { handleBlockchainError } = useBlockchainErrorHandler();
  const { handleWalletError } = useWalletErrorHandler();

  const executeTransaction = async () => {
    await handleBlockchainError(async () => {
      // Blockchain transaction logic
      const tx = await wallet.sendTransaction(txData);
      return tx;
    });
  };

  const connectWallet = () => {
    handleWalletError(async () => {
      await wallet.connect();
    });
  };
}
```

### 2. Using Error Boundaries

#### General Error Boundary

```typescript
import { ErrorBoundaryWithFallback } from "@/components/error-boundary-with-fallback";

function App() {
  return (
    <ErrorBoundaryWithFallback
      onError={(error) => {
        console.log("Error caught:", error);
      }}
      showDetails={process.env.NODE_ENV === "development"}
    >
      <MyComponent />
    </ErrorBoundaryWithFallback>
  );
}
```

#### Specialized Error Boundaries

```typescript
import {
  NetworkErrorBoundary,
  WalletErrorBoundary,
  BlockchainErrorBoundary,
} from "@/components/error-boundary-with-fallback";

function DeFiApp() {
  return (
    <NetworkErrorBoundary>
      <WalletErrorBoundary>
        <BlockchainErrorBoundary>
          <TradingInterface />
        </BlockchainErrorBoundary>
      </WalletErrorBoundary>
    </NetworkErrorBoundary>
  );
}
```

### 3. Using Error States

#### Displaying Error States

```typescript
import {
  NetworkErrorState,
  WalletErrorState,
  BlockchainErrorState,
} from "@/components/ui/error-states";

function ErrorDisplay({ error, onRetry }) {
  switch (error.type) {
    case "NETWORK":
      return (
        <NetworkErrorState
          onRetry={onRetry}
          onGoBack={() => window.history.back()}
        />
      );
    case "WALLET":
      return (
        <WalletErrorState
          onRetry={onRetry}
          onGoBack={() => window.history.back()}
        />
      );
    case "BLOCKCHAIN":
      return (
        <BlockchainErrorState
          onRetry={onRetry}
          onGoBack={() => window.history.back()}
        />
      );
    default:
      return <ErrorState error={error} onRetry={onRetry} />;
  }
}
```

### 4. Creating Custom Errors

```typescript
import { createError, ErrorType, ErrorSeverity } from "@/lib/error-handling";

const customError = createError(
  ErrorType.BLOCKCHAIN,
  "Transaction failed due to insufficient gas",
  "Your transaction failed because the gas fee was too low. Please increase the gas limit and try again.",
  ErrorSeverity.HIGH,
  true, // retryable
  { gasUsed: 21000, gasLimit: 20000 },
  { component: "SwapInterface", action: "executeSwap" }
);
```

## Configuration

### Environment Variables

Add these to your `.env.local` file for error reporting:

```bash
# Error reporting endpoint (optional)
NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT=https://your-error-reporting-service.com/api/errors

# Enable/disable error reporting
NEXT_PUBLIC_ENABLE_ERROR_REPORTING=true
```

### Provider Setup

The error handling provider is already set up in the main layout:

```typescript
// src/app/layout.tsx
import { ErrorHandlingProvider } from "@/components/providers/error-handling-provider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ErrorBoundary>
          <ErrorHandlingProvider
            enablePeriodicReporting={true}
            reportingInterval={30000}
            onError={(error) => {
              // Custom error handling logic
              console.log("Global error:", error);
            }}
          >
            {children}
          </ErrorHandlingProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

## Retry Configuration

The retry mechanism supports exponential backoff:

```typescript
interface RetryConfig {
  maxAttempts: number; // Maximum number of retry attempts
  baseDelay: number; // Base delay in milliseconds
  maxDelay: number; // Maximum delay in milliseconds
  backoffMultiplier: number; // Multiplier for exponential backoff
  retryableErrors?: ErrorType[]; // Which error types to retry
}
```

Example:

```typescript
const retryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // Start with 1 second
  maxDelay: 10000, // Max 10 seconds
  backoffMultiplier: 2, // Double the delay each time
  retryableErrors: [ErrorType.NETWORK, ErrorType.TIMEOUT],
};
```

## Error Reporting

The system automatically reports errors to external services when configured:

1. **Batch Reporting**: Errors are queued and sent in batches
2. **Critical Errors**: Critical errors are reported immediately
3. **Development**: Errors are logged to console in development
4. **Custom Endpoints**: Configure custom reporting endpoints

## Best Practices

### 1. Use Appropriate Error Types

```typescript
// Good
handleError(new Error("fetch failed: Network error"), {
  type: ErrorType.NETWORK,
});

// Better - let the system auto-detect
handleError(new Error("fetch failed: Network error"));
```

### 2. Provide User-Friendly Messages

```typescript
// Good
handleError(error, {
  userMessage:
    "Unable to connect to the server. Please check your internet connection.",
});

// Avoid
handleError(error, {
  userMessage: "Error: fetch failed: Network error",
});
```

### 3. Use Retry for Transient Errors

```typescript
// Good - retry network errors
await handleAsyncError(
  async () => {
    return await fetch("/api/data");
  },
  {
    retryConfig: {
      maxAttempts: 3,
      baseDelay: 1000,
    },
  }
);

// Avoid - don't retry validation errors
handleError(validationError, {
  retryable: false,
});
```

### 4. Wrap Critical Components

```typescript
// Good - wrap critical components with error boundaries
<BlockchainErrorBoundary>
  <SwapInterface />
</BlockchainErrorBoundary>
```

### 5. Handle Errors at the Right Level

```typescript
// Good - handle specific errors where they occur
const { handleWalletError } = useWalletErrorHandler()

// Good - let general errors bubble up to boundaries
<ErrorBoundaryWithFallback>
  <App />
</ErrorBoundaryWithFallback>
```

## Testing

### Demo Page

Visit `/error-handling-demo` to see examples of all error handling features in action.

### Testing Error Scenarios

```typescript
// Test network errors
await handleNetworkError(async () => {
  throw new Error("fetch failed: Network error");
});

// Test blockchain errors
await handleBlockchainError(async () => {
  throw new Error("transaction failed: insufficient gas");
});

// Test wallet errors
handleWalletError(new Error("wallet connection failed"));
```

## Troubleshooting

### Common Issues

1. **Errors not showing toasts**: Ensure the `Toaster` component is included in your layout
2. **Error boundaries not catching errors**: Make sure the boundary is wrapping the component that throws
3. **Retry not working**: Check that the error is marked as retryable and the error type is in the retryable errors list

### Debug Mode

Enable debug mode to see detailed error information:

```typescript
<ErrorBoundaryWithFallback showDetails={true}>
  <Component />
</ErrorBoundaryWithFallback>
```

## Migration Guide

### From Basic Error Handling

**Before:**

```typescript
try {
  const result = await apiCall();
} catch (error) {
  console.error(error);
  setError(error.message);
}
```

**After:**

```typescript
const { handleAsyncError } = useErrorHandler();

const result = await handleAsyncError(
  async () => {
    return await apiCall();
  },
  {
    userMessage: "Failed to load data. Please try again.",
  }
);
```

### From Manual Toast Notifications

**Before:**

```typescript
toast({
  title: "Error",
  description: error.message,
  variant: "destructive",
});
```

**After:**

```typescript
const { handleError } = useErrorHandler();

handleError(error, {
  userMessage: "Something went wrong. Please try again.",
});
```

This error handling system provides a robust foundation for managing errors in your DeFi application while maintaining a great user experience.
