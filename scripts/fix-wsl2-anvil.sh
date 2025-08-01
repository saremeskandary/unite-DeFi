#!/bin/bash

echo "🔧 Fixing WSL2 Anvil connection issues..."

# Get WSL2 IP address
WSL2_IP=$(ip route show default | awk '/default/ {print $3}')
echo "🌐 WSL2 IP Address: $WSL2_IP"

echo ""
echo "📋 MetaMask Configuration:"
echo "=========================="
echo "Network Name: Anvil"
echo "RPC URL: http://$WSL2_IP:8545"
echo "Chain ID: 31337"
echo "Currency Symbol: ETH"
echo "Block Explorer URL: (leave empty)"
echo ""

echo "🚀 Starting Anvil with WSL2 configuration..."
anvil \
    --host 0.0.0.0 \
    --port 8545 \
    --accounts 10 \
    --balance 10000 \
    --gas-limit 30000000 \
    --gas-price 20000000000 \
    --block-time 1 \
    --chain-id 31337 \
    --no-mining

echo ""
echo "✅ Anvil is now running!"
echo "🌐 Connect MetaMask using: http://$WSL2_IP:8545"
echo ""
echo "Press Ctrl+C to stop Anvil" 