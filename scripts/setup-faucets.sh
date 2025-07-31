#!/bin/bash

# Faucet Setup Script for Testnet Tokens
echo "🚰 Setting up Faucets for Testnet Tokens"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Checking your wallet address...${NC}"

# Get Ethereum address from environment or prompt user
ETH_ADDRESS=${NEXT_PUBLIC_ETH_ADDRESS:-""}
if [ -z "$ETH_ADDRESS" ]; then
    echo -e "${YELLOW}⚠️  Please enter your Ethereum address (for Sepolia):${NC}"
    read -p "Ethereum Address: " ETH_ADDRESS
fi

# Get Bitcoin address from environment or prompt user
BTC_ADDRESS=${NEXT_PUBLIC_BTC_ADDRESS:-"mp9Z7K1BBCkYvLqepPM7ixKVdEJjkHE1nt"}
if [ -z "$BTC_ADDRESS" ]; then
    echo -e "${YELLOW}⚠️  Please enter your Bitcoin testnet address:${NC}"
    read -p "Bitcoin Address: " BTC_ADDRESS
fi

echo -e "${GREEN}✅ Using addresses:${NC}"
echo -e "Ethereum: ${ETH_ADDRESS}"
echo -e "Bitcoin: ${BTC_ADDRESS}"

echo -e "${BLUE}Step 2: Getting Sepolia ETH...${NC}"

# Sepolia ETH Faucets
echo -e "${YELLOW}🔗 Sepolia ETH Faucets:${NC}"
echo "1. Alchemy Sepolia Faucet: https://sepoliafaucet.com/"
echo "2. Infura Sepolia Faucet: https://www.infura.io/faucet/sepolia"
echo "3. Paradigm Faucet: https://faucet.paradigm.xyz/"
echo "4. QuickNode Faucet: https://faucet.quicknode.com/ethereum/sepolia"

echo -e "${BLUE}Step 3: Getting Sepolia USDC...${NC}"

# Sepolia USDC Faucets
echo -e "${YELLOW}🔗 Sepolia USDC Faucets:${NC}"
echo "1. Circle Faucet: https://faucet.circle.com/"
echo "2. Paradigm Faucet: https://faucet.paradigm.xyz/"

echo -e "${BLUE}Step 4: Getting Bitcoin Testnet BTC...${NC}"

# Bitcoin testnet faucet
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Local Bitcoin faucet is available${NC}"
    
    # Send Bitcoin to the address
    RESPONSE=$(curl -s -X POST http://localhost:3001/send \
      -H "Content-Type: application/json" \
      -d "{\"address\": \"$BTC_ADDRESS\", \"amount\": 0.01}")
    
    if [[ $RESPONSE == *"success"* ]] || [[ $RESPONSE == *"txid"* ]]; then
        echo -e "${GREEN}✅ Sent 0.01 BTC to $BTC_ADDRESS${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not send Bitcoin (faucet might be empty)${NC}"
        echo "Response: $RESPONSE"
    fi
else
    echo -e "${RED}❌ Local Bitcoin faucet not available${NC}"
    echo -e "${YELLOW}🔗 Online Bitcoin Testnet Faucets:${NC}"
    echo "1. Mempool Faucet: https://testnet-faucet.mempool.co/"
    echo "2. Coinfaucet: https://coinfaucet.eu/en/btc-testnet/"
    echo "3. Testnet Faucet: https://testnet.help/"
fi

echo -e "${BLUE}Step 5: Checking balances...${NC}"

# Check Bitcoin balance
if curl -s http://localhost:18332 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Bitcoin testnet node is running${NC}"
    echo -e "${YELLOW}💡 Check your Bitcoin balance with:${NC}"
    echo "curl -u test:test -X POST http://localhost:18332 \\"
    echo "  -H \"Content-Type: application/json\" \\"
    echo "  -d '{\"jsonrpc\": \"1.0\", \"id\": \"test\", \"method\": \"getbalance\", \"params\": []}'"
fi

echo -e "${GREEN}🎉 Faucet setup complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Visit the faucet URLs above to get testnet tokens"
echo "2. Wait for transactions to confirm (usually 1-2 minutes)"
echo "3. Check your balances on block explorers:"
echo "   - Sepolia: https://sepolia.etherscan.io/address/$ETH_ADDRESS"
echo "   - Bitcoin Testnet: https://testnet.blockchain.info/address/$BTC_ADDRESS"
echo "4. Start testing your 1inch integration!"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "- Check Bitcoin faucet balance: curl http://localhost:3001/balance"
echo "- Get more Bitcoin: curl -X POST http://localhost:3001/send -H \"Content-Type: application/json\" -d '{\"address\": \"$BTC_ADDRESS\", \"amount\": 0.01}'" 