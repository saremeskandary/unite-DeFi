# TON EVM Integration

This project implements cross-chain functionality between TON and EVM chains using HTLC (Hash Time Locked Contracts).

## 🚀 **Implementation Status**

✅ **Jetton Wallet Integration Tests** - Implemented  
✅ **EVM Integration Tests** - Implemented  
✅ **Real Jetton Contract Setup** - Created  
✅ **Comprehensive EVM Order Tests** - Added  
⚠️ **Security Audit Tests** - In Progress (9 failing tests)

## 📋 **Project Structure**

- `contracts` - Source code of all smart contracts including new test jetton contracts
- `wrappers` - Wrapper classes for contracts with [de]serialization primitives
- `tests` - Comprehensive test suite including Phase 2 implementations
- `scripts` - Scripts including test runner and deployment utilities

## 🧪 **Quick Start**

### **Run Tests**

```bash
# Run all tests including new Phase 2 implementations
./scripts/run-tests.sh

# Or run specific test suites
npm test tests/jetton_integration.spec.ts
npm test tests/evm_integration.spec.ts
```

### **Build**

```bash
npx blueprint build
# or
yarn blueprint build
```

### **Test**

```bash
npx blueprint test
# or
yarn blueprint test
```

### **Deploy**

```bash
npx blueprint run
# or
yarn blueprint run
```

## 📊 **Test Coverage**

### **Current Implementation Status**

- ✅ **Jetton Integration**: Real jetton master and wallet contracts
- ✅ **EVM Integration**: Cross-chain order creation and validation
- ✅ **Bridge Integration**: Message handling and confirmations
- ✅ **Error Handling**: Comprehensive error scenarios
- ✅ **Gas Optimization**: Multi-chain gas estimation
- ⚠️ **Security Features**: Implementation in progress (9 failing tests)

### **Supported Chains**

- Ethereum Mainnet (Chain ID: 1)
- Polygon (Chain ID: 137)
- BSC (Chain ID: 56)
- Arbitrum (Chain ID: 42161)
- Optimism (Chain ID: 10)

## 📚 **Documentation**

- [Implementation Summary](tests/IMPLEMENTATION_SUMMARY.md) - Detailed implementation status
- [Test Documentation](tests/README.md) - Test suite documentation
- [EVM Integration Checklist](ton/TON_EVM_INTEGRATION_CHECKLIST.md) - Implementation checklist
