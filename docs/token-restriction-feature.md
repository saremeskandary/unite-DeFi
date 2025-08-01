# Token Restriction Feature

## Overview

The swap interface now includes a token restriction feature that automatically limits token selection when special tokens (TON, BTC, or TRX) are selected in one field. When any of these special tokens is selected, the other field is automatically restricted to only show Ethereum testnet tokens (ETH, WETH).

## How It Works

### Special Tokens

The following tokens are considered "special" and trigger the restriction:

- **TON** (TON blockchain)
- **BTC** (Bitcoin)
- **TRX** (Tron)

### Ethereum Testnet Tokens

When the restriction is active, only these tokens are available in the other field:

- **ETH** (Ethereum)
- **WETH** (Wrapped Ethereum)

## User Experience

### Automatic Token Selection

When a user selects a special token (TON, BTC, or TRX) in either the "From" or "To" field:

1. **Automatic Network Assignment**: The other field is automatically set to Ethereum testnet
2. **Token Restriction**: Only ETH and WETH tokens are shown in the token selector for the other field
3. **Visual Indicators**:
   - The network selector shows "Ethereum Testnet Only" and is disabled
   - A blue notice appears explaining the restriction
   - A cross-chain swap indicator appears in the main interface

### Visual Feedback

#### Network Selector

- Shows "Ethereum Testnet Only" when restriction is active
- Button is disabled to prevent network changes
- Blue notice appears below the selector

#### Main Interface

- Cross-chain swap badge appears when special tokens are selected
- Information notice explains the cross-chain nature of the swap

#### Token Selector Dialog

- Only shows ETH and WETH tokens when restriction is active
- Network dropdown is hidden when restriction is active
- Clear messaging about the restriction

## Technical Implementation

### Helper Functions

```typescript
// Check if a token is a special token
const isSpecialToken = (tokenSymbol: string) =>
  ["TON", "BTC", "TRX"].includes(tokenSymbol);

// Check if a token is an Ethereum testnet token
const isEthereumTestnetToken = (tokenSymbol: string) =>
  ["ETH", "WETH"].includes(tokenSymbol);

// Check if restriction should be applied
const isRestrictedToEthereum = (type: "from" | "to") => {
  if (type === "from") {
    return isSpecialToken(toToken.symbol);
  } else {
    return isSpecialToken(fromToken.symbol);
  }
};
```

### Token Filtering Logic

The `getFilteredTokens` function has been enhanced to:

1. Check if the other field has a special token selected
2. If yes, filter out all tokens except ETH and WETH
3. Apply normal search and network filtering
4. Exclude already selected tokens

### State Management

- Automatically clears amounts when restriction changes
- Prevents invalid swap states
- Maintains proper cross-chain swap detection

## Use Cases

### Cross-Chain Swaps

This feature enables seamless cross-chain swaps between:

- Bitcoin ↔ Ethereum Testnet
- TON ↔ Ethereum Testnet
- Tron ↔ Ethereum Testnet

### User Benefits

1. **Simplified Selection**: Users don't need to manually configure networks
2. **Prevented Errors**: Eliminates invalid token combinations
3. **Clear Feedback**: Users understand what's happening and why
4. **Consistent Experience**: Works the same way for all special tokens

## Testing

The feature includes comprehensive tests covering:

- Token identification logic
- Restriction application
- Visual feedback
- State management
- Cross-chain swap detection

Run tests with:

```bash
pnpm test tests/unit/components/token-restriction.test.tsx
```

## Future Enhancements

Potential improvements could include:

- Support for additional special tokens
- Configurable restriction rules
- More flexible network selection
- Enhanced visual feedback
- Integration with additional blockchain networks
