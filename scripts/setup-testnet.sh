#!/bin/bash

# Testnet Setup Script for 1inch Integration
echo "🚀 Setting up 1inch Integration Testnet Environment"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Checking prerequisites...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ pnpm is not installed. Please install pnpm first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

echo -e "${BLUE}Step 2: Installing dependencies...${NC}"
pnpm install

echo -e "${BLUE}Step 3: Setting up environment files...${NC}"

# Copy environment files if they don't exist
if [ ! -f .env.local ]; then
    cp env.example .env.local
    echo -e "${YELLOW}⚠️  Created .env.local - Please update with your API keys${NC}"
fi

if [ ! -f .env.test ]; then
    cp env.test.example .env.test
    echo -e "${YELLOW}⚠️  Created .env.test - Test configuration ready${NC}"
fi

echo -e "${BLUE}Step 4: Starting Bitcoin testnet...${NC}"
./scripts/start-bitcoin-testnet.sh

echo -e "${BLUE}Step 5: Waiting for services to be ready...${NC}"
sleep 10

# Check if Bitcoin node is ready
echo -e "${BLUE}Step 6: Verifying services...${NC}"

# Check Bitcoin node
if curl -s -u test:test -X POST http://localhost:18332 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "1.0", "id": "test", "method": "getblockchaininfo", "params": []}' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Bitcoin testnet node is ready${NC}"
else
    echo -e "${RED}❌ Bitcoin testnet node is not responding${NC}"
fi

# Check faucet
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Bitcoin faucet is ready${NC}"
else
    echo -e "${RED}❌ Bitcoin faucet is not responding${NC}"
fi

echo -e "${BLUE}Step 7: Getting testnet Bitcoin...${NC}"

# Get testnet Bitcoin to the generated address
curl -X POST http://localhost:3001/send \
  -H "Content-Type: application/json" \
  -d '{"address": "mp9Z7K1BBCkYvLqepPM7ixKVdEJjkHE1nt", "amount": 0.01}' > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Sent 0.01 BTC to testnet address${NC}"
else
    echo -e "${YELLOW}⚠️  Could not send testnet Bitcoin (faucet might be empty)${NC}"
fi

echo -e "${BLUE}Step 8: Running tests...${NC}"
pnpm test:btc

echo -e "${GREEN}🎉 Testnet setup complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Get your 1inch API key from https://portal.1inch.dev/"
echo "2. Update .env.local with your API keys:"
echo "   - NEXT_PUBLIC_INCH_API_KEY=your_1inch_api_key"
echo "   - NEXT_PUBLIC_ETH_PRIVATE_KEY=your_sepolia_private_key"
echo "   - NEXT_PUBLIC_ETH_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY"
echo "3. Get Sepolia testnet ETH from https://sepoliafaucet.com/"
echo "4. Run 'pnpm dev' to start development"
echo ""
echo -e "${BLUE}Services running:${NC}"
echo "- Bitcoin Testnet: http://localhost:18332"
echo "- Bitcoin Faucet: http://localhost:3001"
echo "- Development Server: http://localhost:3000 (run 'pnpm dev')" 