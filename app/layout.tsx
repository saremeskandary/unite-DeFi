import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import type { Metadata } from "next"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Unit Def",
  description:
    "Senior Blockchain Developer with expertise in full-stack development, blockchain ecosystems, decentralized applications, and zero-knowledge technologies.",
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
      <body className={inter.className}>{children}</body>
    </html>
  )
}
