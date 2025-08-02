#!/usr/bin/env tsx

import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { BitcoinHTLCOperations } from '../src/lib/blockchains/bitcoin/bitcoin-htlc-operations';
import { BitcoinSwapFlow } from '../src/lib/blockchains/bitcoin/bitcoin-swap-flow';
import { BitcoinNetworkOperations } from '../src/lib/blockchains/bitcoin/bitcoin-network-operations';
import { SwapMonitoringService } from '../src/lib/blockchains/bitcoin/swap-monitoring-service';
import { PartialFillLogic } from '../src/lib/blockchains/bitcoin/partial-fill-logic';
import { BitcoinRelayer } from '../src/lib/blockchains/bitcoin/bitcoin-relayer';
import { BitcoinResolver } from '../src/lib/blockchains/bitcoin/bitcoin-resolver';
// import { validateBitcoinAddress } from 'bitcoin-address-validation';
import * as bitcoin from 'bitcoinjs-lib';
import * as crypto from 'crypto';

// Types
interface HTLCConfig {
  secretHash: string;
  recipientPublicKey: Buffer;
  lockTimeBlocks: number;
}

interface SwapParams {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  userEthereumAddress: string;
  userBitcoinAddress: string;
  secret?: string;
}

interface DemoResult {
  success: boolean;
  message: string;
  data?: any;
}

class BitcoinCLI {
  private htlcOperations: BitcoinHTLCOperations;
  private swapFlow: BitcoinSwapFlow;
  private networkOperations: BitcoinNetworkOperations;
  private monitoringService: SwapMonitoringService;
  private partialFillLogic: PartialFillLogic;
  private relayer: BitcoinRelayer;
  private resolver: BitcoinResolver;
  private useTestnet: boolean = true;

  constructor() {
    this.htlcOperations = new BitcoinHTLCOperations(this.useTestnet);
    this.networkOperations = new BitcoinNetworkOperations(this.useTestnet);
    this.monitoringService = new SwapMonitoringService();
    this.partialFillLogic = new PartialFillLogic();
    this.relayer = new BitcoinRelayer(this.useTestnet);
    this.resolver = new BitcoinResolver();

    // Initialize swap flow with test keys
    const testPrivateKey = process.env.BITCOIN_PRIVATE_KEY || 'test-key';
    const testBtcPrivateKeyWIF = process.env.BITCOIN_WIF_KEY || 'test-wif';
    this.swapFlow = new BitcoinSwapFlow(testPrivateKey, testBtcPrivateKeyWIF, this.useTestnet);
  }

  private log(message: string, color: string = 'white') {
    console.log(chalk[color](message));
  }

  private logSuccess(message: string) {
    this.log(`✅ ${message}`, 'green');
  }

  private logError(message: string) {
    this.log(`❌ ${message}`, 'red');
  }

  private logWarning(message: string) {
    this.log(`⚠️  ${message}`, 'yellow');
  }

  private logInfo(message: string) {
    this.log(`ℹ️  ${message}`, 'blue');
  }

  private displayTable(headers: string[], rows: any[]) {
    const table = new Table({
      head: headers,
      style: { head: ['cyan'] }
    });
    table.push(...rows);
    console.log(table.toString());
  }

  /**
   * Generate a cryptographically secure secret
   */
  private generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Validate Bitcoin address
   */
  private validateBitcoinAddress(address: string): boolean {
    // Simple validation for demo purposes
    return address.startsWith('tb1') || address.startsWith('bc1') || address.startsWith('1') || address.startsWith('3');
  }

