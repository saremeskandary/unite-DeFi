# Unite DeFi - Cross-Chain Atomic Swap Protocol

A decentralized cross-chain atomic swap protocol that enables trustless trading between Ethereum and Bitcoin networks.

## Features

### Core Functionality
- **Cross-Chain Atomic Swaps**: Secure, trustless trading between Ethereum and Bitcoin
- **Partial Fill Support**: Execute large orders across multiple resolvers for better liquidity
- **Bitcoin Relayer Service**: Automated transaction broadcasting and monitoring
- **Real-Time Price Feeds**: Live market data from multiple sources
- **WebSocket Integration**: Real-time updates for orders and prices

### Wallet Integration
- **Multi-Wallet Support**: MetaMask, WalletConnect, Coinbase Wallet
- **Persistent Connections**: Wallet connections persist across browser tabs and page refreshes
- **Automatic State Restoration**: Seamless reconnection when returning to the app
- **Cross-Tab Synchronization**: Wallet state stays in sync across multiple tabs

### Security Features
- **Atomic Swap Protocol**: Ensures either both parties receive their assets or neither does
- **Time-Locked Contracts**: Automatic refund mechanisms for failed swaps
- **Multi-Signature Support**: Enhanced security for large transactions
- **Audit-Ready Code**: Comprehensive test coverage and security best practices

## Wallet Connection Persistence

The application now supports persistent wallet connections that work across browser tabs and page refreshes. Here's how it works:

### How It Works
1. **Automatic State Saving**: When you connect your wallet, the connection state is automatically saved to localStorage
2. **Cross-Tab Synchronization**: The wallet connection is recognized across all open tabs
3. **Page Refresh Recovery**: When you refresh the page, your wallet connection is automatically restored
4. **Security Features**: 
   - Connection state expires after 24 hours
   - Automatic cleanup when wallet is disconnected
   - Graceful error handling for storage issues

### Benefits
- **Seamless User Experience**: No need to reconnect wallet when switching tabs or refreshing
- **Improved Workflow**: Start a swap in one tab, monitor in another
- **Reliable State Management**: Consistent wallet state across the entire application

### Technical Implementation
- Uses localStorage for persistent storage
- Automatic state restoration on app initialization
- Real-time synchronization of wallet events (account changes, chain changes)
- Error handling for storage failures and network issues

## Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm package manager
- MetaMask or compatible Web3 wallet
- Bitcoin testnet wallet (for testing)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd unite-DeFi

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
pnpm dev
```

### Testing

```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm test:unit
pnpm test:integration
pnpm test:e2e

# Run tests with coverage
pnpm test:coverage
```

## Architecture

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Shadcn/ui**: Modern component library
- **Ethers.js**: Ethereum interaction
- **WebSocket**: Real-time updates

### Backend
- **Node.js**: Server runtime
- **Express.js**: API framework
- **WebSocket Server**: Real-time communication
- **Bitcoin Core**: Bitcoin network integration
- **PostgreSQL**: Data persistence

### Smart Contracts
- **Solidity**: Ethereum smart contracts
- **Hardhat**: Development and testing framework
- **OpenZeppelin**: Security libraries

## API Endpoints

### Swap Operations
- `POST /api/swap/quote` - Get swap quote
- `POST /api/swap/execute` - Execute swap
- `GET /api/swap/orders/:id` - Get order status

### Wallet Operations
- `GET /api/wallet/balance` - Get wallet balances
- `POST /api/wallet/connect` - Connect wallet
- `POST /api/wallet/disconnect` - Disconnect wallet

### Market Data
- `GET /api/prices` - Get current prices
- `GET /api/prices/history` - Get price history

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Security

For security concerns, please email security@unitedefi.com or create a private issue.

## Support

- Documentation: [docs.unitedefi.com](https://docs.unitedefi.com)
- Discord: [discord.gg/unitedefi](https://discord.gg/unitedefi)
- Twitter: [@UniteDeFi](https://twitter.com/UniteDeFi) 