'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Bitcoin, Coins, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { FusionBitcoinIntegration } from '@/lib/blockchains/bitcoin/fusion-bitcoin-integration';
import { NetworkEnum } from '@1inch/fusion-sdk';
import { ethers } from 'ethers';
import { useBlockchainErrorHandler } from '@/hooks/use-error-handler';
import { BlockchainErrorBoundary } from '@/components/error-boundary-with-fallback';

interface SwapFormData {
  erc20Token: string;
  erc20Amount: string;
  btcAddress: string;
  btcAmount: string;
  secret: string;
}

interface SwapStatus {
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string;
  orderHash?: string;
}

export function BitcoinSwapInterface() {
  const [swapDirection, setSwapDirection] = useState<'erc20-to-btc' | 'btc-to-erc20'>('erc20-to-btc');
  const [formData, setFormData] = useState<SwapFormData>({
    erc20Token: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
    erc20Amount: '0.1',
    btcAddress: '',
    btcAmount: '0.1',
    secret: ''
  });
  const [swapStatus, setSwapStatus] = useState<SwapStatus>({
    status: 'idle',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const { handleBlockchainError } = useBlockchainErrorHandler();

  const handleInputChange = (field: keyof SwapFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateSecret = () => {
    const secret = 'swap-secret-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    handleInputChange('secret', secret);
  };

  const validateForm = (): boolean => {
    if (!formData.erc20Amount || !formData.btcAddress || !formData.btcAmount || !formData.secret) {
      setSwapStatus({
        status: 'error',
        message: 'Please fill in all required fields'
      });
      return false;
    }

    if (!formData.btcAddress.startsWith('tb1') && !formData.btcAddress.startsWith('bc1')) {
      setSwapStatus({
        status: 'error',
        message: 'Please enter a valid Bitcoin address'
      });
      return false;
    }

    return true;
  };

  const executeSwap = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setSwapStatus({
      status: 'loading',
      message: 'Creating swap order...'
    });

    const result = await handleBlockchainError(async () => {
      // Check if environment variables are available
      if (!process.env.NEXT_PUBLIC_ETH_PRIVATE_KEY ||
        !process.env.NEXT_PUBLIC_BTC_PRIVATE_KEY_WIF ||
        !process.env.NEXT_PUBLIC_ETH_RPC_URL) {
        throw new Error('Environment variables not configured. Please check your .env.local file.');
      }

      const integration = new FusionBitcoinIntegration(
        process.env.NEXT_PUBLIC_ETH_PRIVATE_KEY,
        process.env.NEXT_PUBLIC_BTC_PRIVATE_KEY_WIF,
        process.env.NEXT_PUBLIC_ETH_RPC_URL,
        NetworkEnum.ETHEREUM,
        true // Use testnet
      );

      if (swapDirection === 'erc20-to-btc') {
        const { fusionOrder, secretHash } = await integration.createERC20ToBTCOrder({
          makerAsset: formData.erc20Token,
          makerAmount: ethers.parseUnits(formData.erc20Amount, 8).toString(),
          btcAddress: formData.btcAddress,
          btcAmount: Math.floor(parseFloat(formData.btcAmount) * 100000000), // Convert to satoshis
          secret: formData.secret
        });

        const submission = await integration.submitBitcoinSwapOrder(fusionOrder, [secretHash]);

        setSwapStatus({
          status: 'success',
          message: 'Swap order submitted successfully!',
          orderHash: submission.orderHash
        });

        return submission;
      } else {
        // BTC to ERC20 swap (would need a real Bitcoin transaction ID)
        throw new Error('BTC to ERC20 swaps require a real Bitcoin transaction ID. Please use the API directly.');
      }
    });

    if (!result) {
      setSwapStatus({
        status: 'error',
        message: 'Swap operation failed. Please try again.'
      });
    }

    setIsLoading(false);
  };

  const getStatusIcon = () => {
    switch (swapStatus.status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <BlockchainErrorBoundary>
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bitcoin className="h-6 w-6" />
              1inch Fusion+ Bitcoin Cross-Chain Swap
            </CardTitle>
            <CardDescription>
              Swap between Ethereum ERC20 tokens and native Bitcoin using atomic swaps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={swapDirection} onValueChange={(value) => setSwapDirection(value as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="erc20-to-btc" className="flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  ERC20 → Bitcoin
                </TabsTrigger>
                <TabsTrigger value="btc-to-erc20" className="flex items-center gap-2">
                  <Bitcoin className="h-4 w-4" />
                  Bitcoin → ERC20
                </TabsTrigger>
              </TabsList>

              <TabsContent value="erc20-to-btc" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="erc20Token">ERC20 Token Address</Label>
                    <Input
                      id="erc20Token"
                      value={formData.erc20Token}
                      onChange={(e) => handleInputChange('erc20Token', e.target.value)}
                      placeholder="0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
                    />
                    <p className="text-sm text-muted-foreground">Default: WBTC on Ethereum</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="erc20Amount">ERC20 Amount</Label>
                    <Input
                      id="erc20Amount"
                      type="number"
                      value={formData.erc20Amount}
                      onChange={(e) => handleInputChange('erc20Amount', e.target.value)}
                      placeholder="0.1"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="flex justify-center">
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="btcAddress">Bitcoin Address</Label>
                    <Input
                      id="btcAddress"
                      value={formData.btcAddress}
                      onChange={(e) => handleInputChange('btcAddress', e.target.value)}
                      placeholder="tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
                    />
                    <p className="text-sm text-muted-foreground">Use testnet address for testing</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="btcAmount">Bitcoin Amount</Label>
                    <Input
                      id="btcAmount"
                      type="number"
                      value={formData.btcAmount}
                      onChange={(e) => handleInputChange('btcAmount', e.target.value)}
                      placeholder="0.1"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secret">HTLC Secret</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secret"
                      value={formData.secret}
                      onChange={(e) => handleInputChange('secret', e.target.value)}
                      placeholder="Generate a unique secret for this swap"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateSecret}
                      disabled={isLoading}
                    >
                      Generate
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This secret is used to secure the atomic swap
                  </p>
                </div>

                <Button
                  onClick={executeSwap}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Swap Order...
                    </>
                  ) : (
                    'Execute Swap'
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="btc-to-erc20" className="space-y-4">
                <Alert>
                  <AlertDescription>
                    Bitcoin to ERC20 swaps require a real Bitcoin transaction ID where the user has locked their BTC.
                    This functionality is available through the API but requires additional setup.
                    Please use the ERC20 → Bitcoin direction for testing.
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>

            {/* Status Display */}
            {swapStatus.status !== 'idle' && (
              <Alert className={`mt-4 ${swapStatus.status === 'error' ? 'border-red-200 bg-red-50' :
                swapStatus.status === 'success' ? 'border-green-200 bg-green-50' :
                  'border-blue-200 bg-blue-50'
                }`}>
                <div className="flex items-center gap-2">
                  {getStatusIcon()}
                  <AlertDescription>
                    {swapStatus.message}
                    {swapStatus.orderHash && (
                      <div className="mt-2">
                        <strong>Order Hash:</strong> {swapStatus.orderHash}
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {/* Environment Variables Warning */}
            <Alert className="mt-4 border-yellow-200 bg-yellow-50">
              <AlertDescription>
                <strong>Important:</strong> This demo requires environment variables to be configured.
                Create a <code>.env.local</code> file with:
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">
                  NEXT_PUBLIC_ETH_PRIVATE_KEY=your_private_key{'\n'}
                  NEXT_PUBLIC_BTC_PRIVATE_KEY_WIF=your_btc_private_key{'\n'}
                  NEXT_PUBLIC_ETH_RPC_URL=your_rpc_url{'\n'}
                  NEXT_PUBLIC_INCH_API_KEY=your_1inch_api_key
                </pre>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </BlockchainErrorBoundary>
  );
} 