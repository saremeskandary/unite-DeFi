# 🧪 1inch Integration Testnet Testing Guide

## 📋 Overview

This guide will help you test your 1inch + Bitcoin integration using public testnets. We'll use **Sepolia testnet** for Ethereum tokens and **Bitcoin testnet** for Bitcoin transactions.

## 🚀 Quick Setup

### One-Command Setup

```bash
./scripts/setup-testnet.sh
```

This script will:

- ✅ Install dependencies
- ✅ Setup environment files
- ✅ Start Bitcoin testnet
- ✅ Verify services
- ✅ Fund your testnet address
- ✅ Run tests

## 🔧 Manual Setup

### Step 1: Get Required API Keys

#### 1. 1inch API Key

1. Go to [1inch Developer Portal](https://portal.1inch.dev/)
2. Sign up/Login
3. Create a new project
4. Copy your API key

#### 2. Ethereum RPC URL (Sepolia)

1. Go to [Infura](https://infura.io/) or [Alchemy](https://alchemy.com/)
2. Create a new project
3. Select "Sepolia" network
4. Copy your RPC URL

#### 3. Ethereum Private Key (Sepolia)

1. Create a new MetaMask wallet or use existing one
2. Switch to Sepolia testnet
3. Export private key (without 0x prefix)

### Step 2: Update Environment Configuration

Edit `.env.local`:

```env
# 1inch API Configuration
NEXT_PUBLIC_INCH_API_KEY=your_1inch_api_key_here

# Ethereum Configuration (SEPOLIA TESTNET)
NEXT_PUBLIC_ETH_PRIVATE_KEY=your_sepolia_private_key_here
NEXT_PUBLIC_ETH_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# Bitcoin Configuration (TESTNET)
NEXT_PUBLIC_BTC_PRIVATE_KEY_WIF=cSMbJTTUkAyAktfKpUE3caiMa1dj1VeFWmAznegyDaevacjaJcQp

# Network Configuration
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_USE_TESTNET=true
```

### Step 3: Get Testnet Tokens

#### Quick Faucet Setup

```bash
# Run the faucet setup script
./scripts/setup-faucets.sh

# Check faucet status
./scripts/check-faucet-status.sh
```

#### Get Sepolia ETH

- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/) (Recommended - 0.5 ETH)
- [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia) (0.5 ETH)
- [Paradigm Faucet](https://faucet.paradigm.xyz/) (0.1 ETH)
- [QuickNode Faucet](https://faucet.quicknode.com/ethereum/sepolia) (0.1 ETH)

#### Get Sepolia USDC

- [Circle Faucet](https://faucet.circle.com/) (Recommended - 100 USDC)
- [Paradigm Faucet](https://faucet.paradigm.xyz/) (10 USDC)

#### Get Bitcoin Testnet BTC

```bash
# Use local faucet (recommended)
curl -X POST http://localhost:3001/send \
  -H "Content-Type: application/json" \
  -d '{"address": "mp9Z7K1BBCkYvLqepPM7ixKVdEJjkHE1nt", "amount": 0.01}'

# Or use online faucets:
# - https://testnet-faucet.mempool.co/ (0.01 BTC)
# - https://coinfaucet.eu/en/btc-testnet/ (0.001 BTC)
# - https://testnet.help/ (0.001 BTC)
```

## 🧪 Testing Your Integration

### Step 1: Start Services

```bash
# Start Bitcoin testnet
./scripts/start-bitcoin-testnet.sh

# Start development server
pnpm dev
```

### Step 2: Run Tests

```bash
# All tests
pnpm test

# Bitcoin-specific tests
pnpm test:btc

# Integration tests
pnpm test:integration
```

### Step 3: Test 1inch Integration

#### Test Quote Generation

```typescript
import { OneInchBitcoinIntegration } from "./src/lib/1inch-bitcoin-integration";

const integration = new OneInchBitcoinIntegration(
  process.env.NEXT_PUBLIC_INCH_API_KEY!,
  process.env.NEXT_PUBLIC_BTC_PRIVATE_KEY_WIF!,
  process.env.NEXT_PUBLIC_ETH_PRIVATE_KEY!,
  process.env.NEXT_PUBLIC_ETH_RPC_URL!,
  true, // useTestnet
  "sepolia" // network
);

// Get quote for USDC to WBTC
const quote = await integration.getERC20ToBitcoinQuote(
  "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Sepolia USDC
  "1000000000", // 1000 USDC (6 decimals)
  "mp9Z7K1BBCkYvLqepPM7ixKVdEJjkHE1nt" // Bitcoin address
);

console.log("Quote:", quote);
```

#### Test Swap Execution

```typescript
// Execute the swap
const order = await integration.executeERC20ToBitcoinSwap(
  quote,
  "mp9Z7K1BBCkYvLqepPM7ixKVdEJjkHE1nt"
);

console.log("Order:", order);
```

## 🔗 Testnet Resources

### Sepolia Testnet

- **Network**: Sepolia
- **Chain ID**: 11155111
- **RPC URL**: https://sepolia.infura.io/v3/YOUR_KEY
- **Explorer**: https://sepolia.etherscan.io
- **Faucet**: https://sepoliafaucet.com/

### Bitcoin Testnet

- **Network**: Testnet
- **RPC URL**: http://localhost:18332
- **Explorer**: https://testnet.blockchain.info
- **Faucet**: http://localhost:3001

### Testnet Token Addresses (Sepolia)

| Token | Address                                      | Decimals |
| ----- | -------------------------------------------- | -------- |
| USDC  | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | 6        |
| WBTC  | `0x29f2D40B060490436847878FEB7BDE9b230230a2` | 8        |
| WETH  | `0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9` | 18       |

## 🛠️ Useful Commands

### Check Service Status

```bash
# Bitcoin node
curl -u test:test -X POST http://localhost:18332 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "1.0", "id": "test", "method": "getblockchaininfo", "params": []}'

# Faucet health
curl http://localhost:3001/health

# Faucet balance
curl http://localhost:3001/balance
```

### Get Testnet Bitcoin

```bash
# Send to your address
curl -X POST http://localhost:3001/send \
  -H "Content-Type: application/json" \
  -d '{"address": "YOUR_BITCOIN_ADDRESS", "amount": 0.01}'
```

### View Logs

```bash
# Bitcoin node logs
docker-compose logs bitcoin-testnet

# Faucet logs
docker-compose logs bitcoin-testnet-faucet

# All logs
docker-compose logs -f
```

## 🚨 Troubleshooting

### Common Issues

#### 1. "API key not found" error

- ✅ Verify your 1inch API key is correct
- ✅ Check if the key has proper permissions
- ✅ Ensure the key is active in the 1inch portal

#### 2. "Insufficient funds" error

- ✅ Get Sepolia ETH from faucet
- ✅ Get Bitcoin testnet BTC from faucet
- ✅ Check your wallet balances

#### 3. "Network not supported" error

- ✅ Ensure you're using Sepolia testnet (chain ID 11155111)
- ✅ Verify RPC URL is correct
- ✅ Check if the token addresses are for Sepolia

#### 4. Bitcoin node not responding

```bash
# Restart Bitcoin testnet
docker-compose down
./scripts/start-bitcoin-testnet.sh
```

#### 5. Faucet not working

```bash
# Check faucet balance
curl http://localhost:3001/balance

# If empty, restart faucet
docker-compose restart bitcoin-testnet-faucet
```

## 📊 Monitoring

### Check Transaction Status

```typescript
// Monitor Bitcoin transaction
const txStatus = await integration.monitorBitcoinTransaction(txHash);
console.log("Transaction status:", txStatus);

// Check Bitcoin balance
const balance = await integration.getBitcoinBalance();
console.log("Bitcoin balance:", balance);
```

### View on Block Explorers

- **Sepolia**: https://sepolia.etherscan.io
- **Bitcoin Testnet**: https://testnet.blockchain.info

## 🎯 Next Steps

1. **Test Basic Swaps**: Try small amounts first
2. **Test Error Handling**: Test with invalid addresses, insufficient funds
3. **Test Edge Cases**: Test with different token amounts, slippage settings
4. **Integration Testing**: Test the complete flow from quote to execution
5. **Performance Testing**: Test with larger amounts and multiple concurrent requests

## 🔐 Security Notes

- ✅ All testnet keys are safe for development
- ✅ Never use testnet keys on mainnet
- ✅ Testnet tokens have no real value
- ✅ Always test thoroughly before mainnet deployment

---

## 📞 Support

- **1inch Documentation**: https://docs.1inch.dev/
- **1inch Developer Portal**: https://portal.1inch.dev/
- **Sepolia Documentation**: https://ethereum.org/en/developers/docs/networks/#sepolia
- **Bitcoin Testnet**: https://developer.bitcoin.org/reference/testnet/