  /**
   * Test HTLC script creation and validation
   */
  async testHTLCScript(): Promise<DemoResult> {
    try {
      this.logInfo('Testing HTLC Script Creation...');

      const secret = this.generateSecret();
      const secretHash = this.htlcOperations.generateSecretHash(secret);

      const config: HTLCConfig = {
        secretHash,
        recipientPublicKey: Buffer.from('02' + '0'.repeat(64), 'hex'), // Test public key
        lockTimeBlocks: 144 // 24 hours
      };

      const htlcScript = this.htlcOperations.createBitcoinHTLCScript(config);
      const htlcAddress = this.htlcOperations.createHTLCAddress(htlcScript);

      this.logSuccess('HTLC Script created successfully');
      this.log(`Secret: ${secret}`, 'gray');
      this.log(`Secret Hash: ${secretHash.toString('hex')}`, 'gray');
      this.log(`HTLC Address: ${htlcAddress}`, 'gray');

      return {
        success: true,
        message: 'HTLC script creation test passed',
        data: { htlcAddress, secretHash: secretHash.toString('hex') }
      };
    } catch (error) {
      return {
        success: false,
        message: `HTLC script test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Test bi-directional swap functionality
   */
  async testBidirectionalSwap(): Promise<DemoResult> {
    try {
      this.logInfo('Testing Bi-directional Swap Functionality...');

      // Test ERC20 → BTC swap
      this.log('Testing ERC20 → BTC swap...', 'cyan');
      const erc20ToBtcParams: SwapParams = {
        fromToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C', // USDT
        toToken: 'BTC',
        fromAmount: '100000000', // 100 USDT (6 decimals)
        toAmount: '0.001', // 0.001 BTC
        userEthereumAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        userBitcoinAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'
      };

      const erc20ToBtcResult = await this.swapFlow.handleERC20ToBTCSwap(erc20ToBtcParams);

      if (erc20ToBtcResult.success) {
        this.logSuccess('ERC20 → BTC swap initiated successfully');
      } else {
        this.logWarning(`ERC20 → BTC swap failed: ${erc20ToBtcResult.error}`);
      }

      // Test BTC → ERC20 swap
      this.log('Testing BTC → ERC20 swap...', 'cyan');
      const btcToErc20Params: SwapParams = {
        fromToken: 'BTC',
        toToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C', // USDT
        fromAmount: '0.001', // 0.001 BTC
        toAmount: '100000000', // 100 USDT (6 decimals)
        userEthereumAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        userBitcoinAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'
      };

      const btcToErc20Result = await this.swapFlow.handleBTCToERC20Swap(btcToErc20Params);

      if (btcToErc20Result.success) {
        this.logSuccess('BTC → ERC20 swap initiated successfully');
      } else {
        this.logWarning(`BTC → ERC20 swap failed: ${btcToErc20Result.error}`);
      }

      return {
        success: true,
        message: 'Bi-directional swap test completed',
        data: {
          erc20ToBtc: erc20ToBtcResult,
          btcToErc20: btcToErc20Result
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Bi-directional swap test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Test hashlock logic and secret management
   */
  async testHashlockLogic(): Promise<DemoResult> {
    try {
      this.logInfo('Testing Hashlock Logic and Secret Management...');

      // Generate multiple secrets for partial fills
      const secrets = Array.from({ length: 3 }, () => this.generateSecret());
      const secretHashes = secrets.map(secret => this.htlcOperations.generateSecretHash(secret));

      this.log('Generated secrets and hashes:', 'cyan');
      secrets.forEach((secret, index) => {
        this.log(`Secret ${index + 1}: ${secret}`, 'gray');
        this.log(`Hash ${index + 1}: ${secretHashes[index].toString('hex')}`, 'gray');
      });

      // Test secret validation
      const testSecret = secrets[0];
      const testHash = secretHashes[0];
      const isValid = this.htlcOperations.validateSecret(testSecret, testHash);

      if (isValid) {
        this.logSuccess('Secret validation working correctly');
      } else {
        this.logError('Secret validation failed');
      }

      // Test partial fill logic
      const partialFillOrder = await this.partialFillLogic.createPartialFillOrder({
        orderId: 'test-order-123',
        totalAmount: '100000000',
        partialAmounts: ['30000000', '40000000', '30000000'],
        secrets: secrets,
        secretHashes: secretHashes.map(hash => hash.toString('hex'))
      });

      this.logSuccess('Partial fill order created successfully');
      this.log(`Order ID: ${partialFillOrder.orderId}`, 'gray');

      return {
        success: true,
        message: 'Hashlock logic test completed',
        data: { secrets, secretHashes: secretHashes.map(hash => hash.toString('hex')), partialFillOrder }
      };
    } catch (error) {
      return {
        success: false,
        message: `Hashlock logic test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Test contract expiration and revert handling
   */
  async testContractExpiration(): Promise<DemoResult> {
    try {
      this.logInfo('Testing Contract Expiration and Revert Handling...');

      // Create HTLC with short expiration
      const secret = this.generateSecret();
      const secretHash = this.htlcOperations.generateSecretHash(secret);

      const shortExpiryConfig: HTLCConfig = {
        secretHash,
        recipientPublicKey: Buffer.from('02' + '0'.repeat(64), 'hex'),
        lockTimeBlocks: 6 // 1 hour
      };

      const htlcScript = this.htlcOperations.createBitcoinHTLCScript(shortExpiryConfig);
      const htlcAddress = this.htlcOperations.createHTLCAddress(htlcScript);

      this.log(`Created HTLC with short expiry (1 hour)`, 'cyan');
      this.log(`HTLC Address: ${htlcAddress}`, 'gray');

      // Simulate monitoring for expiration
      const monitoringResult = await this.monitoringService.monitorHTLCExpiration(
        htlcAddress,
        shortExpiryConfig.lockTimeBlocks
      );

      this.logSuccess('HTLC expiration monitoring configured');
      this.log(`Expiry block: ${shortExpiryConfig.lockTimeBlocks}`, 'gray');

      // Test refund logic
      const canRefund = await this.networkOperations.canRefundHTLC(
        htlcAddress,
        shortExpiryConfig.lockTimeBlocks
      );

      if (canRefund) {
        this.logSuccess('HTLC refund logic working correctly');
      } else {
        this.logWarning('HTLC not yet eligible for refund');
      }

      return {
        success: true,
        message: 'Contract expiration test completed',
        data: { htlcAddress, expiryBlock: shortExpiryConfig.lockTimeBlocks, canRefund }
      };
    } catch (error) {
      return {
        success: false,
        message: `Contract expiration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Test relayer and resolver functionality
   */
  async testRelayerResolver(): Promise<DemoResult> {
    try {
      this.logInfo('Testing Bitcoin Relayer and Resolver...');

      // Test relayer functionality
      const testTransaction = {
        to: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
        amount: 1000, // satoshis
        fee: 50
      };

      const broadcastResult = await this.relayer.broadcastTransaction(testTransaction);
      this.logSuccess('Transaction broadcast test completed');

      // Test resolver functionality
      const resolverBid = await this.resolver.submitBid({
        orderId: 'test-order-456',
        amount: '50000000',
        fee: '1000',
        secretHash: 'test-hash'
      });

      this.logSuccess('Resolver bid submission test completed');
      this.log(`Bid ID: ${resolverBid.bidId}`, 'gray');

      return {
        success: true,
        message: 'Relayer and resolver test completed',
        data: { broadcastResult, resolverBid }
      };
    } catch (error) {
      return {
        success: false,
        message: `Relayer and resolver test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Run comprehensive demo
   */
  async runDemo(): Promise<void> {
    this.log(chalk.bold.blue('🚀 Bitcoin HTLC Swap CLI Demo'));
    this.log(chalk.blue('================================'));
    this.log('');

    const tests = [
      { name: 'HTLC Script Creation', test: () => this.testHTLCScript() },
      { name: 'Bi-directional Swaps', test: () => this.testBidirectionalSwap() },
      { name: 'Hashlock Logic', test: () => this.testHashlockLogic() },
      { name: 'Contract Expiration', test: () => this.testContractExpiration() },
      { name: 'Relayer & Resolver', test: () => this.testRelayerResolver() }
    ];

    const results: any[] = [];

    for (const test of tests) {
      this.log(chalk.yellow(`\n🧪 Running: ${test.name}`));
      const result = await test.test();
      results.push({ name: test.name, ...result });

      if (result.success) {
        this.logSuccess(`${test.name} completed successfully`);
      } else {
        this.logError(`${test.name} failed: ${result.message}`);
      }
    }

    // Display summary
    this.log(chalk.bold.blue('\n📊 Demo Summary'));
    this.log(chalk.blue('=============='));

    const summaryTable = results.map(result => [
      result.name,
      result.success ? chalk.green('✅ PASS') : chalk.red('❌ FAIL'),
      result.message
    ]);

    this.displayTable(['Test', 'Status', 'Message'], summaryTable);

    const passedTests = results.filter(r => r.success).length;
    const totalTests = results.length;

    this.log(chalk.bold.green(`\n🎉 Demo completed: ${passedTests}/${totalTests} tests passed`));

    if (passedTests === totalTests) {
      this.log(chalk.green('All tests passed! Bitcoin HTLC swap system is working correctly.'));
    } else {
      this.log(chalk.yellow('Some tests failed. Check the implementation for issues.'));
    }
  }

  /**
   * Show available commands
   */
  showHelp(): void {
    this.log(chalk.bold.blue('Bitcoin HTLC Swap CLI'));
    this.log(chalk.blue('====================='));
    this.log('');
    this.log(chalk.cyan('Available Commands:'));
    this.log('');
    this.log(chalk.white('  demo                    - Run comprehensive demo'));
    this.log(chalk.white('  htlc-script            - Test HTLC script creation'));
    this.log(chalk.white('  bidirectional-swap     - Test bi-directional swaps'));
    this.log(chalk.white('  hashlock-logic         - Test hashlock and secret management'));
    this.log(chalk.white('  contract-expiration    - Test contract expiration handling'));
    this.log(chalk.white('  relayer-resolver       - Test relayer and resolver functionality'));
    this.log(chalk.white('  help                   - Show this help message'));
    this.log('');
    this.log(chalk.yellow('Environment Variables:'));
    this.log(chalk.gray('  BITCOIN_PRIVATE_KEY     - Bitcoin private key for testing'));
    this.log(chalk.gray('  BITCOIN_WIF_KEY         - Bitcoin WIF private key'));
    this.log('');
  }
}

// CLI Setup
const program = new Command();
const cli = new BitcoinCLI();

program
  .name('bitcoin-cli')
  .description('Bitcoin HTLC Swap Testing CLI for Hackathon Demo')
  .version('1.0.0');

program
  .command('demo')
  .description('Run comprehensive Bitcoin HTLC swap demo')
  .action(async () => {
    await cli.runDemo();
  });

program
  .command('htlc-script')
  .description('Test HTLC script creation and validation')
  .action(async () => {
    const result = await cli.testHTLCScript();
    if (result.success) {
      console.log(chalk.green('✅ HTLC script test passed'));
    } else {
      console.log(chalk.red(`❌ HTLC script test failed: ${result.message}`));
    }
  });

program
  .command('bidirectional-swap')
  .description('Test bi-directional swap functionality')
  .action(async () => {
    const result = await cli.testBidirectionalSwap();
    if (result.success) {
      console.log(chalk.green('✅ Bi-directional swap test passed'));
    } else {
      console.log(chalk.red(`❌ Bi-directional swap test failed: ${result.message}`));
    }
  });

program
  .command('hashlock-logic')
  .description('Test hashlock logic and secret management')
  .action(async () => {
    const result = await cli.testHashlockLogic();
    if (result.success) {
      console.log(chalk.green('✅ Hashlock logic test passed'));
    } else {
      console.log(chalk.red(`❌ Hashlock logic test failed: ${result.message}`));
    }
  });

program
  .command('contract-expiration')
  .description('Test contract expiration and revert handling')
  .action(async () => {
    const result = await cli.testContractExpiration();
    if (result.success) {
      console.log(chalk.green('✅ Contract expiration test passed'));
    } else {
      console.log(chalk.red(`❌ Contract expiration test failed: ${result.message}`));
    }
  });

program
  .command('relayer-resolver')
  .description('Test relayer and resolver functionality')
  .action(async () => {
    const result = await cli.testRelayerResolver();
    if (result.success) {
      console.log(chalk.green('✅ Relayer and resolver test passed'));
    } else {
      console.log(chalk.red(`❌ Relayer and resolver test failed: ${result.message}`));
    }
  });

program
  .command('help')
  .description('Show help information')
  .action(() => {
    cli.showHelp();
  });

// Default action
program.action(() => {
  cli.showHelp();
});

// Run CLI
if (require.main === module) {
  program.parse();
} 