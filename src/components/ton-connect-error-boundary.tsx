'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class TonConnectErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('TON Connect Error Boundary caught an error:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      const error = this.state.error
      const isNetworkError = error?.message?.includes('network') || 
                            error?.message?.includes('fetch') ||
                            error?.message?.includes('manifest')
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full mx-auto p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/20 mb-4">
                {isNetworkError ? (
                  <WifiOff className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                )}
              </div>
              
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {isNetworkError ? 'Connection Error' : 'TON Connect Error'}
              </h2>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {isNetworkError 
                  ? 'Unable to connect to TON network. Please check your internet connection and try again.'
                  : 'There was an issue with TON Connect. Please try again.'
                }
              </p>

              <div className="space-y-3">
                <Button
                  onClick={this.handleRetry}
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Connection
                </Button>
                
                <Button
                  onClick={this.handleReload}
                  className="w-full"
                  variant="outline"
                >
                  Reload Page
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && error && (
                <details className="mt-6 text-left">
                  <summary className="text-sm text-gray-500 cursor-pointer">
                    Error details (development only)
                  </summary>
                  <div className="mt-2 text-xs text-gray-600 bg-gray-100 dark:bg-gray-800 p-3 rounded">
                    <p className="font-semibold mb-2">Error:</p>
                    <pre className="overflow-auto">{error.message}</pre>
                    {this.state.errorInfo && (
                      <>
                        <p className="font-semibold mb-2 mt-4">Stack:</p>
                        <pre className="overflow-auto">{this.state.errorInfo.componentStack}</pre>
                      </>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
} 