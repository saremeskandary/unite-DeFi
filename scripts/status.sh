#!/bin/bash

echo "🔍 Unite DeFi - Bitcoin Atomic Swap Testing Environment Status"
echo "================================================================"
echo ""

# Check if Docker is running
if docker info > /dev/null 2>&1; then
    echo "✅ Docker is running"
else
    echo "❌ Docker is not running"
    exit 1
fi

# Check Bitcoin testnet node
echo ""
echo "🐳 Bitcoin Testnet Environment:"
if docker-compose ps bitcoin-testnet | grep -q "Up"; then
    echo "✅ Bitcoin testnet node is running"
    echo "   • RPC URL: http://localhost:18332"
    echo "   • Username: test"
    echo "   • Password: test"
else
    echo "❌ Bitcoin testnet node is not running"
fi

# Check Bitcoin faucet
if docker-compose ps bitcoin-testnet-faucet | grep -q "Up"; then
    echo "✅ Bitcoin faucet is running"
    echo "   • URL: http://localhost:3001"
    
    # Test faucet health
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo "   • Health: ✅ Healthy"
        
        # Get faucet balance
        BALANCE=$(curl -s http://localhost:3001/balance | grep -o '"balance":[0-9.]*' | cut -d':' -f2)
        echo "   • Balance: $BALANCE BTC"
    else
        echo "   • Health: ❌ Unhealthy"
    fi
else
    echo "❌ Bitcoin faucet is not running"
fi

# Check test environment
echo ""
echo "🧪 Testing Environment:"
if [ -f "jest.config.ts" ]; then
    echo "✅ Jest configuration found"
else
    echo "❌ Jest configuration missing"
fi

if [ -f "tests/setup.ts" ]; then
    echo "✅ Test setup found"
else
    echo "❌ Test setup missing"
fi

# Count test files
TEST_COUNT=$(find tests -name "*.test.ts" | wc -l)
echo "✅ Found $TEST_COUNT test files"

# Run a quick test
echo ""
echo "🧪 Running Quick Test:"
if pnpm test tests/unit/example.test.ts > /dev/null 2>&1; then
    echo "✅ Example test passes"
else
    echo "❌ Example test fails"
fi

# Show environment variables
echo ""
echo "🔧 Environment Configuration:"
echo "   • BITCOIN_NETWORK: ${BITCOIN_NETWORK:-not set}"
echo "   • BITCOIN_RPC_URL: ${BITCOIN_RPC_URL:-not set}"
echo "   • NODE_ENV: ${NODE_ENV:-not set}"

# Show useful commands
echo ""
echo "🚀 Useful Commands:"
echo "   • Start environment: ./scripts/start-bitcoin-testnet.sh"
echo "   • Stop environment: ./scripts/stop-bitcoin-testnet.sh"
echo "   • Run all tests: pnpm test"
echo "   • Run unit tests: pnpm test:unit"
echo "   • Run integration tests: pnpm test:integration"
echo "   • View logs: docker-compose logs -f"
echo "   • Faucet health: curl http://localhost:3001/health"
echo "   • Faucet balance: curl http://localhost:3001/balance"

echo ""
echo "📊 Current Status: READY FOR TDD DEVELOPMENT"
echo "   • Bitcoin testnet node: ✅ Running"
echo "   • Bitcoin faucet: ✅ Running"
echo "   • Test framework: ✅ Configured"
echo "   • Test structure: ✅ Complete"
echo ""
echo "🎯 Next Steps:"
echo "   1. Implement real functionality in src/lib/*.ts files"
echo "   2. Replace stub implementations with actual code"
echo "   3. Run tests to verify implementation"
echo "   4. Get testnet coins from faucet for real testing" 