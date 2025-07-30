# Unite DeFi - Bitcoin Atomic Swap Implementation

A comprehensive Bitcoin atomic swap implementation with TDD (Test-Driven Development) structure, featuring HTLC (Hash Time-Locked Contract) support and integration with 1inch Fusion+ resolver.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Docker and Docker Compose
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd unite-DeFi

# Install dependencies
pnpm install

# Copy environment file
cp env.test.example .env.test

# Start Bitcoin testnet environment
chmod +x scripts/start-bitcoin-testnet.sh
./scripts/start-bitcoin-testnet.sh

# Run tests
pnpm test
```

## 🐳 Bitcoin Testnet Environment

This project includes a complete local Bitcoin testnet environment for testing atomic swaps.

### Starting the Environment

```bash
# Start Bitcoin testnet node and faucet
./scripts/start-bitcoin-testnet.sh

# Or manually with docker-compose
docker-compose up -d
```

### Services

- **Bitcoin Testnet Node**: `http://localhost:18332`
- **Bitcoin Faucet**: `http://localhost:3001`

### Faucet API

```bash
# Health check
curl http://localhost:3001/health

# Get balance
curl http://localhost:3001/balance

# Send testnet coins
curl -X POST http://localhost:3001/send \
  -H "Content-Type: application/json" \
  -d '{"address": "YOUR_ADDRESS", "amount": 0.001}'
```

### Stopping the Environment

```bash
# Stop services
./scripts/stop-bitcoin-testnet.sh

# Or manually
docker-compose down
```

## 🧪 Testing

### Test Structure

```
tests/
├── unit/
│   ├── bitcoin/
│   │   ├── htlc-script.test.ts      # HTLC script logic tests
│   │   └── transaction.test.ts      # Transaction building tests
│   ├── resolver/
│   │   └── resolver-logic.test.ts   # Resolver profitability tests
│   └── example.test.ts              # Basic setup verification
├── integration/
│   ├── bitcoin/
│   │   └── network-operations.test.ts # Network interaction tests
│   └── end-to-end/
│       └── atomic-swap.test.ts      # Full swap workflow tests
└── setup.ts                         # Global test configuration
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test categories
pnpm test:unit
pnpm test:integration
pnpm test:btc

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

### Test Categories

1. **Unit Tests**: Core logic testing (HTLC scripts, transactions, resolver)
2. **Integration Tests**: Network operations and Bitcoin node interaction
3. **End-to-End Tests**: Complete atomic swap workflows
4. **Security Tests**: Adversarial scenarios and edge cases

## 📁 Project Structure

```
src/
├── lib/
│   ├── bitcoin-htlc.ts              # HTLC script generation and validation
│   ├── bitcoin-transactions.ts      # Transaction building and signing
│   ├── bitcoin-network.ts           # Network operations and monitoring
│   ├── resolver-logic.ts            # Profitability calculations and bidding
│   └── atomic-swap-integration.ts   # End-to-end swap orchestration
├── components/                      # React components
├── app/                            # Next.js app directory
└── styles/                         # CSS and styling

docker/
├── bitcoin.conf                    # Bitcoin node configuration
└── faucet/                        # Bitcoin testnet faucet service
    ├── index.js
    ├── package.json
    └── README.md

scripts/
├── start-bitcoin-testnet.sh        # Start Bitcoin environment
└── stop-bitcoin-testnet.sh         # Stop Bitcoin environment
```

## 🔧 Configuration

### Environment Variables

Create a `.env.test` file based on `env.test.example`:

```bash
# Bitcoin Testnet
BITCOIN_NETWORK=testnet
BITCOIN_RPC_URL=http://localhost:18332
BITCOIN_RPC_USER=test
BITCOIN_RPC_PASS=test

# Bitcoin Faucet
BITCOIN_FAUCET_URL=http://localhost:3001

# Ethereum Testnet
ETHEREUM_NETWORK=sepolia
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
ETHEREUM_PRIVATE_KEY=your_test_private_key

# 1inch API
INCH_API_KEY=your_1inch_api_key
INCH_API_URL=https://api.1inch.dev
```

## 🧪 TDD Workflow

This project follows Test-Driven Development principles:

1. **Write failing tests first** - Tests are already written and failing (expected)
2. **Implement minimal code** - Replace stub implementations with real functionality
3. **Refactor while keeping tests green** - Iteratively improve the code

### Current Status

- ✅ **Test structure complete** - All test files created and organized
- ✅ **Jest configuration** - Properly configured with Next.js integration
- ✅ **Mock utilities** - Global test utilities for Bitcoin operations
- ✅ **Docker environment** - Local Bitcoin testnet node and faucet
- ❌ **Stub implementations** - Need to be replaced with real functionality

### Next Steps

1. Implement real HTLC script generation in `src/lib/bitcoin-htlc.ts`
2. Implement transaction building in `src/lib/bitcoin-transactions.ts`
3. Implement network operations in `src/lib/bitcoin-network.ts`
4. Implement resolver logic in `src/lib/resolver-logic.ts`
5. Implement end-to-end integration in `src/lib/atomic-swap-integration.ts`

## 🚀 Development

### Adding New Tests

1. Create test file in appropriate directory
2. Follow existing naming conventions
3. Use global test utilities from `tests/setup.ts`
4. Add test to appropriate category in `package.json` scripts

### Running with Real Bitcoin Node

1. Start the Bitcoin testnet environment
2. Get testnet coins from the faucet
3. Update tests to use real network operations
4. Monitor logs with `docker-compose logs -f`

## 📚 Documentation

- [Bitcoin Testnet Faucet](./docker/faucet/README.md)
- [Testing Plan](./docs/BICOIN_SIDE_TESTING_PLAN.md)
- [Jest Configuration](./jest.config.ts)

## 🤝 Contributing

1. Follow TDD principles
2. Write tests for new features
3. Ensure all tests pass
4. Update documentation

## 📄 License

MIT License - see LICENSE file for details 