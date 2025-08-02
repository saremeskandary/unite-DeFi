# Quick Start Guide

Get up and running with Unite DeFi in minutes.

## Prerequisites

- Node.js 18+
- pnpm package manager
- MetaMask or compatible Web3 wallet
- Git

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd unite-DeFi
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   pnpm dev
   ```

The application will be available at `http://localhost:3000`.

## Quick Test

1. **Connect your wallet** using MetaMask or another Web3 wallet
2. **Switch to testnet** (Sepolia recommended for testing)
3. **Get testnet tokens** using the [Faucet Guide](../development/FAUCET_GUIDE.md)
4. **Try a swap** between ETH and USDC

## Next Steps

- [Installation Guide](./INSTALLATION.md) - Detailed setup instructions
- [Development Setup](../development/ANVIL_SETUP.md) - Local blockchain development
- [Testing Guide](../testing/TESTING_OVERVIEW.md) - Run tests and verify functionality
- [API Reference](../api/API_REFERENCE.md) - API documentation

## Troubleshooting

### Common Issues

**"Module not found" errors**

```bash
pnpm install
```

**"Unsupported network" error**

- Make sure you're connected to a supported network (Sepolia, Mainnet, or Anvil)
- Check your MetaMask network settings

**"Insufficient balance" error**

- Get testnet tokens from the [Faucet Guide](../development/FAUCET_GUIDE.md)

**Port 3000 already in use**

```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9
# Or use a different port
pnpm dev --port 3001
```

## Support

- [Documentation](../README.md) - Complete documentation
- [Issues](https://github.com/your-repo/issues) - Report bugs and request features
- [Discord](https://discord.gg/unitedefi) - Community support
