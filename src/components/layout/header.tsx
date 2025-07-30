"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { WalletConnection } from "@/components/wallet/wallet-connection"

export function Header() {
  const [isConnected, setIsConnected] = useState(false)

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
            <span className="text-xl font-bold text-white">BitSwap</span>
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              Beta
            </Badge>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-white hover:text-blue-400 transition-colors">
              Swap
            </Link>
            <Link href="/orders" className="text-slate-400 hover:text-white transition-colors">
              Orders
            </Link>
            <Link href="/portfolio" className="text-slate-400 hover:text-white transition-colors">
              Portfolio
            </Link>
            <Link href="/settings" className="text-slate-400 hover:text-white transition-colors">
              Settings
            </Link>
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {/* Network Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-600 bg-slate-800 text-white hover:bg-slate-700"
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2" />
                  Ethereum
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700">
                <DropdownMenuItem className="text-white hover:bg-slate-700">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2" />
                  Ethereum
                </DropdownMenuItem>
                <DropdownMenuItem className="text-slate-400 hover:bg-slate-700">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mr-2" />
                  Polygon
                </DropdownMenuItem>
                <DropdownMenuItem className="text-slate-400 hover:bg-slate-700">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2" />
                  Arbitrum
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <WalletConnection />
          </div>
        </div>
      </div>
    </header>
  )
}
