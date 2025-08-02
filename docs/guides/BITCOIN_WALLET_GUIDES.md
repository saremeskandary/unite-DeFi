# Bitcoin Wallet Signing Guides

## Overview

This guide provides detailed step-by-step instructions for signing HTLC transactions using the three most popular Bitcoin wallets. Each wallet has different interfaces and capabilities, so we've created specific guides for each.

## Wallet Selection

### Recommended Wallets for HTLC Transactions

1. **Electrum** - Best overall for HTLC support
2. **Bitcoin Core** - Full node control and advanced features
3. **Trezor** - Hardware wallet security

### Why These Wallets?

- **HTLC Support**: All three support complex Bitcoin scripts
- **Transaction Signing**: Advanced transaction signing capabilities
- **Security**: Proven security track records
- **User Base**: Large communities and documentation

---

## 1. Electrum Wallet Guide

### Why Electrum is Recommended

Electrum is the most popular Bitcoin wallet for HTLC transactions because:

- ✅ **Excellent HTLC Support**: Built-in support for complex scripts
- ✅ **Advanced Features**: Professional-grade transaction tools
- ✅ **Cross-Platform**: Works on Windows, Mac, Linux
- ✅ **Active Development**: Regular updates and security patches
- ✅ **Large Community**: Extensive documentation and support

### Installation

1. **Download Electrum**

   - Visit: https://electrum.org/
   - Download for your operating system
   - Verify the download signature

2. **Install Electrum**

   - Run the installer
   - Follow the setup wizard
   - Create a new wallet or import existing

3. **Configure for Testnet** (for testing)
   - Go to `Tools` → `Network`
   - Check "Use Testnet"
   - Restart Electrum

### Step-by-Step HTLC Transaction Signing

#### Step 1: Prepare Your Wallet

1. **Open Electrum**
2. **Ensure you have sufficient Bitcoin**
   - Check your balance in the main window
   - For testnet: Get coins from https://testnet-faucet.mempool.co/

#### Step 2: Access Transaction Signing

1. **Go to Tools Menu**

   - Click `Tools` in the menu bar
   - Select `Sign/Verify Message`

2. **Alternative Method**
   - Press `Ctrl+Shift+S` (Windows/Linux) or `Cmd+Shift+S` (Mac)
   - This opens the signing interface directly

#### Step 3: Import Raw Transaction

1. **Copy Transaction from DeFi App**

   - In your DeFi application, click "Copy Transaction"
   - The raw transaction hex is now in your clipboard

2. **Paste in Electrum**
   - In Electrum's signing window, click "Load Transaction"
   - Paste the transaction hex in the text field
   - Click "Load"

#### Step 4: Review Transaction Details

1. **Verify Transaction Information**

   - **Inputs**: Check that the inputs are from your addresses
   - **Outputs**: Verify the HTLC address and amounts
   - **Fee**: Confirm the fee is reasonable
   - **Lock Time**: Check the HTLC time lock

2. **Transaction Details Display**
   ```
   Inputs: 2 (from your addresses)
   Outputs: 2 (HTLC + Change)
   Fee: 0.0001 BTC
   Lock Time: 1234567890
   ```

#### Step 5: Sign the Transaction

1. **Enter Your Password**

   - If your wallet is encrypted, enter your password
   - Click "Sign"

2. **Review the Signed Transaction**
   - Electrum shows the signed transaction hex
   - Copy this signed transaction

#### Step 6: Broadcast the Transaction

1. **Method 1: Using Electrum**

   - In the signing window, click "Broadcast"
   - Electrum will send the transaction to the network

2. **Method 2: Using Block Explorer**
   - Copy the signed transaction hex
   - Go to https://blockstream.info/testnet/tx/publish
   - Paste and submit

#### Step 7: Monitor Confirmation

1. **Check Transaction Status**

   - In Electrum, go to `History` tab
   - Look for your transaction
   - Wait for confirmations (1-6 blocks)

2. **Monitor HTLC Address**
   - Use block explorer to monitor the HTLC address
   - Wait for the secret reveal or time lock expiration

### Electrum Advanced Features

#### Fee Estimation

1. **Dynamic Fee Calculation**
   - Go to `Tools` → `Preferences` → `Transactions`
   - Set fee calculation method
   - Choose from: Static, Mempool, ETA

#### Replace-by-Fee (RBF)

1. **Enable RBF**
   - In transaction details, check "Replaceable"
   - Allows fee increase if transaction gets stuck

#### Hardware Wallet Integration

