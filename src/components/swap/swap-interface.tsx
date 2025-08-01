"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TokenSelector } from "./token-selector"
import { BitcoinAddressInput } from "./bitcoin-address-input"
import { BitcoinSwapFlowUI } from "./bitcoin-swap-flow-ui"
import { OrderSummary } from "./order-summary"
import { ArrowUpDown, Settings, Info, ChevronDown, Check, Search } from "lucide-react"
import { enhancedWallet } from "@/lib/enhanced-wallet"
import { toast } from "sonner"
import {
  getDefaultToken,
  getDefaultNetwork,
  Token,
  Network,
  NETWORKS,
  TOKENS_DATA
} from "@/constants"

interface SwapInterfaceProps {
  onOrderCreated: (orderId: string) => void
}

interface SwapQuote {
  fromToken: string
  toToken: string
  fromAmount: string
  toAmount: string
  rate: number
  priceImpact: number
  gasEstimate: string
  gasCost: number
  source: string
}

interface NetworkFee {
  gasPrice: number
  gasLimit: number
  totalFee: number
  feeInUSD: number
  priority: 'slow' | 'standard' | 'fast'
  estimatedTime: string
}

export function SwapInterface({ onOrderCreated }: SwapInterfaceProps) {
  const [fromToken, setFromToken] = useState<Token>(getDefaultToken())
  const [toToken, setToToken] = useState<Token>({ symbol: "BTC", name: "Bitcoin", balance: "0.00" })
  const [fromNetwork, setFromNetwork] = useState<Network>(getDefaultNetwork())
  const [toNetwork, setToNetwork] = useState<Network>(NETWORKS.find(n => n.id === 'bitcoin-testnet')!)
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [bitcoinAddress, setBitcoinAddress] = useState("")
  const [slippage, setSlippage] = useState("0.5")
  const [isLoading, setIsLoading] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isQuoteLoading, setIsQuoteLoading] = useState(false)
  const [currentQuote, setCurrentQuote] = useState<SwapQuote | null>(null)
  const [networkFees, setNetworkFees] = useState<{ slow: NetworkFee; standard: NetworkFee; fast: NetworkFee } | null>(null)
  const [selectedFeePriority, setSelectedFeePriority] = useState<'slow' | 'standard' | 'fast'>('standard')
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [showBitcoinFlow, setShowBitcoinFlow] = useState(false)

  // Token selection state
  const [isFromTokenSelectorOpen, setIsFromTokenSelectorOpen] = useState(false)
  const [isToTokenSelectorOpen, setIsToTokenSelectorOpen] = useState(false)
  const [selectedNetworkFilter, setSelectedNetworkFilter] = useState<string>('all')
  const [tokenSearch, setTokenSearch] = useState("")
  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false)

  // Helper functions for token restrictions
  const isSpecialToken = (tokenSymbol: string) => ['TON', 'BTC', 'TRX'].includes(tokenSymbol)
  const isEthereumTestnetToken = (tokenSymbol: string) => ['ETH', 'WETH'].includes(tokenSymbol)

  // Check if restriction should be applied
  const isRestrictedToEthereum = (type: 'from' | 'to') => {
    if (type === 'from') {
      return isSpecialToken(toToken.symbol)
    } else {
      return isSpecialToken(fromToken.symbol)
    }
  }

  // Initialize wallet connection and load token balances
  useEffect(() => {
    const initializeWallet = async () => {
      // Add a small delay to allow the enhanced wallet to restore its state
      await new Promise(resolve => setTimeout(resolve, 50));

      if (enhancedWallet.isConnected()) {
        setWalletConnected(true)
        setWalletAddress(enhancedWallet.getCurrentAddress())
        await loadTokenBalances()
      }
    }

    initializeWallet()

    // Listen for wallet changes
    enhancedWallet.onAccountChange((address) => {
      setWalletAddress(address)
      setWalletConnected(true)
      loadTokenBalances()
    })

    enhancedWallet.onChainChange((chainId) => {
      loadTokenBalances()
    })
  }, [])

  // Load token balances from wallet
  const loadTokenBalances = useCallback(async () => {
    if (!enhancedWallet.isConnected()) return

    try {
      const walletInfo = await enhancedWallet.getWalletInfo()
      if (!walletInfo) return

      // Update from token balance
      const fromTokenBalance = walletInfo.tokens.find(t => t.symbol === fromToken.symbol)
      if (fromTokenBalance) {
        setFromToken(prev => ({
          ...prev,
          balance: fromTokenBalance.balance,
          price: fromTokenBalance.price,
          value: fromTokenBalance.value
        }))
      } else if (fromToken.symbol === 'ETH') {
        setFromToken(prev => ({
          ...prev,
          balance: walletInfo.nativeBalanceFormatted
        }))
      }

      // Update to token balance
      const toTokenBalance = walletInfo.tokens.find(t => t.symbol === toToken.symbol)
      if (toTokenBalance) {
        setToToken(prev => ({
          ...prev,
          balance: toTokenBalance.balance,
          price: toTokenBalance.price,
          value: toTokenBalance.value
        }))
      } else if (toToken.symbol === 'ETH') {
        setToToken(prev => ({
          ...prev,
          balance: walletInfo.nativeBalanceFormatted
        }))
      }
    } catch (error) {
      console.error('Error loading token balances:', error)
    }
  }, [fromToken.symbol, toToken.symbol])

  // Get swap quote when amount changes
  const getSwapQuote = useCallback(async (amount: string) => {
    if (!amount || parseFloat(amount) <= 0 || !walletAddress) {
      setToAmount("")
      setCurrentQuote(null)
      return
    }

    setIsQuoteLoading(true)
    try {
      const response = await fetch(
        `/api/swap/quote?fromToken=${fromToken.symbol}&toToken=${toToken.symbol}&amount=${amount}&fromAddress=${walletAddress}&fromNetwork=${fromNetwork.id}&toNetwork=${toNetwork.id}`
      )

      if (response.ok) {
        const data = await response.json()
        setCurrentQuote(data.quote)
        setToAmount(data.quote.toAmount)
        setNetworkFees(data.fees)
      } else {
        console.error('Failed to get swap quote')
        setToAmount("")
        setCurrentQuote(null)
      }
    } catch (error) {
      console.error('Error getting swap quote:', error)
      setToAmount("")
      setCurrentQuote(null)
    } finally {
      setIsQuoteLoading(false)
    }
  }, [fromToken.symbol, toToken.symbol, walletAddress, fromNetwork.id, toNetwork.id])

  const handleSwapTokens = () => {
    const tempToken = fromToken
    const tempNetwork = fromNetwork
    const tempAmount = fromAmount

    setFromToken(toToken)
    setToToken(tempToken)
    setFromNetwork(toNetwork)
    setToNetwork(tempNetwork)
    setFromAmount(toAmount)
    setToAmount(tempAmount)
    // Clear current quote when swapping tokens
    setCurrentQuote(null)
  }

  const handleAmountChange = (value: string) => {
    setFromAmount(value)
    // Get real-time quote
    getSwapQuote(value)
  }

  const handleMaxAmount = () => {
    const maxBalance = parseFloat(fromToken.balance.replace(/,/g, ""))
    setFromAmount(maxBalance.toString())
    getSwapQuote(maxBalance.toString())
  }

  const handleSlippageChange = (value: number[]) => {
    setSlippage(value[0].toString())
  }

  const handleCreateOrder = async () => {
    if (!walletConnected) {
      toast.error("Please connect your wallet first")
      return
    }

    if (!currentQuote) {
      toast.error("Please enter a valid amount to get a quote")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/swap/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromToken: fromToken.symbol,
          toToken: toToken.symbol,
          fromAmount: fromAmount,
          toAddress: bitcoinAddress || walletAddress,
          slippage: parseFloat(slippage),
          feePriority: selectedFeePriority,
          fromNetwork: fromNetwork.id,
          toNetwork: toNetwork.id
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Swap order created successfully!")
        onOrderCreated(result.order.id)
      } else {
        toast.error(result.error || "Failed to create swap order")
      }
    } catch (error) {
      console.error('Error creating swap order:', error)
      toast.error("Failed to create swap order")
    } finally {
      setIsLoading(false)
    }
  }

  // Filter tokens based on search and network
  const getFilteredTokens = (type: 'from' | 'to') => {
    return TOKENS_DATA.filter(token => {
      const matchesSearch = token.symbol.toLowerCase().includes(tokenSearch.toLowerCase()) ||
        token.name.toLowerCase().includes(tokenSearch.toLowerCase())
      const matchesNetwork = selectedNetworkFilter === 'all' ||
        (token.networks && token.networks.includes(selectedNetworkFilter))

      // Exclude the token that's already selected in the other position
      const isExcluded = type === 'from'
        ? (token.symbol === toToken.symbol && (selectedNetworkFilter === 'all' || selectedNetworkFilter === toNetwork.id))
        : (token.symbol === fromToken.symbol && (selectedNetworkFilter === 'all' || selectedNetworkFilter === fromNetwork.id))

      // Special restriction: If TON, BTC, or TRX is selected in one field, 
      // the other field should only show Ethereum testnet tokens
      const shouldRestrictToEthereum = isRestrictedToEthereum(type)

      // Apply restriction: if special token is selected in other field, only show Ethereum testnet tokens
      if (shouldRestrictToEthereum && !isEthereumTestnetToken(token.symbol)) {
        return false
      }

      return matchesSearch && matchesNetwork && !isExcluded
    })
  }

  // Render network icon
  const renderNetworkIcon = (networkId: string, size: number = 20) => {
    const network = NETWORKS.find(n => n.id === networkId)
    if (!network) return null

    return (
      <div
        className="rounded-full flex items-center justify-center"
        style={{
          width: size,
          height: size,
          backgroundColor: network.icon === 'eth' ? '#627EEA' :
            network.icon === 'btc' ? '#F7931A' :
              network.icon === 'ton' ? '#0088CC' : '#FF0000',
          fontSize: size * 0.6
        }}
      >
        {network.icon.toUpperCase().slice(0, 2)}
      </div>
    )
  }

  // Token Selector Component
  const TokenSelectorWithNetwork = ({
    isOpen,
    onClose,
    onSelect,
    currentToken,
    currentNetwork,
    type
  }: {
    isOpen: boolean
    onClose: () => void
    onSelect: (token: Token, network: Network) => void
    currentToken: Token
    currentNetwork: Network
    type: 'from' | 'to'
  }) => {
    if (!isOpen) return null

    return (
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select {type === 'from' ? 'You Pay' : 'You Receive'}</DialogTitle>
          </DialogHeader>

          {/* Network Selection */}
          <div className="mb-4">
            <div className="relative">
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => setIsNetworkDropdownOpen(!isNetworkDropdownOpen)}
                disabled={isRestrictedToEthereum(type)}
              >
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">N</span>
                  </div>
                  <span>
                    {isRestrictedToEthereum(type)
                      ? 'Ethereum Testnet Only'
                      : selectedNetworkFilter === 'all'
                        ? 'All Networks'
                        : NETWORKS.find(n => n.id === selectedNetworkFilter)?.name
                    }
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${isNetworkDropdownOpen ? 'rotate-180' : ''}`} />
              </Button>

              {/* Show restriction notice */}
              {isRestrictedToEthereum(type) && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-xs text-blue-700">
                    ⚠️ Restricted to Ethereum testnet tokens only due to {type === 'from' ? toToken.symbol : fromToken.symbol} selection
                  </p>
                </div>
              )}

              {/* Network Dropdown */}
              {isNetworkDropdownOpen && !isRestrictedToEthereum(type) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                  <div className="p-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        setSelectedNetworkFilter('all')
                        setIsNetworkDropdownOpen(false)
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">N</span>
                        </div>
                        <span>All Networks</span>
                        {selectedNetworkFilter === 'all' && <Check className="w-4 h-4 ml-auto" />}
                      </div>
                    </Button>
                    {NETWORKS.map((network) => (
                      <Button
                        key={network.id}
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          setSelectedNetworkFilter(network.id)
                          setIsNetworkDropdownOpen(false)
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {renderNetworkIcon(network.id, 16)}
                          <span>{network.name}</span>
                          {selectedNetworkFilter === network.id && <Check className="w-4 h-4 ml-auto" />}
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Input
              placeholder="Search tokens..."
              value={tokenSearch}
              onChange={(e) => setTokenSearch(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          </div>

          {/* Token List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {getFilteredTokens(type).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No available tokens found.</p>
                <p className="text-xs mt-1">Try changing the network filter or search terms.</p>
              </div>
            ) : (
              getFilteredTokens(type).map((token) => (
                <div key={token.symbol}>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-3 h-auto"
                    onClick={() => {
                      // If this is a special token (TON, BTC, TRX), automatically set the other field to Ethereum testnet
                      if (isSpecialToken(token.symbol)) {
                        const ethereumTestnet = NETWORKS.find(n => n.id === 'ethereum-testnet')
                        if (ethereumTestnet) {
                          // Set the other field to Ethereum testnet
                          if (type === 'from') {
                            setToNetwork(ethereumTestnet)
                            // Find ETH or WETH token for the other field
                            const ethereumToken = TOKENS_DATA.find(t => t.symbol === 'ETH' || t.symbol === 'WETH')
                            if (ethereumToken) {
                              setToToken(ethereumToken)
                            }
                          } else {
                            setFromNetwork(ethereumTestnet)
                            // Find ETH or WETH token for the other field
                            const ethereumToken = TOKENS_DATA.find(t => t.symbol === 'ETH' || t.symbol === 'WETH')
                            if (ethereumToken) {
                              setFromToken(ethereumToken)
                            }
                          }
                        }
                      }

                      // Find a non-conflicting default network
                      const availableNetworks = token.networks?.filter(networkId => {
                        const isConflicting = type === 'from'
                          ? (token.symbol === toToken.symbol && networkId === toNetwork.id)
                          : (token.symbol === fromToken.symbol && networkId === fromNetwork.id)
                        return !isConflicting
                      }) || []

                      const defaultNetwork = availableNetworks.length > 0
                        ? NETWORKS.find(n => n.id === availableNetworks[0])
                        : NETWORKS.find(n => token.networks?.includes(n.id)) || NETWORKS[0]

                      if (defaultNetwork) {
                        onSelect(token, defaultNetwork)
                        onClose()
                      } else {
                        // Fallback to first available network if no non-conflicting network found
                        const fallbackNetwork = NETWORKS.find(n => token.networks?.includes(n.id)) || NETWORKS[0]
                        onSelect(token, fallbackNetwork)
                        onClose()
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {token.symbol.slice(0, 2)}
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{token.symbol}</div>
                        <div className="text-sm text-muted-foreground">{token.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {token.networkCount && token.networkCount > 1 && (
                        <Badge variant="secondary" className="text-xs">
                          {token.networkCount}
                        </Badge>
                      )}
                      <div className="text-right">
                        <div className="text-sm">{token.balance}</div>
                        <div className="text-xs text-muted-foreground">
                          ${(token as any).value ? (token as any).value.toFixed(2) : '0.00'}
                        </div>
                      </div>
                    </div>
                  </Button>

                  {/* Show networks if token has multiple */}
                  {token.networks && token.networks.length > 1 && (
                    <div className="ml-12 mb-2 flex flex-wrap gap-1">
                      {token.networks.map(networkId => {
                        const network = NETWORKS.find(n => n.id === networkId)
                        if (!network) return null

                        // Check if this network would conflict with the other token selection
                        const isConflicting = type === 'from'
                          ? (token.symbol === toToken.symbol && networkId === toNetwork.id)
                          : (token.symbol === fromToken.symbol && networkId === fromNetwork.id)

                        if (isConflicting) return null

                        return (
                          <Badge
                            key={networkId}
                            variant="outline"
                            className="text-xs cursor-pointer hover:bg-primary/10"
                            onClick={() => {
                              // If this is a special token, automatically set the other field to Ethereum testnet
                              if (isSpecialToken(token.symbol)) {
                                const ethereumTestnet = NETWORKS.find(n => n.id === 'ethereum-testnet')
                                if (ethereumTestnet) {
                                  if (type === 'from') {
                                    setToNetwork(ethereumTestnet)
                                    const ethereumToken = TOKENS_DATA.find(t => t.symbol === 'ETH' || t.symbol === 'WETH')
                                    if (ethereumToken) {
                                      setToToken(ethereumToken)
                                    }
                                  } else {
                                    setFromNetwork(ethereumTestnet)
                                    const ethereumToken = TOKENS_DATA.find(t => t.symbol === 'ETH' || t.symbol === 'WETH')
                                    if (ethereumToken) {
                                      setFromToken(ethereumToken)
                                    }
                                  }
                                }
                              }

                              onSelect(token, network)
                              onClose()
                            }}
                          >
                            {renderNetworkIcon(networkId, 12)}
                            <span className="ml-1">{network.name}</span>
                          </Badge>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Check if this is a Bitcoin swap
  const isBitcoinSwap = fromToken.symbol === "BTC" || toToken.symbol === "BTC"

  // Check if this is a cross-chain swap
  const isCrossChainSwap = fromNetwork.id !== toNetwork.id

  // Check if Bitcoin is the "from" token (requires special handling)
  const isBitcoinFrom = fromToken.symbol === "BTC"

  // Check if Bitcoin is the "to" token (requires Bitcoin address)
  const isBitcoinTo = toToken.symbol === "BTC"

  // Bitcoin address for "from" token (when swapping from Bitcoin)
  const [fromBitcoinAddress, setFromBitcoinAddress] = useState("")

  // Validate Bitcoin address (for "to" token validation)
  const validateBitcoinAddress = (address: string): boolean => {
    if (!address) return false

    const patterns = [
      /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/, // Legacy
      /^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/, // P2SH
      /^bc1[a-z0-9]{39,59}$/, // Bech32
      /^bc1[a-z0-9]{25,39}$/, // Bech32m
    ]

    return patterns.some(pattern => pattern.test(address))
  }

  // Handle Bitcoin address validation for "from" token
  useEffect(() => {
    if (!isBitcoinFrom) {
      setFromBitcoinAddress("")
    }
  }, [isBitcoinFrom])

  // Handle Bitcoin address validation for "to" token
  useEffect(() => {
    if (isBitcoinTo && bitcoinAddress) {
      // This is already handled by the BitcoinAddressInput component
    } else if (!isBitcoinTo) {
      setBitcoinAddress("")
    }
  }, [bitcoinAddress, isBitcoinTo])

  // Clear amounts when special token restriction changes to prevent invalid states
  useEffect(() => {
    if (isSpecialToken(fromToken.symbol) || isSpecialToken(toToken.symbol)) {
      setFromAmount("")
      setToAmount("")
      setCurrentQuote(null)
    }
  }, [fromToken.symbol, toToken.symbol])

  // Update validation logic to handle Bitcoin as "from" token
  const isValidSwap = fromAmount && toAmount &&
    Number.parseFloat(fromAmount) > 0 &&
    walletConnected &&
    currentQuote &&
    // For Bitcoin as "from" token, require valid Bitcoin address
    (!isBitcoinFrom || (fromBitcoinAddress && validateBitcoinAddress(fromBitcoinAddress))) &&
    // For Bitcoin as "to" token, require valid Bitcoin address
    (!isBitcoinTo || (bitcoinAddress && validateBitcoinAddress(bitcoinAddress)))

  return (
    <Card className="bg-card/50 border-border backdrop-blur-sm w-full max-w-md mx-auto">
      <CardHeader className="pb-4 px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground text-lg sm:text-xl">Swap</CardTitle>
          <div className="flex items-center space-x-2">
            {isCrossChainSwap && (
              <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-500 border-blue-500/30">
                Cross-Chain
              </Badge>
            )}
            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 text-xs sm:text-sm">
              Best Rate
            </Badge>
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground p-2">
                  <Settings className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border w-[90vw] max-w-sm mx-auto">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Swap Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Slippage Tolerance</Label>
                    <div className="space-y-2">
                      <Slider
                        value={[parseFloat(slippage)]}
                        onValueChange={handleSlippageChange}
                        max={5}
                        min={0.1}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">0.1%</span>
                        <span className="text-foreground font-medium">{slippage}%</span>
                        <span className="text-muted-foreground">5%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSlippage("0.5")}
                      className="flex-1 border-border text-muted-foreground hover:bg-accent text-xs"
                    >
                      0.5%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSlippage("1.0")}
                      className="flex-1 border-border text-muted-foreground hover:bg-accent text-xs"
                    >
                      1.0%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSlippage("2.0")}
                      className="flex-1 border-border text-muted-foreground hover:bg-accent text-xs"
                    >
                      2.0%
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-4 sm:px-6">
        {/* From Token */}
        <div className="space-y-2">
          <Label className="text-muted-foreground text-sm">From</Label>
          <div className="relative">
            <Input
              type="number"
              placeholder="0.00"
              value={fromAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="bg-muted/50 border-border text-foreground text-lg sm:text-xl h-14 sm:h-16 pr-28 sm:pr-32"
            />
            <div className="absolute right-2 top-2">
              <Button
                variant="ghost"
                className="flex items-center gap-2 p-2 h-auto"
                onClick={() => setIsFromTokenSelectorOpen(true)}
              >
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {fromToken.symbol.slice(0, 2)}
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm">{fromToken.symbol}</div>
                  <div className="text-xs text-muted-foreground">{fromNetwork.name}</div>
                </div>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">
              Balance: {fromToken.balance} {fromToken.symbol}
            </span>
            {!isBitcoinFrom && (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary/80 h-auto p-0 text-xs"
                onClick={handleMaxAmount}
              >
                Max
              </Button>
            )}
          </div>
        </div>

        {/* Bitcoin Address Input for "From" Token */}
        {isBitcoinFrom && (
          <div className="space-y-2">
            <Label className="text-muted-foreground text-sm">Bitcoin Source Address</Label>
            <BitcoinAddressInput value={fromBitcoinAddress} onChange={setFromBitcoinAddress} />
            <Alert className="mt-2">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Bitcoin to ERC20 Swap Process:</strong>
                <ol className="mt-1 space-y-1 list-decimal list-inside">
                  <li>Enter your Bitcoin address (where you'll send BTC from)</li>
                  <li>Create the swap order to get an HTLC address</li>
                  <li>Manually create and broadcast a Bitcoin transaction to the HTLC address</li>
                  <li>Wait for Bitcoin confirmation (1-6 blocks)</li>
                  <li>Receive your ERC20 tokens on Ethereum</li>
                </ol>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleSwapTokens}
            variant="ghost"
            size="sm"
            className="rounded-full bg-muted hover:bg-accent text-foreground p-2"
          >
            <ArrowUpDown className="w-4 h-4" />
          </Button>
        </div>

        {/* Cross-chain restriction notice */}
        {(isSpecialToken(fromToken.symbol) || isSpecialToken(toToken.symbol)) && (
          <div className="flex items-center justify-center p-2 bg-blue-50 border border-blue-200 rounded-md">
            <Info className="w-4 h-4 text-blue-600 mr-2" />
            <p className="text-xs text-blue-700">
              Cross-chain swap: {isSpecialToken(fromToken.symbol) ? fromToken.symbol : toToken.symbol} ↔ Ethereum Testnet
            </p>
          </div>
        )}

        {/* To Token */}
        <div className="space-y-2">
          <Label className="text-muted-foreground text-sm">To</Label>
          <div className="relative">
            <Input
              type="number"
              placeholder="0.00"
              value={isQuoteLoading ? "Loading..." : toAmount}
              readOnly
              className="bg-muted/50 border-border text-foreground text-lg sm:text-xl h-14 sm:h-16 pr-28 sm:pr-32"
            />
            <div className="absolute right-2 top-2">
              <Button
                variant="ghost"
                className="flex items-center gap-2 p-2 h-auto"
                onClick={() => setIsToTokenSelectorOpen(true)}
              >
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {toToken.symbol.slice(0, 2)}
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm">{toToken.symbol}</div>
                  <div className="text-xs text-muted-foreground">{toNetwork.name}</div>
                </div>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">
            Balance: {toToken.balance} {toToken.symbol}
          </div>
        </div>

        {/* Bitcoin Address Input for "To" Token */}
        {isBitcoinTo && (
          <div className="space-y-2">
            <Label className="text-muted-foreground text-sm">Bitcoin Destination Address</Label>
            <BitcoinAddressInput value={bitcoinAddress} onChange={setBitcoinAddress} />
            <p className="text-xs text-muted-foreground">
              This is where your Bitcoin will be sent after the swap is completed.
            </p>
          </div>
        )}

        {/* Price Info */}
        {currentQuote && (
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">Rate</span>
              <span className="text-foreground text-right">
                1 {fromToken.symbol} = {currentQuote.rate.toFixed(8)} {toToken.symbol}
              </span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">Price Impact</span>
              <span className={`text-right ${Math.abs(currentQuote.priceImpact) > 1 ? 'text-red-500' : 'text-foreground'}`}>
                {currentQuote.priceImpact.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">Slippage Tolerance</span>
              <span className="text-foreground">{slippage}%</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">Network Fee</span>
              <span className="text-foreground">
                ~${networkFees?.[selectedFeePriority]?.feeInUSD?.toFixed(2) || '2.50'}
              </span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">Source</span>
              <span className="text-foreground">{currentQuote.source}</span>
            </div>
            {isCrossChainSwap && (
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Route</span>
                <span className="text-foreground text-right">
                  {fromNetwork.name} → {toNetwork.name}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Order Summary */}
        {isValidSwap && (
          <OrderSummary
            fromToken={fromToken}
            toToken={toToken}
            fromAmount={fromAmount}
            toAmount={toAmount}
            bitcoinAddress={bitcoinAddress}
          />
        )}

        {/* Swap Button */}
        <Button
          onClick={isBitcoinSwap ? () => setShowBitcoinFlow(true) : handleCreateOrder}
          disabled={!isValidSwap || isLoading}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm sm:text-base"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              <span className="text-xs sm:text-sm">Creating Order...</span>
            </div>
          ) : !walletConnected ? (
            "Connect Wallet to Swap"
          ) : isBitcoinSwap ? (
            isBitcoinFrom ? "Start Bitcoin to ERC20 Swap" : "Start ERC20 to Bitcoin Swap"
          ) : (
            "Create Swap Order"
          )}
        </Button>

        {/* Info */}
        <div className="flex items-start space-x-2 text-xs text-muted-foreground bg-muted/20 rounded-lg p-3">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p className="text-xs leading-relaxed">
            This swap uses atomic swap technology to ensure trustless execution. Your funds remain secure throughout the
            process.
          </p>
        </div>
      </CardContent>

      {/* Token Selectors */}
      <TokenSelectorWithNetwork
        isOpen={isFromTokenSelectorOpen}
        onClose={() => setIsFromTokenSelectorOpen(false)}
        onSelect={(token, network) => {
          setFromToken(token)
          setFromNetwork(network)
        }}
        currentToken={fromToken}
        currentNetwork={fromNetwork}
        type="from"
      />

      <TokenSelectorWithNetwork
        isOpen={isToTokenSelectorOpen}
        onClose={() => setIsToTokenSelectorOpen(false)}
        onSelect={(token, network) => {
          setToToken(token)
          setToNetwork(network)
        }}
        currentToken={toToken}
        currentNetwork={toNetwork}
        type="to"
      />

      {/* Bitcoin Swap Flow Dialog */}
      <Dialog open={showBitcoinFlow} onOpenChange={setShowBitcoinFlow}>
        <DialogContent className="bg-card border-border w-[95vw] max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Bitcoin Cross-Chain Swap</DialogTitle>
          </DialogHeader>
          <BitcoinSwapFlowUI
            fromToken={fromToken.symbol}
            toToken={toToken.symbol}
            fromAmount={fromAmount}
            toAmount={toAmount}
            userEthereumAddress={walletAddress || ''}
            fromBitcoinAddress={isBitcoinFrom ? fromBitcoinAddress : ''}
            toBitcoinAddress={isBitcoinTo ? bitcoinAddress : ''}
            onSwapComplete={(result) => {
              if (result.success && result.orderHash) {
                onOrderCreated(result.orderHash)
                setShowBitcoinFlow(false)
                toast.success("Bitcoin swap order created successfully!")
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </Card>
  )
}
