# TRON Integration

This directory contains the TRON blockchain integration for the cross-chain escrow system.

## Overview

The TRON integration provides escrow functionality on the TRON network using Solidity smart contracts. It supports:

- Escrow creation and management
- Time-locked transactions
- Cross-chain escrow coordination
- Safe math operations for TRX

## Directory Structure

```
tron/
├── contracts/           # Solidity smart contracts
│   ├── EscrowFactory.sol
│   ├── EscrowSrc.sol
│   ├── EscrowDst.sol
│   ├── TimelocksLib.sol
│   └── helpers/
│        └── SafeMathTRX.sol
├── test/               # Foundry test files
│   ├── happy-withdraw-tron.t.sol
│   ├── cancel-escrow-tron.t.sol
│   └── edge-cases-tron.t.sol
├── scripts/            # Build and deployment scripts
│   ├── compile_tron.sh
│   ├── deploy_tron.sh
│   └── resolver_tron.js
├── sdk/                # TypeScript SDK
│   ├── order-manager-tron.ts
│   └── resolver-tron.ts
├── docs/               # Documentation
│   └── README.md
└── chain-metadata.json # Network configuration
```

## Quick Start

### Prerequisites

- Foundry (for compilation and testing)
- Node.js (for scripts and SDK)
- TRON Nile testnet access

### Compilation

```bash
bash tron/scripts/compile_tron.sh
```

### Deployment

```bash
bash tron/scripts/deploy_tron.sh
```

### Testing

```bash
forge test --match-path tron/test/*.t.sol
```

### Resolver Script

```bash
node tron/scripts/resolver_tron.js <escrow_id>
```

## Network Configuration

- **Chain ID**: 24 (TRON Nile Testnet)
- **RPC URL**: https://nile.trongrid.io
- **Native Currency**: TRX (6 decimals)
- **Block Time**: ~3 seconds

## Smart Contracts

### EscrowFactory
Factory contract for creating new escrow instances.

### EscrowSrc
Source escrow contract for initiating cross-chain transactions.

### EscrowDst
Destination escrow contract for completing cross-chain transactions.

### TimelocksLib
Library for managing time-locked operations.

### SafeMathTRX
Safe math operations for TRX token calculations.

## SDK Usage

```typescript
import { TronOrderManager } from './sdk/order-manager-tron';
import { TronResolver } from './sdk/resolver-tron';

// Initialize order manager
const orderManager = new TronOrderManager({
    rpcUrl: 'https://nile.trongrid.io',
    chainId: 24,
    escrowFactoryAddress: '0x...',
    escrowSrcAddress: '0x...',
    escrowDstAddress: '0x...'
});

// Create an order
const order = await orderManager.createOrder(
    recipient,
    amount,
    timelock,
    signer
);

// Initialize resolver
const resolver = new TronResolver({
    rpcUrl: 'https://nile.trongrid.io',
    chainId: 24,
    escrowFactoryAddress: '0x...',
    escrowSrcAddress: '0x...',
    escrowDstAddress: '0x...'
});

// Resolve an escrow
const resolution = await resolver.resolveEscrow(escrowId);
```

## Development

### Adding New Features

1. Update contracts in `contracts/`
2. Add tests in `test/`
3. Update SDK in `sdk/`
4. Update scripts in `scripts/`
5. Update documentation in `docs/`

### Testing Strategy

- **Happy Path**: Test successful escrow creation and completion
- **Cancellation**: Test escrow cancellation scenarios
- **Edge Cases**: Test boundary conditions and error cases

## Security Considerations

- All math operations use SafeMathTRX
- Time-locks prevent premature completion
- Access controls on critical functions
- Reentrancy protection

## TODO

- [ ] Port EscrowFactory from cross-chain-swap
- [ ] Port EscrowSrc from cross-chain-swap
- [ ] Port EscrowDst from cross-chain-swap
- [ ] Port TimelocksLib from cross-chain-swap
- [ ] Port SafeMathTRX from cross-chain-swap
- [ ] Set chainId = 24 and configure Nile RPC
- [ ] Write JSON addresses for later CI use
- [ ] Implement actual escrow resolution logic
- [ ] Add comprehensive test coverage
- [ ] Add gas optimization
- [ ] Add security audit 