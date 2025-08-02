# 1inch Fusion+ TON Cross-Chain Integration

This integration enables atomic swaps between Ethereum ERC20 tokens and native TON using 1inch's Fusion+ protocol. It provides a complete implementation for cross-chain DeFi operations.

## Features

- **Atomic Swaps**: Secure ERC20 ↔ Native TON swaps
- **HTLC Smart Contracts**: TON-compatible Hash Time Locked Contracts
- **Order Management**: Full 1inch Fusion+ order lifecycle
- **Real-time Monitoring**: Order status and blockchain monitoring
- **Testnet Support**: Both TON testnet and mainnet support

## Installation

The required dependencies have been added to `package.json`:

```json
{
  "@1inch/fusion-sdk": "^2.3.5",
  "@1inch/cross-chain-sdk": "^0.2.1-rc.47",
  "web3": "^4.0.0",
  "ton": "^13.9.0",
  "ton-core": "^0.53.0",
  "ton-crypto": "^3.2.0",
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

# TON Configuration
TON_PRIVATE_KEY=your_ton_private_key_here
TON_MNEMONIC=your_ton_mnemonic_phrase_here

# 1inch API
INCH_API_KEY=your_1inch_api_key_here
```

## Quick Start

### Basic Usage

```typescript
import { FusionTONIntegration } from "@/lib/fusion-ton-integration";
import { NetworkEnum } from "@1inch/fusion-sdk";

// Initialize the integration
const integration = new FusionTONIntegration(
  process.env.ETH_PRIVATE_KEY!,
  process.env.TON_PRIVATE_KEY!,
  process.env.ETH_RPC_URL!,
  NetworkEnum.ETHEREUM,
  true // Use TON testnet
);

// Create ERC20 → TON swap order
const order = await integration.createERC20ToTONOrder({
  makerAsset: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", // WBTC
  makerAmount: "10000000", // 0.1 WBTC (8 decimals)
  tonAddress: "EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t",
  tonAmount: 100000000, // 0.1 TON in nanoTON
  secret: "my-secret-phrase-for-atomic-swap-123",
});

// Submit order to 1inch network
const submission = await integration.submitTONSwapOrder(order);
console.log("Order submitted:", submission.orderHash);
```

### Running Examples

```typescript
import { TONSwapExamples, runAllExamples } from "@/lib/ton-swap-example";

// Run all examples
await runAllExamples();

// Or run individual examples
await TONSwapExamples.swapERC20ToTON();
await TONSwapExamples.getTONBalance("your-ton-address");
```

## API Reference

### FusionTONIntegration Class

#### Constructor

```typescript
new FusionTONIntegration(
  privateKey: string,
  tonPrivateKey: string,
  rpcUrl?: string,
  network?: NetworkEnum,
  useTONTestnet?: boolean
)
```

#### Methods

##### `createERC20ToTONOrder(params)`

Creates a Fusion+ order for swapping ERC20 tokens to native TON.

```typescript
const order = await integration.createERC20ToTONOrder({
  makerAsset: string, // ERC20 token address
  makerAmount: string, // Amount in wei
  tonAddress: string, // User's TON address
  tonAmount: number, // TON amount in nanoTON
  secret: string, // Secret for HTLC
});
```

##### `createTONToERC20Order(params)`

Creates a Fusion+ order for swapping native TON to ERC20 tokens.

```typescript
const order = await integration.createTONToERC20Order({
  tonTxId: string, // TON transaction ID
  tonAmount: number, // TON amount in nanoTON
  takerAsset: string, // Desired ERC20 token
  takerAmount: string, // Desired ERC20 amount
  ethAddress: string, // User's Ethereum address
  secret: string, // Secret for HTLC
});
```

##### `submitTONSwapOrder(order)`

Submits a swap order to the 1inch Fusion+ network.

##### `monitorOrderStatus(orderHash)`

Monitors the status of a submitted order.

##### `getTONBalance(address)`

Retrieves balance for a TON address.

##### `verifyTONTransaction(txId, expectedAmount)`

Verifies a TON transaction's validity and amount.

## How It Works

