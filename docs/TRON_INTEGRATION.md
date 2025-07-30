# 1inch Fusion+ TRON Cross-Chain Integration

This integration enables atomic swaps between Ethereum ERC20 tokens and native TRX using 1inch's Fusion+ protocol. It provides a complete implementation for cross-chain DeFi operations.

## Features

- **Atomic Swaps**: Secure ERC20 ↔ Native TRX swaps
- **HTLC Smart Contracts**: TRON-compatible Hash Time Locked Contracts
- **Order Management**: Full 1inch Fusion+ order lifecycle
- **Real-time Monitoring**: Order status and blockchain monitoring
- **Testnet Support**: Both TRON testnet (Nile) and mainnet support

## Installation

The required dependencies have been added to `package.json`:

```json
{
  "@1inch/fusion-sdk": "^2.3.5",
  "@1inch/cross-chain-sdk": "^0.2.1-rc.47",
  "web3": "^4.0.0",
  "tronweb": "^5.3.0",
  "@tronprotocol/tronweb": "^5.3.0",
  "crypto-js": "^4.2.0",
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

# TRON Configuration
TRON_PRIVATE_KEY=your_tron_private_key_here
TRON_MNEMONIC=your_tron_mnemonic_phrase_here
TRON_NETWORK=mainnet # or testnet

# 1inch API
INCH_API_KEY=your_1inch_api_key_here
```

## Quick Start

### Basic Usage

```typescript
import { FusionTRONIntegration } from "@/lib/fusion-tron-integration";
import { NetworkEnum } from "@1inch/fusion-sdk";

// Initialize the integration
const integration = new FusionTRONIntegration(
  process.env.ETH_PRIVATE_KEY!,
  process.env.TRON_PRIVATE_KEY!,
  process.env.ETH_RPC_URL!,
  NetworkEnum.ETHEREUM,
  true // Use TRON testnet
);

// Create ERC20 → TRX swap order
const order = await integration.createERC20ToTRXOrder({
  makerAsset: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", // WBTC
  makerAmount: "10000000", // 0.1 WBTC (8 decimals)
  trxAddress: "TQn9Y2khDD95J42FQtQTdwVVRzp4Kn6qyF",
  trxAmount: 100000000, // 100 TRX (6 decimals)
  secret: "my-secret-phrase-for-atomic-swap-123",
});

// Submit order to 1inch network
const submission = await integration.submitTRXSwapOrder(order);
console.log("Order submitted:", submission.orderHash);
```

### Running Examples

```typescript
import { TRXSwapExamples, runAllExamples } from "@/lib/tron-swap-example";

// Run all examples
await runAllExamples();

// Or run individual examples
await TRXSwapExamples.swapERC20ToTRX();
await TRXSwapExamples.getTRXBalance("your-tron-address");
```

## API Reference

### FusionTRONIntegration Class

#### Constructor

```typescript
new FusionTRONIntegration(
  privateKey: string,
  tronPrivateKey: string,
  rpcUrl?: string,
  network?: NetworkEnum,
  useTRONTestnet?: boolean
)
```

#### Methods

##### `createERC20ToTRXOrder(params)`

Creates a Fusion+ order for swapping ERC20 tokens to native TRX.

```typescript
const order = await integration.createERC20ToTRXOrder({
  makerAsset: string, // ERC20 token address
  makerAmount: string, // Amount in wei
  trxAddress: string, // User's TRON address
  trxAmount: number, // TRX amount in sun (6 decimals)
  secret: string, // Secret for HTLC
});
```

##### `createTRXToERC20Order(params)`

Creates a Fusion+ order for swapping native TRX to ERC20 tokens.

```typescript
const order = await integration.createTRXToERC20Order({
  trxTxId: string, // TRON transaction ID
  trxAmount: number, // TRX amount in sun
  takerAsset: string, // Desired ERC20 token
  takerAmount: string, // Desired ERC20 amount
  ethAddress: string, // User's Ethereum address
  secret: string, // Secret for HTLC
});
```

##### `submitTRXSwapOrder(order)`

Submits a swap order to the 1inch Fusion+ network.

##### `monitorOrderStatus(orderHash)`

Monitors the status of a submitted order.

##### `getTRXBalance(address)`

Retrieves balance for a TRON address.

##### `verifyTRXTransaction(txId, expectedAmount)`

Verifies a TRON transaction's validity and amount.

## How It Works

### 1. ERC20 → TRX Swap Flow

1. **Order Creation**: User creates a Fusion+ order to swap ERC20 tokens for TRX
2. **Order Submission**: Order is submitted to 1inch Fusion+ network
3. **Resolver Matching**: A resolver (liquidity provider) matches the order
4. **TRON HTLC**: Resolver creates a TRON HTLC smart contract and funds it
5. **ERC20 Lock**: User's ERC20 tokens are locked in Ethereum escrow
6. **Secret Reveal**: User reveals the secret to claim TRX from HTLC
7. **Completion**: Resolver uses the secret to claim ERC20 tokens

### 2. TRX → ERC20 Swap Flow

