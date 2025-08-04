#!/usr/bin/env tsx

import { TronAPIService, TronNetworkConfig } from '../src/lib/blockchains/tron/tron-api';
import { TronWeb } from 'tronweb';

// Simple Tron CLI for quick operations
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: pnpm tron:cli:simple <command> [args...]');
    console.log('');
    console.log('Commands:');
    console.log('  address <address>     - Get address info');
    console.log('  tx <txid>            - Get transaction info');
    console.log('  block [height]       - Get block info');
    console.log('  status               - Get network status');
    console.log('  validate <address>   - Validate address');
    console.log('  generate             - Generate wallet');
    console.log('  monitor <txid>       - Monitor transaction');
    return;
  }

  const command = args[0];
  const network = args.includes('--local') ? 'local' :
    args.includes('--mainnet') ? 'mainnet' :
      args.includes('--shasta') ? 'shasta' : 'nile';

  const networks: Record<string, TronNetworkConfig> = {
    local: {
      network: 'local',
      rpcUrl: 'http://localhost:9090',
      apiUrl: 'http://localhost:9090',
      blockExplorer: 'http://localhost:9090',
      confirmations: 1
    },
    mainnet: {
      network: 'mainnet',
      rpcUrl: 'https://api.trongrid.io',
      apiUrl: 'https://api.trongrid.io',
      blockExplorer: 'https://tronscan.org',
      confirmations: 19
    },
    nile: {
      network: 'nile',
      rpcUrl: 'https://nile.trongrid.io',
      apiUrl: 'https://nile.trongrid.io',
      blockExplorer: 'https://nile.tronscan.org',
      confirmations: 6
    },
    shasta: {
      network: 'shasta',
      rpcUrl: 'https://api.shasta.trongrid.io',
      apiUrl: 'https://api.shasta.trongrid.io',
      blockExplorer: 'https://shasta.tronscan.org',
      confirmations: 6
    }
  };

  const tronService = new TronAPIService(networks[network]);

  try {
    switch (command) {
      case 'address':
        if (args.length < 2) {
          console.log('Usage: pnpm tron:cli:simple address <address>');
          return;
        }
        await handleAddress(tronService, args[1]);
        break;

      case 'tx':
        if (args.length < 2) {
          console.log('Usage: pnpm tron:cli:simple tx <txid>');
          return;
        }
        await handleTransaction(tronService, args[1]);
        break;

      case 'block':
        const height = args.length > 1 ? parseInt(args[1]) : undefined;
        await handleBlock(tronService, height);
        break;

      case 'status':
        await handleStatus(tronService);
        break;

      case 'validate':
        if (args.length < 2) {
          console.log('Usage: pnpm tron:cli:simple validate <address>');
          return;
        }
        handleValidate(tronService, args[1]);
        break;

      case 'generate':
        handleGenerate(tronService);
        break;

      case 'monitor':
        if (args.length < 2) {
          console.log('Usage: pnpm tron:cli:simple monitor <txid>');
          return;
        }
        await handleMonitor(tronService, args[1]);
        break;

      default:
        console.log(`Unknown command: ${command}`);
        console.log('Run without arguments to see available commands');
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
  }
}

async function handleAddress(tronService: TronAPIService, address: string) {
  console.log(`\n🔍 Fetching address info for: ${address}`);

  if (!tronService.validateAddress(address)) {
    console.log('❌ Invalid Tron address');
    return;
  }

  const addressInfo = await tronService.getAddressInfo(address);

  if (!addressInfo) {
    console.log('❌ Failed to fetch address information');
    return;
  }

  console.log('\n📋 Address Information:');
  console.log(`Address: ${addressInfo.address}`);
  console.log(`Balance: ${addressInfo.balance / 1_000_000} TRX`);
  console.log(`Transaction Count: ${addressInfo.txCount}`);

  if (addressInfo.trc20Tokens.length > 0) {
    console.log('\n🪙 TRC20 Tokens:');
    addressInfo.trc20Tokens.forEach(token => {
      const balance = parseFloat(token.balance) / Math.pow(10, token.decimals);
      console.log(`  ${token.symbol}: ${balance}`);
    });
  }
}

