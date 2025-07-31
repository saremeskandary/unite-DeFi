export interface WalletInfo {
  address: string
  balance: string
  chainId: number
  network: string
  provider: string
}

export interface WalletError extends Error {
  code: string
}

export interface TokenBalance {
  symbol: string
  name: string
  balance: string
  decimals: number
  address: string
  price?: number
} 