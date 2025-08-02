# Bitcoin Swap Flow Documentation

## Overview

The Bitcoin swap interface supports cross-chain swaps between Bitcoin and ERC20 tokens on Ethereum. When Bitcoin is the "from" token (user wants to swap BTC to ERC20), the system requires manual transaction creation since Bitcoin transactions cannot be automatically signed by the web interface.

## Flow for Bitcoin to ERC20 Swaps

### 1. User Input

- User selects BTC as "from" token and an ERC20 token as "to" token
- User enters their Bitcoin address (source address where they'll send BTC from)
- User enters the swap amount

### 2. Swap Order Creation

- System creates an HTLC (Hashed Timelock Contract) on the Bitcoin network
- Generates a unique HTLC address where the user must send their Bitcoin
- Creates a secret hash for the atomic swap
- Returns the swap order with HTLC details

### 3. Manual Transaction Creation

Since the web interface cannot sign Bitcoin transactions (for security reasons), the user must manually create and broadcast the Bitcoin transaction. The interface provides several tools to help:

#### Option A: Transaction Builder UI

- Interactive interface to input UTXOs (Unspent Transaction Outputs)
- Automatic fee calculation
- Transaction template generation
- Download transaction as JSON file

#### Option B: Simple Transaction Template

- Basic transaction structure with placeholders
- User needs to replace UTXO details manually
- Download template for manual editing

#### Option C: Direct HTLC Address

- Copy the HTLC address directly
- Use any Bitcoin wallet to send the exact amount to the HTLC address

### 4. Transaction Broadcasting

The user must:

1. Sign the transaction with their private key using a Bitcoin wallet
2. Broadcast the signed transaction to the Bitcoin network
3. Wait for confirmation (typically 1-6 blocks)

### 5. Swap Completion

Once the Bitcoin transaction is confirmed:

- The HTLC is funded with the user's Bitcoin
- The system automatically releases the corresponding ERC20 tokens to the user's Ethereum address
- The swap is completed atomically

## Technical Details

### HTLC Structure

The HTLC (Hashed Timelock Contract) on Bitcoin uses:

- **Secret Hash**: SHA256 hash of a random secret
- **Recipient Address**: User's Bitcoin address for refund
- **Lock Time**: 1 hour timeout
- **Amount**: Exact swap amount in satoshis

### Transaction Requirements

The manual Bitcoin transaction must:

- Send exactly the swap amount to the HTLC address
- Include sufficient fees for network confirmation
- Be signed with the user's private key
- Be broadcast to the correct Bitcoin network (testnet/mainnet)

### Security Considerations

- Users should never share their private keys
- Always verify the HTLC address before sending funds
- Use reputable Bitcoin wallets for transaction signing
- Double-check transaction amounts and fees

## User Interface Features

### Transaction Builder

- **UTXO Input**: Add multiple UTXOs with transaction details
- **Fee Calculation**: Automatic fee estimation based on transaction size
- **Change Output**: Automatic change calculation and output generation
- **Transaction Preview**: JSON preview of the built transaction
- **Download Options**: Save transaction as JSON file or copy to clipboard

### Validation

- Bitcoin address validation
- UTXO amount validation
- Fee sufficiency checks
- Change amount validation (must be above dust limit)

### Error Handling

- Insufficient funds detection
- Invalid UTXO format validation
- Network fee estimation errors
- Transaction building failures

## Supported Networks

### Testnet

- Bitcoin Testnet
- Ethereum Testnet (Sepolia/Goerli)

### Mainnet (Future)

- Bitcoin Mainnet
- Ethereum Mainnet

## Troubleshooting

### Common Issues

1. **Insufficient Funds**: Ensure total UTXO value covers swap amount + fees
2. **Invalid UTXO**: Verify transaction ID and output index
3. **Low Fees**: Increase fee rate for faster confirmation
4. **Network Mismatch**: Ensure using correct network (testnet/mainnet)

### Getting Help

- Check transaction status on Bitcoin block explorer
- Verify HTLC address matches swap order
- Ensure sufficient confirmation blocks (1-6 blocks)
- Contact support if ERC20 tokens not received after Bitcoin confirmation
