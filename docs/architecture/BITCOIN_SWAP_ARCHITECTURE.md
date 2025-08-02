# Bitcoin Swap Architecture

## Overview

This document explains how Bitcoin ↔ ERC20 token swaps are implemented in the Unite DeFi application. Unlike other blockchain networks, Bitcoin cannot be directly connected like MetaMask wallets, requiring a different approach for cross-chain swaps.

## Key Differences from Other Chains

### Bitcoin Limitations

- **No Smart Contracts**: Bitcoin's scripting language is limited and cannot execute complex logic
- **No Direct Wallet Connection**: Users cannot "connect" a Bitcoin wallet like MetaMask
- **Manual Transaction Signing**: Users must manually sign and broadcast Bitcoin transactions
- **No Native Token Support**: Bitcoin only supports its native BTC token

### Why HTLCs Are Used

Hash Time-Locked Contracts (HTLCs) provide a trustless way to perform atomic swaps between Bitcoin and ERC20 tokens without requiring smart contracts on Bitcoin.

## Architecture Components

### 1. Bitcoin Swap Flow Handler (`BitcoinSwapFlow`)

Located at: `src/lib/blockchains/bitcoin/bitcoin-swap-flow.ts`

This class manages the different swap directions:

#### ERC20 → BTC Flow

1. User approves ERC20 tokens on Ethereum
2. System locks ERC20 tokens in escrow
3. System creates Bitcoin HTLC and funds it
4. User receives Bitcoin at their address
5. System monitors for secret reveal to complete swap

#### BTC → ERC20 Flow

1. User provides Bitcoin address where they'll send BTC
2. System creates HTLC address for user to send BTC to
3. System locks ERC20 tokens in escrow
4. User manually sends BTC to HTLC address
5. System monitors for BTC deposit
6. Once BTC confirmed, ERC20 tokens are released

### 2. HTLC Operations (`BitcoinHTLCOperations`)

Located at: `src/lib/blockchains/bitcoin/bitcoin-htlc-operations.ts`

Handles:

- Creating Bitcoin HTLC scripts
- Generating secret hashes
- Creating HTLC addresses
- Extracting secrets from transactions

### 3. Network Operations (`BitcoinNetworkOperations`)

Located at: `src/lib/blockchains/bitcoin/bitcoin-network-operations.ts`

Handles:

- Bitcoin transaction broadcasting
- Address history monitoring
- UTXO management
- Fee estimation

### 4. Swap Monitoring Service (`SwapMonitoringService`)

Located at: `src/lib/blockchains/bitcoin/swap-monitoring-service.ts`

Handles:

- Monitoring Bitcoin blockchain for transactions
- Detecting secret reveals
- Completing cross-chain swaps
- Error handling and recovery

## User Experience Flow

### For ERC20 → BTC Swaps

1. **User Interface**: User selects ERC20 token and BTC as destination
2. **Bitcoin Address Input**: User enters their Bitcoin address
3. **Order Creation**: System creates Fusion+ order and Bitcoin HTLC
4. **Token Approval**: User approves ERC20 token spending
5. **Automatic Execution**: System automatically handles the Bitcoin side
6. **Completion**: User receives Bitcoin at their address

### For BTC → ERC20 Swaps

1. **User Interface**: User selects BTC and ERC20 token as destination
2. **Bitcoin Address Input**: User enters their Bitcoin address
3. **Order Creation**: System creates Fusion+ order and provides HTLC address
4. **Manual Bitcoin Transfer**: User manually sends BTC to the provided HTLC address
5. **Monitoring**: System monitors for Bitcoin deposit
6. **Completion**: ERC20 tokens are automatically released to user

## Technical Implementation

### HTLC Script Structure

```typescript
// Bitcoin HTLC script parameters
interface HTLCParams {
  secretHash: Buffer; // Hash of the secret
  recipientPublicKey: string; // Who can claim with the secret
  lockTimeBlocks: number; // Timeout for the HTLC
}
```

### Secret Management

```typescript
// Generate random secret
const secret = crypto.randomBytes(32).toString("hex");

// Create hash for HTLC
const secretHash = crypto.createHash("sha256").update(secret).digest();
```

### Monitoring Process

```typescript
// Monitor Bitcoin address for transactions
async monitorSecretReveal(orderHash: string, htlcAddress: string) {
  const addressHistory = await this.networkOperations.getBitcoinAddressHistory(htlcAddress);

  // Look for spending transaction that reveals the secret
  const spendingTx = addressHistory.find(tx =>
    tx.vin.some(input => input.prevout?.scriptpubkey_address === htlcAddress)
  );

  if (spendingTx) {
    const secret = this.extractSecretFromTransaction(spendingTx);
    await this.completeFusionSwap(orderHash, secret);
  }
}
```

