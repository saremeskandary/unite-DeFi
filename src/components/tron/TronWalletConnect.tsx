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
import { useTronWallet } from "@/hooks/use-tron-wallet"
import { Loader2, ExternalLink, Copy, CheckCircle, Zap } from "lucide-react"
import { toast } from "sonner"

interface TronWalletConnectProps {
  compact?: boolean
}

export function TronWalletConnect({ compact = false }: TronWalletConnectProps) {
  const {
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
    switchNetwork
  } = useTronWallet()
  const [copied, setCopied] = useState(false)

  const handleConnect = async () => {
    try {
      await connect()
      toast.success("Tron wallet connected successfully!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to connect Tron wallet")
    }
  }

  const handleDisconnect = async () => {
    disconnect()
    toast.success("Tron wallet disconnected")
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
    if (!address || !network) return

    // Get the appropriate explorer URL based on the network
    const getExplorerUrl = (network: string, address: string) => {
      const explorers: { [key: string]: string } = {
        mainnet: `https://tronscan.org/#/address/${address}`,
        nile: `https://nile.tronscan.org/#/address/${address}`,
        shasta: `https://shasta.tronscan.org/#/address/${address}`
      }
      return explorers[network] || `https://tronscan.org/#/address/${address}`
    }

    const explorerUrl = getExplorerUrl(network, address)
    window.open(explorerUrl, '_blank')
  }

  const handleNetworkSwitch = async (targetNetwork: 'mainnet' | 'nile' | 'shasta') => {
    try {
      const success = await switchNetwork(targetNetwork)
      if (success) {
        toast.success(`Switched to ${targetNetwork} network`)
      } else {
        toast.error(`Failed to switch to ${targetNetwork} network`)
      }
    } catch (error) {
      toast.error(`Failed to switch network: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (isConnected && address) {
    if (compact) {
      return (
        <div className="flex items-center space-x-2">
          <div className="text-right">
            <div className="text-xs text-white font-medium">
              {parseFloat(nativeBalance).toFixed(3)} TRX
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
            {parseFloat(nativeBalance).toFixed(4)} TRX
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
              title="View on Tronscan"
            >
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          <div className="text-xs text-slate-500">
            {network?.toUpperCase()}
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
        <Button className={`bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white ${compact ? 'px-3 py-1.5 text-sm' : ''}`}>
          {isLoading ? (
            <>
              <Loader2 className={`${compact ? 'w-3 h-3 mr-1' : 'w-4 h-4 mr-2'} animate-spin`} />
              {compact ? 'Connecting...' : 'Connecting...'}
            </>
          ) : (
            <>
              <Zap className={compact ? 'w-3 h-3 mr-1' : 'w-4 h-4 mr-2'} />
              {compact ? 'Connect' : 'Connect Tron'}
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Connect Your Tron Wallet</DialogTitle>
          <DialogDescription className="text-slate-400">
            Connect your Tron wallet to start swapping tokens
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
            <span className="mr-3">⚡</span>
            TronLink
            <Badge variant="secondary" className="ml-auto bg-yellow-500/20 text-yellow-400">
              Recommended
            </Badge>
            {isLoading && (
              <Loader2 className="w-4 h-4 ml-auto animate-spin" />
            )}
          </Button>

          <div className="text-center py-4">
            <p className="text-slate-400 mb-4">Network Selection</p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => handleNetworkSwitch('nile')}
                variant="outline"
                size="sm"
                className="border-slate-600 bg-slate-700 hover:bg-slate-600 text-white"
              >
                Nile Testnet
              </Button>
              <Button
                onClick={() => handleNetworkSwitch('shasta')}
                variant="outline"
                size="sm"
                className="border-slate-600 bg-slate-700 hover:bg-slate-600 text-white"
              >
                Shasta Testnet
              </Button>
              <Button
                onClick={() => handleNetworkSwitch('mainnet')}
                variant="outline"
                size="sm"
                className="border-slate-600 bg-slate-700 hover:bg-slate-600 text-white"
              >
                Mainnet
              </Button>
            </div>
          </div>

          <div className="text-center py-4">
            <p className="text-slate-400 mb-4">Other wallet options coming soon</p>
            <div className="space-y-2 text-sm text-slate-500">
              <p>To connect your Tron wallet, please install one of the following:</p>
              <ul className="space-y-1">
                <li>• <a href="https://www.tronlink.org/" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline">TronLink</a></li>
                <li>• <a href="https://wallet.tron.network/" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline">Tron Wallet</a></li>
                <li>• <a href="https://walletconnect.com/" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline">WalletConnect</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-500 text-center">
            By connecting your wallet, you agree to our{" "}
            <a href="#" className="text-yellow-400 hover:underline">Terms of Service</a> and{" "}
            <a href="#" className="text-yellow-400 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
