export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface PriceUpdate {
  symbol: string;
  price: number;
  change24h: number;
  volume24h?: number;
  marketCap?: number;
}

export interface OrderUpdate {
  orderId: string;
  status: string;
  timestamp: string;
  gasUsed?: number;
  blockNumber?: number;
  transactionHash?: string;
}

export interface PortfolioUpdate {
  totalValue: number;
  assets: Array<{
    symbol: string;
    balance: number;
    value: number;
    change24h: number;
  }>;
  timestamp: string;
}

export interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  priceImpact: number;
  gasEstimate: number;
  route: Array<{
    protocol: string;
    name: string;
  }>;
} 