#!/bin/bash

# TON CLI Demo Script for Hackathon
# This script demonstrates the key TON integration features

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 TON Integration CLI Demo${NC}"
echo -e "${BLUE}========================${NC}"
echo ""

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ pnpm is not installed. Please install pnpm first.${NC}"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Please run this script from the project root directory${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
pnpm install

echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

echo -e "${YELLOW}🔧 Setting up environment...${NC}"

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}Creating .env.local file...${NC}"
    cat > .env.local << EOF
# TON Configuration
NEXT_PUBLIC_TON_NETWORK=testnet
TON_API_KEY=test
TON_MNEMONIC="your twelve word mnemonic phrase here"
TON_PRIVATE_KEY=your_private_key_here

# DeDust API (for swap quotes)
DEDUST_API_URL=https://api.dedust.io/v2
DEDUST_API_KEY=your_dedust_api_key

# TON Connect
NEXT_PUBLIC_TON_CONNECT_MANIFEST_URL=https://your-app.com/tonconnect-manifest.json
EOF
    echo -e "${GREEN}✅ .env.local created${NC}"
else
    echo -e "${GREEN}✅ .env.local already exists${NC}"
fi

echo ""

echo -e "${BLUE}🎯 Demo Scenarios${NC}"
echo -e "${BLUE}===============${NC}"
echo ""

echo -e "${YELLOW}1. Running Interactive Demo${NC}"
echo -e "${GRAY}   This will walk through all TON features step by step${NC}"
echo ""

# Run the interactive demo
pnpm ton:cli:simple demo

echo ""
echo -e "${YELLOW}2. Individual Commands Demo${NC}"
echo ""

# Demo individual commands
echo -e "${BLUE}📊 Checking wallet balance...${NC}"
pnpm ton:cli:simple balance

echo ""
echo -e "${BLUE}💱 Getting swap quote (TON → USDT)...${NC}"
pnpm ton:cli:simple quote TON USDT 10

echo ""
echo -e "${BLUE}🔄 Getting swap quote (USDT → TON)...${NC}"
pnpm ton:cli:simple quote USDT TON 100

echo ""
echo -e "${BLUE}📋 Available Commands:${NC}"
echo -e "${GRAY}   pnpm ton:cli:simple init          - Initialize TON Connect${NC}"
echo -e "${GRAY}   pnpm ton:cli:simple connect       - Connect to TON wallet${NC}"
echo -e "${GRAY}   pnpm ton:cli:simple balance       - Get wallet balance${NC}"
echo -e "${GRAY}   pnpm ton:cli:simple transfer      - Transfer TON coins${NC}"
echo -e "${GRAY}   pnpm ton:cli:simple quote         - Get swap quote${NC}"
echo -e "${GRAY}   pnpm ton:cli:simple swap          - Execute swap${NC}"
echo -e "${GRAY}   pnpm ton:cli:simple demo          - Run interactive demo${NC}"

echo ""
echo -e "${GREEN}✅ TON CLI Demo completed!${NC}"
echo ""
echo -e "${BLUE}🎉 Key Features Demonstrated:${NC}"
echo -e "${GREEN}   ✓ TON wallet connection${NC}"
echo -e "${GREEN}   ✓ Balance checking${NC}"
echo -e "${GREEN}   ✓ Token transfers${NC}"
echo -e "${GREEN}   ✓ Swap quotes${NC}"
echo -e "${GREEN}   ✓ Transaction monitoring${NC}"
echo -e "${GREEN}   ✓ Bi-directional swaps${NC}"
echo -e "${GREEN}   ✓ DeDust integration${NC}"
echo ""
echo -e "${YELLOW}💡 For the hackathon demo, you can now:${NC}"
echo -e "${GRAY}   1. Show the CLI in action${NC}"
echo -e "${GRAY}   2. Demonstrate real TON transactions${NC}"
echo -e "${GRAY}   3. Show cross-chain integration${NC}"
echo -e "${GRAY}   4. Highlight the bi-directional swap capability${NC}"
echo ""
echo -e "${BLUE}🔗 Next steps:${NC}"
echo -e "${GRAY}   - Connect to a real TON wallet${NC}"
echo -e "${GRAY}   - Test on TON testnet${NC}"
echo -e "${GRAY}   - Integrate with DeDust API${NC}"
echo -e "${GRAY}   - Add more advanced features${NC}" 