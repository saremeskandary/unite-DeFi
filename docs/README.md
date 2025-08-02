# Unite DeFi Documentation

Welcome to the Unite DeFi documentation. This directory contains comprehensive documentation for the cross-chain atomic swap protocol.

## 📚 Documentation Structure

### 🚀 Getting Started

- [Project Overview](../README.md) - Main project README with features and architecture
- [Quick Start Guide](./getting-started/QUICK_START.md) - Get up and running in minutes
- [Installation Guide](./getting-started/INSTALLATION.md) - Detailed setup instructions

### 🔧 Development Setup

- [Anvil Setup](./development/ANVIL_SETUP.md) - Local blockchain development
- [Testnet Faucets](./development/FAUCET_GUIDE.md) - Get testnet tokens
- [Environment Configuration](./development/ENVIRONMENT.md) - Environment variables setup

### 🔗 Blockchain Integrations

- [Bitcoin Integration](./integrations/bitcoin/) - Bitcoin HTLC and swap implementation
- [TON Integration](./integrations/ton/) - TON blockchain integration
- [TRON Integration](./integrations/tron/) - TRON blockchain integration
- [1inch Integration](./integrations/1inch/) - 1inch Fusion+ protocol integration

### 🧪 Testing

- [Testing Overview](./testing/TESTING_OVERVIEW.md) - Testing strategy and approach
- [Unit Testing](./testing/UNIT_TESTING.md) - Unit test guidelines
- [Integration Testing](./testing/INTEGRATION_TESTING.md) - Integration test setup
- [Frontend Testing](./testing/FRONTEND_TESTING.md) - UI testing guide

### 🔒 Security

- [Security Implementation](./security/SECURITY_IMPLEMENTATION.md) - Security features and best practices
- [Audit Guidelines](./security/AUDIT_GUIDELINES.md) - Security audit preparation

### 📖 API Reference

- [API Documentation](./api/API_REFERENCE.md) - REST API endpoints
- [WebSocket API](./api/WEBSOCKET_API.md) - Real-time communication
- [Error Handling](./api/ERROR_HANDLING.md) - Error codes and handling

### 🏗️ Architecture

- [System Architecture](./architecture/SYSTEM_ARCHITECTURE.md) - High-level system design
- [Smart Contracts](./architecture/SMART_CONTRACTS.md) - Contract architecture
- [Data Flow](./architecture/DATA_FLOW.md) - System data flow diagrams

### 📋 Guides

- [Bitcoin Wallet Setup](./guides/BITCOIN_WALLET_SETUP.md) - Bitcoin wallet configuration
- [Transaction Signing](./guides/BITCOIN_TRANSACTION_SIGNING.md) - Bitcoin transaction handling
- [Swap Flow](./guides/BITCOIN_SWAP_FLOW.md) - Complete swap process

## 🗂️ File Organization

### Removed Files

The following files have been removed or consolidated:

- `TON_CLI_README.md` → Moved to `scripts/ton/README.md`
- `BITCOIN_CLI_README.md` → Moved to `scripts/bitcoin/README.md`
- `judging notes.md` → Consolidated into project requirements
- `conversations.md` → Development notes, not needed in production
- `doc-links.md` → Replaced by this index
- Duplicate testing guides → Consolidated into testing directory
- Outdated integration guides → Updated and organized

### Directory Structure

```
docs/
├── README.md                    # This file
├── getting-started/            # Quick start and installation
├── development/                # Development setup and tools
├── integrations/               # Blockchain integrations
│   ├── bitcoin/
│   ├── ton/
│   ├── tron/
│   └── 1inch/
├── testing/                    # Testing documentation
├── security/                   # Security and audit docs
├── api/                        # API documentation
├── architecture/               # System architecture
└── guides/                     # User guides
```

## 🔄 Contributing to Documentation

When adding new documentation:

1. **Choose the right directory** based on the content type
2. **Use consistent naming** - UPPER_CASE for files, descriptive names
3. **Update this index** when adding new files
4. **Keep it concise** - Focus on essential information
5. **Include examples** - Code examples and practical usage

## 📝 Documentation Standards

- **Markdown format** for all documentation
- **Clear headings** with proper hierarchy
- **Code blocks** with syntax highlighting
- **Links** to related documentation
- **Examples** for practical usage
- **Regular updates** to keep content current
