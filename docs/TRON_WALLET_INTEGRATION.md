# Tron Wallet Integration

This document describes the Tron wallet integration implemented in the Unite DeFi project, providing seamless connection to Tron wallets and management of TRX and TRC20 tokens.

## Overview

The Tron wallet integration provides:
- Connection to TronLink and other Tron wallets
- Support for multiple Tron networks (Mainnet, Nile Testnet, Shasta Testnet)
- TRX balance display and management
- TRC20 token balance tracking
- Network switching capabilities
- Transaction history and explorer integration

## Architecture

### Core Components

1. **TronWalletService** (`src/lib/tron-wallet.ts`)
   - Main service class for Tron wallet operations
   - Handles wallet connection, balance queries, and network management
   - Integrates with TronWeb for blockchain interactions

2. **useTronWallet Hook** (`src/hooks/use-tron-wallet.ts`)
   - React hook providing wallet state and operations
   - Manages connection state, balances, and network information
   - Provides methods for connecting, disconnecting, and switching networks

3. **TronWalletConnect Component** (`src/components/tron/TronWalletConnect.tsx`)
   - UI component for wallet connection
   - Supports both full and compact display modes
   - Includes network selection and wallet management features

### Network Support

The integration supports three Tron networks:

| Network | RPC URL | Explorer | Use Case |
|---------|---------|----------|----------|
| Mainnet | `https://api.trongrid.io` | `https://tronscan.org` | Production |
| Nile Testnet | `https://nile.trongrid.io` | `https://nile.tronscan.org` | Testing |
| Shasta Testnet | `https://api.shasta.trongrid.io` | `https://shasta.tronscan.org` | Development |

## Installation and Setup

### Prerequisites

1. **TronWeb**: Already included in the project dependencies
2. **TronLink**: Users need to install TronLink browser extension
3. **API Key**: Optional TronGrid API key for enhanced rate limits

### Environment Variables

Add the following to your `.env.local`:

```bash
NEXT_PUBLIC_TRON_API_KEY=your_tron_grid_api_key_here
```

### Dependencies

The following dependencies are already included:
- `tronweb`: ^6.0.3 (Tron blockchain interaction)
- `axios`: HTTP client for API calls
- `sonner`: Toast notifications

## Usage

### Basic Wallet Connection

```tsx
import { TronWalletConnect } from '@/components/tron/TronWalletConnect'

function MyComponent() {
  return (
    <div>
      <TronWalletConnect />
    </div>
  )
}
```

### Using the Hook

```tsx
import { useTronWallet } from '@/hooks/use-tron-wallet'

function MyComponent() {
  const {
    isConnected,
    address,
    network,
    nativeBalance,
    tokens,
    totalValue,
    connect,
    disconnect,
    switchNetwork
  } = useTronWallet()

  const handleConnect = async () => {
    try {
      await connect()
      console.log('Connected to Tron wallet')
    } catch (error) {
      console.error('Failed to connect:', error)
    }
  }

  return (
    <div>
      {isConnected ? (
        <div>
          <p>Address: {address}</p>
          <p>Network: {network}</p>
          <p>Balance: {nativeBalance} TRX</p>
          <p>Total Value: ${totalValue}</p>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      ) : (
        <button onClick={handleConnect}>Connect Tron Wallet</button>
      )}
    </div>
  )
}
```

### Network Switching

```tsx
import { useTronWallet } from '@/hooks/use-tron-wallet'

function NetworkSwitcher() {
  const { switchNetwork, network } = useTronWallet()

  const handleSwitchToMainnet = async () => {
    const success = await switchNetwork('mainnet')
    if (success) {
      console.log('Switched to mainnet')
    }
  }

  return (
    <div>
      <p>Current Network: {network}</p>
      <button onClick={handleSwitchToMainnet}>Switch to Mainnet</button>
    </div>
  )
}
```

## Supported Tokens

### Mainnet Tokens

