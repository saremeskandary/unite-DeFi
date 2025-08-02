# Bitcoin WIF Private Key Generation Guide

This guide explains how to generate Bitcoin private keys in WIF (Wallet Import Format) format for use with the 1inch Fusion+ Bitcoin integration.

## 🔑 What is WIF Format?

WIF (Wallet Import Format) is a way to represent Bitcoin private keys in a readable format that includes:

- The actual private key
- Network information (mainnet vs testnet)
- Checksum for error detection

**WIF Format Examples:**

- **Testnet**: `cQAPyLxx84YtechDcCtsgzmboC7zk5gmM6sxdN6qErs3AqQow2hC`
- **Mainnet**: `L34utF8ADEqe7JvLxCAGReNMwEreNRdzLPPP55WwTdL2zmHyu2MQ`

## 🛠️ Method 1: Using Our Key Generator (Recommended)

### Quick Start

1. **Generate a testnet key** (for development/testing):

   ```bash
   npx tsx scripts/generate-bitcoin-keys.ts testnet
   ```

2. **Generate a mainnet key** (for production):

   ```bash
   npx tsx scripts/generate-bitcoin-keys.ts mainnet
   ```

3. **Run the full demo**:
   ```bash
   npx tsx scripts/generate-bitcoin-keys.ts demo
   ```

### Available Commands

```bash
# Generate single keys
npx tsx scripts/generate-bitcoin-keys.ts testnet
npx tsx scripts/generate-bitcoin-keys.ts mainnet

# Generate multiple keys
npx tsx scripts/generate-bitcoin-keys.ts multiple 10

# Validate a WIF key
npx tsx scripts/generate-bitcoin-keys.ts validate <WIF_KEY>

# Convert hex to WIF
npx tsx scripts/generate-bitcoin-keys.ts convert <HEX_KEY> [mainnet|testnet]

# Show help
npx tsx scripts/generate-bitcoin-keys.ts
```

### Example Output

```bash
🔑 Bitcoin WIF Key Generator

📝 Generating Testnet Key Pair:
Private Key (WIF): cQAPyLxx84YtechDcCtsgzmboC7zk5gmM6sxdN6qErs3AqQow2hC
Public Key: 03865e9f939e9b36cd32de4cc4a2ac679ef8c099e12331bb07bf7f518ec31cb2cc
Address: ms294B3mhVYzdAkHGAHDW4ZyxHg3Go44pv
Network: testnet
```

## 🔧 Method 2: Using Bitcoin.js in Code
import BitcoinKeyGenerator from '@/lib/blockchains/bitcoin/bitcoin-key-generator';
### Generate WIF Key Programmatically

```typescript
import BitcoinKeyGenerator from "@/lib/blockchains/bitcoin/bitcoin-key-generator";

// Generate testnet key
const testnetKey = BitcoinKeyGenerator.generateWIFKeyPair(true);
console.log("WIF:", testnetKey.privateKeyWIF);
console.log("Address:", testnetKey.address);

// Generate mainnet key
const mainnetKey = BitcoinKeyGenerator.generateWIFKeyPair(false);
console.log("WIF:", mainnetKey.privateKeyWIF);
console.log("Address:", mainnetKey.address);
```

### Convert Existing Hex Key to WIF

```typescript
// If you have a hex private key
const hexKey =
  "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const wifKey = BitcoinKeyGenerator.hexToWIF(hexKey, true); // true for testnet
console.log("WIF:", wifKey.privateKeyWIF);
```

### Validate a WIF Key

```typescript
const wifKey = "cQAPyLxx84YtechDcCtsgzmboC7zk5gmM6sxdN6qErs3AqQow2hC";
const validation = BitcoinKeyGenerator.validateWIF(wifKey);
console.log("Is Valid:", validation.isValid);
console.log("Network:", validation.network);
console.log("Address:", validation.address);
```

## 🌐 Method 3: Online Tools (Use with Caution)

⚠️ **Security Warning**: Only use online tools for testnet keys or in trusted environments.

### Popular Online Generators

1. **Bitcoin Testnet Faucet**: https://testnet-faucet.mempool.co/
2. **Bitcoin Address Generator**: https://www.bitaddress.org/
3. **Bitcoin Paper Wallet**: https://walletgenerator.net/

### Steps for Online Generation