1. **Connect Hardware Wallet**
   - Go to `File` → `New/Restore`
   - Choose "Use a hardware device"
   - Follow the setup wizard

### Troubleshooting Electrum

#### Common Issues

- **"Transaction not found"**: Check if you're on the right network (mainnet/testnet)
- **"Insufficient funds"**: Verify your balance and UTXO selection
- **"Invalid transaction"**: Check the raw transaction format

#### Solutions

- **Network Issues**: Restart Electrum and reconnect
- **Fee Problems**: Use dynamic fee estimation
- **Script Errors**: Verify HTLC script compatibility

---

## 2. Bitcoin Core Wallet Guide

### Why Bitcoin Core?

Bitcoin Core is the reference implementation and offers:

- ✅ **Full Node**: Complete blockchain validation
- ✅ **Maximum Security**: No trust in third parties
- ✅ **Advanced Scripting**: Full Bitcoin script support
- ✅ **Privacy**: No external API calls
- ✅ **Control**: Complete control over your Bitcoin

### Installation

1. **Download Bitcoin Core**

   - Visit: https://bitcoincore.org/
   - Download the latest version
   - Verify the download signature

2. **Initial Setup**

   - Run Bitcoin Core
   - Choose data directory
   - Let it sync (can take several days)

3. **Configure for Testnet** (for testing)
   - Add `testnet=1` to bitcoin.conf
   - Restart Bitcoin Core

### Step-by-Step HTLC Transaction Signing

#### Step 1: Access Console

1. **Open Bitcoin Core**
2. **Go to Help Menu**
   - Click `Help` → `Debug Window`
   - Click `Console` tab

#### Step 2: Import Raw Transaction

1. **Copy Transaction from DeFi App**

   - Copy the raw transaction hex

2. **Decode Transaction**
   ```bash
   decoderawtransaction "0200000001..."
   ```
   - This shows transaction details
   - Verify inputs, outputs, and amounts

#### Step 3: Sign Transaction

1. **Sign Raw Transaction**

   ```bash
   signrawtransactionwithwallet "0200000001..."
   ```

   - Bitcoin Core will sign the transaction
   - Check the result for "complete": true

2. **If Incomplete**
   - Check error messages
   - Verify you own the input addresses
   - Ensure sufficient funds

#### Step 4: Broadcast Transaction

1. **Send Raw Transaction**
   ```bash
   sendrawtransaction "0200000001..."
   ```
   - Returns transaction ID (TXID)
   - Transaction is now on the network

#### Step 5: Monitor Transaction

1. **Check Transaction Status**
   ```bash
   gettransaction "TXID"
   ```
   - Shows confirmation count
   - Monitor until confirmed

### Bitcoin Core Advanced Features

#### RPC Interface

1. **Enable RPC**

   - Add to bitcoin.conf:

   ```
   server=1
   rpcuser=your_username
   rpcpassword=your_password
   ```

2. **Use RPC Commands**
   ```bash
   bitcoin-cli getbalance
   bitcoin-cli listunspent
   ```

#### Fee Estimation

1. **Estimate Smart Fee**
   ```bash
   estimatesmartfee 6
   ```
   - Returns fee rate for 6-block confirmation

#### UTXO Management

1. **List UTXOs**
   ```bash
   listunspent
   ```
   - Shows all available UTXOs
   - Use for manual transaction building

### Troubleshooting Bitcoin Core

#### Common Issues

- **"Not enough funds"**: Check UTXO list and amounts
- **"Transaction rejected"**: Verify transaction format
- **"Script evaluation failed"**: Check HTLC script syntax

#### Solutions

- **Sync Issues**: Wait for full blockchain sync
- **Memory Issues**: Increase memory allocation
- **Network Issues**: Check firewall settings

---

## 3. Trezor Hardware Wallet Guide

### Why Trezor?

Trezor offers the highest security for HTLC transactions:

- ✅ **Hardware Security**: Private keys never leave device
- ✅ **HTLC Support**: Advanced script support
- ✅ **User-Friendly**: Web interface
- ✅ **Multi-Currency**: Supports many cryptocurrencies
- ✅ **Backup**: Recovery seed for backup

### Setup

1. **Purchase Trezor**

   - Buy from official store: https://shop.trezor.io/
   - Avoid third-party sellers

2. **Initialize Device**

   - Connect Trezor to computer
   - Follow setup wizard
   - Write down recovery seed
   - Set PIN code

3. **Install Trezor Suite**
   - Download from: https://suite.trezor.io/
   - Install and connect device

### Step-by-Step HTLC Transaction Signing

