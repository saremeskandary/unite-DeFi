# Bitcoin Cross-Chain Swap Implementation

This directory contains a modular implementation of Bitcoin ↔ ERC20 atomic swaps using 1inch Fusion+ protocol.

## Architecture

The implementation has been broken down into focused modules for better maintainability:

### Core Modules

- **`FusionBitcoinIntegration`** - Main integration class that orchestrates all operations
- **`BitcoinHTLCOperations`** - Handles Bitcoin HTLC script creation and management
- **`BitcoinNetworkOperations`** - Manages Bitcoin blockchain interactions and transactions
- **`FusionOrderManager`** - Handles 1inch Fusion+ order creation and submission
- **`SwapMonitoringService`** - Monitors swaps and handles secret reveal detection

### Types and Interfaces

- **`bitcoin-swap-types.ts`** - All TypeScript interfaces and types used across modules

## Usage

### Basic Setup

```typescript
import { FusionBitcoinIntegration } from "./bitcoin";

const integration = new FusionBitcoinIntegration(
  process.env.ETH_PRIVATE_KEY!,
  process.env.BTC_PRIVATE_KEY_WIF!,
  process.env.ETH_RPC_URL!,
  NetworkEnum.ETHEREUM,
  true // Use testnet
);
```

### ERC20 → Bitcoin Swap

```typescript
const { fusionOrder, secretHash } = await integration.createERC20ToBTCOrder({
  makerAsset: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", // WBTC
  makerAmount: ethers.parseUnits("0.1", 8).toString(), // 0.1 WBTC
  btcAddress: "tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", // User's Bitcoin address
  btcAmount: 10000000, // 0.1 BTC in satoshis
  secret: "my-secret-phrase-for-atomic-swap-123",
});

await integration.submitBitcoinSwapOrder(fusionOrder, [secretHash]);
```

### Bitcoin → ERC20 Swap

```typescript
const { fusionOrder, secretHash } = await integration.createBTCToERC20Order({
  btcTxId: "bitcoin-transaction-id",
  btcAmount: 10000000, // 0.1 BTC in satoshis
  takerAsset: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", // WBTC
  takerAmount: ethers.parseUnits("0.1", 8).toString(), // 0.1 WBTC
  ethAddress: "0x...", // User's Ethereum address
  secret: "my-secret-phrase-for-atomic-swap-123",
});

await integration.submitBitcoinSwapOrder(fusionOrder, [secretHash]);
```

## Module Responsibilities

### FusionBitcoinIntegration

- Main orchestrator class
- Provides high-level API for swap operations
- Delegates to specialized modules

### BitcoinHTLCOperations

- Creates Bitcoin HTLC scripts
- Manages P2SH address generation
- Handles secret extraction from transactions

### BitcoinNetworkOperations

- Manages Bitcoin blockchain interactions
- Handles UTXO management and transaction creation
- Provides Bitcoin network utilities

### FusionOrderManager

- Creates and submits 1inch Fusion+ orders
- Monitors order status
- Handles order completion

### SwapMonitoringService

- Monitors Bitcoin HTLCs for secret reveals
- Handles swap execution logic
- Manages cross-chain coordination

## Environment Variables

Required environment variables:

```bash
ETH_PRIVATE_KEY=your_ethereum_private_key
BTC_PRIVATE_KEY_WIF=your_bitcoin_private_key_wif
ETH_RPC_URL=your_ethereum_rpc_url
INCH_API_KEY=your_1inch_api_key
```

## Testing

The implementation includes a demo function for testing:

```typescript
import { createBitcoinSwapDemo } from "./bitcoin";

// Run the demo
await createBitcoinSwapDemo();
```

## Security Considerations

- Always use testnet for development and testing
- Keep private keys secure and never commit them to version control
- Verify all transaction parameters before execution
- Monitor swap status and handle timeouts appropriately
