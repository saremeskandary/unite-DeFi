import axios from 'axios';

export interface FusionQuoteParams {
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  walletAddress: string;
}

export interface FusionOrderParams {
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  walletAddress: string;
}

export interface FusionQuoteResponse {
  fromToken: {
    address: string;
    decimals: number;
    symbol: string;
  };
  toToken: {
    address: string;
    decimals: number;
    symbol: string;
  };
  toTokenAmount: string;
  fromTokenAmount: string;
  protocols: any[];
  quoteId: string;
}

export interface FusionOrderResponse {
  orderHash: string;
  quoteId: string;
  status: string;
}

export class FusionAPIWrapper {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/1inch';
  }

  async getQuote(params: FusionQuoteParams): Promise<FusionQuoteResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/quote`, {
        params: {
          fromTokenAddress: params.fromTokenAddress,
          toTokenAddress: params.toTokenAddress,
          amount: params.amount,
          walletAddress: params.walletAddress,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error getting Fusion quote:', error);
      throw new Error(`Failed to get quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async placeOrder(params: FusionOrderParams): Promise<FusionOrderResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/order`, {
        fromTokenAddress: params.fromTokenAddress,
        toTokenAddress: params.toTokenAddress,
        amount: params.amount,
        walletAddress: params.walletAddress,
      });

      return response.data;
    } catch (error) {
      console.error('Error placing Fusion order:', error);
      throw new Error(`Failed to place order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 