#### Step 1: Access Advanced Features

1. **Open Trezor Suite**
2. **Connect Your Trezor**
3. **Go to Advanced**
   - Click `Settings` → `Advanced`
   - Enable "Expert mode"

#### Step 2: Import Transaction

1. **Copy Transaction from DeFi App**

   - Copy the raw transaction hex

2. **Use Trezor Suite**
   - Go to `Send` tab
   - Click "Advanced" or "Raw transaction"
   - Paste the transaction hex

#### Step 3: Review on Device

1. **Check Trezor Display**

   - Transaction details appear on Trezor screen
   - Verify:
     - Input addresses (should be yours)
     - Output addresses (HTLC + change)
     - Amounts and fees

2. **Confirm Transaction**
   - Press button on Trezor to confirm
   - Enter PIN if prompted

#### Step 4: Sign and Broadcast

1. **Sign Transaction**

   - Trezor signs the transaction
   - Signed transaction appears in Suite

2. **Broadcast Transaction**
   - Click "Send" or "Broadcast"
   - Transaction is sent to network

#### Step 5: Monitor Status

1. **Check Transaction**
   - Go to `Transactions` tab
   - Look for your transaction
   - Monitor confirmations

### Trezor Advanced Features

#### Custom Scripts

1. **Enable Script Support**
   - In Expert mode, enable "Custom scripts"
   - Allows complex HTLC scripts

#### Fee Customization

1. **Manual Fee Setting**
   - Choose "Custom" fee option
   - Enter fee rate in sat/byte

#### Multiple Accounts

1. **Account Management**
   - Create multiple Bitcoin accounts
   - Organize funds by purpose

### Troubleshooting Trezor

#### Common Issues

- **"Device not recognized"**: Check USB connection
- **"Invalid transaction"**: Verify transaction format
- **"Insufficient funds"**: Check account balance

#### Solutions

- **Connection Issues**: Try different USB cable/port
- **Firmware Updates**: Keep Trezor firmware updated
- **Recovery**: Use recovery seed if needed

---

## Comparison Table

| Feature            | Electrum   | Bitcoin Core | Trezor     |
| ------------------ | ---------- | ------------ | ---------- |
| **Ease of Use**    | ⭐⭐⭐⭐⭐ | ⭐⭐         | ⭐⭐⭐⭐   |
| **Security**       | ⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐ |
| **HTLC Support**   | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐   | ⭐⭐⭐⭐   |
| **Setup Time**     | 5 minutes  | 1-7 days     | 15 minutes |
| **Resource Usage** | Low        | High         | Low        |
| **Privacy**        | Good       | Excellent    | Good       |
| **Cost**           | Free       | Free         | $59-169    |

## Security Best Practices

### General Security

1. **Use Testnet First**

   - Always test on testnet before mainnet
   - Get free testnet coins from faucets

2. **Verify Downloads**

   - Check GPG signatures
   - Download from official sources only

3. **Backup Everything**
   - Wallet files
   - Recovery seeds
   - Private keys (if applicable)

### Transaction Security

1. **Double-Check Addresses**

   - Verify HTLC addresses
   - Check change addresses
   - Confirm amounts

2. **Fee Verification**

   - Ensure fees are reasonable
   - Use dynamic fee estimation
   - Monitor network congestion

3. **Transaction Monitoring**
   - Track confirmation progress
   - Monitor HTLC status
   - Watch for secret reveals

## Testing Workflow

### Recommended Testing Process

1. **Setup Testnet Environment**

   - Install wallet on testnet
   - Get testnet Bitcoin
   - Practice with small amounts

2. **Test Complete Flow**

   - Create HTLC transaction
   - Sign and broadcast
   - Monitor confirmation
   - Test secret reveal

3. **Practice Multiple Times**
   - Try different amounts
   - Test error scenarios
   - Familiarize with interface

### Testnet Resources

- **Bitcoin Testnet**: https://testnet.bitcoin.com/
- **Testnet Faucet**: https://testnet-faucet.mempool.co/
- **Testnet Explorer**: https://blockstream.info/testnet/

## Conclusion

Each wallet has its strengths:

- **Electrum**: Best for beginners and advanced users alike
- **Bitcoin Core**: Maximum security and control
- **Trezor**: Hardware security with user-friendly interface

Choose based on your security needs, technical expertise, and convenience preferences. All three support HTLC transactions effectively, so the choice is largely personal preference.

Remember to always test on testnet first and follow security best practices to ensure safe and successful Bitcoin ↔ ERC20 swaps.
