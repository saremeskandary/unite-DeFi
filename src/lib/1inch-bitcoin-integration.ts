import axios from 'axios';
import { BitcoinNetworkOperations } from './blockchains/bitcoin/bitcoin-network-operations';
import { getTestnetConfig, getChainId } from './testnet-config';

export interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromTokenAmount: string;
  toTokenAmount: string;
  estimatedGas: string;
  protocols: any[];
  tx: {
    from: string;
    to: string;
    data: string;
    value: string;
    gasPrice: string;
    gas: string;
  };
}

export interface SwapOrder {
  orderHash: string;
  signature: string;
  order: any;
}

export class OneInchBitcoinIntegration {
  private apiKey: string;
  private apiUrl: string;
  private btcNetwork: BitcoinNetworkOperations;
  private ethPrivateKey: string;
  private ethRpcUrl: string;
  private testnetConfig: any;
  private chainId: number;

  constructor(
    inchApiKey: string,
    btcPrivateKeyWIF: string,
    ethPrivateKey: string,
    ethRpcUrl: string,
    useTestnet: boolean = true,
    network: 'sepolia' | 'goerli' = 'sepolia'
  ) {
    this.apiKey = inchApiKey;
    this.apiUrl = 'https://api.1inch.dev';
    this.btcNetwork = new BitcoinNetworkOperations(btcPrivateKeyWIF, useTestnet);
    this.ethPrivateKey = ethPrivateKey;
    this.ethRpcUrl = ethRpcUrl;
    this.testnetConfig = getTestnetConfig(network);
    this.chainId = getChainId(network);
  }

  /**
   * Get a quote for swapping ERC20 to Bitcoin
   */
  async getERC20ToBitcoinQuote(
    fromToken: string, // ERC20 token address
    amount: string,    // Amount in wei
    btcAddress: string // Bitcoin address to receive
  ): Promise<SwapQuote> {
    try {
      // Use testnet WBTC address based on network
      const wbtcAddress = this.testnetConfig.tokens.wbtc;

      // For Bitcoin integration, we need to use 1inch's cross-chain API
      const response = await axios.get(
        `${this.apiUrl}/swap/v5.2/${this.chainId}/quote`,
        {
          params: {
            src: fromToken,
            dst: wbtcAddress, // Testnet WBTC address
            amount: amount,
            from: this.getEthereumAddress(),
            slippage: 1, // 1% slippage
          },
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Accept': 'application/json',
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting quote:', error);
      throw new Error(`Failed to get quote: ${error}`);
    }
  }

  /**
   * Execute a swap from ERC20 to Bitcoin
   */
  async executeERC20ToBitcoinSwap(
    quote: SwapQuote,
    btcAddress: string
  ): Promise<SwapOrder> {
    try {
      // First, approve the token if needed
      await this.approveToken(quote.fromToken, quote.tx.to);

      // Execute the swap
      const swapResponse = await axios.post(
        `${this.apiUrl}/swap/v5.2/1/swap`,
        {
          src: quote.fromToken,
          dst: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
          amount: quote.fromTokenAmount,
          from: this.getEthereumAddress(),
          slippage: 1,
          disableEstimate: false,
          allowPartialFill: false,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          }
        }
      );

      // After the swap, we need to bridge WBTC to Bitcoin
      // This would typically involve a bridge service like RenVM, WBTC, or similar
      const swapResult = swapResponse.data;

      return {
        orderHash: swapResult.txHash,
        signature: '', // Would be generated for the bridge
        order: swapResult
      };
    } catch (error) {
      console.error('Error executing swap:', error);
      throw new Error(`Failed to execute swap: ${error}`);
    }
  }

  /**
   * Get Bitcoin address for receiving funds
   */
  getBitcoinAddress(): string {
    return this.btcNetwork.getResolverAddress();
  }

  /**
   * Get Ethereum address
   */
  private getEthereumAddress(): string {
    // This is a simplified version - in practice you'd derive from private key
    return '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
  }

  /**
   * Approve token spending
   */
  private async approveToken(tokenAddress: string, spenderAddress: string): Promise<void> {
    try {
      const approvalResponse = await axios.post(
        `${this.apiUrl}/swap/v5.2/1/approve/transaction`,
        {
          tokenAddress: tokenAddress,
          amount: '115792089237316195423570985008687907853269984665640564039457584007913129639935', // Max approval
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          }
        }
      );

      // In a real implementation, you'd sign and send this transaction
      console.log('Approval transaction:', approvalResponse.data);
    } catch (error) {
      console.error('Error approving token:', error);
      throw new Error(`Failed to approve token: ${error}`);
    }
  }

