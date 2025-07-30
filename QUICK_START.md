# 🚀 Quick Start: Bitcoin Testnet + 1inch Integration

## ⚡ One-Command Setup

```bash
# Clone and setup everything automatically
./scripts/deploy-testnet.sh
```

## 📋 Manual Setup (if you prefer step-by-step)

### 1. Prerequisites

- Node.js 18+ and pnpm
- Docker and Docker Compose
- Git

### 2. Install & Setup

```bash
# Install dependencies
pnpm install

# Copy environment files
cp env.test.example .env.test
cp env.example .env.local

# Generate Bitcoin keys
npx tsx scripts/generate-bitcoin-keys.ts testnet

# Start Bitcoin testnet
./scripts/start-bitcoin-testnet.sh
```

### 3. Configure Environment

Edit `.env.local` with your keys:

```env
# Use the generated Bitcoin key
NEXT_PUBLIC_BTC_PRIVATE_KEY_WIF=cSMbJTTUkAyAktfKpUE3caiMa1dj1VeFWmAznegyDaevacjaJcQp

# Add your Ethereum private key (from MetaMask)
NEXT_PUBLIC_ETH_PRIVATE_KEY=your_ethereum_private_key_here
NEXT_PUBLIC_ETH_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# Get from https://portal.1inch.dev/
NEXT_PUBLIC_INCH_API_KEY=your_1inch_api_key_here
```

### 4. Get Testnet Bitcoin

```bash
# Use local faucet
curl -X POST http://localhost:3001/send \
  -H "Content-Type: application/json" \
  -d '{"address": "mp9Z7K1BBCkYvLqepPM7ixKVdEJjkHE1nt", "amount": 0.01}'

# Or use online faucets:
# - https://testnet-faucet.mempool.co/
# - https://coinfaucet.eu/en/btc-testnet/
```

### 5. Run Tests

```bash
# All tests
pnpm test

# Bitcoin-specific tests
pnpm test:btc

# Integration tests
pnpm test:integration
```

### 6. Start Development

```bash
pnpm dev
```

## 🔗 Services

- **Bitcoin Testnet Node**: http://localhost:18332
- **Bitcoin Faucet**: http://localhost:3001
- **Development Server**: http://localhost:3000

## 🧪 Testing

```bash
# Run specific test categories
pnpm test:btc          # Bitcoin tests
pnpm test:integration  # Integration tests
pnpm test:unit         # Unit tests

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

## 🛠️ Useful Commands

```bash
# Check Bitcoin node status
docker-compose logs bitcoin-testnet

# Check faucet status
docker-compose logs bitcoin-testnet-faucet

# Get Bitcoin balance
curl -u test:test -X POST http://localhost:18332 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "1.0", "id": "test", "method": "getbalance", "params": []}'

# Stop services
docker-compose down
```

## 📚 Next Steps

1. **Get 1inch API Key**: [1inch Developer Portal](https://portal.1inch.dev/)
2. **Read Documentation**: [SETUP_GUIDE.md](./SETUP_GUIDE.md)
3. **Implement Features**: Start with `src/lib/bitcoin-htlc.ts`
4. **Run Tests**: Ensure everything works before mainnet

## 🆘 Troubleshooting

**Docker not running:**

```bash
sudo systemctl start docker
```

**Port conflicts:**

```bash
sudo lsof -i :18332
sudo lsof -i :3001
```

**Reset environment:**

```bash
docker-compose down -v
./scripts/start-bitcoin-testnet.sh
```

## 🔐 Security Notes

- ✅ Use testnet for development
- ✅ Never commit private keys
- ✅ Backup keys securely
- ✅ Test thoroughly before mainnet
