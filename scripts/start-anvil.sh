#!/bin/bash

echo "🚀 Starting Anvil local blockchain..."

# Check if anvil is installed
if ! command -v anvil &> /dev/null; then
    echo "❌ Anvil is not installed. Please install it first:"
    echo "   cargo install --git https://github.com/foundry-rs/foundry.git anvil --locked"
    exit 1
fi

# Start Anvil with predefined accounts and balances
anvil \
    --host 127.0.0.1 \
    --port 8545 \
    --accounts 10 \
    --balance 10000 \
    --gas-limit 30000000 \
    --gas-price 20000000000 \
    --block-time 1 \
    --chain-id 31337 \
    --no-mining \
    --silent

echo "✅ Anvil started on http://localhost:8545"
echo "📋 Chain ID: 31337"
echo "💰 10 accounts with 10,000 ETH each"
echo "⛽ Gas limit: 30,000,000"
echo "⛽ Gas price: 20 gwei"
echo ""
echo "🔑 Private keys for testing:"
echo "   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
echo "   0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
echo "   0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
echo ""
echo "Press Ctrl+C to stop Anvil" 