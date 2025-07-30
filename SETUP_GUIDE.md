# 🚀 Complete Setup Guide: Bitcoin Testnet + 1inch Integration

## 📋 Prerequisites

- Node.js 18+ and pnpm
- Docker and Docker Compose
- Git

## 🔧 Step 1: Environment Setup

### 1.1 Copy Environment Files

```bash
cp env.test.example .env.test
cp env.example .env.local
```

### 1.2 Install Dependencies

```bash
pnpm install
```

## 🔑 Step 2: Generate Bitcoin Keys

### 2.1 Generate Testnet Keys

```bash
# Generate a single testnet key
npx tsx scripts/generate-bitcoin-keys.ts testnet

# Generate multiple keys for testing
npx tsx scripts/generate-bitcoin-keys.ts multiple 5
```

### 2.2 Update Environment Variables

Add your generated keys to `.env.local`:

```env
# Bitcoin Configuration (use the generated testnet keys)
NEXT_PUBLIC_BTC_PRIVATE_KEY_WIF=cSMbJTTUkAyAktfKpUE3caiMa1dj1VeFWmAznegyDaevacjaJcQp

# Ethereum Configuration (get from MetaMask or generate)
NEXT_PUBLIC_ETH_PRIVATE_KEY=your_ethereum_private_key_here
NEXT_PUBLIC_ETH_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# 1inch API Configuration
NEXT_PUBLIC_INCH_API_KEY=your_1inch_api_key_here
```

## 🐳 Step 3: Start Bitcoin Testnet Environment

### 3.1 Start Docker Services

```bash
# Make script executable
chmod +x scripts/start-bitcoin-testnet.sh

# Start Bitcoin testnet node and faucet
./scripts/start-bitcoin-testnet.sh
```

### 3.2 Verify Services

```bash
# Check Bitcoin node status
curl -u test:test -X POST http://localhost:18332 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "1.0", "id": "test", "method": "getblockchaininfo", "params": []}'

# Check faucet health
curl http://localhost:3001/health
```

## 💰 Step 4: Get Testnet Bitcoin

### 4.1 Use the Local Faucet

```bash
# Get testnet BTC to your address
curl -X POST http://localhost:3001/send \
  -H "Content-Type: application/json" \
  -d '{"address": "mp9Z7K1BBCkYvLqepPM7ixKVdEJjkHE1nt", "amount": 0.01}'
```

### 4.2 Alternative: Use Online Faucets

- [Bitcoin Testnet Faucet](https://testnet-faucet.mempool.co/)
- [Coinfaucet](https://coinfaucet.eu/en/btc-testnet/)

## 🔗 Step 5: 1inch API Setup

### 5.1 Get 1inch API Key

1. Go to [1inch Developer Portal](https://portal.1inch.dev/)
2. Sign up and create a new project
3. Get your API key
4. Add it to `.env.local`

### 5.2 Test 1inch API

```bash
# Test API connection
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "https://api.1inch.dev/swap/v5.2/1/quote?src=0xA0b86a33E6441b8c4C3131C8C5C9C5C9C5C9C5C9&dst=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2&amount=1000000000000000000"
```

## 🧪 Step 6: Run Tests

### 6.1 Run All Tests

```bash
pnpm test
```

### 6.2 Run Specific Test Categories

```bash
# Bitcoin-specific tests
pnpm test:btc

# Integration tests
pnpm test:integration

# Unit tests
pnpm test:unit
```

### 6.3 Run with Coverage

```bash
pnpm test:coverage
```

## 🚀 Step 7: Development

### 7.1 Start Development Server

```bash
pnpm dev
```

### 7.2 Monitor Bitcoin Node

```bash
# View Bitcoin node logs
docker-compose logs -f bitcoin-testnet

# View faucet logs
docker-compose logs -f bitcoin-testnet-faucet
```

## 📊 Step 8: Useful Commands

### 8.1 Bitcoin Node Commands

```bash
# Get blockchain info
docker-compose exec bitcoin-testnet bitcoin-cli -conf=/bitcoin/.bitcoin/bitcoin.conf getblockchaininfo

# Get wallet balance
docker-compose exec bitcoin-testnet bitcoin-cli -conf=/bitcoin/.bitcoin/bitcoin.conf getbalance

# Get new address
docker-compose exec bitcoin-testnet bitcoin-cli -conf=/bitcoin/.bitcoin/bitcoin.conf getnewaddress
```

### 8.2 Faucet Commands

```bash
# Check faucet balance
curl http://localhost:3001/balance

# Send testnet coins
curl -X POST http://localhost:3001/send \
  -H "Content-Type: application/json" \
  -d '{"address": "YOUR_ADDRESS", "amount": 0.001}'
```

## 🛠️ Step 9: Troubleshooting

### 9.1 Common Issues

**Docker not running:**

```bash
# Start Docker
sudo systemctl start docker
```

**Bitcoin node not syncing:**

```bash
# Check node status
docker-compose logs bitcoin-testnet

# Restart services
docker-compose restart
```

**Port conflicts:**

```bash
# Check what's using the ports
sudo lsof -i :18332
sudo lsof -i :3001

# Stop conflicting services
sudo systemctl stop conflicting-service
```

### 9.2 Reset Environment

```bash
# Stop all services
docker-compose down

# Remove volumes (WARNING: This deletes all data)
docker-compose down -v

# Restart fresh
./scripts/start-bitcoin-testnet.sh
```

## 📚 Step 10: Next Steps

### 10.1 Implement Core Features

1. **HTLC Scripts**: Implement in `src/lib/bitcoin-htlc.ts`
2. **Transactions**: Implement in `src/lib/bitcoin-transactions.ts`
3. **Network Operations**: Implement in `src/lib/bitcoin-network.ts`
4. **Resolver Logic**: Implement in `src/lib/resolver-logic.ts`
5. **Integration**: Implement in `src/lib/atomic-swap-integration.ts`

### 10.2 Testing Strategy

1. **Unit Tests**: Test individual components
2. **Integration Tests**: Test Bitcoin network operations
3. **End-to-End Tests**: Test complete swap workflows
4. **Security Tests**: Test adversarial scenarios

### 10.3 Deployment

1. **Testnet Deployment**: Deploy to Bitcoin testnet
2. **Mainnet Deployment**: Deploy to Bitcoin mainnet (with caution)
3. **Monitoring**: Set up monitoring and alerting

## 🔐 Security Notes

- **Never commit private keys** to version control
- **Use testnet** for all development and testing
- **Backup your keys** securely
- **Test thoroughly** before mainnet deployment
- **Use hardware wallets** for production

## 📞 Support

- [Bitcoin Testnet Documentation](https://developer.bitcoin.org/reference/testnet/)
- [1inch API Documentation](https://docs.1inch.dev/)
- [Project Issues](https://github.com/your-repo/issues)
