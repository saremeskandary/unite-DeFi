# TON Contract Deployment Guide

## 🚀 Deploying TON Fusion Contract to Testnet

This guide shows you how to deploy the TON Fusion contract to the TON blockchain testnet for cross-chain atomic swaps.

## 📋 Prerequisites

### 1. Install Dependencies

```bash
# Navigate to TON contracts directory
cd contracts/ton

# Install dependencies
pnpm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the `contracts/ton` directory:

```bash
# TON Testnet Configuration
TON_NETWORK=testnet
TON_RPC_URL=https://testnet.toncenter.com/api/v2/jsonRPC
TON_API_KEY=your_ton_api_key_here

# Wallet Configuration
TON_PRIVATE_KEY=your_ton_private_key_here
TON_MNEMONIC="your twelve word mnemonic phrase here"

# Contract Configuration
CONTRACT_OWNER=EQDyour_owner_address_here
INITIAL_BALANCE=0.1
```

### 3. Get TON Testnet Coins

You'll need testnet TON coins for deployment:

```bash
# Get testnet TON from faucet
# Visit: https://t.me/testgiver_ton_bot
# Or: https://t.me/toncoin_bot
```

## 🔧 Build the Contract

### 1. Compile the Contract

```bash
# Build the contract
pnpm run build

# This will create the build artifacts in build/TonFusion/
```

### 2. Verify Build Output

```bash
# Check build directory
ls -la build/TonFusion/

# You should see:
# - TonFusion_TonFusion.ts (TypeScript wrapper)
# - TonFusion_TonFusion.cell (compiled contract)
# - TonFusion_TonFusion.tact (source)
```

## 🚀 Deploy to Testnet

### Method 1: Using Blueprint (Recommended)

```bash
# Deploy using the built-in script
pnpm run bp run deployTonFusion

# This will:
# 1. Compile the contract
# 2. Deploy to testnet
# 3. Wait for confirmation
# 4. Display contract address
```

### Method 2: Manual Deployment

```bash
# Create deployment script
cat > deploy-manual.ts << 'EOF'
import { toNano, Address } from '@ton/core';
import { TonFusion } from './build/TonFusion/TonFusion_TonFusion';
import { NetworkProvider, compile } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    // Compile the contract
    const tonFusion = compile('TonFusion');
    
    // Deploy with initial parameters
    const contract = provider.open(
        await TonFusion.fromInit(
            Address.parse(process.env.CONTRACT_OWNER || provider.sender().address!.toString())
        )
    );

    // Send deployment transaction
    await contract.send(
        provider.sender(),
        {
            value: toNano(process.env.INITIAL_BALANCE || '0.1'),
        },
        null
    );

    // Wait for deployment
    await provider.waitForDeploy(contract.address);

    console.log('✅ TonFusion deployed successfully!');
    console.log('📋 Contract address:', contract.address.toString());
    console.log('👤 Owner:', provider.sender().address?.toString());
    console.log('🔗 Explorer:', `https://testnet.tonscan.org/address/${contract.address.toString()}`);
}
EOF

# Run manual deployment
pnpm run bp run deploy-manual
```

### Method 3: Using TON CLI

```bash
# Install TON CLI if not already installed
npm install -g @ton/cli

# Deploy using TON CLI
ton-cli deploy \
  --network testnet \
  --contract build/TonFusion/TonFusion_TonFusion.cell \
  --owner EQDyour_owner_address_here \
  --amount 0.1
```

## 🔍 Verify Deployment

### 1. Check Contract on Explorer

```bash
# Get your contract address from deployment output
# Then visit: https://testnet.tonscan.org/address/YOUR_CONTRACT_ADDRESS
```

### 2. Verify Contract State

```bash
# View contract state
pnpm run bp run viewContract YOUR_CONTRACT_ADDRESS
```

### 3. Test Basic Functions

```bash
# Set whitelist for testing
pnpm run bp run setWhitelist YOUR_CONTRACT_ADDRESS YOUR_TEST_ADDRESS true

# Create a test order
pnpm run bp run createBidirectionalOrder YOUR_CONTRACT_ADDRESS ton-to-evm -3 1 \
  EQDtest_jetton_address \
  EQDsender_address \
  EQDreceiver_address \
  test_hashlock \
  3600 \
  0.01
```

## 🧪 Test the Deployed Contract

### 1. Initialize Contract

```bash
# Set up initial configuration
pnpm run bp run setWhitelist YOUR_CONTRACT_ADDRESS YOUR_RESOLVER_ADDRESS true

# Configure EVM chain support
pnpm run bp run escrowFactory YOUR_CONTRACT_ADDRESS deploy 1 YOUR_ETHEREUM_CONTRACT
```

### 2. Create Test Orders

```bash
# Create TON → Ethereum order
pnpm run bp run createBidirectionalOrder YOUR_CONTRACT_ADDRESS \
  ton-to-evm \
  -3 1 \
  EQDtest_jetton \
  EQDsender \
  EQDreceiver \
  $(openssl rand -hex 32) \
  3600 \
  0.01

# Create Ethereum → TON order
pnpm run bp run createBidirectionalOrder YOUR_CONTRACT_ADDRESS \
  evm-to-ton \
  1 -3 \
  EQDtest_jetton \
  EQDsender \
  EQDreceiver \
  $(openssl rand -hex 32) \
  3600 \
  0.01 \
  0x1234567890abcdef
