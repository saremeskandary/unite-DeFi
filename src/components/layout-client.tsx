"use client"

import type React from "react"
import ResponsiveHeader from "./responsive-header"
import { appInfo } from "@/constants/app-info"
import { Mail } from "lucide-react"

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <ResponsiveHeader />
      <main className="container mx-auto px-4 py-8">{children}</main>
      <footer className="bg-card/80 backdrop-blur-sm border-t border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} {appInfo.name}
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <a
                href={`mailto:${appInfo.email}`}
                className="text-muted-foreground hover:text-primary transition-colors flex items-center text-sm"
              >
                <Mail size={14} className="mr-1" />
                <span>{appInfo.email}</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
