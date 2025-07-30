"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, Search } from "lucide-react"
import { TokenIcon } from "@web3icons/react"

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
  { symbol: "ETH", name: "Ethereum", balance: "1.25" },
  { symbol: "MATIC", name: "Polygon", balance: "1500.00" },
  { symbol: "UNI", name: "Uniswap", balance: "25.50" },
  { symbol: "LINK", name: "Chainlink", balance: "45.20" },
  { symbol: "AAVE", name: "Aave", balance: "12.30" },
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

  const renderTokenIcon = (symbol: string, size: number = 24) => {
    try {
      return (
        <TokenIcon
          symbol={symbol.toLowerCase()}
          size={size}
          variant="branded"
          className="rounded-full"
        />
      )
    } catch (error) {
      // Fallback for tokens not in the library
      return (
        <div className={`w-${size / 4} h-${size / 4} bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground`}>
          {symbol.slice(0, 2)}
        </div>
      )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="bg-muted/50 hover:bg-accent text-foreground border-0 h-12 px-3">
          <div className="flex items-center space-x-2">
            {renderTokenIcon(token.symbol, 60)}
            <span className="font-medium">{token.symbol}</span>
            <ChevronDown className="w-4 h-4" />
          </div>
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle>Select Token</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tokens..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-muted border-border text-foreground"
            />
          </div>

          {/* Popular Tokens */}
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground mb-2">Popular Tokens</div>
            <div className="flex flex-wrap gap-2">
              {["USDC", "USDT", "WETH", "BTC", "ETH"].map((symbol) => (
                <Badge
                  key={symbol}
                  variant="secondary"
                  className="bg-muted hover:bg-accent cursor-pointer"
                  onClick={() => {
                    const tokenData = TOKENS.find((t) => t.symbol === symbol)
                    if (tokenData) handleSelect(tokenData)
                  }}
                >
                  <div className="flex items-center space-x-1">
                    {renderTokenIcon(symbol, 60)}
                    <span>{symbol}</span>
                  </div>
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
                className="w-full justify-between p-3 h-auto hover:bg-accent"
                onClick={() => handleSelect(tokenOption)}
              >
                <div className="flex items-center space-x-3">
                  {renderTokenIcon(tokenOption.symbol, 60)}
                  <div className="text-left">
                    <div className="font-medium">{tokenOption.symbol}</div>
                    <div className="text-sm text-muted-foreground">{tokenOption.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">{tokenOption.balance}</div>
                  <div className="text-xs text-muted-foreground">{tokenOption.symbol}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
