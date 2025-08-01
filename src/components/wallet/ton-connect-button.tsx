"use client"

import { TonConnectButton } from '@tonconnect/ui-react'
import { useEffect, useState } from 'react'

export function TONConnectButton() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <button className="bg-blue-500 hover:bg-blue-600 text-white border-0 px-4 py-2 rounded-md">
        Connect TON Wallet
      </button>
    )
  }

  return (
    <TonConnectButton className="bg-blue-500 hover:bg-blue-600 text-white border-0" />
  )
} 