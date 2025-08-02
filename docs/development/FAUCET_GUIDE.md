# 🚰 Testnet Faucet Guide

## 📋 Overview

This guide will help you get testnet tokens for testing your 1inch + Bitcoin integration. You'll need tokens on both **Sepolia testnet** (Ethereum) and **Bitcoin testnet**.

## 🚀 Quick Setup

### One-Command Faucet Setup

```bash
./scripts/setup-faucets.sh
```

This script will:

- ✅ Check your wallet addresses
- ✅ Provide faucet URLs for all networks
- ✅ Send Bitcoin testnet tokens automatically
- ✅ Show balance checking commands

## 🔗 Sepolia Testnet Faucets

### 1. Sepolia ETH Faucets

#### Alchemy Sepolia Faucet (Recommended)

- **URL**: https://sepoliafaucet.com/
- **Amount**: 0.5 ETH per request
- **Requirements**: Alchemy account (free)
- **Wait Time**: Instant
- **Rate Limit**: 1 request per 24 hours

#### Infura Sepolia Faucet

- **URL**: https://www.infura.io/faucet/sepolia
- **Amount**: 0.5 ETH per request
- **Requirements**: Infura account (free)
- **Wait Time**: Instant
- **Rate Limit**: 1 request per 24 hours

#### Paradigm Faucet

- **URL**: https://faucet.paradigm.xyz/
- **Amount**: 0.1 ETH per request
- **Requirements**: None
- **Wait Time**: 1-2 minutes
- **Rate Limit**: 1 request per 24 hours

#### QuickNode Faucet

- **URL**: https://faucet.quicknode.com/ethereum/sepolia
- **Amount**: 0.1 ETH per request
- **Requirements**: QuickNode account (free)
- **Wait Time**: Instant
- **Rate Limit**: 1 request per 24 hours

### 2. Sepolia USDC Faucets

#### Circle Faucet (Recommended)

- **URL**: https://faucet.circle.com/
- **Amount**: 100 USDC per request
- **Requirements**: Circle account (free)
- **Wait Time**: Instant
- **Rate Limit**: 1 request per 24 hours

#### Paradigm Faucet

- **URL**: https://faucet.paradigm.xyz/
- **Amount**: 10 USDC per request
- **Requirements**: None
- **Wait Time**: 1-2 minutes
- **Rate Limit**: 1 request per 24 hours

## 🔗 Bitcoin Testnet Faucets

### 1. Local Bitcoin Faucet (Recommended)

```bash
# Check if local faucet is running
curl http://localhost:3001/health

# Get Bitcoin testnet tokens
curl -X POST http://localhost:3001/send \
  -H "Content-Type: application/json" \
  -d '{"address": "YOUR_BITCOIN_ADDRESS", "amount": 0.01}'

# Check faucet balance
curl http://localhost:3001/balance
```

### 2. Online Bitcoin Testnet Faucets

#### Mempool Faucet

- **URL**: https://testnet-faucet.mempool.co/
- **Amount**: 0.01 BTC per request
- **Requirements**: None
- **Wait Time**: 1-2 minutes
- **Rate Limit**: 1 request per 24 hours

#### Coinfaucet

- **URL**: https://coinfaucet.eu/en/btc-testnet/
- **Amount**: 0.001 BTC per request
- **Requirements**: None
- **Wait Time**: 1-2 minutes
- **Rate Limit**: 1 request per 24 hours

#### Testnet Help

- **URL**: https://testnet.help/
- **Amount**: 0.001 BTC per request
- **Requirements**: None
- **Wait Time**: 1-2 minutes
- **Rate Limit**: 1 request per 24 hours

## 🛠️ Manual Setup

### Step 1: Get Your Wallet Addresses

#### Ethereum Address (Sepolia)

1. Open MetaMask
2. Switch to Sepolia testnet
3. Copy your wallet address

#### Bitcoin Address (Testnet)

```bash
# Use the pre-generated address
BTC_ADDRESS="mp9Z7K1BBCkYvLqepPM7ixKVdEJjkHE1nt"

# Or generate a new one
npx tsx scripts/generate-bitcoin-keys.ts testnet
```

### Step 2: Get Sepolia ETH

1. **Visit Alchemy Faucet** (Recommended)

   - Go to https://sepoliafaucet.com/
   - Sign up for free Alchemy account
   - Enter your Ethereum address
   - Receive 0.5 ETH instantly

2. **Alternative: Infura Faucet**
   - Go to https://www.infura.io/faucet/sepolia
   - Sign up for free Infura account
   - Enter your Ethereum address
   - Receive 0.5 ETH instantly

### Step 3: Get Sepolia USDC

1. **Visit Circle Faucet** (Recommended)

   - Go to https://faucet.circle.com/
   - Sign up for free Circle account
   - Enter your Ethereum address
   - Receive 100 USDC instantly

2. **Alternative: Paradigm Faucet**
   - Go to https://faucet.paradigm.xyz/
   - Enter your Ethereum address
   - Receive 10 USDC in 1-2 minutes

### Step 4: Get Bitcoin Testnet BTC

#### Option A: Local Faucet (Recommended)

