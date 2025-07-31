import * as React from 'react'

export interface SwapInterfaceProps {
  onOrderCreated?: (orderId: string) => void
}

export function SwapInterface({ onOrderCreated }: SwapInterfaceProps) {
  const [amount, setAmount] = React.useState('')
  const [address, setAddress] = React.useState('')
  const [showQuote, setShowQuote] = React.useState(false)
  const [error, setError] = React.useState('')

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value)
    if (e.target.value) {
      setShowQuote(true)
    } else {
      setShowQuote(false)
    }
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value)
  }

  const handleSwap = () => {
    if (!amount || !address) {
      setError('Please fill in all fields')
      return
    }
    onOrderCreated?.('order_123')
  }

  return (
    <div data-testid="swap-interface">
      <div>USDC</div>
      <input
        placeholder="Enter amount"
        value={amount}
        onChange={handleAmountChange}
      />
      <input
        placeholder="Bitcoin address"
        value={address}
        onChange={handleAddressChange}
      />
      <button onClick={handleSwap}>Swap</button>
      {showQuote && <div>0.023</div>}
      {error && <div>{error}</div>}
    </div>
  )
} 