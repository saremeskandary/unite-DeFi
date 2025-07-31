#!/bin/bash

# Faucet Status Checker
echo "🔍 Checking Faucet and Service Status"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Checking Bitcoin Testnet Services...${NC}"

# Check Bitcoin node
if curl -s -u test:test -X POST http://localhost:18332 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "1.0", "id": "test", "method": "getblockchaininfo", "params": []}' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Bitcoin testnet node is running${NC}"
else
    echo -e "${RED}❌ Bitcoin testnet node is not responding${NC}"
fi

# Check Bitcoin faucet
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Bitcoin faucet is running${NC}"
    
    # Get faucet balance
    BALANCE=$(curl -s http://localhost:3001/balance 2>/dev/null | grep -o '"balance":[^,]*' | cut -d':' -f2)
    if [ ! -z "$BALANCE" ]; then
        echo -e "${GREEN}💰 Faucet balance: $BALANCE BTC${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not get faucet balance${NC}"
    fi
else
    echo -e "${RED}❌ Bitcoin faucet is not responding${NC}"
fi

echo -e "${BLUE}Step 2: Checking Wallet Addresses...${NC}"

# Get addresses from environment
ETH_ADDRESS=${NEXT_PUBLIC_ETH_ADDRESS:-""}
BTC_ADDRESS=${NEXT_PUBLIC_BTC_ADDRESS:-"mp9Z7K1BBCkYvLqepPM7ixKVdEJjkHE1nt"}

if [ ! -z "$ETH_ADDRESS" ] && [ "$ETH_ADDRESS" != "your_ethereum_address_here" ]; then
    echo -e "${GREEN}✅ Ethereum address configured: $ETH_ADDRESS${NC}"
else
    echo -e "${YELLOW}⚠️  Ethereum address not configured${NC}"
fi

echo -e "${GREEN}✅ Bitcoin address configured: $BTC_ADDRESS${NC}"

echo -e "${BLUE}Step 3: Available Faucets...${NC}"

echo -e "${YELLOW}🔗 Sepolia ETH Faucets:${NC}"
echo "  • Alchemy: https://sepoliafaucet.com/"
echo "  • Infura: https://www.infura.io/faucet/sepolia"
echo "  • Paradigm: https://faucet.paradigm.xyz/"
echo "  • QuickNode: https://faucet.quicknode.com/ethereum/sepolia"

echo -e "${YELLOW}🔗 Sepolia USDC Faucets:${NC}"
echo "  • Circle: https://faucet.circle.com/"
echo "  • Paradigm: https://faucet.paradigm.xyz/"

echo -e "${YELLOW}🔗 Bitcoin Testnet Faucets:${NC}"
echo "  • Local: http://localhost:3001"
echo "  • Mempool: https://testnet-faucet.mempool.co/"
echo "  • Coinfaucet: https://coinfaucet.eu/en/btc-testnet/"

echo -e "${BLUE}Step 4: Quick Commands...${NC}"

echo -e "${YELLOW}💡 Get Bitcoin testnet tokens:${NC}"
echo "curl -X POST http://localhost:3001/send \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"address\": \"$BTC_ADDRESS\", \"amount\": 0.01}'"

echo -e "${YELLOW}💡 Check Bitcoin faucet balance:${NC}"
echo "curl http://localhost:3001/balance"

echo -e "${YELLOW}💡 Check Bitcoin node status:${NC}"
echo "curl -u test:test -X POST http://localhost:18332 \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"jsonrpc\": \"1.0\", \"id\": \"test\", \"method\": \"getblockchaininfo\", \"params\": []}'"

echo -e "${GREEN}🎉 Status check complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Visit the faucet URLs above to get testnet tokens"
echo "2. Use the quick commands to interact with local services"
echo "3. Check balances on block explorers"
echo "4. Start testing your 1inch integration!" 