```

### 3. Test Partial Fills

```bash
# Generate test secrets
pnpm run bp run generateSecret

# Create partial fill
pnpm run bp run partialFill YOUR_CONTRACT_ADDRESS \
  fill \
  ORDER_HASH \
  SECRET \
  0.005 \
  RESOLVER_ADDRESS
```

## 🔧 Configuration Scripts

### 1. Setup Script

```bash
cat > setup-contract.sh << 'EOF'
#!/bin/bash

CONTRACT_ADDRESS=$1
OWNER_ADDRESS=$2

if [ -z "$CONTRACT_ADDRESS" ] || [ -z "$OWNER_ADDRESS" ]; then
    echo "Usage: ./setup-contract.sh <contract_address> <owner_address>"
    exit 1
fi

echo "🔧 Setting up TonFusion contract..."

# Set whitelist for owner
echo "📝 Setting whitelist for owner..."
pnpm run bp run setWhitelist $CONTRACT_ADDRESS $OWNER_ADDRESS true

# Configure Ethereum support
echo "🔗 Configuring Ethereum support..."
pnpm run bp run escrowFactory $CONTRACT_ADDRESS deploy 1 0x0000000000000000000000000000000000000000

# Configure Polygon support
echo "🔗 Configuring Polygon support..."
pnpm run bp run escrowFactory $CONTRACT_ADDRESS deploy 137 0x0000000000000000000000000000000000000000

# Configure BSC support
echo "🔗 Configuring BSC support..."
pnpm run bp run escrowFactory $CONTRACT_ADDRESS deploy 56 0x0000000000000000000000000000000000000000

echo "✅ Contract setup complete!"
echo "📋 Contract: $CONTRACT_ADDRESS"
echo "👤 Owner: $OWNER_ADDRESS"
EOF

chmod +x setup-contract.sh
```

### 2. Test Script

```bash
cat > test-contract.sh << 'EOF'
#!/bin/bash

CONTRACT_ADDRESS=$1

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo "Usage: ./test-contract.sh <contract_address>"
    exit 1
fi

echo "🧪 Testing TonFusion contract..."

# View contract state
echo "📊 Contract state:"
pnpm run bp run viewContract $CONTRACT_ADDRESS

# Create test order
echo "📝 Creating test order..."
ORDER_HASH=$(openssl rand -hex 32)
SECRET=$(openssl rand -hex 32)

pnpm run bp run createBidirectionalOrder $CONTRACT_ADDRESS \
  ton-to-evm \
  -3 1 \
  EQDtest_jetton \
  EQDsender \
  EQDreceiver \
  $ORDER_HASH \
  3600 \
  0.01

echo "✅ Test complete!"
echo "📋 Order hash: $ORDER_HASH"
echo "🔑 Secret: $SECRET"
EOF

chmod +x test-contract.sh
```

## 🐛 Troubleshooting

### Common Issues

1. **Insufficient Balance**
```bash
# Check balance
pnpm run bp run getFund YOUR_ADDRESS

# Get more testnet TON from faucet
```

2. **Compilation Errors**
```bash
# Clean and rebuild
rm -rf build/
pnpm run build
```

3. **Network Issues**
```bash
# Check network connectivity
curl -X POST https://testnet.toncenter.com/api/v2/jsonRPC \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"getMasterchainInfo","params":{},"id":1}'
```

4. **Contract Not Found**
```bash
# Verify contract address
pnpm run bp run viewContract YOUR_CONTRACT_ADDRESS

# Check explorer
echo "https://testnet.tonscan.org/address/YOUR_CONTRACT_ADDRESS"
```

## 📊 Monitoring

### 1. Contract Events

```bash
# Monitor contract events
pnpm run bp run viewContract YOUR_CONTRACT_ADDRESS --events
```

### 2. Network Status

```bash
# Check TON testnet status
curl -X POST https://testnet.toncenter.com/api/v2/jsonRPC \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"getMasterchainInfo","params":{},"id":1}'
```

### 3. Gas Usage

```bash
# Monitor gas usage
pnpm run bp run viewContract YOUR_CONTRACT_ADDRESS --gas
```

## 🔄 Continuous Deployment

### GitHub Actions Example

```yaml
name: Deploy TON Contract

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd contracts/ton
          pnpm install
          
      - name: Build contract
        run: |
          cd contracts/ton
          pnpm run build
          
      - name: Deploy to testnet
        run: |
          cd contracts/ton
          pnpm run bp run deployTonFusion
        env:
          TON_PRIVATE_KEY: ${{ secrets.TON_PRIVATE_KEY }}
          TON_NETWORK: testnet
```

## 📚 Additional Resources

- [TON Documentation](https://ton.org/docs)
- [Tact Language Guide](https://tact-lang.org/)
- [TON Testnet Explorer](https://testnet.tonscan.org/)
- [TON Center API](https://toncenter.com/api/v2/)
- [Cross-Chain Resolver Implementation](./CROSS_CHAIN_RESOLVER_IMPLEMENTATION_SUMMARY.md)

## 🎯 Next Steps

After successful deployment:

1. **Verify Contract**: Check all functions work correctly
2. **Set Up Monitoring**: Monitor contract events and gas usage
3. **Test Integration**: Test with your cross-chain resolver
4. **Deploy to Mainnet**: When ready, deploy to TON mainnet
5. **Documentation**: Update your integration documentation 