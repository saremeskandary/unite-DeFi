# TonFusion Enhanced Scripts

This directory contains comprehensive scripts for the enhanced TonFusion contract that implements bi-directional swaps, partial fills, escrow factory, and relayer system as required by the hackathon.

## 🎯 Hackathon Requirements Implemented

### ✅ Bi-directional Swaps
- **TON → EVM**: Swap from TON to Ethereum/Polygon/BSC/Base/Arbitrum
- **EVM → TON**: Swap from EVM chains to TON
- **TON → TON**: Same-chain swaps within TON ecosystem

### ✅ HTLC Management
- Proper hashlock/timelock logic
- Contract expiration handling
- Secure secret management

### ✅ Escrow Factory
- Deploy escrow contracts on target chains
- Support for Base/Arbitrum/L2s
- Chain-specific contract management

### ✅ Partial Fills
- Multiple secrets for multiple resolvers
- Partial order execution
- Efficient order matching

### ✅ Relayer/Resolver System
- Non-EVM chain support
- Relayer statistics tracking
- Success rate monitoring

### ✅ Smart Contract Level Only
- No REST APIs (as required)
- Direct contract interactions
- Self-contained functionality

## 📁 Script Files

### Core Scripts
- **`deployTonFusion.ts`** - Deploy the enhanced contract
- **`setWhitelist.ts`** - Manage whitelist for resolvers
- **`createOrder.ts`** - Create basic orders (legacy)
- **`getFund.ts`** - Claim funds with secret
- **`refund.ts`** - Refund expired orders
- **`viewContract.ts`** - View contract state and statistics

### Enhanced Scripts
- **`createBidirectionalOrder.ts`** - Create bi-directional orders
- **`partialFill.ts`** - Handle partial fills with multiple secrets
- **`escrowFactory.ts`** - Deploy escrow contracts on target chains
- **`relayerManagement.ts`** - Manage relayers and track statistics
- **`generateSecret.ts`** - Generate secrets and hashes for testing

## 🚀 Quick Start

### 1. Deploy Contract
```bash
npm run bp run deployTonFusion
```

### 2. Set Whitelist
```bash
npm run bp run setWhitelist <contract> <address> true
```

### 3. Create Bi-directional Order
```bash
# TON → Ethereum
npm run bp run createBidirectionalOrder <contract> ton-to-evm -3 1 <jetton> <sender> <receiver> <hashlock> <timelock> <amount>

# Ethereum → TON
npm run bp run createBidirectionalOrder <contract> evm-to-ton 1 -3 <jetton> <sender> <receiver> <hashlock> <timelock> <amount> <evmContract>

# TON → TON
npm run bp run createBidirectionalOrder <contract> ton-to-ton -3 -3 <jetton> <sender> <receiver> <hashlock> <timelock> <amount>
```

### 4. Partial Fill
```bash
# Create partial fill
npm run bp run partialFill <contract> fill <orderHash> <secret> <amount> <resolver>

# Complete partial fill
npm run bp run partialFill <contract> complete <orderHash> <secret>
```

### 5. Deploy Escrow Contract
```bash
# Deploy to Base
npm run bp run escrowFactory <contract> deploy 8453 <address>

# Deploy to Arbitrum
npm run bp run escrowFactory <contract> deploy 42161 <address>
```

### 6. Manage Relayers
```bash
# Register relayer
npm run bp run relayerManagement <contract> register <address>

# Update stats
npm run bp run relayerManagement <contract> update <address> true

# View statistics
npm run bp run relayerManagement <contract> stats
```

## 🌐 Supported Networks

| Chain ID | Network | Status |
|----------|---------|--------|
| 1 | Ethereum Mainnet | ✅ |
| 137 | Polygon | ✅ |
| 56 | BSC | ✅ |
| 8453 | Base | ✅ |
| 42161 | Arbitrum | ✅ |
| -3 | TON Mainnet | ✅ |
| -239 | TON Testnet | ✅ |

## 🔧 Advanced Features

### Partial Fills with Multiple Secrets
```bash
# Generate multiple secrets for large orders
npm run bp run generateSecret

# Use different secrets for different resolvers
npm run bp run partialFill <contract> fill <orderHash> <secret1> <amount1> <resolver1>
npm run bp run partialFill <contract> fill <orderHash> <secret2> <amount2> <resolver2>
```

### Escrow Factory Pattern
```bash
# Deploy escrow contracts on multiple chains
npm run bp run escrowFactory <contract> deploy 1 <ethereumAddress>
npm run bp run escrowFactory <contract> deploy 8453 <baseAddress>
npm run bp run escrowFactory <contract> deploy 42161 <arbitrumAddress>
```

### Relayer Statistics
```bash
# Track relayer performance
npm run bp run relayerManagement <contract> update <relayer> true
npm run bp run relayerManagement <contract> update <relayer> false
```

## 📊 Contract Statistics

The enhanced contract tracks:
- Total orders created
- Total volume processed
- Total resolves completed
- Number of relayers
- Escrow contracts deployed
- Success rates

## 🔒 Security Features

- **HTLC**: Hashlock/timelock for secure swaps
- **Whitelist**: Controlled access to resolvers
- **Validation**: Chain ID and parameter validation
- **Expiration**: Automatic order expiration handling
- **Partial Fills**: Secure multi-secret system

## 🎯 Hackathon Compliance

✅ **Bi-directional swaps** - TON ↔ EVM chains  
✅ **HTLC management** - Proper hashlock/timelock  
✅ **Escrow factory** - Deploy on target chains  
✅ **Partial fills** - Multiple secrets for multiple resolvers  
✅ **Relayer system** - Non-EVM chain support  
✅ **L2 support** - Base/Arbitrum/etc  
✅ **Smart contract only** - No REST APIs  
✅ **Mainnet ready** - Production deployment support  

## 🚀 Deployment Examples

### Testnet Deployment
```bash
# Deploy to TON testnet
npm run bp run deployTonFusion

# Create test orders
npm run bp run createBidirectionalOrder <contract> ton-to-evm -239 1 <jetton> <sender> <receiver> <hashlock> <timelock> <amount>
```

### Mainnet Deployment
```bash
# Deploy to TON mainnet
npm run bp run deployTonFusion

# Deploy escrow to Base
npm run bp run escrowFactory <contract> deploy 8453 <baseAddress>

# Register relayers
npm run bp run relayerManagement <contract> register <relayer1>
npm run bp run relayerManagement <contract> register <relayer2>
```

## 📝 Notes

- All scripts work at smart contract level only (no REST APIs)
- Supports multiple secrets for partial fills
- Includes relayer statistics tracking
- Ready for Base/Arbitrum/L2 deployment
- Enhanced jetton wallet calculation
- Comprehensive error handling
- Production-ready security features

This implementation meets all hackathon requirements and provides a complete bi-directional swap solution with advanced features for production use. 