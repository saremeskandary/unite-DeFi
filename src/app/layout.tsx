import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import type { Metadata } from "next"
import { QueryProvider } from "@/components/providers/query-provider"
// import { WebSocketProvider } from "@/components/providers/websocket-provider"
import { ErrorBoundary } from "@/components/error-boundary"
import { ErrorHandlingProvider } from "@/components/providers/error-handling-provider"
import { Toaster } from "@/components/ui/toaster"
import { Header } from "@/components/layout/header"
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register"
import { TonConnectProvider } from "@/components/providers/ton-connect-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FusionSwap - Cross-Chain Bitcoin Swaps",
  description:
    "Seamlessly swap between Bitcoin and ERC20 tokens using atomic swaps powered by 1inch Fusion+",
  generator: 'v0.dev',
  icons: {
    icon: "/Unite-Defi-favicon.png"
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FusionSwap"
  },
  formatDetection: {
    telephone: false
  }
}

export const viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="FusionSwap" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FusionSwap" />
        <meta name="description" content="Cross-chain DeFi platform for seamless atomic swaps between Ethereum and Bitcoin networks." />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#3b82f6" />

        <link rel="apple-touch-icon" href="/Unite-Defi-favicon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/Unite-Defi-favicon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/Unite-Defi-favicon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/Unite-Defi-favicon.png" color="#3b82f6" />
        <link rel="shortcut icon" href="/Unite-Defi-favicon.png" />
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>
        <ErrorBoundary>
          <ErrorHandlingProvider>
            <QueryProvider>
              <TonConnectProvider>
                {/* Temporarily disabled WebSocket provider to prevent connection errors */}
                {/* <WebSocketProvider> */}
                <Header />
                {children}
                <Toaster />
                <ServiceWorkerRegister />
                {/* </WebSocketProvider> */}
              </TonConnectProvider>
            </QueryProvider>
          </ErrorHandlingProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
