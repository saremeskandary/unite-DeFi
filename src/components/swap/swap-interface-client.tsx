"use client"

import { useTonAddress, useTonWallet } from '@tonconnect/ui-react'
import { useEffect, useState } from 'react'
import { SwapInterface } from './swap-interface'

interface SwapInterfaceClientProps {
    onOrderCreated: (orderId: string) => void
}

export function SwapInterfaceClient({ onOrderCreated }: SwapInterfaceClientProps) {
    const [isMounted, setIsMounted] = useState(false)

    // Always call TON Connect hooks to maintain hook order
    const tonWalletAddress = useTonAddress()
    const tonWallet = useTonWallet()

    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Use safe fallbacks when not mounted or provider not ready
    const safeTonWalletAddress = isMounted && tonWalletAddress ? tonWalletAddress : null
    const safeTonWalletConnected = isMounted && tonWalletAddress && tonWallet ? true : false

    // Show loading state during hydration to prevent mismatch
    if (!isMounted) {
        return (
            <div className="animate-pulse">
                <div className="h-96 bg-card rounded-lg border border-border"></div>
            </div>
        )
    }

    return (
        <SwapInterface
            onOrderCreated={onOrderCreated}
            tonWalletAddress={safeTonWalletAddress}
            tonWalletConnected={safeTonWalletConnected}
        />
    )
} 