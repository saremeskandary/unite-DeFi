# 1inch Component Integration Guide

## Overview

This guide explains how to integrate the 1inch Swap Interface component from the [1inch Community Interface repository](https://github.com/DKotsyuba/interface) into your current DeFi project. The 1inch interface provides a complete swap solution with Fusion protocol support, which can replace or complement your existing swap components.

## Current vs 1inch Implementation Comparison

### Your Current Implementation

- **Custom swap interface** with manual token selection
- **Basic Fusion SDK integration** for order creation
- **Manual wallet connection** handling
- **Custom UI components** built with shadcn/ui

### 1inch Community Interface Benefits

- **Complete swap widget** with embedded functionality
- **Advanced Fusion+ support** for cross-chain swaps
- **Built-in wallet integration** with multiple providers
- **Professional UI/UX** with comprehensive features
- **Production-ready** with extensive testing

## Integration Options

### Option 1: Embedded Widget (Recommended)

Embed the 1inch swap widget directly into your application.

### Option 2: Component Replacement

Replace your current swap components with 1inch components.

### Option 3: Hybrid Approach

Use 1inch components alongside your existing implementation.

## Implementation Guide

### Step 1: Install 1inch Interface Dependencies

```bash
# Clone the 1inch interface repository
git clone https://github.com/DKotsyuba/interface.git
cd interface

# Install dependencies
pnpm install

# Build the libraries
pnpm run build:libs:all
```

### Step 2: Set Up Environment Variables

Create a `.env` file in your project root:

```env
# 1inch API Configuration
ONE_INCH_DEV_PORTAL_TOKEN=your_1inch_api_token
ONE_INCH_DEV_PORTAL_HOST=https://api.1inch.dev

# WalletConnect (optional)
WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id

# Network Configuration
NEXT_PUBLIC_DEFAULT_CHAIN_ID=1
NEXT_PUBLIC_SUPPORTED_CHAINS=1,137,56,42161
```

### Step 3: Create 1inch Integration Component

Create a new component to integrate the 1inch interface:

```tsx
// src/components/1inch/1inch-swap-widget.tsx
"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OneInchSwapWidgetProps {
  onSwapComplete?: (txHash: string) => void;
  onError?: (error: Error) => void;
  defaultFromToken?: string;
  defaultToToken?: string;
  theme?: "light" | "dark";
}

export function OneInchSwapWidget({
  onSwapComplete,
  onError,
  defaultFromToken = "USDC",
  defaultToToken = "ETH",
  theme = "dark",
}: OneInchSwapWidgetProps) {
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load 1inch widget script
    const script = document.createElement("script");
    script.src = "https://widget.1inch.io/widget.js";
    script.async = true;

    script.onload = () => {
      if (window.OneInchWidget && widgetRef.current) {
        window.OneInchWidget.init({
          element: widgetRef.current,
          theme: theme,
          defaultFromToken: defaultFromToken,
          defaultToToken: defaultToToken,
          onSwapComplete: onSwapComplete,
          onError: onError,
          // Additional configuration options
          slippage: 0.5,
          gasPrice: "auto",
          enableFusion: true,
          enableCrossChain: true,
        });
      }
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [theme, defaultFromToken, defaultToToken, onSwapComplete, onError]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <img src="/1inch-logo.svg" alt="1inch" className="w-6 h-6" />
          1inch Swap
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={widgetRef} className="min-h-[400px]" />
      </CardContent>
    </Card>
  );
}

// TypeScript declarations
declare global {
  interface Window {
    OneInchWidget: {
      init: (config: any) => void;
    };
  }
}
```

### Step 4: Create Advanced Integration with SDK

For more control, create a component that uses the 1inch SDK directly:

```tsx
// src/components/1inch/1inch-sdk-integration.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FusionSDK, NetworkEnum } from "@1inch/fusion-sdk";
import { ethers } from "ethers";

interface OneInchSDKIntegrationProps {
  onSwapComplete?: (txHash: string) => void;
}

export function OneInchSDKIntegration({
  onSwapComplete,
}: OneInchSDKIntegrationProps) {
  const [fusionSDK, setFusionSDK] = useState<FusionSDK | null>(null);
  const [fromToken, setFromToken] = useState("USDC");
  const [toToken, setToToken] = useState("ETH");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    initializeFusionSDK();
  }, []);

  const initializeFusionSDK = async () => {
    try {
      // Initialize Fusion SDK
      const sdk = new FusionSDK({
        url: "https://api.1inch.dev/fusion",
        network: NetworkEnum.ETHEREUM,
        blockchainProvider: {
          // Configure your provider
        },
      });
      setFusionSDK(sdk);
    } catch (error) {
      console.error("Failed to initialize Fusion SDK:", error);
      toast({
        title: "Error",
        description: "Failed to initialize swap service",
        variant: "destructive",
      });
    }
  };

  const getQuote = async () => {
    if (!fusionSDK || !amount) return;

    setIsLoading(true);
    try {
      const quoteResponse = await fusionSDK.getQuote({
        fromTokenAddress: fromToken,
        toTokenAddress: toToken,
        amount: ethers.parseUnits(amount, 18).toString(),
        walletAddress: "0x...", // User's wallet address
      });
      setQuote(quoteResponse);
    } catch (error) {
      console.error("Failed to get quote:", error);
      toast({
        title: "Error",
        description: "Failed to get swap quote",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const executeSwap = async () => {
    if (!fusionSDK || !quote) return;

    setIsLoading(true);
    try {
      const swapResult = await fusionSDK.swap({
        quote: quote,
        walletAddress: "0x...", // User's wallet address
        slippage: 0.5,
      });

      toast({
        title: "Success",
        description: `Swap completed! TX: ${swapResult.txHash}`,
      });

      onSwapComplete?.(swapResult.txHash);
    } catch (error) {
      console.error("Failed to execute swap:", error);
      toast({
        title: "Error",
        description: "Failed to execute swap",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>1inch Fusion Swap</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fromToken">From Token</Label>
          <Input
            id="fromToken"
            value={fromToken}
            onChange={(e) => setFromToken(e.target.value)}
            placeholder="Token address or symbol"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="toToken">To Token</Label>
          <Input
            id="toToken"
            value={toToken}
            onChange={(e) => setToToken(e.target.value)}
            placeholder="Token address or symbol"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            type="number"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={getQuote}
            disabled={isLoading || !fusionSDK}
            className="flex-1"
          >
            Get Quote
          </Button>
          <Button
            onClick={executeSwap}
            disabled={isLoading || !quote}
            className="flex-1"
          >
            Swap
          </Button>
        </div>

        {quote && (
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Quote</h4>
            <p>Rate: {quote.rate}</p>
            <p>Price Impact: {quote.priceImpact}%</p>
            <p>Gas Estimate: {quote.gasEstimate}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Step 5: Create Integration Hook

Create a custom hook to manage 1inch integration:

```tsx
// src/hooks/use-1inch-integration.ts
import { useState, useEffect, useCallback } from "react";
import { FusionSDK, NetworkEnum } from "@1inch/fusion-sdk";
import { ethers } from "ethers";

interface UseOneInchIntegrationProps {
  network?: NetworkEnum;
  walletAddress?: string;
}

export function useOneInchIntegration({
  network = NetworkEnum.ETHEREUM,
  walletAddress,
}: UseOneInchIntegrationProps = {}) {
  const [fusionSDK, setFusionSDK] = useState<FusionSDK | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialize = useCallback(async () => {
    try {
      setError(null);

      // Initialize Fusion SDK
      const sdk = new FusionSDK({
        url: "https://api.1inch.dev/fusion",
        network,
        blockchainProvider: {
          // Configure provider based on network
        },
      });

      setFusionSDK(sdk);
      setIsInitialized(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to initialize 1inch SDK"
      );
      setIsInitialized(false);
    }
  }, [network]);

  const getQuote = useCallback(
    async (fromToken: string, toToken: string, amount: string) => {
      if (!fusionSDK || !walletAddress) {
        throw new Error("SDK not initialized or wallet not connected");
      }

      return await fusionSDK.getQuote({
        fromTokenAddress: fromToken,
        toTokenAddress: toToken,
        amount: ethers.parseUnits(amount, 18).toString(),
        walletAddress,
      });
    },
    [fusionSDK, walletAddress]
  );

  const executeSwap = useCallback(
    async (quote: any, slippage: number = 0.5) => {
      if (!fusionSDK || !walletAddress) {
        throw new Error("SDK not initialized or wallet not connected");
      }

      return await fusionSDK.swap({
        quote,
        walletAddress,
        slippage,
      });
    },
    [fusionSDK, walletAddress]
  );

  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    fusionSDK,
    isInitialized,
    error,
    getQuote,
    executeSwap,
    reinitialize: initialize,
  };
}
```

### Step 6: Update Your Main Swap Page

Replace or integrate the 1inch component into your existing swap interface:

```tsx
// src/app/swap/page.tsx
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SwapInterface } from "@/components/swap/swap-interface";
import { OneInchSwapWidget } from "@/components/1inch/1inch-swap-widget";
import { OneInchSDKIntegration } from "@/components/1inch/1inch-sdk-integration";

