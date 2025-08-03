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
import { useTronWallet } from "@/hooks/use-tron-wallet"
import { Loader2, ExternalLink, Copy, CheckCircle, Wallet, Zap } from "lucide-react"
import { toast } from "sonner"

interface WalletConnectionProps {
  compact?: boolean
}

export function WalletConnection({ compact = false }: WalletConnectionProps) {
  const {
    isConnected: isEthConnected,
    address: ethAddress,
    chainId,
    network: ethNetwork,
    nativeBalance: ethBalance,
    tokens: ethTokens,
    totalValue: ethTotalValue,
    isLoading: isEthLoading,
    error: ethError,
    connect: connectEth,
    disconnect: disconnectEth,
    switchToSupportedNetwork
  } = useEnhancedWallet()

  const {
    isConnected: isTronConnected,
    address: tronAddress,
    network: tronNetwork,
    nativeBalance: tronBalance,
    tokens: tronTokens,
    totalValue: tronTotalValue,
    isLoading: isTronLoading,
    error: tronError,
    connect: connectTron,
    disconnect: disconnectTron,
    switchNetwork: switchTronNetwork
  } = useTronWallet()

  const [copied, setCopied] = useState(false)
  const [activeWallet, setActiveWallet] = useState<'ethereum' | 'tron' | null>(null)

  const handleConnectEth = async () => {
    try {
      await connectEth()
      setActiveWallet('ethereum')
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unsupported network')) {
        // Try to switch to a supported network
        const switched = await switchToSupportedNetwork()
        if (switched) {
          // Try connecting again
          await connectEth()
          setActiveWallet('ethereum')
        } else {
          toast.error("Please manually switch to Ethereum Mainnet, Goerli, or Sepolia in MetaMask")
        }
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to connect Ethereum wallet")
      }
    }
  }

  const handleConnectTron = async () => {
    try {
      await connectTron()
      setActiveWallet('tron')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to connect Tron wallet")
    }
  }

  const handleDisconnect = async () => {
    if (activeWallet === 'ethereum') {
      disconnectEth()
    } else if (activeWallet === 'tron') {
      disconnectTron()
    }
    setActiveWallet(null)
  }

  const copyAddress = async () => {
    const address = activeWallet === 'ethereum' ? ethAddress : tronAddress
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
    if (activeWallet === 'ethereum' && ethAddress && chainId) {
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

      const explorerUrl = getExplorerUrl(chainId, ethAddress)
      window.open(explorerUrl, '_blank')
    } else if (activeWallet === 'tron' && tronAddress && tronNetwork) {
      const getTronExplorerUrl = (network: string, address: string) => {
        const explorers: { [key: string]: string } = {
          mainnet: `https://tronscan.org/#/address/${address}`,
          nile: `https://nile.tronscan.org/#/address/${address}`,
          shasta: `https://shasta.tronscan.org/#/address/${address}`
        }
        return explorers[network] || `https://tronscan.org/#/address/${address}`
      }

      const explorerUrl = getTronExplorerUrl(tronNetwork, tronAddress)
      window.open(explorerUrl, '_blank')
    }
  }

  // Determine which wallet is connected
  const isConnected = isEthConnected || isTronConnected
  const isLoading = isEthLoading || isTronLoading
  const error = ethError || tronError

  if (isConnected && (ethAddress || tronAddress)) {
          if (compact) {
        const address = activeWallet === 'ethereum' ? ethAddress : tronAddress
        const balance = activeWallet === 'ethereum' ? ethBalance : tronBalance
        const symbol = activeWallet === 'ethereum' ? 'ETH' : 'TRX'
        
        return (
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <div className="text-xs text-white font-medium">
                {parseFloat(balance).toFixed(3)} {symbol}
              </div>
              <div className="text-xs text-slate-400">
                {address?.slice(0, 4)}...{address?.slice(-4)}
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

    const address = activeWallet === 'ethereum' ? ethAddress : tronAddress
    const balance = activeWallet === 'ethereum' ? ethBalance : tronBalance
    const totalValue = activeWallet === 'ethereum' ? ethTotalValue : tronTotalValue
    const symbol = activeWallet === 'ethereum' ? 'ETH' : 'TRX'
    const network = activeWallet === 'ethereum' ? ethNetwork : tronNetwork
    const explorerTitle = activeWallet === 'ethereum' ? 'View on Etherscan' : 'View on Tronscan'
    
    return (
      <div className="flex items-center space-x-3">
        <div className="text-right">
          <div className="text-sm text-white font-medium">
            {parseFloat(balance).toFixed(4)} {symbol}
          </div>
          <div className="text-xs text-slate-400">
            ${totalValue.toFixed(2)}
          </div>
          <div className="text-xs text-slate-400 flex items-center space-x-1">
            <span>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
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
              title={explorerTitle}
            >
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          <div className="text-xs text-slate-500">
            {activeWallet?.toUpperCase()} • {network?.toUpperCase()}
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
            onClick={handleConnectEth}
            variant="outline"
            className="w-full justify-start border-slate-600 bg-slate-700 hover:bg-slate-600 text-white"
            disabled={isEthLoading}
          >
            <span className="mr-3">🦊</span>
            MetaMask (Ethereum)
            <Badge variant="secondary" className="ml-auto bg-green-500/20 text-green-400">
              Popular
            </Badge>
            {isEthLoading && (
              <Loader2 className="w-4 h-4 ml-auto animate-spin" />
            )}
          </Button>

          <Button
            onClick={handleConnectTron}
            variant="outline"
            className="w-full justify-start border-slate-600 bg-slate-700 hover:bg-slate-600 text-white"
            disabled={isTronLoading}
          >
            <span className="mr-3">⚡</span>
            TronLink (TRON)
            <Badge variant="secondary" className="ml-auto bg-yellow-500/20 text-yellow-400">
              Fast & Low Fees
            </Badge>
            {isTronLoading && (
              <Loader2 className="w-4 h-4 ml-auto animate-spin" />
            )}
          </Button>

          <div className="text-center py-4">
            <p className="text-slate-400 mb-4">Other wallet options coming soon</p>
            <div className="space-y-2 text-sm text-slate-500">
              <p>To connect your wallet, please install one of the following:</p>
              <ul className="space-y-1">
                <li>• <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">MetaMask</a> (Ethereum)</li>
                <li>• <a href="https://www.tronlink.org/" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline">TronLink</a> (TRON)</li>
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
