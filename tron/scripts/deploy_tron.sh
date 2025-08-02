#!/bin/bash

# TODO: write JSON addresses for later CI use

set -e

echo "Deploying TRON contracts..."

# Check if Foundry is installed
if ! command -v forge &> /dev/null; then
    echo "Error: Foundry is not installed. Please install Foundry first."
    exit 1
fi

# Check if build artifacts exist
if [ ! -d "../build/tron" ]; then
    echo "Error: Build artifacts not found. Please run compile_tron.sh first."
    exit 1
fi

# Set up environment variables
export PRIVATE_KEY=${PRIVATE_KEY:-"0x0000000000000000000000000000000000000000000000000000000000000001"}
export RPC_URL=${RPC_URL:-"https://nile.trongrid.io"}

echo "Using RPC URL: $RPC_URL"
echo "Using Private Key: ${PRIVATE_KEY:0:10}..."

# Deploy contracts using Foundry
echo "Deploying EscrowFactory..."
FACTORY_ADDRESS=$(forge create --rpc-url $RPC_URL --private-key $PRIVATE_KEY \
    --contracts tron/contracts/EscrowFactory.sol:EscrowFactory \
    --json | jq -r '.deployedTo')

echo "Deploying EscrowSrc..."
SRC_ADDRESS=$(forge create --rpc-url $RPC_URL --private-key $PRIVATE_KEY \
    --contracts tron/contracts/EscrowSrc.sol:EscrowSrc \
    --json | jq -r '.deployedTo')

echo "Deploying EscrowDst..."
DST_ADDRESS=$(forge create --rpc-url $RPC_URL --private-key $PRIVATE_KEY \
    --contracts tron/contracts/EscrowDst.sol:EscrowDst \
    --json | jq -r '.deployedTo')

# Update addresses.json
echo "Updating contract addresses..."
cat > ../build/tron/addresses.json << EOF
{
  "escrowFactory": "$FACTORY_ADDRESS",
  "escrowSrc": "$SRC_ADDRESS",
  "escrowDst": "$DST_ADDRESS",
  "network": "tron",
  "chainId": 24,
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

echo "✅ Deployment completed!"
echo "Contract addresses:"
echo "  EscrowFactory: $FACTORY_ADDRESS"
echo "  EscrowSrc: $SRC_ADDRESS"
echo "  EscrowDst: $DST_ADDRESS"
echo "Addresses saved to ../build/tron/addresses.json" 