## Security Considerations

### HTLC Security

- **Time Locks**: HTLCs have timeouts to prevent indefinite locking
- **Secret Verification**: Secrets are cryptographically verified
- **Atomic Execution**: Either both sides complete or both sides fail

### User Security

- **Address Validation**: Bitcoin addresses are validated before use
- **Amount Verification**: Exact amounts are required for HTLC funding
- **Transaction Monitoring**: All transactions are monitored for confirmation

### Network Security

- **Testnet Support**: Development and testing on Bitcoin testnet
- **Mainnet Safety**: Gradual rollout with extensive testing
- **Error Recovery**: Robust error handling and recovery mechanisms

## UI Components

### Bitcoin Address Input (`BitcoinAddressInput`)

- Validates Bitcoin address formats (Legacy, P2SH, Bech32, Bech32m)
- QR code scanning support
- Real-time validation feedback

### Bitcoin Swap Flow UI (`BitcoinSwapFlowUI`)

- Step-by-step swap process
- Clear instructions for users
- Progress tracking and status updates
- Copy-to-clipboard functionality for addresses

### Integration with Main Swap Interface

- Conditional rendering when Bitcoin is selected
- Seamless integration with existing swap flow
- Consistent user experience

## Configuration

### Environment Variables

```bash
# Ethereum private key for smart contract interactions
NEXT_PUBLIC_ETH_PRIVATE_KEY=your_eth_private_key

# Bitcoin private key (WIF format) for Bitcoin operations
NEXT_PUBLIC_BTC_PRIVATE_KEY_WIF=your_btc_private_key_wif

# Network configuration
NEXT_PUBLIC_USE_BTC_TESTNET=true  # Set to false for mainnet
```

### Network Settings

```typescript
const bitcoinConfig = {
  testnet: {
    rpcUrl: "https://blockstream.info/testnet/api",
    explorer: "https://blockstream.info/testnet",
    confirmations: 3,
  },
  mainnet: {
    rpcUrl: "https://blockstream.info/api",
    explorer: "https://blockstream.info",
    confirmations: 6,
  },
};
```

## Testing

### Unit Tests

- HTLC script creation and validation
- Secret generation and hashing
- Address validation
- Transaction monitoring

### Integration Tests

- End-to-end swap workflows
- Cross-chain coordination
- Error handling scenarios
- Network failure recovery

### Test Data

```typescript
// Test Bitcoin addresses
const testAddresses = {
  legacy: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  p2sh: "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy",
  bech32: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
};
```

## Monitoring and Analytics

### Swap Tracking

- Order creation and status
- Transaction confirmations
- Success/failure rates
- User experience metrics

### Network Monitoring

- Bitcoin network congestion
- Fee estimation accuracy
- Transaction confirmation times
- HTLC timeout rates

### Error Tracking

- Failed swaps analysis
- User error patterns
- Network issue detection
- Recovery success rates

## Future Enhancements

### Planned Features

- **Lightning Network Support**: Faster Bitcoin transactions
- **Multi-Signature HTLCs**: Enhanced security for large amounts
- **Batch Processing**: Multiple swaps in single transaction
- **Advanced Monitoring**: Real-time blockchain monitoring

### Performance Optimizations

- **Caching**: Address history and transaction data
- **Parallel Processing**: Multiple swap monitoring
- **Fee Optimization**: Dynamic fee adjustment
- **Network Selection**: Automatic network selection based on conditions

## Troubleshooting

### Common Issues

#### Bitcoin Transaction Not Confirming

- Check network congestion
- Verify fee estimation
- Monitor mempool status
- Consider RBF (Replace-by-Fee)

#### HTLC Timeout

- Verify time lock settings
- Check network block time
- Monitor for secret reveal
- Implement recovery procedures

#### Address Validation Errors

- Verify address format
- Check network (testnet vs mainnet)
- Validate checksum
- Test with known good addresses

### Debug Tools

- Transaction explorer links
- HTLC script verification
- Secret hash validation
- Network status monitoring

## Conclusion

The Bitcoin swap architecture provides a robust, secure, and user-friendly way to perform cross-chain swaps between Bitcoin and ERC20 tokens. By using HTLCs and careful monitoring, the system ensures trustless execution while handling Bitcoin's unique limitations.

The modular design allows for easy testing, maintenance, and future enhancements while providing a seamless user experience that integrates with the existing DeFi application.