```bash
# Start Bitcoin testnet if not running
./scripts/start-bitcoin-testnet.sh

# Get Bitcoin testnet tokens
curl -X POST http://localhost:3001/send \
  -H "Content-Type: application/json" \
  -d '{"address": "mp9Z7K1BBCkYvLqepPM7ixKVdEJjkHE1nt", "amount": 0.01}'
```

#### Option B: Online Faucets

1. **Mempool Faucet**

   - Go to https://testnet-faucet.mempool.co/
   - Enter your Bitcoin testnet address
   - Receive 0.01 BTC in 1-2 minutes

2. **Coinfaucet**
   - Go to https://coinfaucet.eu/en/btc-testnet/
   - Enter your Bitcoin testnet address
   - Receive 0.001 BTC in 1-2 minutes

## 📊 Checking Balances

### Check Sepolia Balances

```bash
# Check on Etherscan
echo "https://sepolia.etherscan.io/address/YOUR_ETH_ADDRESS"

# Check using web3 (if you have it installed)
npx web3 --network sepolia balance YOUR_ETH_ADDRESS
```

### Check Bitcoin Testnet Balances

```bash
# Check on Blockchain.info
echo "https://testnet.blockchain.info/address/YOUR_BTC_ADDRESS"

# Check using local node
curl -u test:test -X POST http://localhost:18332 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "1.0", "id": "test", "method": "getbalance", "params": []}'
```

## 🚨 Troubleshooting

### Common Issues

#### 1. "Insufficient funds" error

- ✅ Get more Sepolia ETH from faucets
- ✅ Get more Bitcoin testnet BTC from faucets
- ✅ Wait for transactions to confirm (1-2 minutes)

#### 2. "Faucet rate limit exceeded"

- ✅ Wait 24 hours before requesting again
- ✅ Try alternative faucets
- ✅ Use different wallet addresses

#### 3. "Local Bitcoin faucet not working"

```bash
# Restart Bitcoin testnet
docker-compose down
./scripts/start-bitcoin-testnet.sh

# Check faucet health
curl http://localhost:3001/health

# Check faucet balance
curl http://localhost:3001/balance
```

#### 4. "Transaction not confirmed"

- ✅ Wait 1-2 minutes for confirmation
- ✅ Check block explorers for status
- ✅ Verify address is correct

### Faucet Status Check

```bash
# Check local Bitcoin faucet
curl http://localhost:3001/health

# Check Bitcoin node
curl -u test:test -X POST http://localhost:18332 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "1.0", "id": "test", "method": "getblockchaininfo", "params": []}'
```

## 📈 Recommended Token Amounts

### For Testing 1inch Integration

| Token               | Recommended Amount | Purpose              |
| ------------------- | ------------------ | -------------------- |
| Sepolia ETH         | 0.5 ETH            | Gas fees and testing |
| Sepolia USDC        | 100 USDC           | Token swaps          |
| Bitcoin Testnet BTC | 0.01 BTC           | Bitcoin transactions |

### For Extended Testing

| Token               | Extended Amount | Purpose                       |
| ------------------- | --------------- | ----------------------------- |
| Sepolia ETH         | 1-2 ETH         | Multiple transactions         |
| Sepolia USDC        | 500-1000 USDC   | Large swaps                   |
| Bitcoin Testnet BTC | 0.1 BTC         | Multiple Bitcoin transactions |

## 🔄 Getting More Tokens

### When You Run Out

1. **Sepolia ETH**: Use different faucets or wait 24 hours
2. **Sepolia USDC**: Circle faucet allows multiple requests
3. **Bitcoin Testnet BTC**: Local faucet can be refilled

### Refilling Local Bitcoin Faucet

```bash
# Check faucet balance
curl http://localhost:3001/balance

# If empty, restart faucet
docker-compose restart bitcoin-testnet-faucet

# Or restart entire Bitcoin testnet
docker-compose down
./scripts/start-bitcoin-testnet.sh
```

## 🎯 Next Steps After Getting Tokens

1. **Verify Balances**: Check all tokens are received
2. **Update Environment**: Ensure addresses are correct in `.env.local`
3. **Start Testing**: Run your 1inch integration tests
4. **Monitor Transactions**: Watch for confirmations
5. **Test Swaps**: Try small amounts first

## 📞 Support

- **Alchemy Support**: https://docs.alchemy.com/
- **Infura Support**: https://docs.infura.io/
- **Circle Support**: https://developers.circle.com/
- **Bitcoin Testnet**: https://developer.bitcoin.org/reference/testnet/

---

## 🚀 Quick Commands

```bash
# Setup faucets
./scripts/setup-faucets.sh

# Get Bitcoin testnet tokens
curl -X POST http://localhost:3001/send \
  -H "Content-Type: application/json" \
  -d '{"address": "mp9Z7K1BBCkYvLqepPM7ixKVdEJjkHE1nt", "amount": 0.01}'

# Check Bitcoin faucet balance
curl http://localhost:3001/balance

# Check Bitcoin node status
curl -u test:test -X POST http://localhost:18332 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "1.0", "id": "test", "method": "getblockchaininfo", "params": []}'
```
