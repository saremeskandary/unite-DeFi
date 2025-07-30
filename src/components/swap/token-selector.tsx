"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, Search } from "lucide-react"

interface Token {
  symbol: string
  name: string
  balance: string
  icon?: string
}

interface TokenSelectorProps {
  token: Token
  onSelect: (token: Token) => void
  type: "from" | "to"
}

const TOKENS = [
  { symbol: "USDC", name: "USD Coin", balance: "1,250.00" },
  { symbol: "USDT", name: "Tether USD", balance: "500.00" },
  { symbol: "DAI", name: "Dai Stablecoin", balance: "750.00" },
  { symbol: "WETH", name: "Wrapped Ether", balance: "2.45" },
  { symbol: "BTC", name: "Bitcoin", balance: "0.00" },
]

export function TokenSelector({ token, onSelect, type }: TokenSelectorProps) {
  const [search, setSearch] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const filteredTokens = TOKENS.filter(
    (t) => t.symbol.toLowerCase().includes(search.toLowerCase()) || t.name.toLowerCase().includes(search.toLowerCase()),
  )

  const handleSelect = (selectedToken: Token) => {
    onSelect(selectedToken)
    setIsOpen(false)
    setSearch("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="bg-slate-600/50 hover:bg-slate-600 text-white border-0 h-12 px-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
              {token.symbol.slice(0, 2)}
            </div>
            <span className="font-medium">{token.symbol}</span>
            <ChevronDown className="w-4 h-4" />
          </div>
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Select Token</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search tokens..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600 text-white"
            />
          </div>

          {/* Popular Tokens */}
          <div className="space-y-1">
            <div className="text-sm text-slate-400 mb-2">Popular Tokens</div>
            <div className="flex flex-wrap gap-2">
              {["USDC", "USDT", "WETH", "BTC"].map((symbol) => (
                <Badge
                  key={symbol}
                  variant="secondary"
                  className="bg-slate-700 hover:bg-slate-600 cursor-pointer"
                  onClick={() => {
                    const tokenData = TOKENS.find((t) => t.symbol === symbol)
                    if (tokenData) handleSelect(tokenData)
                  }}
                >
                  {symbol}
                </Badge>
              ))}
            </div>
          </div>

          {/* Token List */}
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {filteredTokens.map((tokenOption) => (
              <Button
                key={tokenOption.symbol}
                variant="ghost"
                className="w-full justify-between p-3 h-auto hover:bg-slate-700"
                onClick={() => handleSelect(tokenOption)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                    {tokenOption.symbol.slice(0, 2)}
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{tokenOption.symbol}</div>
                    <div className="text-sm text-slate-400">{tokenOption.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">{tokenOption.balance}</div>
                  <div className="text-xs text-slate-400">{tokenOption.symbol}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
