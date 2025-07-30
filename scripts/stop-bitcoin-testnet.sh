#!/bin/bash

# Stop Bitcoin Testnet Environment
# This script stops the local Bitcoin testnet node and faucet service

echo "🛑 Stopping Bitcoin Testnet Environment..."

# Stop the services
docker-compose down

echo "✅ Bitcoin testnet environment stopped!"
echo ""
echo "💡 To start again, run: ./scripts/start-bitcoin-testnet.sh"
echo "💡 To remove all data, run: docker-compose down -v" 