### 1. ERC20 → TON Swap Flow

1. **Order Creation**: User creates a Fusion+ order to swap ERC20 tokens for TON
2. **Order Submission**: Order is submitted to 1inch Fusion+ network
3. **Resolver Matching**: A resolver (liquidity provider) matches the order
4. **TON HTLC**: Resolver creates a TON HTLC smart contract and funds it
5. **ERC20 Lock**: User's ERC20 tokens are locked in Ethereum escrow
6. **Secret Reveal**: User reveals the secret to claim TON from HTLC
7. **Completion**: Resolver uses the secret to claim ERC20 tokens

### 2. TON → ERC20 Swap Flow

1. **TON Lock**: User locks TON in a TON HTLC smart contract
2. **Order Creation**: User creates a Fusion+ order for the swap
3. **Order Submission**: Order is submitted to 1inch network
4. **Resolver Matching**: A resolver matches the order
5. **ERC20 Lock**: Resolver locks ERC20 tokens in Ethereum escrow
6. **Secret Reveal**: User reveals the secret to claim ERC20 tokens
7. **Completion**: Resolver uses the secret to claim TON

### HTLC Smart Contract Structure

The TON HTLC smart contract uses this structure:

```func
;; HTLC Smart Contract for TON
;; TEP-74 compliant

;; Storage
;; - hash: uint256 (secret hash)
;; - recipient: address (recipient address)
;; - sender: address (sender address)
;; - locktime: uint64 (unlock timestamp)
;; - balance: uint128 (locked amount)

;; Message handlers
;; - redeem(secret: uint256) - redeem with secret
;; - refund() - refund after timeout
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
  const order = await integration.createERC20ToTONOrder(params);
  const submission = await integration.submitTONSwapOrder(order);
} catch (error) {
  console.error("Swap failed:", error);
  // Handle specific error types
  if (error.message.includes("insufficient funds")) {
    // Handle insufficient funds
  }
}
```

## Testing

### Testnet Configuration

For testing, use:

- TON testnet addresses (starting with `EQ`)
- Ethereum testnet (Sepolia, Goerli)
- Testnet TON faucets for funding

### Example Test Flow

1. Get testnet TON from a faucet
2. Create a test ERC20 → TON swap order
3. Monitor the order status
4. Verify the swap completion

## Troubleshooting

### Common Issues

1. **"Invalid private key"**: Ensure your private keys are in the correct format
2. **"Insufficient funds"**: Check your TON and Ethereum balances
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
- Review the TON documentation: https://docs.ton.org/
- Open an issue in this repository

## TON-Specific Features

### Smart Contract Standards

- **TEP-74**: Standard for smart contract interfaces
- **TEP-89**: Standard for wallet contracts
- **TEP-95**: Standard for Jetton (fungible tokens)

### Gas Optimization

- TON uses a different gas model than Ethereum
- Gas costs are typically lower on TON
- Consider gas optimization for frequent operations

### Network Characteristics

- **Block Time**: ~5 seconds (vs Bitcoin's ~10 minutes)
- **Finality**: ~2-3 blocks (vs Bitcoin's 6+ blocks)
- **Transaction Format**: Different from Bitcoin/Ethereum

### Wallet Integration

- **v3R2**: Legacy wallet format
- **v4R2**: Modern wallet format with better features
- **Highload**: For high-frequency operations

## Development Tools

| Tool            | Purpose                  |
| --------------- | ------------------------ |
| `ton`           | Main TON SDK             |
| `ton-core`      | Core TON functionality   |
| `ton-crypto`    | Cryptographic operations |
| `ton-compiler`  | FunC compiler            |
| `tonos-cli`     | Command-line interface   |
| `toncenter.com` | Public API for TON       |

## Additional Resources

- [TON Documentation](https://docs.ton.org/)
- [TON Smart Contracts](https://docs.ton.org/develop/smart-contracts/)
- [FunC Language](https://docs.ton.org/develop/func/)
- [TON Testnet](https://t.me/testgiver_ton_bot)
- [1inch Fusion+ Documentation](https://docs.1inch.dev/)
