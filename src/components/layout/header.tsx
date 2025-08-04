"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { WalletConnection } from "@/components/wallet/wallet-connection"
import { TONConnectButton } from "@/components/wallet/ton-connect-button"
import { Menu, X } from "lucide-react"
import Image from "next/image"
import { TronWalletConnection } from "../wallet/tron-wallet-connection"

export function Header() {
  const [isConnected, setIsConnected] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(path)
  }

  const navigationItems = [
    { href: "/", label: "Swap" },
    { href: "/orders", label: "Orders" },
  ]

  const moreItems = [
    { href: "/portfolio", label: "Portfolio" },
    { href: "/multi-chain-swap", label: "Multi-chain Swap" },
    { href: "/bitcoin-swap", label: "Bitcoin Swap" },
    { href: "/bitcoin-keys", label: "Bitcoin Keys" },
    { href: "/settings", label: "Settings" },
    { href: "/about", label: "About" },
    { href: "/terms", label: "Terms" },
    { href: "/privacy", label: "Privacy" },
  ]

  return (
    <header className="border-b border-slate-700 bg-slate-900/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <Image
              src="/fusion-swap-favicon.png"
              alt="FusionSwap Logo"
              width={60}
              height={90}
            />
            <span className="text-xl font-bold text-white">FusionSwap</span>
            <Badge
              variant="secondary"
              className="bg-blue-500/20 text-blue-400 border-blue-500/30"
            >
              Beta
            </Badge>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6 flex-1 justify-center">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors whitespace-nowrap ${isActive(item.href)
                  ? "text-blue-400 border-b-2 border-blue-400 pb-1"
                  : "text-slate-400 hover:text-white"
                  }`}
              >
                {item.label}
              </Link>
            ))}

            {/* More Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`transition-colors whitespace-nowrap ${moreItems.some(item => isActive(item.href))
                    ? "text-blue-400 border-b-2 border-blue-400 pb-1"
                    : "text-slate-400 hover:text-white"
                    }`}
                >
                  More
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700">
                {moreItems.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link
                      href={item.href}
                      className={`cursor-pointer ${isActive(item.href)
                        ? "text-blue-400 bg-blue-500/10"
                        : "text-slate-300 hover:text-white hover:bg-slate-700"
                        }`}
                    >
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Wallet Connections - Desktop */}
          <div className="hidden lg:flex items-center space-x-3 flex-shrink-0">
            <WalletConnection compact />
            <TronWalletConnection compact />
            <TONConnectButton size="sm" />
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <WalletConnection compact />
              <TONConnectButton size="sm" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:bg-slate-800"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-700 bg-slate-900/95 backdrop-blur-sm">
            <nav className="py-4 space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-2 transition-colors ${isActive(item.href)
                    ? "text-blue-400 bg-blue-500/10 border-l-2 border-blue-400"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                >
                  {item.label}
                </Link>
              ))}

              {/* More items in mobile */}
              <div className="border-t border-slate-700 pt-2 mt-2">
                <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  More
                </div>
                {moreItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-4 py-2 transition-colors ${isActive(item.href)
                      ? "text-blue-400 bg-blue-500/10 border-l-2 border-blue-400"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
