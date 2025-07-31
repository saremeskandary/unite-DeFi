#!/bin/bash

# Wallet Integration Tests Runner
# This script runs all wallet integration tests with proper configuration

set -e

echo "🚀 Starting Wallet Integration Tests..."
echo "======================================"

# Set test environment variables
export NODE_ENV=test
export TEST_WALLET_INTEGRATION=true

# Create test coverage directory
mkdir -p coverage/wallet-integration

# Run wallet integration tests with coverage
echo "📋 Running wallet integration tests..."
pnpm test --testPathPattern="tests/integration/wallet" \
  --coverage \
  --coverageDirectory="coverage/wallet-integration" \
  --coverageReporters="text,lcov,html" \
  --verbose \
  --testTimeout=30000

# Run specific test suites
echo ""
echo "🔗 Testing wallet connection flows..."
pnpm test --testPathPattern="wallet-integration.test.ts" \
  --testNamePattern="Wallet Connection Flows" \
  --verbose

echo ""
echo "💰 Testing balance fetching..."
pnpm test --testPathPattern="wallet-integration.test.ts" \
  --testNamePattern="Balance Fetching" \
  --verbose

echo ""
echo "✍️  Testing transaction signing..."
pnpm test --testPathPattern="wallet-integration.test.ts" \
  --testNamePattern="Transaction Signing" \
  --verbose

echo ""
echo "🌐 Testing multi-chain support..."
pnpm test --testPathPattern="wallet-integration.test.ts" \
  --testNamePattern="Multi-Chain Support" \
  --verbose

echo ""
echo "⚠️  Testing error handling..."
pnpm test --testPathPattern="wallet-integration.test.ts" \
  --testNamePattern="Error Handling for Wallet Failures" \
  --verbose

echo ""
echo "🧩 Testing wallet components..."
pnpm test --testPathPattern="wallet-component.test.tsx" \
  --verbose

echo ""
echo "🔄 Testing end-to-end workflows..."
pnpm test --testPathPattern="wallet-e2e.test.ts" \
  --verbose

# Generate test report
echo ""
echo "📊 Generating test report..."
pnpm test --testPathPattern="tests/integration/wallet" \
  --coverage \
  --coverageDirectory="coverage/wallet-integration" \
  --coverageReporters="text,lcov,html" \
  --json \
  --outputFile="coverage/wallet-integration/test-results.json"

echo ""
echo "✅ Wallet Integration Tests Completed!"
echo "📁 Coverage report available at: coverage/wallet-integration/"
echo "📄 Test results available at: coverage/wallet-integration/test-results.json"

# Check if all tests passed
if [ $? -eq 0 ]; then
  echo "🎉 All wallet integration tests passed!"
  exit 0
else
  echo "❌ Some wallet integration tests failed!"
  exit 1
fi 