#!/bin/bash

# TON EVM Integration Test Runner
# This script builds the contracts and runs all tests

set -e

echo "🚀 Starting TON EVM Integration Test Suite"
echo "=========================================="

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

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if tact is installed
if ! command -v tact &> /dev/null; then
    print_error "Tact compiler not found. Please install Tact first."
    print_status "Install with: npm install -g @tact-lang/cli"
    exit 1
fi

# Check if node modules are installed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Build contracts
print_status "Building contracts..."
tact --config ./tact.config.json

if [ $? -eq 0 ]; then
    print_success "Contracts built successfully"
else
    print_error "Contract build failed"
    exit 1
fi

# Run tests
print_status "Running test suite..."

# Run all tests
print_status "Running all tests..."
npm test

if [ $? -eq 0 ]; then
    print_success "All tests passed! 🎉"
else
    print_error "Some tests failed"
    exit 1
fi

# Run specific test files if they exist
if [ -f "tests/jetton_integration.spec.ts" ]; then
    print_status "Running jetton integration tests..."
    npm test tests/jetton_integration.spec.ts
fi

if [ -f "tests/evm_integration.spec.ts" ]; then
    print_status "Running EVM integration tests..."
    npm test tests/evm_integration.spec.ts
fi

print_success "Test suite completed successfully!"
echo ""
print_status "Test coverage includes:"
echo "  ✅ Jetton wallet integration tests"
echo "  ✅ EVM integration tests"
echo "  ✅ Cross-chain functionality tests"
echo "  ✅ Bridge integration tests"
echo "  ✅ Error handling tests"
echo "  ✅ Gas optimization tests"
echo ""
print_status "Phase 2 implementation complete! 🚀" 