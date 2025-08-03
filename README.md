# Tron Foundry Project

A comprehensive Foundry-based smart contract development environment for the Tron blockchain.

## 🚀 Features

- **HTLC (Hash Time Locked Contracts)** - Secure cross-chain atomic swaps
- **Escrow System** - Source and destination escrow contracts
- **Factory Pattern** - Efficient contract deployment and management
- **Foundry Integration** - Modern Solidity development toolchain

## 📋 Project Structure

```
├── src/                    # Smart contracts
│   ├── TronHTLC.sol       # Hash Time Locked Contract
│   ├── EscrowFactory.sol  # Escrow factory contract
│   ├── EscrowSrc.sol      # Source escrow contract
│   ├── EscrowDst.sol      # Destination escrow contract
│   ├── interfaces/        # Contract interfaces
│   └── libraries/         # Shared libraries
├── test/                  # Foundry tests
├── script/                # Deployment scripts
├── lib/                   # Dependencies
└── foundry.toml          # Foundry configuration
```

## 🛠 Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Node.js](https://nodejs.org/) (for additional tooling)
- [Git](https://git-scm.com/)

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd tron-foundry-project

# Install Foundry dependencies
forge install

# Install Node.js dependencies (optional)
npm install
```

### Build Contracts

```bash
# Build all contracts
forge build
# or
npm run build
```

### Run Tests

```bash
# Run all tests
forge test
# or
npm test

# Run tests with verbose output
forge test -vvv
# or
npm run test:verbose

# Generate gas report
forge test --gas-report
# or
npm run test:gas
```

### Deploy Contracts

```bash
# Deploy to Tron Nile Testnet
npm run deploy:nile

# Deploy to Tron Mainnet
npm run deploy:mainnet
```

## 🧪 Testing

The project includes comprehensive test suites for all contracts:

- **EscrowFactory.t.sol** - Factory contract tests
- **TronHTLC.t.sol** - HTLC functionality tests
- **Escrow.t.sol** - Escrow contract tests

Run specific test files:

```bash
forge test --match-path test/TronHTLC.t.sol
```

## 🔧 Configuration

The project is configured for Tron networks in `foundry.toml`:

- **Tron Nile Testnet** - https://nile.trongrid.io
- **Tron Mainnet** - https://api.trongrid.io

## 📚 Smart Contracts

### TronHTLC

Hash Time Locked Contract for atomic cross-chain swaps with time-based locks and secret reveal mechanisms.

### EscrowFactory

Factory contract for deploying escrow instances with standardized parameters and management.

### EscrowSrc & EscrowDst

Source and destination escrow contracts for secure multi-party transactions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Resources

- [Foundry Documentation](https://book.getfoundry.sh/)
- [Tron Documentation](https://developers.tron.network/)
- [Solidity Documentation](https://docs.soliditylang.org/)
