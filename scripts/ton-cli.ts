#!/usr/bin/env tsx

import { Command } from 'commander';
import chalk from 'chalk';
import { TonClient, WalletContractV4, Address, toNano } from '@ton/ton';
import { TonConnect } from '@tonconnect/sdk';
import ora from 'ora';
import Table from 'cli-table3';

// Types
interface TONBalance {
  address: string;
  balance: string;
  jettons: Array<{
    address: string;
    symbol: string;
    balance: string;
  }>;
}

interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  priceImpact: string;
  fee: string;
}

interface TransactionStatus {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  timestamp: number;
}

export class TONCLI {
  private client: TonClient;
  private wallet: WalletContractV4 | null = null;
  private tonConnect: TonConnect | null = null;
  private isConnected = false;

  constructor() {
    // Initialize TON client for testnet
    this.client = new TonClient({
      endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
      apiKey: process.env.TON_API_KEY || 'test'
    });
  }

  /**
   * Initialize TON Connect for wallet connection
   */
  async initializeTonConnect(): Promise<void> {
    const spinner = ora('Initializing TON Connect...').start();

    try {
      this.tonConnect = new TonConnect({
        manifestUrl: 'https://your-app.com/tonconnect-manifest.json'
      });

      // Listen for wallet connection
      this.tonConnect.onStatusChange((wallet) => {
        if (wallet) {
          this.isConnected = true;
          console.log(chalk.green('✓ Wallet connected:', wallet.account.address));
        } else {
          this.isConnected = false;
          console.log(chalk.yellow('⚠ Wallet disconnected'));
        }
      });

      spinner.succeed('TON Connect initialized');
    } catch (error) {
      spinner.fail('Failed to initialize TON Connect');
      console.error(chalk.red('Error:'), error);
    }
  }

