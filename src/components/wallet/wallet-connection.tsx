"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useWallet } from "@/hooks/use-wallet"
import { walletManager } from "@/lib/wallet"
import { Loader2, ExternalLink, Copy, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function WalletConnection() {
  const { wallet, isConnecting, isConnected, connect, disconnect, error } = useWallet()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const handleConnect = async (providerName: string) => {
    await connect(providerName)
  }

  const handleDisconnect = async () => {
    await disconnect()
  }

  const copyAddress = async () => {
    if (!wallet?.address) return

    try {
      await navigator.clipboard.writeText(wallet.address)
      setCopied(true)
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy address to clipboard",
        variant: "destructive",
      })
    }
  }

  const openExplorer = () => {
    if (!wallet?.address) return

    const explorerUrl = `https://etherscan.io/address/${wallet.address}`
    window.open(explorerUrl, '_blank')
  }

  if (isConnected && wallet) {
    return (
      <div className="flex items-center space-x-3">
        <div className="text-right">
          <div className="text-sm text-white font-medium">
            {parseFloat(wallet.balance).toFixed(4)} ETH
          </div>
          <div className="text-xs text-slate-400 flex items-center space-x-1">
            <span>{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</span>
            <button
              onClick={copyAddress}
              className="hover:text-white transition-colors"
              title="Copy address"
            >
              {copied ? (
                <CheckCircle className="w-3 h-3 text-green-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
            <button
              onClick={openExplorer}
              className="hover:text-white transition-colors"
              title="View on Etherscan"
            >
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
        <Button
          onClick={handleDisconnect}
          variant="outline"
          size="sm"
          className="border-slate-600 bg-slate-800 text-white hover:bg-slate-700"
        >
          Disconnect
        </Button>
      </div>
    )
  }

  const availableProviders = walletManager.getAvailableProviders()

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
          {isConnecting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            "Connect Wallet"
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Connect Your Wallet</DialogTitle>
          <DialogDescription className="text-slate-400">
            Choose your preferred wallet to connect to BitSwap
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-3 mt-6">
          {availableProviders.map((provider) => (
            <Button
              key={provider.name}
              onClick={() => handleConnect(provider.name.toLowerCase().replace(' ', ''))}
              variant="outline"
              className="w-full justify-start border-slate-600 bg-slate-700 hover:bg-slate-600 text-white"
              disabled={isConnecting}
            >
              <span className="mr-3">{provider.icon}</span>
              {provider.name}
              {provider.name === 'MetaMask' && (
                <Badge variant="secondary" className="ml-auto bg-green-500/20 text-green-400">
                  Popular
                </Badge>
              )}
              {isConnecting && (
                <Loader2 className="w-4 h-4 ml-auto animate-spin" />
              )}
            </Button>
          ))}

          {availableProviders.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-400 mb-4">No wallet providers available</p>
              <div className="space-y-2 text-sm text-slate-500">
                <p>To connect your wallet, please install one of the following:</p>
                <ul className="space-y-1">
                  <li>• <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">MetaMask</a></li>
                  <li>• <a href="https://wallet.coinbase.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Coinbase Wallet</a></li>
                  <li>• <a href="https://walletconnect.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">WalletConnect</a></li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-500 text-center">
            By connecting your wallet, you agree to our{" "}
            <a href="#" className="text-blue-400 hover:underline">Terms of Service</a> and{" "}
            <a href="#" className="text-blue-400 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
