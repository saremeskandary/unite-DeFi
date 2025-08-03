#!/usr/bin/env tsx

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { TronAPIService, TronNetworkConfig } from '../src/lib/blockchains/tron/tron-api';
import { TronWeb } from 'tronweb';

const program = new Command();

// Network configurations
const networks: Record<string, TronNetworkConfig> = {
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

let tronService: TronAPIService;

program
  .name('tron-cli')
  .description('Tron blockchain CLI tool')
  .version('1.0.0');

program
  .option('-n, --network <network>', 'Network to use (mainnet, nile, shasta)', 'nile')
  .hook('preAction', (thisCommand) => {
    const options = thisCommand.opts();
    const network = networks[options.network];

    if (!network) {
      console.error(chalk.red(`Invalid network: ${options.network}`));
      console.log(chalk.yellow('Available networks: mainnet, nile, shasta'));
      process.exit(1);
    }

    tronService = new TronAPIService(network);
    console.log(chalk.blue(`Connected to Tron ${network.network} network`));
  });

// Address info command
program
  .command('address')
  .description('Get address information')
  .argument('<address>', 'Tron address')
  .action(async (address: string) => {
    const spinner = ora('Fetching address information...').start();

    try {
      if (!tronService.validateAddress(address)) {
        spinner.fail('Invalid Tron address');
        return;
      }

      const addressInfo = await tronService.getAddressInfo(address);

      if (!addressInfo) {
        spinner.fail('Failed to fetch address information');
        return;
      }

      spinner.succeed('Address information retrieved');

      console.log(chalk.green('\n📋 Address Information:'));
      console.log(chalk.white(`Address: ${addressInfo.address}`));
      console.log(chalk.white(`Balance: ${addressInfo.balance / 1_000_000} TRX`));
      console.log(chalk.white(`Transaction Count: ${addressInfo.txCount}`));

      if (addressInfo.trc20Tokens.length > 0) {
        console.log(chalk.green('\n🪙 TRC20 Tokens:'));
        addressInfo.trc20Tokens.forEach(token => {
          const balance = parseFloat(token.balance) / Math.pow(10, token.decimals);
          console.log(chalk.white(`  ${token.symbol}: ${balance}`));
        });
      }

    } catch (error) {
      spinner.fail('Error fetching address information');
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    }
  });

// Transaction info command
program
  .command('tx')
  .description('Get transaction information')
  .argument('<txid>', 'Transaction ID')
  .action(async (txid: string) => {
    const spinner = ora('Fetching transaction information...').start();

    try {
      const tx = await tronService.getTransaction(txid);

      if (!tx) {
        spinner.fail('Transaction not found');
        return;
      }

      spinner.succeed('Transaction information retrieved');

      console.log(chalk.green('\n📄 Transaction Information:'));
      console.log(chalk.white(`Transaction ID: ${tx.txID}`));
      console.log(chalk.white(`Block Number: ${tx.blockNumber}`));
      console.log(chalk.white(`Confirmations: ${tx.confirmations}`));
      console.log(chalk.white(`From: ${tx.from}`));
      console.log(chalk.white(`To: ${tx.to}`));
      console.log(chalk.white(`Value: ${tx.value / 1_000_000} TRX`));
      console.log(chalk.white(`Fee: ${tx.fee} sun`));
      console.log(chalk.white(`Timestamp: ${new Date(tx.timestamp).toISOString()}`));

      if (tx.contractAddress) {
        console.log(chalk.white(`Contract Address: ${tx.contractAddress}`));
      }
      if (tx.contractType) {
        console.log(chalk.white(`Contract Type: ${tx.contractType}`));
      }

    } catch (error) {
      spinner.fail('Error fetching transaction information');
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    }
  });

// Block info command
program
  .command('block')
  .description('Get block information')
  .argument('[height]', 'Block height (optional, defaults to latest)')
  .action(async (height?: string) => {
    const spinner = ora('Fetching block information...').start();

    try {
      let block;

      if (height) {
        block = await tronService.getBlockByHeight(parseInt(height));
      } else {
        const currentHeight = await tronService.getBlockHeight();
        block = await tronService.getBlockByHeight(currentHeight);
      }

      if (!block) {
        spinner.fail('Block not found');
        return;
      }

      spinner.succeed('Block information retrieved');

      console.log(chalk.green('\n🔗 Block Information:'));
      console.log(chalk.white(`Block Hash: ${block.blockID}`));
      console.log(chalk.white(`Block Number: ${block.block_header?.raw_data?.number}`));
      console.log(chalk.white(`Timestamp: ${new Date(block.block_header?.raw_data?.timestamp).toISOString()}`));
      console.log(chalk.white(`Parent Hash: ${block.block_header?.raw_data?.parentHash}`));
      console.log(chalk.white(`Witness: ${block.block_header?.raw_data?.witness_address}`));
      console.log(chalk.white(`Transaction Count: ${block.transactions?.length || 0}`));

    } catch (error) {
      spinner.fail('Error fetching block information');
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    }
  });

// Network status command
program
  .command('status')
  .description('Get network status')
  .action(async () => {
    const spinner = ora('Fetching network status...').start();

    try {
      const blockHeight = await tronService.getBlockHeight();
      const resources = await tronService.getResourceEstimates();
      const config = tronService.getNetworkConfig();

      spinner.succeed('Network status retrieved');

      console.log(chalk.green('\n🌐 Network Status:'));
      console.log(chalk.white(`Network: ${config.network}`));
      console.log(chalk.white(`RPC URL: ${config.rpcUrl}`));
      console.log(chalk.white(`Block Explorer: ${config.blockExplorer}`));
      console.log(chalk.white(`Current Block Height: ${blockHeight}`));
      console.log(chalk.white(`Required Confirmations: ${config.confirmations}`));

      console.log(chalk.green('\n⚡ Resource Estimates:'));
      console.log(chalk.white(`Energy Used: ${resources.energy}`));
      console.log(chalk.white(`Bandwidth Used: ${resources.bandwidth}`));
      console.log(chalk.white(`Sun: ${resources.sun}`));

    } catch (error) {
      spinner.fail('Error fetching network status');
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    }
  });

// Monitor transaction command
program
  .command('monitor')
  .description('Monitor transaction confirmation')
  .argument('<txid>', 'Transaction ID')
  .option('-c, --confirmations <number>', 'Required confirmations', '6')
  .option('-t, --timeout <seconds>', 'Timeout in seconds', '300')
  .action(async (txid: string, options: { confirmations: string; timeout: string }) => {
    const spinner = ora('Monitoring transaction...').start();

    try {
      const requiredConfirmations = parseInt(options.confirmations);
      const timeout = parseInt(options.timeout) * 1000;

      console.log(chalk.blue(`\nMonitoring transaction ${txid}`));
      console.log(chalk.blue(`Required confirmations: ${requiredConfirmations}`));
      console.log(chalk.blue(`Timeout: ${timeout / 1000} seconds`));

      const result = await tronService.waitForConfirmation(txid, requiredConfirmations, timeout);

      if (result.confirmed) {
        spinner.succeed('Transaction confirmed!');
        console.log(chalk.green(`\n✅ Transaction confirmed with ${result.confirmations} confirmations`));
        console.log(chalk.white(`Block Height: ${result.blockHeight}`));
      } else {
        spinner.fail('Transaction not confirmed within timeout');
        console.log(chalk.yellow(`\n⏳ Current confirmations: ${result.confirmations}`));
      }

    } catch (error) {
      spinner.fail('Error monitoring transaction');
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    }
  });

// Validate address command
program
  .command('validate')
  .description('Validate Tron address')
  .argument('<address>', 'Address to validate')
  .action((address: string) => {
    const isValid = tronService.validateAddress(address);

    if (isValid) {
      console.log(chalk.green('✅ Valid Tron address'));
      console.log(chalk.white(`Address: ${address}`));

      try {
        const hexAddress = tronService.addressToHex(address);
        console.log(chalk.white(`Hex: ${hexAddress}`));
      } catch (error) {
        console.log(chalk.yellow('Could not convert to hex format'));
      }
    } else {
      console.log(chalk.red('❌ Invalid Tron address'));
    }
  });

// Generate wallet command
program
  .command('generate')
  .description('Generate a new Tron wallet')
  .action(() => {
    const tronWeb = tronService.getTronWeb();
    const account = tronWeb.utils.accounts.generateAccount();

    console.log(chalk.green('\n🔑 Generated Tron Wallet:'));
    console.log(chalk.white(`Address: ${account.address.base58}`));
    console.log(chalk.white(`Private Key: ${account.privateKey}`));
    console.log(chalk.white(`Hex Address: ${account.address.hex}`));

    console.log(chalk.yellow('\n⚠️  Keep your private key secure and never share it!'));
  });

// Help command
program
  .command('help')
  .description('Show detailed help')
  .action(() => {
    console.log(chalk.blue('\n🚀 Tron CLI Help'));
    console.log(chalk.white('\nAvailable commands:'));
    console.log(chalk.white('  address <address>     - Get address information'));
    console.log(chalk.white('  tx <txid>            - Get transaction information'));
    console.log(chalk.white('  block [height]       - Get block information'));
    console.log(chalk.white('  status               - Get network status'));
    console.log(chalk.white('  monitor <txid>       - Monitor transaction confirmation'));
    console.log(chalk.white('  validate <address>   - Validate Tron address'));
    console.log(chalk.white('  generate             - Generate new wallet'));
    console.log(chalk.white('  help                 - Show this help'));

    console.log(chalk.white('\nOptions:'));
    console.log(chalk.white('  -n, --network        - Network to use (mainnet, nile, shasta)'));
    console.log(chalk.white('  -c, --confirmations  - Required confirmations for monitoring'));
    console.log(chalk.white('  -t, --timeout        - Timeout in seconds for monitoring'));

    console.log(chalk.white('\nExamples:'));
    console.log(chalk.white('  tron-cli address TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'));
    console.log(chalk.white('  tron-cli tx <transaction-id>'));
    console.log(chalk.white('  tron-cli monitor <txid> -c 12'));
    console.log(chalk.white('  tron-cli --network mainnet status'));
  });

program.parse(); 