"use client"

import { useTonConnectUI, useTonAddress, useTonWallet, useIsConnectionRestored } from '@tonconnect/ui-react'
import { useEffect, useState, useRef } from 'react'

export function useTonConnectFixed() {
  const [tonConnectUI] = useTonConnectUI()
  const address = useTonAddress()
  const wallet = useTonWallet()
  const isConnectionRestored = useIsConnectionRestored()

  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [isBridgeBlocked, setIsBridgeBlocked] = useState(false)
  const connectionAttempts = useRef(0)
  const maxAttempts = 3

  // Clear connection error when connection is restored
  useEffect(() => {
    if (isConnectionRestored && address) {
      setConnectionError(null)
      connectionAttempts.current = 0
    }
  }, [isConnectionRestored, address])

  // Monitor for bridge connection errors and prevent reconnection loops
  useEffect(() => {
    if (!tonConnectUI) return

    const handleError = (error: any) => {
      console.log('TON Connect error detected:', error)

      // Check if it's a bridge connection error
      if (error?.message?.includes('bridge') ||
        error?.message?.includes('CORS') ||
        error?.message?.includes('403') ||
        error?.message?.includes('Forbidden')) {

        setIsBridgeBlocked(true)
        setConnectionError('Bridge connections blocked (expected in development). Try direct wallet connection.')

        // Prevent further connection attempts if bridge is blocked
        connectionAttempts.current = maxAttempts
      }
    }

    // Listen for connection status changes
    const handleConnectionChange = (wallet: any) => {
      if (wallet) {
        console.log('TON Connect: Successfully connected')
        setConnectionError(null)
        setIsBridgeBlocked(false)
        connectionAttempts.current = 0
      }
    }

    // Add event listeners if available
    try {
      if (tonConnectUI.onConnectionStatusChange) {
        tonConnectUI.onConnectionStatusChange(handleConnectionChange)
      }
      if (tonConnectUI.onError) {
        tonConnectUI.onError(handleError)
      }
    } catch (error) {
      console.log('Could not add TON Connect event listeners:', error)
    }

    return () => {
      // Cleanup event listeners if needed
    }
  }, [tonConnectUI])

  const connect = async () => {
    if (!tonConnectUI) {
      setConnectionError('TON Connect UI not ready')
      return
    }

    // Prevent connection if bridge is blocked and we've tried too many times
    if (isBridgeBlocked && connectionAttempts.current >= maxAttempts) {
      setConnectionError('Bridge connections are blocked. Please try connecting directly through your wallet.')
      return
    }

    setIsConnecting(true)
    setConnectionError(null)
    connectionAttempts.current++

    try {
      console.log(`TON Connect: Attempt ${connectionAttempts.current}/${maxAttempts}`)

      // Open the connection modal
      await tonConnectUI.openModal()

      // Set a timeout to detect if connection is taking too long
      setTimeout(() => {
        if (isConnecting && !address) {
          setIsConnecting(false)
          setConnectionError('Connection timeout. Please try again.')
        }
      }, 30000) // 30 second timeout

    } catch (error) {
      console.error('TON Connect error:', error)
      setConnectionError(error instanceof Error ? error.message : 'Connection failed')
      setIsConnecting(false)
    }
  }

  const disconnect = async () => {
    if (!tonConnectUI) return

    try {
      await tonConnectUI.disconnect()
      setConnectionError(null)
      setIsBridgeBlocked(false)
      connectionAttempts.current = 0
    } catch (error) {
      console.error('TON Disconnect error:', error)
    }
  }

  return {
    address,
    wallet,
    isConnectionRestored,
    isConnecting,
    connectionError,
    isBridgeBlocked,
    connectionAttempts: connectionAttempts.current,
    maxAttempts,
    connect,
    disconnect,
    tonConnectUI
  }
} 