"use client"

import { TonConnectUIProvider, THEME } from '@tonconnect/ui-react'
import { TonConnect } from '@tonconnect/sdk'
import { ReactNode, useEffect, useState, useMemo } from 'react'
import { enableBridgeBlocking } from '@/lib/ton-connect-bridge-blocker'
import { TonConnectErrorBoundary } from '@/components/ton-connect-error-boundary'

interface TonConnectProviderProps {
  children: ReactNode
}

export function TonConnectProvider({ children }: TonConnectProviderProps) {
  const [isClient, setIsClient] = useState(false)
  const [manifestUrl, setManifestUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsClient(true)

    // Enable bridge blocking in development
    enableBridgeBlocking()

    // Determine the correct manifest URL based on environment
    const isLocalhost = typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

    const manifestFile = isLocalhost ? 'tonconnect-manifest-dev.json' : 'tonconnect-manifest.json'
    const url = `/${manifestFile}`

    console.log('TON Connect: Using manifest URL:', url)
    setManifestUrl(url)

    // Test if manifest is accessible with better error handling
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Manifest not accessible: ${response.status} ${response.statusText}`)
        }
        return response.json()
      })
      .then(manifest => {
        console.log('TON Connect: Manifest loaded successfully:', manifest)

        // Validate manifest structure
        if (!manifest.url || !manifest.name || !manifest.iconUrl) {
          throw new Error('Invalid manifest structure: missing required fields')
        }

        // Test if icon is accessible
        return fetch(manifest.iconUrl)
          .then(iconResponse => {
            if (!iconResponse.ok) {
              console.warn('TON Connect: Icon not accessible:', manifest.iconUrl)
            }
            return manifest
          })
          .catch(iconErr => {
            console.warn('TON Connect: Icon fetch failed:', iconErr.message)
            return manifest
          })
      })
      .catch(err => {
        console.error('TON Connect: Failed to load manifest:', err)
        setError(`Failed to load manifest: ${err.message}`)
      })
  }, [])

  // Don't render until we're on the client and have the manifest URL
  if (!isClient || !manifestUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Initializing TON Connect...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️ TON Connect Error</div>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <TonConnectErrorBoundary>
      <TonConnectUIProvider
        manifestUrl={manifestUrl}
        uiPreferences={{
          theme: THEME.DARK
        }}
        actionsConfiguration={{
          twaReturnUrl: window.location.origin as `${string}://${string}`
        }}
      >
        {children}
      </TonConnectUIProvider>
    </TonConnectErrorBoundary>
  )
} 