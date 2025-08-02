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
        className={`bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 transition-all duration-200 rounded-lg shadow-md ${combinedClasses}`}
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
        className={`bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 transition-all duration-200 rounded-lg shadow-md ${combinedClasses}`}
      >
        {isLoading ? 'Retrying...' : 'Retry TON'}
      </Button>
    )
  }

  return (
    <div className="ton-connect-button-wrapper">
      <style jsx>{`
        .ton-connect-button-wrapper :global(button) {
          background: linear-gradient(to right, #2563eb, #1d4ed8) !important;
          color: white !important;
          border: none !important;
          border-radius: 0.5rem !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
          transition: all 0.2s ease-in-out !important;
        }
        
        .ton-connect-button-wrapper :global(button:hover) {
          background: linear-gradient(to right, #1d4ed8, #1e40af) !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
        }
        
        .ton-connect-button-wrapper :global(button:active) {
          transform: translateY(0) !important;
        }
      `}</style>
      <TonConnectButton
        className={combinedClasses}
      />
    </div>
  )
} 