#!/usr/bin/env tsx

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { TronAPIService, TronNetworkConfig } from '../src/lib/blockchains/tron/tron-api';
import { TronWeb } from 'tronweb';

const program = new Command();

// Network configurations
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

let tronService: TronAPIService;

program
  .name('tron-cli')
  .description('Tron blockchain CLI tool (Full-featured with Commander.js)')
  .version('1.0.0')
  .addHelpText('after', `

📚 CLI Variants:
  tron:cli          - Full-featured CLI with Commander.js (this tool)
  tron:cli:simple   - Simple CLI for quick operations

🎯 When to use which:
  tron:cli          - Professional CLI with spinners, colors, and detailed help
  tron:cli:simple   - Quick one-liners and simple operations

💡 Examples:
  pnpm tron:cli --network shasta address <address>
  pnpm tron:cli:simple address <address> --shasta
  pnpm tron:cli --network local demo
  pnpm tron:cli:simple status --local`);

program
  .option('-n, --network <network>', 'Network to use (local, mainnet, nile, shasta)', 'nile')
  .hook('preAction', (thisCommand) => {
    const options = thisCommand.opts();
    const network = networks[options.network];

    if (!network) {
      console.error(chalk.red(`Invalid network: ${options.network}`));
      console.log(chalk.yellow('Available networks: local, mainnet, nile, shasta'));
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

// Demo command implementation
program
  .command('demo')
  .description('Run interactive Tron CLI demo')
  .action(async () => {
    await runDemo();
  });

// Help command
program
  .command('help')
  .description('Show detailed help')
  .action(() => {
    console.log(chalk.blue('\n🚀 Tron CLI Help'));

    console.log(chalk.green('\n📚 CLI Variants:'));
    console.log(chalk.white('  tron:cli          - Full-featured CLI with Commander.js (this tool)'));
    console.log(chalk.white('  tron:cli:simple   - Simple CLI for quick operations'));

    console.log(chalk.green('\n🎯 When to use which:'));
    console.log(chalk.white('  tron:cli          - Professional CLI with spinners, colors, and detailed help'));
    console.log(chalk.white('  tron:cli:simple   - Quick one-liners and simple operations'));

    console.log(chalk.green('\n📋 Available commands:'));
    console.log(chalk.white('  address <address>     - Get address information'));
    console.log(chalk.white('  tx <txid>            - Get transaction information'));
    console.log(chalk.white('  block [height]       - Get block information'));
    console.log(chalk.white('  status               - Get network status'));
    console.log(chalk.white('  monitor <txid>       - Monitor transaction confirmation'));
    console.log(chalk.white('  validate <address>   - Validate Tron address'));
    console.log(chalk.white('  generate             - Generate new wallet'));
    console.log(chalk.white('  demo                 - Run interactive demo'));
    console.log(chalk.white('  help                 - Show this help'));

    console.log(chalk.green('\n⚙️  Options:'));
    console.log(chalk.white('  -n, --network        - Network to use (local, mainnet, nile, shasta)'));
    console.log(chalk.white('  -c, --confirmations  - Required confirmations for monitoring'));
    console.log(chalk.white('  -t, --timeout        - Timeout in seconds for monitoring'));

    console.log(chalk.green('\n💡 Examples:'));
    console.log(chalk.white('  # Full CLI examples:'));
    console.log(chalk.white('  pnpm tron:cli --network shasta address TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'));
    console.log(chalk.white('  pnpm tron:cli --network local demo'));
    console.log(chalk.white('  pnpm tron:cli --network nile status'));
    console.log(chalk.white('  pnpm tron:cli --network mainnet validate <address>'));

    console.log(chalk.white('\n  # Simple CLI examples:'));
    console.log(chalk.white('  pnpm tron:cli:simple address <address> --shasta'));
    console.log(chalk.white('  pnpm tron:cli:simple status --local'));
    console.log(chalk.white('  pnpm tron:cli:simple generate --nile'));
    console.log(chalk.white('  pnpm tron:cli:simple validate <address> --mainnet'));

    console.log(chalk.green('\n🌐 Available Networks:'));
    console.log(chalk.white('  local     - Local testnet (http://localhost:9090)'));
    console.log(chalk.white('  shasta    - Shasta testnet (https://api.shasta.trongrid.io)'));
    console.log(chalk.white('  nile      - Nile testnet (https://nile.trongrid.io)'));
    console.log(chalk.white('  mainnet   - Mainnet (https://api.trongrid.io)'));
  });

// Demo function
async function runDemo() {
  console.log(chalk.blue.bold('\n🚀 Tron Integration Demo'));
  console.log(chalk.gray('This demo showcases key Tron CLI features for the hackathon.'));

  // 1. Connect to network (already done by CLI setup)
  console.log(chalk.yellow('\n1. Connecting to Tron network...'));
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log(chalk.green('Connected!'));

  // 2. Generate a new wallet
  console.log(chalk.yellow('\n2. Generating a new Tron wallet...'));
  const tronWeb = tronService.getTronWeb();
  const account = tronWeb.utils.accounts.generateAccount();
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log(chalk.green('Wallet generated:'));
  console.log(chalk.white(`  Address: ${account.address.base58}`));
  console.log(chalk.white(`  Private Key: ${account.privateKey}`));
  console.log(chalk.white(`  Hex Address: ${account.address.hex}`));

  // 3. Fetch address info (for the generated wallet)
  console.log(chalk.yellow('\n3. Fetching address info for the generated wallet...'));
  const spinner = ora('Fetching address information...').start();
  try {
    const addressInfo = await tronService.getAddressInfo(account.address.base58);
    spinner.succeed('Address information retrieved');
    console.log(chalk.green('\n📋 Address Information:'));
    console.log(chalk.white(`Address: ${addressInfo?.address}`));
    console.log(chalk.white(`Balance: ${addressInfo?.balance ? addressInfo.balance / 1_000_000 : 0} TRX`));
    console.log(chalk.white(`Transaction Count: ${addressInfo?.txCount}`));
    if (addressInfo?.trc20Tokens && addressInfo.trc20Tokens.length > 0) {
      console.log(chalk.green('\n🪙 TRC20 Tokens:'));
      addressInfo?.trc20Tokens.forEach(token => {
        const balance = parseFloat(token.balance) / Math.pow(10, token.decimals);
        console.log(chalk.white(`  ${token.symbol}: ${balance}`));
      });
    }
  } catch (error) {
    spinner.fail('Error fetching address information');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
  }

  // 4. Get network status
  console.log(chalk.yellow('\n4. Fetching network status...'));
  const spinner2 = ora('Fetching network status...').start();
  try {
    const blockHeight = await tronService.getBlockHeight();
    const resources = await tronService.getResourceEstimates();
    const config = tronService.getNetworkConfig();
    spinner2.succeed('Network status retrieved');
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
    spinner2.fail('Error fetching network status');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
  }

  console.log(chalk.green.bold('\n✅ Demo completed successfully!'));
}

program.parse(); 