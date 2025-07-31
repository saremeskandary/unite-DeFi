import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import type { Metadata } from "next"
import { QueryProvider } from "@/components/providers/query-provider"
import { WebSocketProvider } from "@/components/providers/websocket-provider"
import { ErrorBoundary } from "@/components/error-boundary"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Unite DeFi",
  description:
    "Cross-chain DeFi platform for seamless atomic swaps between Ethereum and Bitcoin networks.",
  generator: 'v0.dev',
  icons: {
    icon: "/Unite-Defi-favicon.png"
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <QueryProvider>
            <WebSocketProvider>
              {children}
              <Toaster />
            </WebSocketProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
