"use client"

import { TonConnectUIProvider, THEME } from '@tonconnect/ui-react'
import { ReactNode, useEffect, useState } from 'react'

interface TonConnectProviderProps {
  children: ReactNode
}

export function TonConnectProvider({ children }: TonConnectProviderProps) {
  const [isClient, setIsClient] = useState(false)
  const [manifestUrl, setManifestUrl] = useState('')

  useEffect(() => {
    setIsClient(true)

    // Determine the correct manifest URL based on environment
    const isLocalhost = typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

    const manifestFile = isLocalhost ? 'tonconnect-manifest-dev.json' : 'tonconnect-manifest.json'
    setManifestUrl(`/${manifestFile}`)
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

  return (
    <TonConnectUIProvider
      manifestUrl={manifestUrl}
      uiPreferences={{
        theme: THEME.DARK
      }}
    >
      {children}
    </TonConnectUIProvider>
  )
} 