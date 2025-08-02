#!/usr/bin/env node

// TODO: set chainId = 24 and configure Nile RPC

const fs = require('fs');
const path = require('path');

// TRON network configuration
const TRON_CONFIG = {
    chainId: 24,
    rpcUrl: 'https://nile.trongrid.io',
    networkName: 'TRON Nile Testnet',
    nativeCurrency: {
        name: 'TRON',
        symbol: 'TRX',
        decimals: 6
    }
};

// Load contract addresses
function loadContractAddresses() {
    try {
        const addressesPath = path.join(__dirname, '../../build/tron/addresses.json');
        if (fs.existsSync(addressesPath)) {
            const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
            return addresses;
        }
    } catch (error) {
        console.error('Error loading contract addresses:', error.message);
    }
    return null;
}

// Resolve escrow by ID
function resolveEscrow(escrowId) {
    console.log(`🔍 Resolving escrow: ${escrowId}`);
    
    const addresses = loadContractAddresses();
    if (!addresses) {
        console.error('❌ Contract addresses not found. Please deploy contracts first.');
        return;
    }
    
    console.log('📋 Contract Addresses:');
    console.log(`  EscrowFactory: ${addresses.escrowFactory}`);
    console.log(`  EscrowSrc: ${addresses.escrowSrc}`);
    console.log(`  EscrowDst: ${addresses.escrowDst}`);
    console.log(`  Network: ${addresses.network}`);
    console.log(`  Chain ID: ${addresses.chainId}`);
    
    // TODO: Implement actual escrow resolution logic
    console.log('✅ Escrow resolution completed (placeholder)');
}

// Main function
function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Usage: node resolver_tron.js <escrow_id>');
        console.log('Example: node resolver_tron.js 0x1234567890abcdef...');
        process.exit(1);
    }
    
    const escrowId = args[0];
    resolveEscrow(escrowId);
}

if (require.main === module) {
    main();
}

module.exports = {
    resolveEscrow,
    loadContractAddresses,
    TRON_CONFIG
}; 