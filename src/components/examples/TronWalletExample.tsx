"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TronWalletConnect } from "@/components/tron/TronWalletConnect"
import { useTronWallet } from "@/hooks/use-tron-wallet"
import { RefreshCw, Zap, Coins, TrendingUp } from "lucide-react"

export function TronWalletExample() {
  const {
    isConnected,
    address,
    network,
    nativeBalance,
    tokens,
    totalValue,
    isLoading,
    error,
    refreshBalances,
    switchNetwork
  } = useTronWallet()

  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshBalances()
    setIsRefreshing(false)
  }

  const handleNetworkSwitch = async (targetNetwork: 'mainnet' | 'nile' | 'shasta') => {
    await switchNetwork(targetNetwork)
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Tron Wallet Integration
          </CardTitle>
          <CardDescription className="text-slate-400">
            Connect your Tron wallet and manage your TRX and TRC20 tokens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <TronWalletConnect />
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {isConnected && address && (
        <>
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Wallet Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-slate-400">Address</p>
                  <p className="text-white font-mono text-sm break-all">{address}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-slate-400">Network</p>
                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                    {network?.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="w-4 h-4 text-yellow-400" />
                    <p className="text-sm text-slate-400">TRX Balance</p>
                  </div>
                  <p className="text-xl font-bold text-white">
                    {parseFloat(nativeBalance).toFixed(4)} TRX
                  </p>
                </div>

                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <p className="text-sm text-slate-400">Total Value</p>
                  </div>
                  <p className="text-xl font-bold text-white">
                    ${totalValue.toFixed(2)}
                  </p>
                </div>

                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <p className="text-sm text-slate-400">Token Count</p>
                  </div>
                  <p className="text-xl font-bold text-white">
                    {tokens.length}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleRefresh}
                  disabled={isRefreshing || isLoading}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 bg-slate-700 hover:bg-slate-600 text-white"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh Balances
                </Button>
              </div>
            </CardContent>
          </Card>

          {tokens.length > 0 && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">TRC20 Tokens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tokens.map((token, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-700 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                          <span className="text-yellow-400 text-xs font-bold">
                            {token.symbol.slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{token.symbol}</p>
                          <p className="text-slate-400 text-sm">{token.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">
                          {parseFloat(token.balance).toFixed(4)}
                        </p>
                        {token.value && (
                          <p className="text-slate-400 text-sm">
                            ${token.value.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Network Management</CardTitle>
              <CardDescription className="text-slate-400">
                Switch between different Tron networks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  onClick={() => handleNetworkSwitch('nile')}
                  variant="outline"
                  className={`border-slate-600 bg-slate-700 hover:bg-slate-600 text-white ${
                    network === 'nile' ? 'border-yellow-400 bg-yellow-500/20' : ''
                  }`}
                >
                  Nile Testnet
                </Button>
                <Button
                  onClick={() => handleNetworkSwitch('shasta')}
                  variant="outline"
                  className={`border-slate-600 bg-slate-700 hover:bg-slate-600 text-white ${
                    network === 'shasta' ? 'border-yellow-400 bg-yellow-500/20' : ''
                  }`}
                >
                  Shasta Testnet
                </Button>
                <Button
                  onClick={() => handleNetworkSwitch('mainnet')}
                  variant="outline"
                  className={`border-slate-600 bg-slate-700 hover:bg-slate-600 text-white ${
                    network === 'mainnet' ? 'border-yellow-400 bg-yellow-500/20' : ''
                  }`}
                >
                  Mainnet
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
} 