1. **TRX Lock**: User locks TRX in a TRON HTLC smart contract
2. **Order Creation**: User creates a Fusion+ order for the swap
3. **Order Submission**: Order is submitted to 1inch network
4. **Resolver Matching**: A resolver matches the order
5. **ERC20 Lock**: Resolver locks ERC20 tokens in Ethereum escrow
6. **Secret Reveal**: User reveals the secret to claim ERC20 tokens
7. **Completion**: Resolver uses the secret to claim TRX

### HTLC Smart Contract Structure

The TRON HTLC smart contract uses this structure:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract HTLC {
    struct Swap {
        bytes32 hashlock;
        address recipient;
        address sender;
        uint256 locktime;
        uint256 amount;
        bool withdrawn;
        bool refunded;
    }

    mapping(bytes32 => Swap) public swaps;

    event HTLCNew(
        bytes32 indexed contractId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        uint256 locktime
    );

    event HTLCWithdraw(bytes32 indexed contractId);
    event HTLCRefund(bytes32 indexed contractId);

    function newContract(
        bytes32 _hashlock,
        address _recipient,
        uint256 _locktime
    ) external payable {
        require(msg.value > 0, "Amount must be greater than 0");
        require(_locktime > block.timestamp, "Locktime must be in the future");

        bytes32 contractId = keccak256(
            abi.encodePacked(msg.sender, _recipient, _hashlock, _locktime)
        );

        swaps[contractId] = Swap({
            hashlock: _hashlock,
            recipient: _recipient,
            sender: msg.sender,
            locktime: _locktime,
            amount: msg.value,
            withdrawn: false,
            refunded: false
        });

        emit HTLCNew(contractId, msg.sender, _recipient, msg.value, _locktime);
    }

    function withdraw(bytes32 _contractId, bytes32 _preimage) external {
        Swap storage swap = swaps[_contractId];
        require(swap.recipient == msg.sender, "Only recipient can withdraw");
        require(!swap.withdrawn, "Already withdrawn");
        require(!swap.refunded, "Already refunded");
        require(
            keccak256(abi.encodePacked(_preimage)) == swap.hashlock,
            "Invalid preimage"
        );

        swap.withdrawn = true;
        payable(msg.sender).transfer(swap.amount);

        emit HTLCWithdraw(_contractId);
    }

    function refund(bytes32 _contractId) external {
        Swap storage swap = swaps[_contractId];
        require(swap.sender == msg.sender, "Only sender can refund");
        require(!swap.withdrawn, "Already withdrawn");
        require(!swap.refunded, "Already refunded");
        require(block.timestamp >= swap.locktime, "Locktime not reached");

        swap.refunded = true;
        payable(msg.sender).transfer(swap.amount);

        emit HTLCRefund(_contractId);
    }

    function getSwap(bytes32 _contractId) external view returns (Swap memory) {
        return swaps[_contractId];
    }
}
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
  const order = await integration.createERC20ToTRXOrder(params);
  const submission = await integration.submitTRXSwapOrder(order);
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

- TRON testnet addresses (Nile network)
- Ethereum testnet (Sepolia, Goerli)
- Testnet TRX faucets for funding

### Example Test Flow

1. Get testnet TRX from a faucet
2. Create a test ERC20 → TRX swap order
3. Monitor the order status
4. Verify the swap completion

## Troubleshooting

### Common Issues

1. **"Invalid private key"**: Ensure your private keys are in the correct format
2. **"Insufficient funds"**: Check your TRX and Ethereum balances
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
- Review the TRON documentation: https://developers.tron.network/
- Open an issue in this repository

## TRON-Specific Features

### Smart Contract Standards

- **TRC-20**: Standard for smart contract interfaces
- **TRC-10**: Standard for TRON tokens
- **TRC-721**: Standard for non-fungible tokens

### Energy Optimization

- TRON uses energy instead of gas
- Energy costs are typically lower on TRON
- Consider energy optimization for frequent operations

### Network Characteristics

- **Block Time**: ~3 seconds (vs Bitcoin's ~10 minutes)
- **Finality**: ~1-2 blocks (vs Bitcoin's 6+ blocks)
- **Transaction Format**: Different from Bitcoin/Ethereum

### Wallet Integration

- **TronLink**: Popular TRON wallet
- **Ledger**: Hardware wallet support
- **Highload**: For high-frequency operations

## Development Tools

| Tool                    | Purpose                  |
| ----------------------- | ------------------------ |
| `tronweb`               | Main TRON SDK            |
| `@tronprotocol/tronweb` | Core TRON functionality  |
| `crypto-js`             | Cryptographic operations |
| `tronbox`               | Development framework    |
| `tronlink`              | Browser extension        |
| `tronscan.org`          | Public API for TRON      |

## Additional Resources

- [TRON Documentation](https://developers.tron.network/)
- [TRON Smart Contracts](https://developers.tron.network/docs/smart-contract)
- [Solidity for TRON](https://developers.tron.network/docs/solidity)
- [TRON Testnet (Nile)](https://nileex.io/)
- [1inch Fusion+ Documentation](https://docs.1inch.dev/)
