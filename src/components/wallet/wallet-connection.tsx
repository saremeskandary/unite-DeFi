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

export function WalletConnection() {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState("")
  const [balance, setBalance] = useState("0.00")

  const connectWallet = async (walletType: string) => {
    // Simulate wallet connection
    setIsConnected(true)
    setAddress("0x742d35Cc6634C0532925a3b8D4C9db96590b5b8c")
    setBalance("2.45")
  }

  const disconnectWallet = () => {
    setIsConnected(false)
    setAddress("")
    setBalance("0.00")
  }

  if (isConnected) {
    return (
      <div className="flex items-center space-x-3">
        <div className="text-right">
          <div className="text-sm text-white font-medium">{balance} ETH</div>
          <div className="text-xs text-slate-400">
            {address.slice(0, 6)}...{address.slice(-4)}
          </div>
        </div>
        <Button
          onClick={disconnectWallet}
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
        <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
          Connect Wallet
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Connect Your Wallet</DialogTitle>
          <DialogDescription className="text-slate-400">
            Choose your preferred wallet to connect to BitSwap
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-6">
          <Button
            onClick={() => connectWallet("metamask")}
            variant="outline"
            className="w-full justify-start border-slate-600 bg-slate-700 hover:bg-slate-600 text-white"
          >
            <div className="w-6 h-6 bg-orange-500 rounded mr-3" />
            MetaMask
            <Badge variant="secondary" className="ml-auto bg-green-500/20 text-green-400">
              Popular
            </Badge>
          </Button>

          <Button
            onClick={() => connectWallet("walletconnect")}
            variant="outline"
            className="w-full justify-start border-slate-600 bg-slate-700 hover:bg-slate-600 text-white"
          >
            <div className="w-6 h-6 bg-blue-500 rounded mr-3" />
            WalletConnect
          </Button>

          <Button
            onClick={() => connectWallet("coinbase")}
            variant="outline"
            className="w-full justify-start border-slate-600 bg-slate-700 hover:bg-slate-600 text-white"
          >
            <div className="w-6 h-6 bg-blue-600 rounded mr-3" />
            Coinbase Wallet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
