# 1inch Fusion+ Bitcoin Cross-Chain Integration

This integration enables atomic swaps between Ethereum ERC20 tokens and native Bitcoin using 1inch's Fusion+ protocol. It provides a complete implementation for cross-chain DeFi operations.

## Features

- **Atomic Swaps**: Secure ERC20 ↔ Native BTC swaps
- **HTLC Scripts**: Bitcoin-compatible Hash Time Locked Contracts
- **Order Management**: Full 1inch Fusion+ order lifecycle
- **Real-time Monitoring**: Order status and blockchain monitoring
- **Testnet Support**: Both Bitcoin testnet and mainnet support

## Installation

The required dependencies have been added to `package.json`:

```json
{
  "@1inch/fusion-sdk": "^2.3.5",
  "@1inch/cross-chain-sdk": "^0.2.1-rc.47",
  "web3": "^4.0.0",
  "bitcoinjs-lib": "^6.1.0",
  "ecpair": "^2.1.0",
  "tiny-secp256k1": "^2.2.3",
  "axios": "^1.6.0",
  "ethers": "^6.0.0"
}
```

Install dependencies:
```bash
npm install
# or
pnpm install
```

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Ethereum Configuration
ETH_PRIVATE_KEY=your_ethereum_private_key_here
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-alchemy-key

# Bitcoin Configuration
BTC_PRIVATE_KEY_WIF=your_bitcoin_private_key_in_wif_format

# 1inch API
INCH_API_KEY=your_1inch_api_key_here
```

## Quick Start

### Basic Usage

```typescript
import { FusionBitcoinIntegration } from '@/lib/fusion-bitcoin-integration';
import { NetworkEnum } from '@1inch/fusion-sdk';

// Initialize the integration
const integration = new FusionBitcoinIntegration(
  process.env.ETH_PRIVATE_KEY!,
  process.env.BTC_PRIVATE_KEY_WIF!,
  process.env.ETH_RPC_URL!,
  NetworkEnum.ETHEREUM,
  true // Use Bitcoin testnet
);

// Create ERC20 → BTC swap order
const order = await integration.createERC20ToBTCOrder({
  makerAsset: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
  makerAmount: '10000000', // 0.1 WBTC (8 decimals)
  btcAddress: 'tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  btcAmount: 10000000, // 0.1 BTC in satoshis
  secret: 'my-secret-phrase-for-atomic-swap-123'
});

// Submit order to 1inch network
const submission = await integration.submitBitcoinSwapOrder(order);
console.log('Order submitted:', submission.orderHash);
```

### Running Examples

```typescript
import { BitcoinSwapExamples, runAllExamples } from '@/lib/bitcoin-swap-example';

// Run all examples
await runAllExamples();

