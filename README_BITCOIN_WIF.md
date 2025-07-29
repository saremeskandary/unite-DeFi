# 🔑 Bitcoin WIF Key Generation - Complete Guide

This guide provides multiple methods to generate Bitcoin private keys in WIF (Wallet Import Format) format for use with the 1inch Fusion+ Bitcoin integration.

## 🚀 Quick Start

### Method 1: Command Line Tool (Recommended)

```bash
# Generate a testnet key (for development)
npx tsx scripts/generate-bitcoin-keys.ts testnet

# Generate a mainnet key (for production)
npx tsx scripts/generate-bitcoin-keys.ts mainnet

# Generate multiple testnet keys
npx tsx scripts/generate-bitcoin-keys.ts multiple 5

# Validate a WIF key
npx tsx scripts/generate-bitcoin-keys.ts validate <WIF_KEY>

# Convert hex to WIF
npx tsx scripts/generate-bitcoin-keys.ts convert <HEX_KEY> [mainnet|testnet]
```

### Method 2: Web Interface

Visit `/bitcoin-keys` in your app to use the web-based key generator with:
- One-click key generation
- WIF validation
- Hex to WIF conversion
- Copy-to-clipboard functionality

### Method 3: Programmatic Generation

```typescript
import { BitcoinKeyGenerator } from '@/lib/bitcoin-key-generator';

// Generate testnet key
const key = BitcoinKeyGenerator.generateWIFKeyPair(true);
console.log('WIF:', key.privateKeyWIF);
console.log('Address:', key.address);
```

## 📋 What You'll Get

### Testnet Key Example
```
Private Key (WIF): cQAPyLxx84YtechDcCtsgzmboC7zk5gmM6sxdN6qErs3AqQow2hC
Public Key: 03865e9f939e9b36cd32de4cc4a2ac679ef8c099e12331bb07bf7f518ec31cb2cc
Address: ms294B3mhVYzdAkHGAHDW4ZyxHg3Go44pv
Network: testnet
```

### Mainnet Key Example
```
Private Key (WIF): L34utF8ADEqe7JvLxCAGReNMwEreNRdzLPPP55WwTdL2zmHyu2MQ
Public Key: 03c652e9e893fba837d096b2dc318bee8bb7a97b0d99d3ca5d0dff3207fe82e57b
Address: 1ByYLRX7rQHMtiqqpQnCM9LArevCnzPyDG
Network: mainnet
```

## 🔧 Available Tools

### 1. Command Line Script (`scripts/generate-bitcoin-keys.ts`)
- ✅ Generate single keys (testnet/mainnet)
- ✅ Generate multiple keys
- ✅ Validate existing WIF keys
- ✅ Convert hex private keys to WIF
- ✅ Full demo with examples

### 2. Web Interface (`/bitcoin-keys`)
- ✅ User-friendly UI
- ✅ Real-time key generation
- ✅ WIF validation
- ✅ Hex to WIF conversion
- ✅ Copy-to-clipboard
- ✅ Security guidelines

### 3. Programmatic API (`src/lib/bitcoin-key-generator.ts`)
- ✅ `BitcoinKeyGenerator.generateWIFKeyPair(useTestnet)`
- ✅ `BitcoinKeyGenerator.hexToWIF(hexKey, useTestnet)`
- ✅ `BitcoinKeyGenerator.validateWIF(wifKey)`
- ✅ `BitcoinKeyGenerator.generateMultipleKeyPairs(count, useTestnet)`

## 🔐 Security Guidelines

### For Development/Testing
1. ✅ Use **testnet keys** only
2. ✅ Generate keys programmatically
3. ✅ Never commit keys to version control
4. ✅ Use environment variables for storage

### For Production
1. ✅ Use **hardware wallets** when possible
2. ✅ Generate keys offline
3. ✅ Use secure key management systems
4. ✅ Never expose private keys in client-side code
5. ✅ Use multi-signature wallets

## 📝 Environment Setup

Once you have your WIF key, add it to `.env.local`:

```env
# For testing (use testnet)
NEXT_PUBLIC_BTC_PRIVATE_KEY_WIF=cQAPyLxx84YtechDcCtsgzmboC7zk5gmM6sxdN6qErs3AqQow2hC

# For production (use mainnet)
# NEXT_PUBLIC_BTC_PRIVATE_KEY_WIF=L34utF8ADEqe7JvLxCAGReNMwEreNRdzLPPP55WwTdL2zmHyu2MQ
```

## 🧪 Testing Your Keys

### 1. Validate the Key
```bash
npx tsx scripts/generate-bitcoin-keys.ts validate cQAPyLxx84YtechDcCtsgzmboC7zk5gmM6sxdN6qErs3AqQow2hC
```

### 2. Check the Address Format
- **Testnet**: Addresses start with `m` or `n`
- **Mainnet**: Addresses start with `1`, `3`, or `bc1`

### 3. Get Test Bitcoin
- Use [Bitcoin Testnet Faucet](https://testnet-faucet.mempool.co/)
- Test your integration with small amounts

## 🚨 Common Issues & Solutions

### Invalid WIF Key
- Check key length (should be 51-52 characters)
- Verify checksum
- Ensure correct network (testnet vs mainnet)

### Address Mismatch
- Verify the key is for the correct network
- Check address format (testnet vs mainnet prefixes)

### Import Errors
- Ensure key is in WIF format, not hex
- Remove extra spaces or characters
- Check for corruption

## 📚 Additional Resources

- [Bitcoin WIF Format Specification](https://en.bitcoin.it/wiki/Wallet_import_format)
- [Bitcoin.js Documentation](https://github.com/bitcoinjs/bitcoinjs-lib)
- [1inch Fusion+ Documentation](https://docs.1inch.dev/)
- [Bitcoin Testnet Faucet](https://testnet-faucet.mempool.co/)

## 🎯 Next Steps

1. **Generate your WIF key** using any of the methods above
2. **Add it to your environment variables**
3. **Test with the Bitcoin swap interface** at `/bitcoin-swap`
4. **Get testnet Bitcoin** from a faucet
5. **Try the cross-chain swap functionality**

## 🆘 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Validate your WIF key using our tool
3. Ensure you're using the correct network
4. Test with a fresh generated key
5. Review the comprehensive guide in `docs/BITCOIN_WIF_GUIDE.md`

---

**Remember**: Always use testnet keys for development and testing. Only use mainnet keys when you're ready for real transactions! 