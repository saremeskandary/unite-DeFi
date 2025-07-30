#!/bin/bash

# Bitcoin Testnet Local Development Setup
# This script starts a local Bitcoin testnet node with a faucet service

set -e

echo "🚀 Starting Bitcoin Testnet Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install it first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p docker/faucet

# Start the services
echo "🐳 Starting Bitcoin testnet node and faucet..."
docker-compose up -d

# Wait for Bitcoin node to be ready
echo "⏳ Waiting for Bitcoin node to be ready..."
sleep 10

# Check if Bitcoin node is healthy
echo "🔍 Checking Bitcoin node health..."
for i in {1..30}; do
    if docker-compose exec bitcoin-testnet bitcoin-cli -conf=/bitcoin/.bitcoin/bitcoin.conf getblockchaininfo > /dev/null 2>&1; then
        echo "✅ Bitcoin node is ready!"
        break
    fi
    echo "⏳ Waiting for Bitcoin node... (attempt $i/30)"
    sleep 10
done

# Check faucet health
echo "🔍 Checking faucet health..."
for i in {1..10}; do
    if curl -s http://localhost:3001/health > /dev/null; then
        echo "✅ Faucet is ready!"
        break
    fi
    echo "⏳ Waiting for faucet... (attempt $i/10)"
    sleep 5
done

# Display status
echo ""
echo "🎉 Bitcoin Testnet Environment is ready!"
echo ""
echo "📊 Services:"
echo "  • Bitcoin Testnet Node: http://localhost:18332"
echo "  • Bitcoin Faucet: http://localhost:3001"
echo ""
echo "🔧 Useful Commands:"
echo "  • Check node status: docker-compose logs bitcoin-testnet"
echo "  • Check faucet status: docker-compose logs bitcoin-testnet-faucet"
echo "  • Stop services: docker-compose down"
echo "  • View logs: docker-compose logs -f"
echo ""
echo "💰 Faucet Endpoints:"
echo "  • Health check: curl http://localhost:3001/health"
echo "  • Get balance: curl http://localhost:3001/balance"
echo "  • Send coins: curl -X POST http://localhost:3001/send -H 'Content-Type: application/json' -d '{\"address\":\"YOUR_ADDRESS\",\"amount\":0.001}'"
echo ""
echo "🔗 RPC Connection:"
echo "  • Host: localhost"
echo "  • Port: 18332"
echo "  • Username: test"
echo "  • Password: test"
echo "  • Network: testnet"
echo ""
echo "📝 Environment variables for your app:"
echo "  BITCOIN_RPC_URL=http://localhost:18332"
echo "  BITCOIN_RPC_USER=test"
echo "  BITCOIN_RPC_PASS=test"
echo "  BITCOIN_NETWORK=testnet"
echo "" 