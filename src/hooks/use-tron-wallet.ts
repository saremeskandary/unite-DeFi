import { useState, useEffect, useCallback } from 'react';
import { tronWallet, TronTokenBalance } from '@/lib/tron-wallet';

export interface UseTronWalletReturn {
  isConnected: boolean;
  address: string | null;
  network: string | null;
  nativeBalance: string;
  tokens: TronTokenBalance[];
  totalValue: number;
  isLoading: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalances: () => Promise<void>;
  getTokenBalance: (symbol: string) => Promise<TronTokenBalance | null>;
  switchNetwork: (network: 'mainnet' | 'nile' | 'shasta') => Promise<boolean>;
}

export function useTronWallet(): UseTronWalletReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [nativeBalance, setNativeBalance] = useState('0');
  const [tokens, setTokens] = useState<TronTokenBalance[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize wallet state
  useEffect(() => {
    const initializeWallet = async () => {
      // Add a small delay to allow the tron wallet to restore its state
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const connected = tronWallet.isConnected();
      setIsConnected(connected);

      if (connected) {
        setAddress(tronWallet.getCurrentAddress());
        setNetwork(tronWallet.getCurrentNetwork());
        await loadWalletInfo();
      }
    };

    initializeWallet();

    // Listen for account changes (if TronLink is available)
    if (typeof window !== 'undefined' && window.tronWeb) {
      window.tronWeb.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
          loadWalletInfo();
        } else {
          setIsConnected(false);
          setAddress(null);
          setNetwork(null);
          setNativeBalance('0');
          setTokens([]);
          setTotalValue(0);
        }
      });

      window.tronWeb.on('networkChanged', (networkId: string) => {
        setNetwork(networkId);
        loadWalletInfo();
      });
    }

    // Check for disconnection
    const checkConnection = () => {
      if (!tronWallet.isConnected()) {
        setIsConnected(false);
        setAddress(null);
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
    if (!tronWallet.isConnected()) return;

    setIsLoading(true);
    setError(null);

    try {
      const walletInfo = await tronWallet.getWalletInfo();
      if (walletInfo) {
        setNativeBalance(walletInfo.nativeBalanceFormatted);
        setTokens(walletInfo.tokens);
        setTotalValue(walletInfo.totalValue);
        setNetwork(walletInfo.network);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wallet info');
      console.error('Error loading Tron wallet info:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const walletInfo = await tronWallet.connect();
      if (walletInfo) {
        setIsConnected(true);
        setAddress(walletInfo.address);
        setNetwork(walletInfo.network);
        setNativeBalance(walletInfo.nativeBalanceFormatted);
        setTokens(walletInfo.tokens);
        setTotalValue(walletInfo.totalValue);
      } else {
        setError('Failed to connect Tron wallet');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect Tron wallet');
      console.error('Error connecting Tron wallet:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    tronWallet.disconnect();
    setIsConnected(false);
    setAddress(null);
    setNetwork(null);
    setNativeBalance('0');
    setTokens([]);
    setTotalValue(0);
    setError(null);
  }, []);

  const refreshBalances = useCallback(async () => {
    await loadWalletInfo();
  }, [loadWalletInfo]);

  const getTokenBalance = useCallback(async (symbol: string): Promise<TronTokenBalance | null> => {
    if (!tronWallet.isConnected()) return null;

    try {
      return await tronWallet.getTokenBalance(symbol);
    } catch (err) {
      console.error(`Error getting Tron balance for ${symbol}:`, err);
      return null;
    }
  }, []);

  const switchNetwork = useCallback(async (network: 'mainnet' | 'nile' | 'shasta'): Promise<boolean> => {
    try {
      const success = await tronWallet.switchNetwork(network);
      if (success) {
        setNetwork(network);
        await loadWalletInfo();
      }
      return success;
    } catch (err) {
      console.error('Error switching Tron network:', err);
      return false;
    }
  }, [loadWalletInfo]);

  return {
    isConnected,
    address,
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
    switchNetwork
  };
} 