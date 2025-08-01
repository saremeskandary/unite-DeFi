# Anvil Setup for Local Development

This guide explains how to set up and use Anvil (Foundry's local blockchain) for testing the Unite DeFi application.

## Prerequisites

1. **Install Foundry/Anvil**:

   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Verify Installation**:
   ```bash
   anvil --version
   ```

## Quick Start

### 1. Start Anvil

**For standard environments:**

```bash
./scripts/start-anvil.sh
```

**For WSL2 environments:**

```bash
./scripts/start-anvil-wsl2.sh
```

**Or manually:**

```bash
anvil --host 0.0.0.0 --port 8545 --accounts 10 --balance 10000
```

### 2. Add Anvil to MetaMask

1. Open MetaMask
2. Go to Settings → Networks → Add Network
3. Add the following details:
   - **Network Name**: Anvil
   - **RPC URL**: `http://localhost:8545` (or `http://127.0.0.1:8545`)
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`
   - **Block Explorer URL**: (leave empty)

**Note for WSL2 users**: If you encounter connection issues, try using `http://127.0.0.1:8545` instead of `http://localhost:8545` in the RPC URL.

### 3. Import Test Accounts

Use these private keys to import test accounts in MetaMask:

```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
```

### 4. Deploy Test Tokens (Optional)

If you want to deploy test tokens to Anvil, you can use the Foundry scripts:

```bash
# Deploy USDC
forge script script/DeployUSDC.s.sol --rpc-url http://localhost:8545 --broadcast

# Deploy USDT
forge script script/DeployUSDT.s.sol --rpc-url http://localhost:8545 --broadcast
```

## Supported Features

The application now supports Anvil (Chain ID: 31337) with:

- ✅ Wallet connection
- ✅ Token balance checking
- ✅ Network switching
- ✅ Price fetching (with fallbacks)
- ✅ WebSocket connections

## Default Token Addresses

The following token addresses are pre-configured for Anvil:

- **USDC**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **USDT**: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`
- **WETH**: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`
- **DAI**: `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9`

## Troubleshooting

### "Unsupported network" Error

Make sure you're connected to Anvil (Chain ID: 31337) in MetaMask.

### Connection Issues

1. Verify Anvil is running on `http://localhost:8545`
2. Check that MetaMask is connected to the Anvil network
3. Ensure the RPC URL is correct in MetaMask

### WSL2-Specific Issues

If you're using WSL2 and encounter connection errors:

1. **Use the WSL2-specific script:**

   ```bash
   ./scripts/start-anvil-wsl2.sh
   ```

2. **Try different RPC URLs in MetaMask:**

   - `http://localhost:8545`
   - `http://127.0.0.1:8545`
   - `http://[WSL2_IP]:8545` (replace with your WSL2 IP)

3. **Check WSL2 IP address:**

   ```bash
   ip route show default | awk '/default/ {print $3}'
   ```

4. **If still having issues, try port forwarding:**
   ```bash
   # In Windows PowerShell (as Administrator)
   netsh interface portproxy add v4tov4 listenport=8545 listenaddress=0.0.0.0 connectport=8545 connectaddress=[WSL2_IP]
   ```

### Token Balance Issues

If tokens don't show up:

1. Verify the token contracts are deployed
2. Check that you have tokens in your account
3. Try refreshing the page

## Development Workflow

1. Start Anvil: `./scripts/start-anvil.sh`
2. Start WebSocket server: `node scripts/start-websocket-server.js`
3. Start the frontend: `pnpm dev`
4. Connect MetaMask to Anvil
5. Test the application features

## Stopping Anvil

Press `Ctrl+C` in the terminal where Anvil is running to stop it.
