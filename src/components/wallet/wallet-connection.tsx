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
import { useEnhancedWallet } from "@/hooks/use-enhanced-wallet"
import { enhancedWallet } from "@/lib/enhanced-wallet"
import { Loader2, ExternalLink, Copy, CheckCircle, Wallet } from "lucide-react"
import { toast } from "sonner"

interface WalletConnectionProps {
  compact?: boolean
}

export function WalletConnection({ compact = false }: WalletConnectionProps) {
  const {
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
    switchToSupportedNetwork
  } = useEnhancedWallet()
  const [copied, setCopied] = useState(false)

  const handleConnect = async () => {
    try {
      await connect()
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unsupported network')) {
        // Try to switch to a supported network
        const switched = await switchToSupportedNetwork()
        if (switched) {
          // Try connecting again
          await connect()
        } else {
          toast.error("Please manually switch to Ethereum Mainnet, Goerli, or Sepolia in MetaMask")
        }
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to connect wallet")
      }
    }
  }

  const handleDisconnect = async () => {
    disconnect()
  }

  const copyAddress = async () => {
    if (!address) return

    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      toast.success("Address copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Failed to copy address to clipboard")
    }
  }

  const openExplorer = () => {
    if (!address || !chainId) return

    // Get the appropriate explorer URL based on the network
    const getExplorerUrl = (chainId: number, address: string) => {
      const explorers: { [key: number]: string } = {
        1: `https://etherscan.io/address/${address}`, // Ethereum Mainnet
        5: `https://goerli.etherscan.io/address/${address}`, // Goerli
        11155111: `https://sepolia.etherscan.io/address/${address}`, // Sepolia
        137: `https://polygonscan.com/address/${address}`, // Polygon
        42161: `https://arbiscan.io/address/${address}`, // Arbitrum
        10: `https://optimistic.etherscan.io/address/${address}`, // Optimism
        56: `https://bscscan.com/address/${address}`, // BSC
        43114: `https://snowtrace.io/address/${address}`, // Avalanche
      }
      return explorers[chainId] || `https://etherscan.io/address/${address}`
    }

    const explorerUrl = getExplorerUrl(chainId, address)
    window.open(explorerUrl, '_blank')
  }

  if (isConnected && address) {
    if (compact) {
      return (
        <div className="flex items-center space-x-2">
          <div className="text-right">
            <div className="text-xs text-white font-medium">
              {parseFloat(nativeBalance).toFixed(3)} ETH
            </div>
            <div className="text-xs text-slate-400">
              {address.slice(0, 4)}...{address.slice(-4)}
            </div>
          </div>
          <Button
            onClick={handleDisconnect}
            variant="outline"
            size="sm"
            className="border-slate-600 bg-slate-800 text-white hover:bg-slate-700 px-2 py-1 text-xs"
          >
            Disconnect
          </Button>
        </div>
      )
    }

    return (
      <div className="flex items-center space-x-3">
        <div className="text-right">
          <div className="text-sm text-white font-medium">
            {parseFloat(nativeBalance).toFixed(4)} ETH
          </div>
          <div className="text-xs text-slate-400">
            ${totalValue.toFixed(2)}
          </div>
          <div className="text-xs text-slate-400 flex items-center space-x-1">
            <span>{address.slice(0, 6)}...{address.slice(-4)}</span>
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

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className={`bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white ${compact ? 'px-3 py-1.5 text-sm' : ''}`}>
          {isLoading ? (
            <>
              <Loader2 className={`${compact ? 'w-3 h-3 mr-1' : 'w-4 h-4 mr-2'} animate-spin`} />
              {compact ? 'Connecting...' : 'Connecting...'}
            </>
          ) : (
            <>
              <Wallet className={compact ? 'w-3 h-3 mr-1' : 'w-4 h-4 mr-2'} />
              {compact ? 'Connect' : 'Connect Wallet'}
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Connect Your Wallet</DialogTitle>
          <DialogDescription className="text-slate-400">
            Connect your wallet to start swapping tokens
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-3 mt-6">
          <Button
            onClick={handleConnect}
            variant="outline"
            className="w-full justify-start border-slate-600 bg-slate-700 hover:bg-slate-600 text-white"
            disabled={isLoading}
          >
            <span className="mr-3">🦊</span>
            MetaMask
            <Badge variant="secondary" className="ml-auto bg-green-500/20 text-green-400">
              Popular
            </Badge>
            {isLoading && (
              <Loader2 className="w-4 h-4 ml-auto animate-spin" />
            )}
          </Button>

          <div className="text-center py-4">
            <p className="text-slate-400 mb-4">Other wallet options coming soon</p>
            <div className="space-y-2 text-sm text-slate-500">
              <p>To connect your wallet, please install one of the following:</p>
              <ul className="space-y-1">
                <li>• <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">MetaMask</a></li>
                <li>• <a href="https://wallet.coinbase.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Coinbase Wallet</a></li>
                <li>• <a href="https://walletconnect.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">WalletConnect</a></li>
              </ul>
            </div>
          </div>
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