  /**
   * Connect to TON wallet
   */
  async connectWallet(): Promise<void> {
    if (!this.tonConnect) {
      console.log(chalk.red('TON Connect not initialized. Run init first.'));
      return;
    }

    const spinner = ora('Connecting to wallet...').start();

    try {
      // Mock connection for demo purposes
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.isConnected = true;
      spinner.succeed('Wallet connection initiated');
      console.log(chalk.blue('Please approve the connection in your wallet app'));
    } catch (error) {
      spinner.fail('Failed to connect wallet');
      console.error(chalk.red('Error:'), error);
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(address?: string): Promise<TONBalance> {
    const spinner = ora('Fetching balance...').start();

    try {
      const targetAddress = address || 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t';

      // Use a mock balance for demo purposes
      const balanceInTON = 100.5; // Mock balance

      // Mock Jetton balances for demo
      const jettons = [
        {
          address: 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t',
          symbol: 'USDT',
          balance: '1000.00'
        },
        {
          address: 'EQCM3B12QK1e4yZSf8LtR_zmWfejA9hKtQjHq5HM0LfXxJqh',
          symbol: 'USDC',
          balance: '500.00'
        }
      ];

      spinner.succeed('Balance fetched successfully');

      return {
        address: targetAddress,
        balance: balanceInTON.toFixed(4),
        jettons
      };
    } catch (error) {
      spinner.fail('Failed to fetch balance');
      console.error(chalk.red('Error:'), error);
      throw error;
    }
  }

  /**
   * Display balance in a nice table
   */
  displayBalance(balance: TONBalance): void {
    console.log(chalk.blue('\n📊 Wallet Balance'));
    console.log(chalk.gray('─'.repeat(50)));

    const table = new Table({
      head: [chalk.cyan('Asset'), chalk.cyan('Balance'), chalk.cyan('Address')],
      colWidths: [15, 20, 50]
    });

    table.push([
      chalk.yellow('TON'),
      chalk.green(`${balance.balance} TON`),
      balance.address
    ]);

    balance.jettons.forEach(jetton => {
      table.push([
        chalk.blue(jetton.symbol),
        chalk.green(jetton.balance),
        jetton.address
      ]);
    });

    console.log(table.toString());
  }

  /**
   * Transfer TON coins
   */
  async transferTON(toAddress: string, amount: string): Promise<TransactionStatus> {
    const spinner = ora('Preparing transfer...').start();

    try {
      if (!this.wallet) {
        throw new Error('No wallet connected');
      }

      const amountNano = toNano(amount);
      const targetAddress = Address.parse(toAddress);

      // Mock transfer for demo purposes
      console.log(chalk.blue(`Preparing to transfer ${amount} TON to ${toAddress}`));

      // Mock transaction status for demo
      const mockStatus: TransactionStatus = {
        hash: '0x' + Math.random().toString(16).substr(2, 64),
        status: 'pending',
        confirmations: 0,
        timestamp: Date.now()
      };

      spinner.succeed('Transfer prepared');
      return mockStatus;
    } catch (error) {
      spinner.fail('Transfer failed');
      console.error(chalk.red('Error:'), error);
      throw error;
    }
  }

  /**
   * Get swap quote from DeDust
   */
  async getSwapQuote(fromToken: string, toToken: string, amount: string): Promise<SwapQuote> {
    const spinner = ora('Getting swap quote...').start();

    try {
      // Mock DeDust API call
      const mockQuote: SwapQuote = {
        fromToken,
        toToken,
        fromAmount: amount,
        toAmount: (parseFloat(amount) * 0.95).toFixed(6), // Mock 5% slippage
        priceImpact: '0.5%',
        fee: '0.1'
      };

      spinner.succeed('Quote received');
      return mockQuote;
    } catch (error) {
      spinner.fail('Failed to get quote');
      console.error(chalk.red('Error:'), error);
      throw error;
    }
  }

  /**
   * Execute swap
   */
  async executeSwap(quote: SwapQuote): Promise<TransactionStatus> {
    const spinner = ora('Executing swap...').start();

    try {
      console.log(chalk.blue(`Swapping ${quote.fromAmount} ${quote.fromToken} for ${quote.toAmount} ${quote.toToken}`));
      console.log(chalk.gray(`Price Impact: ${quote.priceImpact} | Fee: ${quote.fee} TON`));

      // Mock swap execution
      const mockStatus: TransactionStatus = {
        hash: '0x' + Math.random().toString(16).substr(2, 64),
        status: 'pending',
        confirmations: 0,
        timestamp: Date.now()
      };

      spinner.succeed('Swap executed');
      return mockStatus;
    } catch (error) {
      spinner.fail('Swap failed');
      console.error(chalk.red('Error:'), error);
      throw error;
    }
  }

  /**
   * Monitor transaction status
   */
  async monitorTransaction(hash: string): Promise<void> {
    const spinner = ora('Monitoring transaction...').start();

    try {
      // Mock transaction monitoring
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const confirmations = i + 1;
        const status = confirmations >= 3 ? 'confirmed' : 'pending';

        spinner.text = `Transaction ${status} (${confirmations}/3 confirmations)`;

        if (status === 'confirmed') {
          spinner.succeed(`Transaction confirmed! Hash: ${hash}`);
          break;
        }
      }
    } catch (error) {
      spinner.fail('Failed to monitor transaction');
      console.error(chalk.red('Error:'), error);
    }
  }

  /**
   * Interactive demo mode
   */
  async runDemo(): Promise<void> {
    console.log(chalk.blue.bold('\n🚀 TON Integration Demo'));
    console.log(chalk.gray('This demo showcases the key features for the hackathon\n'));

    const steps = [
      {
        name: 'Initialize TON Connect',
        action: () => this.initializeTonConnect()
      },
      {
        name: 'Connect Wallet',
        action: () => this.connectWallet()
      },
      {
        name: 'Check Balance',
        action: async () => {
          const balance = await this.getBalance();
          this.displayBalance(balance);
        }
      },
      {
        name: 'Get Swap Quote',
        action: async () => {
          const quote = await this.getSwapQuote('TON', 'USDT', '10');
          console.log(chalk.blue('\n💱 Swap Quote'));
          console.log(chalk.gray('─'.repeat(40)));
          console.log(`From: ${quote.fromAmount} ${quote.fromToken}`);
          console.log(`To: ${quote.toAmount} ${quote.toToken}`);
          console.log(`Price Impact: ${quote.priceImpact}`);
          console.log(`Fee: ${quote.fee} TON`);
        }
      },
      {
        name: 'Execute Swap',
        action: async () => {
          const quote = await this.getSwapQuote('TON', 'USDT', '10');
          const tx = await this.executeSwap(quote);
          await this.monitorTransaction(tx.hash);
        }
      }
    ];

    for (const step of steps) {
      console.log(chalk.yellow(`\n${step.name}...`));
      await step.action();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(chalk.green.bold('\n✅ Demo completed successfully!'));
  }
}

// CLI Setup
const program = new Command();
const cli = new TONCLI();

program
  .name('ton-cli')
  .description('TON Integration CLI for Hackathon Demo')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize TON Connect')
  .action(async () => {
    await cli.initializeTonConnect();
  });

program
  .command('connect')
  .description('Connect to TON wallet')
  .action(async () => {
    await cli.connectWallet();
  });

program
  .command('balance')
  .description('Get wallet balance')
  .option('-a, --address <address>', 'Wallet address (optional)')
  .action(async (options) => {
    try {
      const balance = await cli.getBalance(options.address);
      cli.displayBalance(balance);
    } catch (error) {
      console.error(chalk.red('Failed to get balance:'), error);
    }
  });

program
  .command('transfer')
  .description('Transfer TON coins')
  .argument('<address>', 'Recipient address')
  .argument('<amount>', 'Amount in TON')
  .action(async (address, amount) => {
    try {
      const tx = await cli.transferTON(address, amount);
      console.log(chalk.green('Transfer initiated:'), tx.hash);
      await cli.monitorTransaction(tx.hash);
    } catch (error) {
      console.error(chalk.red('Transfer failed:'), error);
    }
  });

program
  .command('quote')
  .description('Get swap quote')
  .argument('<fromToken>', 'Token to swap from')
  .argument('<toToken>', 'Token to swap to')
  .argument('<amount>', 'Amount to swap')
  .action(async (fromToken, toToken, amount) => {
    try {
      const quote = await cli.getSwapQuote(fromToken, toToken, amount);
      console.log(chalk.blue('\n💱 Swap Quote'));
      console.log(chalk.gray('─'.repeat(40)));
      console.log(`From: ${quote.fromAmount} ${quote.fromToken}`);
      console.log(`To: ${quote.toAmount} ${quote.toToken}`);
      console.log(`Price Impact: ${quote.priceImpact}`);
      console.log(`Fee: ${quote.fee} TON`);
    } catch (error) {
      console.error(chalk.red('Failed to get quote:'), error);
    }
  });

program
  .command('swap')
  .description('Execute swap')
  .argument('<fromToken>', 'Token to swap from')
  .argument('<toToken>', 'Token to swap to')
  .argument('<amount>', 'Amount to swap')
  .action(async (fromToken, toToken, amount) => {
    try {
      const quote = await cli.getSwapQuote(fromToken, toToken, amount);
      const tx = await cli.executeSwap(quote);
      await cli.monitorTransaction(tx.hash);
    } catch (error) {
      console.error(chalk.red('Swap failed:'), error);
    }
  });

program
  .command('demo')
  .description('Run interactive demo')
  .action(async () => {
    await cli.runDemo();
  });

// Error handling
program.exitOverride();

try {
  program.parse();
} catch (err) {
  if (err.code === 'commander.help') {
    process.exit(0);
  } else {
    console.error(chalk.red('Error:'), err.message);
    process.exit(1);
  }
}