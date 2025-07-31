import React from 'react'

// Mock icons for testing
export const ExchangeIcon = (props: any) => <div data-testid="exchange-icon" {...props} />
export const NetworkIcon = (props: any) => <div data-testid="network-icon" {...props} />
export const TokenIcon = (props: any) => <div data-testid="token-icon" {...props} />
export const WalletIcon = (props: any) => <div data-testid="wallet-icon" {...props} />

// Export all icons as a default export as well
export default {
    ExchangeIcon,
    NetworkIcon,
    TokenIcon,
    WalletIcon,
} 