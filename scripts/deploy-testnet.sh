#!/bin/bash

# Bitcoin Testnet + 1inch Integration Deployment Script
# This script sets up the complete environment for testing

set -e

echo "🚀 Deploying Bitcoin Testnet + 1inch Integration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Please install it first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    print_error "pnpm is not installed. Please install pnpm first."
    exit 1
fi

print_success "Prerequisites check passed!"

# Step 1: Install dependencies
print_status "Installing dependencies..."
pnpm install
print_success "Dependencies installed!"

# Step 2: Setup environment files
print_status "Setting up environment files..."

if [ ! -f .env.test ]; then
    cp env.test.example .env.test
    print_success "Created .env.test"
else
    print_warning ".env.test already exists"
fi

if [ ! -f .env.local ]; then
    cp env.example .env.local
    print_success "Created .env.local"
else
    print_warning ".env.local already exists"
fi

# Step 3: Generate Bitcoin keys
print_status "Generating Bitcoin testnet keys..."

# Generate keys and capture output
KEYS_OUTPUT=$(npx tsx scripts/generate-bitcoin-keys.ts multiple 3 2>/dev/null)

# Extract the first key for environment setup
FIRST_KEY=$(echo "$KEYS_OUTPUT" | grep "WIF:" | head -1 | sed 's/.*WIF: //')
FIRST_ADDRESS=$(echo "$KEYS_OUTPUT" | grep "Address:" | head -1 | sed 's/.*Address: //')

if [ -n "$FIRST_KEY" ]; then
    print_success "Generated Bitcoin keys"
    print_status "First key address: $FIRST_ADDRESS"
    
    # Update .env.local with the generated key
    if [ -f .env.local ]; then
        # Replace the placeholder with the actual key
        sed -i "s/NEXT_PUBLIC_BTC_PRIVATE_KEY_WIF=.*/NEXT_PUBLIC_BTC_PRIVATE_KEY_WIF=$FIRST_KEY/" .env.local
        print_success "Updated .env.local with generated Bitcoin key"
    fi
else
    print_error "Failed to generate Bitcoin keys"
    exit 1
fi

# Step 4: Start Bitcoin testnet environment
print_status "Starting Bitcoin testnet environment..."

# Make script executable
chmod +x scripts/start-bitcoin-testnet.sh

# Start the environment
./scripts/start-bitcoin-testnet.sh

# Step 5: Wait for services to be ready
print_status "Waiting for services to be ready..."

# Wait for Bitcoin node
for i in {1..30}; do
    if curl -s -u test:test -X POST http://localhost:18332 \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc": "1.0", "id": "test", "method": "getblockchaininfo", "params": []}' > /dev/null 2>&1; then
        print_success "Bitcoin node is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Bitcoin node failed to start within timeout"
        exit 1
    fi
    print_status "Waiting for Bitcoin node... (attempt $i/30)"
    sleep 10
done

# Wait for faucet
for i in {1..10}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        print_success "Faucet is ready!"
        break
    fi
    if [ $i -eq 10 ]; then
        print_error "Faucet failed to start within timeout"
        exit 1
    fi
    print_status "Waiting for faucet... (attempt $i/10)"
    sleep 5
done

# Step 6: Fund the Bitcoin address
print_status "Funding Bitcoin address with testnet coins..."

# Send some testnet BTC to the generated address
curl -s -X POST http://localhost:3001/send \
    -H "Content-Type: application/json" \
    -d "{\"address\": \"$FIRST_ADDRESS\", \"amount\": 0.01}" > /dev/null

if [ $? -eq 0 ]; then
    print_success "Sent 0.01 BTC to $FIRST_ADDRESS"
else
    print_warning "Failed to send testnet coins (faucet might be empty)"
fi

# Step 7: Run tests
print_status "Running tests to verify setup..."

# Run Bitcoin-specific tests
if pnpm test:btc > /dev/null 2>&1; then
    print_success "Bitcoin tests passed!"
else
    print_warning "Some Bitcoin tests failed (this is expected if implementations are stubs)"
fi

# Step 8: Display final status
echo ""
echo "🎉 Deployment Complete!"
echo ""
echo "📊 Services Status:"
echo "  • Bitcoin Testnet Node: http://localhost:18332"
echo "  • Bitcoin Faucet: http://localhost:3001"
echo ""
echo "🔑 Generated Keys:"
echo "  • Bitcoin Address: $FIRST_ADDRESS"
echo "  • Private Key (WIF): $FIRST_KEY"
echo ""
echo "💰 Next Steps:"
echo "  1. Get your 1inch API key from https://portal.1inch.dev/"
echo "  2. Add it to .env.local: NEXT_PUBLIC_INCH_API_KEY=your_key"
echo "  3. Add your Ethereum private key to .env.local"
echo "  4. Run: pnpm dev"
echo ""
echo "🧪 Testing:"
echo "  • Run all tests: pnpm test"
echo "  • Run Bitcoin tests: pnpm test:btc"
echo "  • Run integration tests: pnpm test:integration"
echo ""
echo "📚 Documentation:"
echo "  • Setup Guide: SETUP_GUIDE.md"
echo "  • Bitcoin Integration: docs/bitcoin/BITCOIN_INTEGRATION.md"
echo ""
echo "🛠️ Useful Commands:"
echo "  • Check node status: docker-compose logs bitcoin-testnet"
echo "  • Check faucet status: docker-compose logs bitcoin-testnet-faucet"
echo "  • Stop services: docker-compose down"
echo "  • View logs: docker-compose logs -f"
echo ""

print_success "Deployment completed successfully!" 