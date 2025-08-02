# Bitcoin Transaction Signing Guide

## Overview

This document explains how users can manually sign Bitcoin transactions for HTLC swaps in the Unite DeFi application. Since Bitcoin doesn't support direct wallet connections like MetaMask, users need to manually sign and broadcast transactions using their Bitcoin wallets.

## Why Manual Transaction Signing?

### Bitcoin's Limitations

- **No Smart Contracts**: Bitcoin's scripting language is limited
- **No Direct Wallet Connection**: Cannot connect Bitcoin wallets like MetaMask
- **Manual Transaction Signing**: Users must manually sign transactions
- **Off-chain Coordination**: Requires careful coordination between chains

### HTLC Requirements

- **Trustless Execution**: HTLCs require specific transaction structures
- **Custom Scripts**: Bitcoin scripts must be precisely crafted
- **Time Locks**: Transactions must include specific time constraints
- **Secret Verification**: Cryptographic secrets must be properly handled

## Transaction Types

### 1. HTLC Funding Transaction

**Purpose**: Creates the HTLC by sending Bitcoin to a special address

**When Used**:

- BTC → ERC20 swaps
- User wants to send Bitcoin to receive ERC20 tokens

**Key Components**:

- **Inputs**: User's Bitcoin UTXOs
- **Outputs**: HTLC address (main output) + change address
- **Script**: HTLC script with secret hash and time lock
- **Lock Time**: Prevents refund until time expires

### 2. HTLC Spending Transaction

**Purpose**: Claims Bitcoin from HTLC by revealing the secret

**When Used**:

- After ERC20 tokens are received
- User wants to claim their Bitcoin

**Key Components**:

- **Input**: HTLC output
- **Output**: User's Bitcoin address
- **Witness Data**: Secret and signature
- **Script**: HTLC script verification

## Transaction Viewer Interface

### Features

1. **Raw Transaction Display**: Complete transaction hex
2. **Expandable Sections**: Detailed view of inputs, outputs, scripts
3. **Copy Functionality**: Easy copying of transaction data
4. **Opcode Explanations**: Detailed Bitcoin script explanations
5. **Step-by-step Instructions**: Clear signing guidance
6. **Warnings**: Important security reminders

### Sections Explained

#### Transaction Summary

- **Total Amount**: Total Bitcoin being moved
- **Fee**: Transaction fee in BTC
- **Change**: Amount returned to user
- **Inputs/Outputs**: Count of transaction components

#### Raw Transaction

- **Complete Hex**: Full transaction in hexadecimal format
- **Copyable**: One-click copying for wallet import
- **Expandable**: Full view or truncated display

#### Transaction Explanation

- **Purpose**: What the transaction does
- **HTLC Details**: Address, time lock, secret hash
- **Security**: How the HTLC protects funds

#### Inputs/Outputs

- **Input Details**: TXID, amount, address for each input
- **Output Details**: Address, amount, script for each output
- **Type Labels**: HTLC, change, recipient classifications

#### Bitcoin Opcodes

- **OP_IF**: Conditional execution
- **OP_HASH160**: SHA256 + RIPEMD160 hashing
- **OP_EQUALVERIFY**: Value comparison
- **OP_CHECKLOCKTIMEVERIFY**: Time lock verification
- **OP_CHECKSIG**: Signature verification

## Signing Process

### Step 1: Copy Transaction

1. Click "Copy Transaction" button
2. Transaction hex is copied to clipboard
3. Verify the transaction details match expectations

### Step 2: Import to Bitcoin Wallet

1. Open your Bitcoin wallet (Electrum, Bitcoin Core, etc.)
2. Navigate to "Sign Transaction" or "Advanced" section
3. Paste the transaction hex
4. Review transaction details carefully

### Step 3: Sign Transaction

1. Verify all inputs and outputs
2. Check fee amount is reasonable
3. Confirm HTLC address is correct
4. Sign with your private key
5. Review the signed transaction

### Step 4: Broadcast Transaction

1. Copy the signed transaction hex
2. Use wallet's "Broadcast" function
3. Or use a Bitcoin block explorer
4. Wait for confirmation (1-6 blocks)

## Supported Bitcoin Wallets

### Desktop Wallets

- **Electrum**: Most popular, excellent HTLC support
- **Bitcoin Core**: Full node, complete control
- **Wasabi**: Privacy-focused wallet
- **Sparrow**: Advanced features

### Hardware Wallets

