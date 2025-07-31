"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Search, ChevronDown } from "lucide-react"
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

const TOKENS: Token[] = [
  { symbol: "USDC", name: "USD Coin", balance: "1,234.56" },
  { symbol: "USDT", name: "Tether USD", balance: "2,345.67" },
  { symbol: "WETH", name: "Wrapped Ethereum", balance: "3.45" },
  { symbol: "WBTC", name: "Wrapped Bitcoin", balance: "0.12" },
  { symbol: "DAI", name: "Dai Stablecoin", balance: "567.89" },
  { symbol: "UNI", name: "Uniswap", balance: "45.67" },
  { symbol: "LINK", name: "Chainlink", balance: "123.45" },
  { symbol: "AAVE", name: "Aave", balance: "8.90" },
]

export function TokenSelector({ token, onSelect, type }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")

  const handleSelect = (selectedToken: Token) => {
    onSelect(selectedToken)
    setIsOpen(false)
    setSearch("")
  }

  const renderTokenIcon = (symbol: string, size: number = 24) => {
    const iconMap: { [key: string]: string } = {
      USDC: "usdc",
      USDT: "usdt",
      WETH: "weth",
      WBTC: "wbtc",
      DAI: "dai",
      UNI: "uni",
      LINK: "link",
      AAVE: "aave",
      ETH: "eth",
      BTC: "btc",
    }

    const iconName = iconMap[symbol.toUpperCase()]
    if (iconName) {
      return <TokenIcon symbol={iconName} size={size} variant="branded" />
    }

    return (
      <div
        className="rounded-full bg-muted flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span className="text-xs font-medium">{symbol.slice(0, 2)}</span>
      </div>
    )
  }

  const filteredTokens = useMemo(() => {
    if (!search) return TOKENS
    return TOKENS.filter(
      (token) =>
        token.symbol.toLowerCase().includes(search.toLowerCase()) ||
        token.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [search])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="bg-muted/50 hover:bg-accent text-foreground border-0 h-10 sm:h-12 px-2 sm:px-3">
          <div className="flex items-center space-x-1 sm:space-x-2">
            {renderTokenIcon(token.symbol, 24)}
            <span className="font-medium text-xs sm:text-sm">{token.symbol}</span>
            <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-card border-border text-foreground w-[90vw] max-w-sm max-h-[85vh] overflow-hidden mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Select Token</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex flex-col h-full">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tokens..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-muted border-border text-foreground h-10"
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
                  className="bg-muted hover:bg-accent cursor-pointer text-xs"
                  onClick={() => {
                    const tokenData = TOKENS.find((t) => t.symbol === symbol)
                    if (tokenData) handleSelect(tokenData)
                  }}
                >
                  <div className="flex items-center space-x-1">
                    {renderTokenIcon(symbol, 16)}
                    <span>{symbol}</span>
                  </div>
                </Badge>
              ))}
            </div>
          </div>

          {/* Token List */}
          <div className="space-y-1 max-h-60 overflow-y-auto flex-1">
            {filteredTokens.map((tokenOption) => (
              <Button
                key={tokenOption.symbol}
                variant="ghost"
                className="w-full justify-between p-2 sm:p-3 h-auto hover:bg-accent"
                onClick={() => handleSelect(tokenOption)}
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  {renderTokenIcon(tokenOption.symbol, 32)}
                  <div className="text-left">
                    <div className="font-medium text-sm">{tokenOption.symbol}</div>
                    <div className="text-xs text-muted-foreground">{tokenOption.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs sm:text-sm">{tokenOption.balance}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