- **USDT**: Tether USD (`TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`)
- **USDC**: USD Coin (`TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8`)
- **TUSD**: TrueUSD (`TUpMhErZL2fhh4sVNULAbNKLokS4GjC1F4`)
- **BTT**: BitTorrent (`TAFjULxiVgT4qWk6UZwjqwZXTSaGaqnVp4`)
- **WIN**: WINk (`TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7`)
- **JST**: JUST (`TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9`)

### Testnet Tokens

- **USDT**: Test Tether USD (Nile/Shasta specific addresses)
- **USDC**: Test USD Coin (Nile/Shasta specific addresses)

## Features

### Wallet Connection
- Automatic TronLink detection and integration
- Fallback to direct TronWeb connection
- Connection state persistence in localStorage
- Automatic reconnection on page reload

### Balance Management
- Real-time TRX balance updates
- TRC20 token balance tracking
- USD value calculation using price feeds
- Balance refresh functionality

### Network Management
- Seamless network switching
- Network-specific token support
- Automatic explorer URL generation
- Network state persistence

### User Experience
- Loading states and error handling
- Toast notifications for user feedback
- Address copying functionality
- Direct explorer links
- Responsive design with compact mode

## Error Handling

The integration includes comprehensive error handling:

```tsx
const { error, connect } = useTronWallet()

const handleConnect = async () => {
  try {
    await connect()
  } catch (error) {
    if (error.message.includes('No Tron account found')) {
      // Handle no wallet installed
      toast.error('Please install TronLink wallet')
    } else if (error.message.includes('User rejected')) {
      // Handle user rejection
      toast.error('Connection was rejected by user')
    } else {
      // Handle other errors
      toast.error('Failed to connect wallet')
    }
  }
}
```

## Testing

### Running Tests

```bash
# Run all Tron wallet tests
pnpm test tests/components/TronWalletConnect.test.tsx

# Run with coverage
pnpm test tests/components/TronWalletConnect.test.tsx --coverage
```

### Test Coverage

The test suite covers:
- Component rendering in different states
- Wallet connection and disconnection
- Error handling and user feedback
- Network switching functionality
- Address copying and explorer navigation
- Balance display and formatting

## Security Considerations

1. **Private Key Management**: Never store private keys in the application
2. **API Key Security**: Keep TronGrid API keys secure and use environment variables
3. **Network Validation**: Always validate network configurations
4. **Transaction Signing**: Use TronLink for transaction signing, never handle private keys directly

## Troubleshooting

### Common Issues

1. **TronLink Not Detected**
   - Ensure TronLink extension is installed
   - Check if TronLink is unlocked
   - Verify browser compatibility

2. **Network Connection Issues**
   - Check internet connection
   - Verify RPC endpoint availability
   - Ensure API key is valid (if using)

3. **Balance Not Updating**
   - Refresh the page
   - Check network connection
   - Verify wallet is connected to correct network

### Debug Mode

Enable debug logging by setting:

```typescript
localStorage.setItem('tron-wallet-debug', 'true')
```

## Integration with Main Wallet System

The Tron wallet integration is seamlessly integrated with the main wallet connection system:

```tsx
import { WalletConnection } from '@/components/wallet/wallet-connection'

// The main wallet connection now supports both Ethereum and Tron
function App() {
  return (
    <div>
      <WalletConnection />
      {/* This will show both MetaMask and TronLink options */}
    </div>
  )
}
```

## Future Enhancements

1. **WalletConnect Support**: Add WalletConnect protocol support
2. **More Token Support**: Expand TRC20 token list
3. **Transaction History**: Add transaction history display
4. **DeFi Integration**: Integrate with Tron DeFi protocols
5. **Cross-chain Features**: Enable cross-chain token transfers

## Contributing

When contributing to the Tron wallet integration:

1. Follow the existing code style and patterns
2. Add comprehensive tests for new features
3. Update documentation for any API changes
4. Test on multiple networks and wallets
5. Ensure backward compatibility

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the test files for usage examples
3. Check the existing CLI tools in `scripts/tron-cli.ts`
4. Refer to TronWeb documentation for advanced features 