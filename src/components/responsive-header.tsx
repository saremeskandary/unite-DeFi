"use client"

import { appInfo } from "@/constants/app-info"
import Link from "next/link"
import Image from "next/image"
import Logo from "@/public/Unite-Defi-favicon.png"
import { Github, Linkedin, Mail } from "lucide-react"
import { InstagramIcon, FarcasterIcon, NostrIcon, StackOverflowIcon } from "./social-icons"
import { useState } from "react"

export default function ResponsiveHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="max-w-[950px] mx-auto flex justify-center">
      <div className="container mx-auto px-4 py-4 flex flex-row justify-between items-center">
        <Link href="/" className="text-foreground hover:text-primary transition-colors left-2">
          <Image src={Logo} alt={`${appInfo.name} Logo`} width={70} height={70} />
        </Link>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {isMenuOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M4 12h16M4 6h16M4 18h16" />}
          </svg>
        </button>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-card/95 backdrop-blur-sm border-b border-border/50 p-4 z-50">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/about"
                className="text-foreground/80 hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <div className="flex flex-wrap gap-4 pt-4 border-t border-border/50">
                <a
                  href={`mailto:${appInfo.email}`}
                  className="text-foreground/70 hover:text-primary transition-colors"
                  aria-label="Email"
                >
                  <Mail size={20} />
                </a>
                <a
                  href={appInfo.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/70 hover:text-primary transition-colors"
                  aria-label="GitHub"
                >
                  <Github size={20} />
                </a>
                <a
                  href={appInfo.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/70 hover:text-primary transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin size={20} />
                </a>
                <a
                  href={appInfo.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/70 hover:text-primary transition-colors"
                  aria-label="Instagram"
                >
                  <InstagramIcon className="w-5 h-5" />
                </a>
                <a
                  href={appInfo.farcaster}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/70 hover:text-primary transition-colors"
                  aria-label="Farcaster"
                >
                  <FarcasterIcon className="w-5 h-5" />
                </a>
                <a
                  href={`nostr:${appInfo.nostr}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/70 hover:text-primary transition-colors"
                  aria-label="Nostr"
                >
                  <NostrIcon className="w-5 h-5" />
                </a>
                <a
                  href={appInfo.stackoverflow}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/70 hover:text-primary transition-colors"
                  aria-label="Stack Overflow"
                >
                  <StackOverflowIcon className="w-5 h-5" />
                </a>
              </div>
            </nav>
          </div>
        )}

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/about" className="text-foreground/80 hover:text-primary transition-colors">
            About
          </Link>
          <div className="flex items-center space-x-3">
            <a
              href={`mailto:${appInfo.email}`}
              className="text-foreground/70 hover:text-primary transition-colors"
              aria-label="Email"
            >
              <Mail size={18} />
            </a>
            <a
              href={appInfo.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/70 hover:text-primary transition-colors"
              aria-label="GitHub"
            >
              <Github size={18} />
            </a>
            <a
              href={appInfo.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/70 hover:text-primary transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin size={18} />
            </a>
            <a
              href={appInfo.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/70 hover:text-primary transition-colors"
              aria-label="Instagram"
            >
              <InstagramIcon className="w-4 h-4" />
            </a>
            <a
              href={appInfo.farcaster}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/70 hover:text-primary transition-colors"
              aria-label="Farcaster"
            >
              <FarcasterIcon className="w-4 h-4" />
            </a>
            <a
              href={`nostr:${appInfo.nostr}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/70 hover:text-primary transition-colors"
              aria-label="Nostr"
            >
              <NostrIcon className="w-4 h-4" />
            </a>
            <a
              href={appInfo.stackoverflow}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/70 hover:text-primary transition-colors"
              aria-label="Stack Overflow"
            >
              <StackOverflowIcon className="w-4 h-4" />
            </a>
          </div>
        </nav>
      </div>
    </header>
  )
}
