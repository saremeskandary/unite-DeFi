# Testing Overview

Comprehensive testing strategy for the Unite DeFi cross-chain atomic swap protocol.

## Testing Strategy

### Test Types

1. **Unit Tests** - Individual component testing
2. **Integration Tests** - Cross-component interaction testing
3. **End-to-End Tests** - Complete user workflow testing
4. **Security Tests** - Vulnerability and attack vector testing
5. **Performance Tests** - Load and stress testing

### Test Coverage Goals

- **Smart Contracts**: 95%+ coverage
- **Frontend Components**: 80%+ coverage
- **API Endpoints**: 90%+ coverage
- **Critical Paths**: 100% coverage

## Running Tests

### All Tests

```bash
pnpm test
```

### Specific Test Suites

```bash
# Unit tests
pnpm test:unit

# Integration tests
pnpm test:integration

# End-to-end tests
pnpm test:e2e

# Contract tests
pnpm test:contracts

# Frontend tests
pnpm test:frontend
```

### With Coverage

```bash
pnpm test:coverage
```

## Test Environment Setup

### Local Development

- **Anvil**: Local Ethereum blockchain
- **Bitcoin Testnet**: Bitcoin testnet for HTLC testing
- **Mock Services**: Simulated external APIs

### Test Networks

- **Sepolia**: Ethereum testnet
- **Bitcoin Testnet**: Bitcoin testnet
- **TON Testnet**: TON testnet
- **TRON Testnet**: TRON testnet

## Test Categories

### Smart Contract Testing

- [Contract Testing Guide](./CONTRACT_TESTING.md)
- HTLC validation
- Atomic swap logic
- Time-lock mechanisms
- Refund scenarios

### Frontend Testing

- [Frontend Testing Guide](./FRONTEND_TESTING.md)
- Component rendering
- User interactions
- Wallet integration
- Error handling

### Integration Testing

- [Integration Testing Guide](./INTEGRATION_TESTING.md)
- Cross-chain communication
- API integration
- WebSocket connections
- Database operations

### Security Testing

- [Security Testing Guide](./SECURITY_TESTING.md)
- Vulnerability scanning
- Penetration testing
- Audit preparation
- Attack vector analysis

## Test Data Management

### Test Accounts

```bash
# Anvil test accounts
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

### Test Tokens

- **USDC**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **USDT**: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`
- **WETH**: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`

## Continuous Integration

### GitHub Actions

- Automated testing on pull requests
- Coverage reporting
- Security scanning
- Performance monitoring

### Test Reports

- Coverage reports in HTML format
- Test results in JUnit format
- Performance metrics
- Security scan results

## Debugging Tests

### Common Issues

- **Network timeouts**: Increase timeout values
- **Gas estimation failures**: Use fixed gas limits
- **Race conditions**: Add proper waits
- **State conflicts**: Reset state between tests

### Debug Commands

```bash
# Run tests with verbose output
pnpm test --verbose

# Run specific test file
pnpm test --grep "test name"

# Run tests in watch mode
pnpm test:watch

# Debug with console logs
DEBUG=* pnpm test
```

## Performance Testing

### Load Testing

- Concurrent user simulation
- Transaction throughput testing
- Memory usage monitoring
- Response time analysis

### Stress Testing

- Maximum capacity testing
- Failure recovery testing
- Resource exhaustion testing
- Network partition testing

## Related Documentation

- [Quick Reference](./TESTING_QUICK_REFERENCE.md) - Common testing commands
- [Frontend Testing](./FRONTEND_TESTING.md) - UI testing guide
- [Contract Testing](./CONTRACT_TESTING.md) - Smart contract testing
- [Security Testing](./SECURITY_TESTING.md) - Security test procedures
