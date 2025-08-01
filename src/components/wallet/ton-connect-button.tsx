"use client"

import { TonConnectButton } from '@tonconnect/ui-react'
import { useEffect, useState } from 'react'

interface TONConnectButtonProps {
  size?: 'sm' | 'default'
  className?: string
}

export function TONConnectButton({ size = 'default', className = '' }: TONConnectButtonProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const sizeClasses = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'
  const combinedClasses = `${sizeClasses} ${className}`

  if (!isMounted) {
    return (
      <button className={`bg-blue-500 hover:bg-blue-600 text-white border-0 transition-colors rounded-md ${combinedClasses}`}>
        {size === 'sm' ? 'TON' : 'Connect TON'}
      </button>
    )
  }

  return (
    <div className="ton-connect-button-wrapper">
      <TonConnectButton className={combinedClasses} />
    </div>
  )
} 