- **Trezor**: Good HTLC support
- **Ledger**: Basic transaction signing
- **ColdCard**: Advanced Bitcoin features

### Mobile Wallets

- **BlueWallet**: Good for basic transactions
- **Samourai**: Privacy features
- **Electrum Mobile**: Full Electrum features

## Security Considerations

### Before Signing

- ✅ Verify HTLC address is correct
- ✅ Check time lock duration
- ✅ Confirm fee amount
- ✅ Review all inputs and outputs
- ✅ Ensure secret hash matches

### During Signing

- 🔒 Use secure, offline wallet if possible
- 🔒 Never share private keys
- 🔒 Double-check transaction details
- 🔒 Verify wallet is not compromised

### After Broadcasting

- 📡 Monitor transaction confirmation
- 📡 Keep secret safe for claiming
- 📡 Track HTLC status
- 📡 Monitor for secret reveal

## Common Issues and Solutions

### Transaction Rejection

**Problem**: Transaction fails to broadcast
**Solutions**:

- Check fee is sufficient
- Verify inputs are unspent
- Ensure proper script format
- Check network congestion

### Incorrect HTLC Address

**Problem**: Funds sent to wrong address
**Solutions**:

- Double-check address before signing
- Verify secret hash matches
- Confirm time lock settings
- Use testnet for testing

### Time Lock Issues

**Problem**: Cannot claim funds after time lock
**Solutions**:

- Monitor time lock expiration
- Have backup claiming method
- Understand refund process
- Plan timing carefully

## Testing on Testnet

### Testnet Benefits

- **No Real Money**: Safe testing environment
- **Free Bitcoin**: Get testnet coins easily
- **Same Features**: Full HTLC functionality
- **Learning**: Practice without risk

### Testnet Setup

1. Switch wallet to testnet
2. Get testnet Bitcoin from faucet
3. Use testnet addresses
4. Test complete swap flow

### Testnet Resources

- **Faucet**: https://testnet-faucet.mempool.co/
- **Explorer**: https://blockstream.info/testnet/
- **Network**: Bitcoin testnet

## Advanced Features

### Fee Optimization

- **Dynamic Fees**: Adjust based on network congestion
- **Fee Estimation**: Use mempool data
- **RBF Support**: Replace-by-fee for stuck transactions
- **CPFP**: Child-pays-for-parent

### Multi-Signature HTLCs

- **Enhanced Security**: Multiple signatures required
- **Complex Scripts**: Advanced Bitcoin scripting
- **Higher Fees**: Larger transaction size
- **Better Protection**: Against single point of failure

### Lightning Network Integration

- **Faster Swaps**: Instant settlement
- **Lower Fees**: Minimal transaction costs
- **Complex Setup**: Requires Lightning channels
- **Limited Support**: Not all wallets support

## Troubleshooting

### Transaction Not Confirming

1. Check network congestion
2. Verify fee is sufficient
3. Monitor mempool status
4. Consider RBF if stuck

### HTLC Timeout

1. Verify time lock settings
2. Check block time
3. Monitor for secret reveal
4. Understand refund process

### Address Validation Errors

1. Check address format
2. Verify network (testnet/mainnet)
3. Validate checksum
4. Test with known good addresses

### Script Errors

1. Verify opcode sequence
2. Check data lengths
3. Validate signatures
4. Review HTLC script structure

## Best Practices

### For Users

- **Test First**: Always test on testnet
- **Small Amounts**: Start with small swaps
- **Backup Secrets**: Keep secrets secure
- **Monitor Status**: Track transaction progress
- **Understand Process**: Learn how HTLCs work

### For Developers

- **Clear Instructions**: Provide step-by-step guidance
- **Error Handling**: Graceful failure recovery
- **Security Warnings**: Highlight important risks
- **Testing Tools**: Provide testnet support
- **Documentation**: Comprehensive guides

## Conclusion

Manual Bitcoin transaction signing is essential for HTLC-based cross-chain swaps. While more complex than direct wallet connections, it provides the security and trustlessness required for decentralized exchanges.

The transaction viewer interface makes this process as user-friendly as possible by providing:

- Clear transaction explanations
- Detailed opcode descriptions
- Step-by-step instructions
- Copy functionality for easy wallet import
- Comprehensive security warnings

By following this guide and using the provided tools, users can safely and confidently perform Bitcoin ↔ ERC20 swaps while maintaining full control over their funds.
