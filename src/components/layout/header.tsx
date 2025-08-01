"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { WalletConnection } from "@/components/wallet/wallet-connection"
import { TONConnectButton } from "@/components/wallet/ton-connect-button"

export function Header() {
  const [isConnected, setIsConnected] = useState(false)
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(path)
  }

  return (
    <header className="border-b border-slate-700 bg-slate-900/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">FusionSwap</span>
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              Beta
            </Badge>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`transition-colors ${isActive("/")
                ? "text-blue-400 border-b-2 border-blue-400 pb-1"
                : "text-slate-400 hover:text-white"
                }`}
            >
              Swap
            </Link>
            <Link
              href="/orders"
              className={`transition-colors ${isActive("/orders")
                ? "text-blue-400 border-b-2 border-blue-400 pb-1"
                : "text-slate-400 hover:text-white"
                }`}
            >
              Orders
            </Link>
            <Link
              href="/portfolio"
              className={`transition-colors ${isActive("/portfolio")
                ? "text-blue-400 border-b-2 border-blue-400 pb-1"
                : "text-slate-400 hover:text-white"
                }`}
            >
              Portfolio
            </Link>
            <Link
              href="/settings"
              className={`transition-colors ${isActive("/settings")
                ? "text-blue-400 border-b-2 border-blue-400 pb-1"
                : "text-slate-400 hover:text-white"
                }`}
            >
              Settings
            </Link>
            <Link
              href="/ton-test"
              className={`transition-colors ${isActive("/ton-test")
                ? "text-blue-400 border-b-2 border-blue-400 pb-1"
                : "text-slate-400 hover:text-white"
                }`}
            >
              TON Test
            </Link>
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            <WalletConnection />
            <TONConnectButton />
          </div>
        </div>
      </div>
    </header>
  )
}