async function handleTransaction(tronService: TronAPIService, txid: string) {
  console.log(`\n🔍 Fetching transaction: ${txid}`);

  const tx = await tronService.getTransaction(txid);

  if (!tx) {
    console.log('❌ Transaction not found');
    return;
  }

  console.log('\n📄 Transaction Information:');
  console.log(`Transaction ID: ${tx.txID}`);
  console.log(`Block Number: ${tx.blockNumber}`);
  console.log(`Confirmations: ${tx.confirmations}`);
  console.log(`From: ${tx.from}`);
  console.log(`To: ${tx.to}`);
  console.log(`Value: ${tx.value / 1_000_000} TRX`);
  console.log(`Fee: ${tx.fee} sun`);
  console.log(`Timestamp: ${new Date(tx.timestamp).toISOString()}`);

  if (tx.contractAddress) {
    console.log(`Contract Address: ${tx.contractAddress}`);
  }
}

async function handleBlock(tronService: TronAPIService, height?: number) {
  if (height) {
    console.log(`\n🔍 Fetching block ${height}`);
  } else {
    console.log('\n🔍 Fetching latest block');
  }

  let block;

  if (height) {
    block = await tronService.getBlockByHeight(height);
  } else {
    const currentHeight = await tronService.getBlockHeight();
    block = await tronService.getBlockByHeight(currentHeight);
  }

  if (!block) {
    console.log('❌ Block not found');
    return;
  }

  console.log('\n🔗 Block Information:');
  console.log(`Block Hash: ${block.blockID}`);
  console.log(`Block Number: ${block.block_header?.raw_data?.number}`);
  console.log(`Timestamp: ${new Date(block.block_header?.raw_data?.timestamp).toISOString()}`);
  console.log(`Transaction Count: ${block.transactions?.length || 0}`);
}

async function handleStatus(tronService: TronAPIService) {
  console.log('\n🌐 Fetching network status...');

  const blockHeight = await tronService.getBlockHeight();
  const resources = await tronService.getResourceEstimates();
  const config = tronService.getNetworkConfig();

  console.log('\n🌐 Network Status:');
  console.log(`Network: ${config.network}`);
  console.log(`RPC URL: ${config.rpcUrl}`);
  console.log(`Current Block Height: ${blockHeight}`);
  console.log(`Required Confirmations: ${config.confirmations}`);

  console.log('\n⚡ Resource Estimates:');
  console.log(`Energy Used: ${resources.energy}`);
  console.log(`Bandwidth Used: ${resources.bandwidth}`);
  console.log(`Sun: ${resources.sun}`);
}

function handleValidate(tronService: TronAPIService, address: string) {
  console.log(`\n🔍 Validating address: ${address}`);

  const isValid = tronService.validateAddress(address);

  if (isValid) {
    console.log('✅ Valid Tron address');
    console.log(`Address: ${address}`);

    try {
      const hexAddress = tronService.addressToHex(address);
      console.log(`Hex: ${hexAddress}`);
    } catch (error) {
      console.log('Could not convert to hex format');
    }
  } else {
    console.log('❌ Invalid Tron address');
  }
}

function handleGenerate(tronService: TronAPIService) {
  console.log('\n🔑 Generating new Tron wallet...');

  const tronWeb = tronService.getTronWeb();
  const account = tronWeb.utils.accounts.generateAccount();

  console.log('\n🔑 Generated Tron Wallet:');
  console.log(`Address: ${account.address.base58}`);
  console.log(`Private Key: ${account.privateKey}`);
  console.log(`Hex Address: ${account.address.hex}`);

  console.log('\n⚠️  Keep your private key secure and never share it!');
}

async function handleMonitor(tronService: TronAPIService, txid: string) {
  console.log(`\n⏳ Monitoring transaction: ${txid}`);
  console.log('Press Ctrl+C to stop monitoring');

  const startTime = Date.now();
  const timeout = 5 * 60 * 1000; // 5 minutes

  while (Date.now() - startTime < timeout) {
    const status = await tronService.monitorTransaction(txid, 6);

    console.log(`\n[${new Date().toISOString()}] Confirmations: ${status.confirmations}`);

    if (status.confirmed) {
      console.log('✅ Transaction confirmed!');
      console.log(`Block Height: ${status.blockHeight}`);
      return;
    }

    // Wait 10 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 10000));
  }

  console.log('⏰ Monitoring timeout reached');
}

main().catch(console.error); 