export default function SwapPage() {
  const [activeTab, setActiveTab] = useState("1inch");

  const handleSwapComplete = (txHash: string) => {
    console.log("Swap completed:", txHash);
    // Handle swap completion
  };

  const handleError = (error: Error) => {
    console.error("Swap error:", error);
    // Handle error
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Swap Tokens</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="1inch">1inch Widget</TabsTrigger>
          <TabsTrigger value="1inch-sdk">1inch SDK</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>

        <TabsContent value="1inch" className="mt-6">
          <OneInchSwapWidget
            onSwapComplete={handleSwapComplete}
            onError={handleError}
            defaultFromToken="USDC"
            defaultToToken="ETH"
            theme="dark"
          />
        </TabsContent>

        <TabsContent value="1inch-sdk" className="mt-6">
          <OneInchSDKIntegration onSwapComplete={handleSwapComplete} />
        </TabsContent>

        <TabsContent value="custom" className="mt-6">
          <SwapInterface onOrderCreated={handleSwapComplete} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

## Configuration Options

### Widget Configuration

```tsx
const widgetConfig = {
  // Basic settings
  theme: 'light' | 'dark',
  defaultFromToken: 'USDC',
  defaultToToken: 'ETH',

  // Swap settings
  slippage: 0.5,
  gasPrice: 'auto' | 'fast' | 'slow',

  // Features
  enableFusion: true,
  enableCrossChain: true,
  enableLimitOrders: false,

  // Callbacks
  onSwapComplete: (txHash: string) => void,
  onError: (error: Error) => void,
  onQuoteUpdate: (quote: any) => void,

  // Styling
  width: '100%',
  height: '600px',
  borderRadius: '12px'
}
```

### SDK Configuration

```tsx
const sdkConfig = {
  // API Configuration
  url: "https://api.1inch.dev/fusion",
  authKey: process.env.ONE_INCH_DEV_PORTAL_TOKEN,

  // Network Configuration
  network: NetworkEnum.ETHEREUM,

  // Provider Configuration
  blockchainProvider: {
    // Your provider configuration
  },

  // Advanced Settings
  enableLogging: true,
  timeout: 30000,
};
```

## Migration Strategy

### Phase 1: Parallel Implementation

1. Add 1inch components alongside existing ones
2. Test both implementations
3. Gather user feedback

### Phase 2: Feature Parity

1. Ensure all current features work with 1inch
2. Add any missing functionality
3. Optimize performance

### Phase 3: Gradual Migration

1. Make 1inch the default option
2. Keep custom implementation as fallback
3. Monitor usage and performance

### Phase 4: Full Migration

1. Remove custom implementation
2. Optimize 1inch integration
3. Add custom branding/styling

## Benefits of Using 1inch Interface

### For Users

- **Better UX**: Professional, tested interface
- **More Features**: Advanced swap options, limit orders
- **Better Rates**: Access to 1inch's aggregation
- **Cross-chain**: Support for multiple networks

### For Developers

- **Reduced Maintenance**: Less custom code to maintain
- **Better Testing**: Extensive testing by 1inch team
- **Regular Updates**: New features and improvements
- **Community Support**: Active community and documentation

### For Business

- **Faster Development**: Quick integration
- **Lower Costs**: Less development time
- **Better Reliability**: Production-tested code
- **Competitive Advantage**: Access to advanced features

## Troubleshooting

### Common Issues

1. **Widget not loading**

   - Check API token configuration
   - Verify network connectivity
   - Check browser console for errors

2. **Swap failures**

   - Verify wallet connection
   - Check token allowances
   - Ensure sufficient balance

3. **Rate limiting**
   - Implement proper error handling
   - Add retry logic
   - Monitor API usage

### Debug Mode

Enable debug mode for development:

```tsx
const debugConfig = {
  enableLogging: true,
  debugMode: true,
  showDetailedErrors: true,
};
```

## Conclusion

Integrating the 1inch interface provides a robust, feature-rich swap solution that can significantly enhance your DeFi application. The modular approach allows for gradual migration while maintaining your existing functionality.

For more information, refer to:

- [1inch Community Interface Repository](https://github.com/DKotsyuba/interface)
- [1inch Fusion Documentation](https://docs.1inch.io/)
- [1inch API Documentation](https://docs.1inch.dev/)
