'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertTriangle, CheckCircle, Info } from 'lucide-react'

interface DebugInfo {
  timestamp: string
  userAgent: string
  isConnectionRestored: boolean
  hasAddress: boolean
  hasWallet: boolean
  manifestUrl: string
  manifestAccessible: boolean
  iconAccessible: boolean
  errors: string[]
}

export function TonConnectDebug() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runDiagnostics = async () => {
    setIsLoading(true)
    const info: DebugInfo = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      isConnectionRestored: false,
      hasAddress: false,
      hasWallet: false,
      manifestUrl: '',
      manifestAccessible: false,
      iconAccessible: false,
      errors: []
    }

    try {
      // Check manifest accessibility
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      const manifestFile = isLocalhost ? 'tonconnect-manifest-dev.json' : 'tonconnect-manifest.json'
      const manifestUrl = `/${manifestFile}`
      info.manifestUrl = manifestUrl

      try {
        const manifestResponse = await fetch(manifestUrl)
        info.manifestAccessible = manifestResponse.ok
        
        if (manifestResponse.ok) {
          const manifest = await manifestResponse.json()
          
          // Check icon accessibility
          if (manifest.iconUrl) {
            try {
              const iconResponse = await fetch(manifest.iconUrl)
              info.iconAccessible = iconResponse.ok
            } catch (iconError) {
              info.errors.push(`Icon fetch error: ${iconError}`)
            }
          }
        } else {
          info.errors.push(`Manifest not accessible: ${manifestResponse.status}`)
        }
      } catch (manifestError) {
        info.errors.push(`Manifest fetch error: ${manifestError}`)
      }

      // Check TON Connect SDK availability
      try {
        const { TonConnect } = await import('@tonconnect/sdk')
        const connector = new TonConnect({
          manifestUrl
        })
        
        // Check if connection can be restored
        const walletConnectionSource = {
          jsBridgeKey: 'test'
        }
        
        try {
          await connector.restoreConnection()
          info.isConnectionRestored = true
        } catch (restoreError) {
          info.errors.push(`Connection restore error: ${restoreError}`)
        }
      } catch (sdkError) {
        info.errors.push(`SDK initialization error: ${sdkError}`)
      }

    } catch (error) {
      info.errors.push(`General error: ${error}`)
    }

    setDebugInfo(info)
    setIsLoading(false)
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  if (!debugInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Running Diagnostics...
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          TON Connect Debug Info
        </CardTitle>
        <CardDescription>
          Diagnostic information for troubleshooting TON Connect issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Timestamp:</span>
            <div className="text-gray-600 dark:text-gray-400">
              {new Date(debugInfo.timestamp).toLocaleString()}
            </div>
          </div>
          
          <div>
            <span className="font-medium">User Agent:</span>
            <div className="text-gray-600 dark:text-gray-400 text-xs">
              {debugInfo.userAgent.substring(0, 50)}...
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Connection Restored:</span>
            <Badge variant={debugInfo.isConnectionRestored ? "default" : "secondary"}>
              {debugInfo.isConnectionRestored ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Yes
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  No
                </>
              )}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Manifest Accessible:</span>
            <Badge variant={debugInfo.manifestAccessible ? "default" : "destructive"}>
              {debugInfo.manifestAccessible ? "Yes" : "No"}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Icon Accessible:</span>
            <Badge variant={debugInfo.iconAccessible ? "default" : "destructive"}>
              {debugInfo.iconAccessible ? "Yes" : "No"}
            </Badge>
          </div>
        </div>

        <div>
          <span className="text-sm font-medium">Manifest URL:</span>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
            {debugInfo.manifestUrl}
          </div>
        </div>

        {debugInfo.errors.length > 0 && (
          <div>
            <span className="text-sm font-medium text-red-600 dark:text-red-400">Errors:</span>
            <div className="mt-2 space-y-1">
              {debugInfo.errors.map((error, index) => (
                <div key={index} className="text-xs text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  {error}
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={runDiagnostics}
          disabled={isLoading}
          className="w-full"
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Running...' : 'Run Diagnostics'}
        </Button>
      </CardContent>
    </Card>
  )
} 