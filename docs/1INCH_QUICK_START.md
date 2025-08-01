# 1inch Integration Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will help you integrate the 1inch swap widget into your project immediately.

## Step 1: Add the Component

The 1inch swap widget component is already created and ready to use:

```tsx
import { OneInchSwapWidget } from "@/components/1inch/1inch-swap-widget";

// Use it in your page
<OneInchSwapWidget
  onSwapComplete={(txHash) => console.log("Swap completed:", txHash)}
  onError={(error) => console.error("Swap error:", error)}
  defaultFromToken="USDC"
  defaultToToken="ETH"
  theme="dark"
/>;
```

## Step 2: Visit the Demo Page

Navigate to `/1inch-demo` to see the component in action and compare it with your current implementation.

## Step 3: Environment Setup (Optional)

For production use, add these environment variables to your `.env.local`:

```env
# 1inch API Configuration (optional for widget)
ONE_INCH_DEV_PORTAL_TOKEN=your_1inch_api_token
ONE_INCH_DEV_PORTAL_HOST=https://api.1inch.dev

# WalletConnect (optional)
WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id
```

## Step 4: Replace Your Current Swap Interface

Replace your current swap component with the 1inch widget:

### Before (Your Current Implementation)

```tsx
// src/app/swap/page.tsx
import { SwapInterface } from "@/components/swap/swap-interface";

export default function SwapPage() {
  return (
    <div>
      <SwapInterface onOrderCreated={handleOrderCreated} />
    </div>
  );
}
```

### After (With 1inch Widget)

```tsx
// src/app/swap/page.tsx
import { OneInchSwapWidget } from "@/components/1inch/1inch-swap-widget";

export default function SwapPage() {
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

      <OneInchSwapWidget
        onSwapComplete={handleSwapComplete}
        onError={handleError}
        defaultFromToken="USDC"
        defaultToToken="ETH"
        theme="dark"
      />
    </div>
  );
}
```

## Step 5: Customize the Widget

The widget supports various configuration options:

```tsx
<OneInchSwapWidget
  // Basic settings
  defaultFromToken="USDC"
  defaultToToken="ETH"
  theme="dark" // or "light"
  // Callbacks
  onSwapComplete={(txHash) => {
    // Handle successful swap
    console.log("Swap completed:", txHash);
  }}
  onError={(error) => {
    // Handle errors
    console.error("Swap error:", error);
  }}
  // Styling
  className="max-w-2xl mx-auto"
/>
```

## Step 6: Test the Integration

1. **Start your development server:**

   ```bash
   pnpm dev
   ```

2. **Navigate to the demo page:**

   ```
   http://localhost:3000/1inch-demo
   ```

3. **Test the widget:**
   - Connect your wallet
   - Select tokens
   - Get quotes
   - Execute swaps

## Benefits You Get Immediately

✅ **Professional UI/UX** - Production-ready interface  
✅ **Best Rates** - Aggregated from 100+ DEXs  
✅ **MEV Protection** - Secure against front-running  
✅ **Zero Gas Costs** - Users don't pay gas fees  
✅ **Cross-chain Support** - Multiple networks  
✅ **Limit Orders** - Advanced trading features  
✅ **Mobile Optimized** - Responsive design

## Troubleshooting

### Widget Not Loading

- Check browser console for errors
- Ensure internet connection
- Try refreshing the page

### Swap Failures

- Verify wallet connection
- Check token allowances
- Ensure sufficient balance

### Styling Issues

- The widget uses its own styling
- Custom styling is limited
- Use the `className` prop for container styling

## Next Steps

1. **Test thoroughly** with different tokens and amounts
2. **Monitor performance** and user feedback
3. **Consider SDK integration** for more customization
4. **Add analytics** to track usage
5. **Implement error handling** for production

## Support

- [1inch Documentation](https://docs.1inch.io/)
- [1inch API Documentation](https://docs.1inch.dev/)
- [Community Interface Repository](https://github.com/DKotsyuba/interface)

## Migration Checklist

- [ ] Component integrated
- [ ] Demo page working
- [ ] Error handling implemented
- [ ] User feedback collected
- [ ] Performance tested
- [ ] Production deployment ready

---

**That's it!** You now have a professional 1inch swap interface integrated into your project. The widget handles all the complexity of token swaps, MEV protection, and cross-chain functionality automatically.