// Or run individual examples
await BitcoinSwapExamples.swapERC20ToBitcoin();
await BitcoinSwapExamples.getBitcoinUTXOs('your-bitcoin-address');
```

## API Reference

### FusionBitcoinIntegration Class

#### Constructor

```typescript
new FusionBitcoinIntegration(
  privateKey: string,
  btcPrivateKeyWIF: string,
  rpcUrl?: string,
  network?: NetworkEnum,
  useBtcTestnet?: boolean
)
```

#### Methods

##### `createERC20ToBTCOrder(params)`
Creates a Fusion+ order for swapping ERC20 tokens to native Bitcoin.

```typescript
const order = await integration.createERC20ToBTCOrder({
  makerAsset: string,      // ERC20 token address
  makerAmount: string,     // Amount in wei
  btcAddress: string,      // User's Bitcoin address
  btcAmount: number,       // BTC amount in satoshis
  secret: string          // Secret for HTLC
});
```

##### `createBTCToERC20Order(params)`
Creates a Fusion+ order for swapping native Bitcoin to ERC20 tokens.

```typescript
const order = await integration.createBTCToERC20Order({
  btcTxId: string,         // Bitcoin transaction ID
  btcAmount: number,       // BTC amount in satoshis
  takerAsset: string,      // Desired ERC20 token
  takerAmount: string,     // Desired ERC20 amount
  ethAddress: string,      // User's Ethereum address
  secret: string          // Secret for HTLC
});
```

##### `submitBitcoinSwapOrder(order)`
Submits a swap order to the 1inch Fusion+ network.

##### `monitorOrderStatus(orderHash)`
Monitors the status of a submitted order.

##### `getBitcoinUTXOs(address)`
Retrieves unspent transaction outputs for a Bitcoin address.

##### `verifyBitcoinTransaction(txId, expectedAmount)`
Verifies a Bitcoin transaction's validity and amount.

## How It Works

### 1. ERC20 → Bitcoin Swap Flow

1. **Order Creation**: User creates a Fusion+ order to swap ERC20 tokens for Bitcoin
2. **Order Submission**: Order is submitted to 1inch Fusion+ network
3. **Resolver Matching**: A resolver (liquidity provider) matches the order
4. **Bitcoin HTLC**: Resolver creates a Bitcoin HTLC script and funds it
5. **ERC20 Lock**: User's ERC20 tokens are locked in Ethereum escrow
6. **Secret Reveal**: User reveals the secret to claim Bitcoin from HTLC
7. **Completion**: Resolver uses the secret to claim ERC20 tokens

### 2. Bitcoin → ERC20 Swap Flow

1. **Bitcoin Lock**: User locks Bitcoin in a Bitcoin HTLC
2. **Order Creation**: User creates a Fusion+ order for the swap
3. **Order Submission**: Order is submitted to 1inch network
4. **Resolver Matching**: A resolver matches the order
5. **ERC20 Lock**: Resolver locks ERC20 tokens in Ethereum escrow
6. **Secret Reveal**: User reveals the secret to claim ERC20 tokens
7. **Completion**: Resolver uses the secret to claim Bitcoin

### HTLC Script Structure

The Bitcoin HTLC script uses this structure:

```
OP_IF
  OP_HASH160 <secret_hash> OP_EQUALVERIFY
  <recipient_pubkey> OP_CHECKSIG
OP_ELSE
  <locktime> OP_CHECKLOCKTIMEVERIFY OP_DROP
  OP_TRUE
OP_ENDIF
```

## Security Considerations

1. **Private Keys**: Never expose private keys in client-side code
2. **Secrets**: Use cryptographically secure random secrets for HTLCs
3. **Timeouts**: Set appropriate timelocks for your use case
4. **Network Selection**: Use testnet for development and testing
5. **API Keys**: Secure your 1inch API key

## Error Handling

The integration includes comprehensive error handling:

```typescript
try {
  const order = await integration.createERC20ToBTCOrder(params);
  const submission = await integration.submitBitcoinSwapOrder(order);
} catch (error) {
  console.error('Swap failed:', error);
  // Handle specific error types
  if (error.message.includes('insufficient funds')) {
    // Handle insufficient funds
  }
}
```

## Testing

### Testnet Configuration

For testing, use:
- Bitcoin testnet addresses (starting with `tb1`)
- Ethereum testnet (Sepolia, Goerli)
- Testnet Bitcoin faucets for funding

### Example Test Flow

1. Get testnet Bitcoin from a faucet
2. Create a test ERC20 → BTC swap order
3. Monitor the order status
4. Verify the swap completion

## Troubleshooting

### Common Issues

1. **"Invalid private key"**: Ensure your private keys are in the correct format
2. **"Insufficient funds"**: Check your Bitcoin and Ethereum balances
3. **"Order not found"**: Verify the order hash and network configuration
4. **"API key invalid"**: Check your 1inch API key configuration

### Debug Mode

Enable debug logging by setting the environment variable:
```env
DEBUG=true
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

This integration is provided as-is for educational and development purposes. Use at your own risk in production environments.

## Support

For issues and questions:
- Check the 1inch documentation: https://docs.1inch.dev/
- Review the Bitcoin.js documentation: https://github.com/bitcoinjs/bitcoinjs-lib
- Open an issue in this repository 