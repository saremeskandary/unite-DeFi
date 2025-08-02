#!/bin/bash

# TODO: write JSON addresses for later CI use

set -e

echo "Compiling TRON contracts..."

# Check if Foundry is installed
if ! command -v forge &> /dev/null; then
    echo "Error: Foundry is not installed. Please install Foundry first."
    exit 1
fi

# Create build directory if it doesn't exist
mkdir -p ../build/tron

# Compile contracts using Foundry
echo "Compiling with Foundry..."
forge build --contracts tron/contracts --out ../build/tron

# Check if compilation was successful
if [ $? -eq 0 ]; then
    echo "✅ TRON contracts compiled successfully!"
    echo "Build artifacts saved to ../build/tron/"
else
    echo "❌ Compilation failed!"
    exit 1
fi

# Generate contract addresses JSON for CI
echo "Generating contract addresses..."
cat > ../build/tron/addresses.json << EOF
{
  "escrowFactory": "",
  "escrowSrc": "",
  "escrowDst": "",
  "network": "tron",
  "chainId": 24
}
EOF

echo "✅ Compilation script completed!" 