1. Visit a trusted Bitcoin address generator
2. Generate a new address
3. Copy the private key in WIF format
4. **Never use online tools for mainnet keys with real funds**

## 🔒 Method 4: Hardware Wallets

For maximum security with real funds:

### Ledger

1. Connect your Ledger device
2. Open Bitcoin app
3. Export private key (if supported)
4. Convert to WIF format if needed

### Trezor

1. Connect your Trezor device
2. Use Trezor Suite
3. Export private key
4. Convert to WIF format if needed

## 📋 WIF Format Details

### Structure

```
[Version Byte][Private Key][Compression Flag][Checksum]
```

### Version Bytes

- **Mainnet**: `0x80` (starts with `5` or `K/L`)
- **Testnet**: `0xEF` (starts with `9` or `c`)

### Examples by Network

#### Testnet WIF Keys

```
cQAPyLxx84YtechDcCtsgzmboC7zk5gmM6sxdN6qErs3AqQow2hC
cVmqSWVCD4PyqE24snnGwV1so94aG2ZapBeooGMNykepwhnLE9VR
cU21WuSXa6WPuPKvuaFqt2pSnyVCB3721DF8g21seSbtTfGuvqVu
```

#### Mainnet WIF Keys

```
L34utF8ADEqe7JvLxCAGReNMwEreNRdzLPPP55WwTdL2zmHyu2MQ
5KJvsngHeMpm884wtkJNzQGaCErckhHJBGFsvd3VyK5qMZXj3hS
KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFU73sVHnoWn
```

## 🧪 Testing Your WIF Key

### 1. Validate the Key

```bash
npx tsx scripts/generate-bitcoin-keys.ts validate cQAPyLxx84YtechDcCtsgzmboC7zk5gmM6sxdN6qErs3AqQow2hC
```

### 2. Check the Address

- Testnet addresses start with `m` or `n`
- Mainnet addresses start with `1`, `3`, or `bc1`

### 3. Test with Small Amounts

- Use testnet faucets to get test Bitcoin
- Test your integration with small amounts first

## 🔐 Security Best Practices

### For Development/Testing

1. ✅ Use testnet keys
2. ✅ Generate keys programmatically
3. ✅ Never commit keys to version control
4. ✅ Use environment variables

### For Production

1. ✅ Use hardware wallets
2. ✅ Generate keys offline
3. ✅ Use secure key management
4. ✅ Never expose private keys in client-side code
5. ✅ Use multi-signature wallets when possible

## 🚨 Common Mistakes to Avoid

1. **Using mainnet keys for testing**
2. **Committing private keys to Git**
3. **Sharing private keys in logs**
4. **Using online generators for real funds**
5. **Not backing up private keys securely**

## 📝 Environment Variable Setup

Once you have your WIF key, add it to your `.env.local`:

```env
# For testing (use testnet)
NEXT_PUBLIC_BTC_PRIVATE_KEY_WIF=cQAPyLxx84YtechDcCtsgzmboC7zk5gmM6sxdN6qErs3AqQow2hC

# For production (use mainnet)
# NEXT_PUBLIC_BTC_PRIVATE_KEY_WIF=L34utF8ADEqe7JvLxCAGReNMwEreNRdzLPPP55WwTdL2zmHyu2MQ
```

## 🔍 Troubleshooting

### Invalid WIF Key Error

- Check the key format (should be 51-52 characters)
- Verify the checksum
- Ensure you're using the correct network

### Address Mismatch

- Testnet addresses start with `m` or `n`
- Mainnet addresses start with `1`, `3`, or `bc1`
- Verify the key is for the correct network

### Import Issues

- Ensure the key is in WIF format, not hex
- Check for extra spaces or characters
- Verify the key hasn't been corrupted

## 📚 Additional Resources

- [Bitcoin WIF Format Specification](https://en.bitcoin.it/wiki/Wallet_import_format)
- [Bitcoin.js Documentation](https://github.com/bitcoinjs/bitcoinjs-lib)
- [1inch Fusion+ Documentation](https://docs.1inch.dev/)
- [Bitcoin Testnet Faucet](https://testnet-faucet.mempool.co/)

## 🆘 Need Help?

If you encounter issues:

1. Check the troubleshooting section above
2. Validate your WIF key using our tool
3. Ensure you're using the correct network
4. Test with a fresh generated key
