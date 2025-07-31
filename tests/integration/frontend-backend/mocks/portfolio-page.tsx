import * as React from 'react'

export default function PortfolioPage() {
  const [totalSwaps] = React.useState(23)
  const [error] = React.useState<string | null>(null)

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div data-testid="portfolio-page">
      <h1>Portfolio Overview</h1>
      <div>$12,450.75</div>
      <div>{totalSwaps}</div>
      <div>$45,230.50</div>
      <div>0.25 BTC</div>
      <div>2.5 ETH</div>
      <div>1,000 USDC</div>
    </div>
  )
} 