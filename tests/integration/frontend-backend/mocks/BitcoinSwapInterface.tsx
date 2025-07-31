import * as React from 'react'

export interface BitcoinSwapInterfaceProps {
    onSwapCreated?: (swapId: string) => void
    onError?: (error: string) => void
}

export function BitcoinSwapInterface({ onSwapCreated, onError }: BitcoinSwapInterfaceProps) {
    const [erc20Amount, setErc20Amount] = React.useState('')
    const [btcAmount, setBtcAmount] = React.useState('')
    const [btcAddress, setBtcAddress] = React.useState('')
    const [secret, setSecret] = React.useState('')

    const handleExecute = () => {
        if (!erc20Amount || !btcAmount || !btcAddress || !secret) {
            onError?.('Missing required fields')
            return
        }
        onSwapCreated?.('swap_123')
    }

    return (
        <div data-testid="bitcoin-swap-interface">
            <label htmlFor="erc20-amount">ERC20 Amount</label>
            <input
                id="erc20-amount"
                type="text"
                value={erc20Amount}
                onChange={(e) => setErc20Amount(e.target.value)}
            />
            <label htmlFor="btc-amount">BTC Amount</label>
            <input
                id="btc-amount"
                type="text"
                value={btcAmount}
                onChange={(e) => setBtcAmount(e.target.value)}
            />
            <label htmlFor="btc-address">Bitcoin Address</label>
            <input
                id="btc-address"
                type="text"
                value={btcAddress}
                onChange={(e) => setBtcAddress(e.target.value)}
            />
            <label htmlFor="secret">Secret</label>
            <input
                id="secret"
                type="text"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
            />
            <button onClick={handleExecute}>Execute Swap</button>
            <div>Order Hash</div>
        </div>
    )
} 