  /**
   * Monitor Bitcoin transaction
   */
  async monitorBitcoinTransaction(txHash: string): Promise<any> {
    try {
      // This would interact with your Bitcoin node
      const response = await axios.get(`http://localhost:18332`, {
        auth: {
          username: 'test',
          password: 'test'
        },
        data: {
          jsonrpc: '1.0',
          id: 'monitor',
          method: 'gettransaction',
          params: [txHash]
        }
      });

      return response.data.result;
    } catch (error) {
      console.error('Error monitoring Bitcoin transaction:', error);
      throw new Error(`Failed to monitor transaction: ${error}`);
    }
  }

  /**
   * Get Bitcoin balance
   */
  async getBitcoinBalance(): Promise<number> {
    try {
      const response = await axios.post(`http://localhost:18332`, {
        jsonrpc: '1.0',
        id: 'balance',
        method: 'getbalance',
        params: []
      }, {
        auth: {
          username: 'test',
          password: 'test'
        }
      });

      return response.data.result;
    } catch (error) {
      console.error('Error getting Bitcoin balance:', error);
      return 0;
    }
  }

  /**
   * Send Bitcoin to address
   */
  async sendBitcoin(toAddress: string, amount: number): Promise<string> {
    try {
      const response = await axios.post(`http://localhost:18332`, {
        jsonrpc: '1.0',
        id: 'send',
        method: 'sendtoaddress',
        params: [toAddress, amount]
      }, {
        auth: {
          username: 'test',
          password: 'test'
        }
      });

      return response.data.result;
    } catch (error) {
      console.error('Error sending Bitcoin:', error);
      throw new Error(`Failed to send Bitcoin: ${error}`);
    }
  }
}

/**
 * Example usage function
 */
export async function exampleUsage() {
  // Initialize the integration
  const integration = new OneInchBitcoinIntegration(
    process.env.NEXT_PUBLIC_INCH_API_KEY!,
    process.env.NEXT_PUBLIC_BTC_PRIVATE_KEY_WIF!,
    process.env.NEXT_PUBLIC_ETH_PRIVATE_KEY!,
    process.env.NEXT_PUBLIC_ETH_RPC_URL!,
    true // Use testnet
  );

  console.log('🔗 1inch + Bitcoin Integration Example\n');

  // Get Bitcoin address
  const btcAddress = integration.getBitcoinAddress();
  console.log('📝 Bitcoin Address:', btcAddress);

  // Get Bitcoin balance
  const btcBalance = await integration.getBitcoinBalance();
  console.log('💰 Bitcoin Balance:', btcBalance, 'BTC');

  // Example: Get quote for USDC to Bitcoin
  try {
    const quote = await integration.getERC20ToBitcoinQuote(
      '0xA0b86a33E6441b8c4C3131C8C5C9C5C9C5C9C5C9', // USDC address (example)
      '1000000000', // 1000 USDC (6 decimals)
      btcAddress
    );

    console.log('📊 Swap Quote:');
    console.log('  From:', quote.fromTokenAmount, 'USDC');
    console.log('  To:', quote.toTokenAmount, 'WBTC');
    console.log('  Estimated Gas:', quote.estimatedGas);

    // Execute the swap (commented out for safety)
    // const swapOrder = await integration.executeERC20ToBitcoinSwap(quote, btcAddress);
    // console.log('✅ Swap executed:', swapOrder.orderHash);

  } catch (error) {
    console.error('❌ Error getting quote:', error);
  }
} 