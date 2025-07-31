# Network Setup Guide

## MetaMask Configuration

This application requires MetaMask to be connected to a supported Ethereum network. Follow these steps to configure your wallet correctly.

### Supported Networks

The application supports the following networks:

- **Ethereum Mainnet** (Chain ID: 1) - For real transactions
- **Sepolia Testnet** (Chain ID: 11155111) - **Recommended for testing**
- **Goerli Testnet** (Chain ID: 5) - Alternative testnet

### Step-by-Step Setup

#### 1. Install MetaMask

If you haven't already, install the MetaMask browser extension from [metamask.io](https://metamask.io)

#### 2. Create or Import Wallet

- Create a new wallet or import an existing one
- **Important**: For testing, use a wallet with testnet tokens only

#### 3. Switch to Sepolia Testnet (Recommended)

1. Open MetaMask
2. Click on the network dropdown (usually shows "Ethereum Mainnet")
3. Select "Sepolia Testnet"
4. If Sepolia is not listed, click "Add network" and enter:
   - **Network Name**: Sepolia Testnet
   - **RPC URL**: `https://sepolia.infura.io/v3/`
   - **Chain ID**: `11155111`
   - **Currency Symbol**: `SEP`
   - **Block Explorer URL**: `https://sepolia.etherscan.io`

#### 4. Get Testnet Tokens

For testing on Sepolia:

- Visit [Sepolia Faucet](https://sepoliafaucet.com/)
- Enter your wallet address
- Request test ETH

### Common Issues and Solutions

#### Error: "HTTP request failed - localhost:8545"

**Cause**: MetaMask is configured to use a local network that isn't running.

**Solution**:

1. Open MetaMask
2. Click the network dropdown
3. Switch to "Ethereum Mainnet" or "Sepolia Testnet"
4. Try connecting again

#### Error: "Unsupported network"

**Cause**: You're connected to a network that the application doesn't support.

**Solution**:

1. The application will automatically try to switch you to Sepolia Testnet
2. If that fails, manually switch to a supported network in MetaMask

#### Error: "No accounts found"

**Cause**: MetaMask is locked or no accounts are available.

**Solution**:

1. Unlock MetaMask by entering your password
2. Make sure you have at least one account created
3. Try connecting again

#### Error: "Failed to fetch"

**Cause**: Network connectivity issues or MetaMask configuration problems.

**Solution**:

1. Check your internet connection
2. Refresh the page
3. Try switching networks in MetaMask
4. Restart your browser if the issue persists

### Testing with Testnet

For the best testing experience:

1. **Use Sepolia Testnet**: It's the most stable testnet
2. **Get test tokens**: Use faucets to get test ETH and tokens
3. **Test with small amounts**: Even on testnet, test with realistic amounts
4. **Check transaction status**: Use Sepolia Etherscan to verify transactions

### Security Best Practices

1. **Never use real wallets for testing**: Always use testnet wallets
2. **Keep private keys secure**: Never share your private keys
3. **Verify network before transactions**: Always double-check you're on the correct network
4. **Use hardware wallets for real transactions**: Consider using a hardware wallet for mainnet transactions

### Getting Help

If you continue to experience issues:

1. Check the browser console for detailed error messages
2. Ensure MetaMask is up to date
3. Try clearing browser cache and cookies
4. Contact support with specific error messages

### Network Information

| Network          | Chain ID | RPC URL                       | Explorer                     | Status     |
| ---------------- | -------- | ----------------------------- | ---------------------------- | ---------- |
| Ethereum Mainnet | 1        | https://mainnet.infura.io/v3/ | https://etherscan.io         | Production |
| Sepolia Testnet  | 11155111 | https://sepolia.infura.io/v3/ | https://sepolia.etherscan.io | Testing    |
| Goerli Testnet   | 5        | https://goerli.infura.io/v3/  | https://goerli.etherscan.io  | Testing    |
