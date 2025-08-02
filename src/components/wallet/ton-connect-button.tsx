"use client"

import { TonConnectButton, useTonConnectUI } from '@tonconnect/ui-react'
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
  const [tonConnectUI] = useTonConnectUI()

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

    // Listen for TON Connect specific events
    const handleConnect = () => {
      console.log('TON Connect: Connection successful')
      toast.success('TON wallet connected successfully!')
    }

    const handleDisconnect = () => {
      console.log('TON Connect: Disconnected')
      toast.info('TON wallet disconnected')
    }

    const handleError = (error: any) => {
      console.error('TON Connect: Connection error:', error)
      toast.error(`TON Connect error: ${error.message || 'Unknown error'}`)
    }

    window.addEventListener('error', handleGlobalError)

    // TON Connect event listeners will be handled by the provider

    return () => {
      window.removeEventListener('error', handleGlobalError)
    }
  }, [tonConnectUI])

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