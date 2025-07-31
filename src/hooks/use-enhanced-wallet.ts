import { useState, useEffect, useCallback } from 'react';
import { enhancedWallet, WalletTokenInfo, TokenBalance } from '@/lib/enhanced-wallet';

export interface UseEnhancedWalletReturn {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  network: string | null;
  nativeBalance: string;
  tokens: TokenBalance[];
  totalValue: number;
  isLoading: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalances: () => Promise<void>;
  getTokenBalance: (symbol: string) => Promise<TokenBalance | null>;
  switchToSupportedNetwork: () => Promise<boolean>;
}

export function useEnhancedWallet(): UseEnhancedWalletReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [nativeBalance, setNativeBalance] = useState('0');
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize wallet state
  useEffect(() => {
    const initializeWallet = () => {
      const connected = enhancedWallet.isConnected();
      setIsConnected(connected);

      if (connected) {
        setAddress(enhancedWallet.getCurrentAddress());
        setChainId(enhancedWallet.getCurrentChainId());
        loadWalletInfo();
      }
    };

    initializeWallet();

    // Listen for account changes
    enhancedWallet.onAccountChange((newAddress) => {
      setAddress(newAddress);
      setIsConnected(true);
      loadWalletInfo();
    });

    // Listen for chain changes
    enhancedWallet.onChainChange((newChainId) => {
      setChainId(newChainId);
      loadWalletInfo();
    });

    // Check for disconnection
    const checkConnection = () => {
      if (!enhancedWallet.isConnected()) {
        setIsConnected(false);
        setAddress(null);
        setChainId(null);
        setNetwork(null);
        setNativeBalance('0');
        setTokens([]);
        setTotalValue(0);
      }
    };

    // Check connection status periodically
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadWalletInfo = useCallback(async () => {
    if (!enhancedWallet.isConnected()) return;

    setIsLoading(true);
    setError(null);

    try {
      const walletInfo = await enhancedWallet.getWalletInfo();
      if (walletInfo) {
        setNativeBalance(walletInfo.nativeBalanceFormatted);
        setTokens(walletInfo.tokens);
        setTotalValue(walletInfo.totalValue);
        setNetwork(walletInfo.network);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wallet info');
      console.error('Error loading wallet info:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const walletInfo = await enhancedWallet.connect();
      if (walletInfo) {
        setIsConnected(true);
        setAddress(walletInfo.address);
        setChainId(walletInfo.chainId);
        setNetwork(walletInfo.network);
        setNativeBalance(walletInfo.nativeBalanceFormatted);
        setTokens(walletInfo.tokens);
        setTotalValue(walletInfo.totalValue);
      } else {
        setError('Failed to connect wallet');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
      console.error('Error connecting wallet:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    enhancedWallet.disconnect();
    setIsConnected(false);
    setAddress(null);
    setChainId(null);
    setNetwork(null);
    setNativeBalance('0');
    setTokens([]);
    setTotalValue(0);
    setError(null);
  }, []);

  const refreshBalances = useCallback(async () => {
    await loadWalletInfo();
  }, [loadWalletInfo]);

  const getTokenBalance = useCallback(async (symbol: string): Promise<TokenBalance | null> => {
    if (!enhancedWallet.isConnected()) return null;

    try {
      return await enhancedWallet.getTokenBalance(symbol);
    } catch (err) {
      console.error(`Error getting balance for ${symbol}:`, err);
      return null;
    }
  }, []);

  const switchToSupportedNetwork = useCallback(async (): Promise<boolean> => {
    try {
      return await enhancedWallet.switchToSupportedNetwork();
    } catch (err) {
      console.error('Error switching network:', err);
      return false;
    }
  }, []);

  return {
    isConnected,
    address,
    chainId,
    network,
    nativeBalance,
    tokens,
    totalValue,
    isLoading,
    error,
    connect,
    disconnect,
    refreshBalances,
    getTokenBalance,
    switchToSupportedNetwork
  };
} 