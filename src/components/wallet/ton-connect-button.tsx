"use client"

import { TonConnectButton } from '@tonconnect/ui-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface TONConnectButtonProps {
  size?: 'sm' | 'default'
  className?: string
}

export function TONConnectButton({ size = 'default', className = '' }: TONConnectButtonProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    // Listen for global errors that might be related to TON Connect
    const handleGlobalError = (event: ErrorEvent) => {
      if (event.error?.message?.includes('ton') || event.error?.message?.includes('manifest')) {
        console.error('TON Connect error detected:', event.error)
        setHasError(true)
        toast.error('TON Connect error. Please refresh the page and try again.')
      }
    }

    window.addEventListener('error', handleGlobalError)

    return () => {
      window.removeEventListener('error', handleGlobalError)
    }
  }, [])

  const sizeClasses = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'
  const combinedClasses = `${sizeClasses} ${className}`

  const handleRetry = () => {
    setHasError(false)
    setIsLoading(true)

    // Force a page reload to retry the connection
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  if (!isMounted) {
    return (
      <Button
        disabled
        className={`bg-blue-500 hover:bg-blue-600 text-white border-0 transition-colors rounded-md ${combinedClasses}`}
      >
        {size === 'sm' ? 'TON' : 'Connect TON'}
      </Button>
    )
  }

  if (hasError) {
    return (
      <Button
        onClick={handleRetry}
        disabled={isLoading}
        className={`bg-red-500 hover:bg-red-600 text-white border-0 transition-colors rounded-md ${combinedClasses}`}
      >
        {isLoading ? 'Retrying...' : 'Retry TON'}
      </Button>
    )
  }

  return (
    <div className="ton-connect-button-wrapper">
      <TonConnectButton
        className={combinedClasses}
      />
    </div>
  )
} 