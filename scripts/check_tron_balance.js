#!/usr/bin/env node

import { TronWeb } from 'tronweb';

// TRON Nile Testnet configuration
const tronWeb = new TronWeb({
  fullHost: 'https://nile.trongrid.io',
  headers: { "TRON-PRO-API-KEY": "your-api-key-here" }
});

// Common test addresses to check
const testAddresses = [
  'TJRabPrwbZy45sbavfcjinPJC18kjpRTv8', // Example test address
  'TJRabPrwbZy45sbavfcjinPJC18kjpRTv9', // Another example
  'TJRabPrwbZy45sbavfcjinPJC18kjpRTvA'  // Third example
];

async function checkBalance(address) {
  try {
    const balance = await tronWeb.trx.getBalance(address);
    const balanceInTRX = tronWeb.fromSun(balance);
    return {
      address,
      balance: balanceInTRX,
      balanceSun: balance,
      exists: balance > 0
    };
  } catch (error) {
    return {
      address,
      error: error.message,
      exists: false
    };
  }
}

async function main() {
  console.log('🔍 Checking TRON Nile Testnet Balances...\n');

  for (const address of testAddresses) {
    const result = await checkBalance(address);

    if (result.error) {
      console.log(`❌ ${address}: ${result.error}`);
    } else if (result.exists) {
      console.log(`✅ ${address}: ${result.balance} TRX (${result.balanceSun} SUN)`);
    } else {
      console.log(`⚠️  ${address}: No balance found`);
    }
  }

  console.log('\n💡 To check your own wallet balance:');
  console.log('   node scripts/check_tron_balance.js <your-address>');
}

// If an address is provided as command line argument
if (process.argv.length > 2) {
  const address = process.argv[2];
  checkBalance(address).then(result => {
    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
    } else {
      console.log(`💰 Balance for ${address}: ${result.balance} TRX (${result.balanceSun} SUN)`);
    }
  });
} else {
  main();
} 