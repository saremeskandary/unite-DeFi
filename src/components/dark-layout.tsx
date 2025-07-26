import type React from "react"
import { appInfo } from "@/constants/app-info"
import Link from "next/link"
import { Github, Linkedin, Mail } from "lucide-react"

export default function DarkLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-card/50 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center">
          <nav className="flex items-center space-x-6 mt-4 md:mt-0">
            <Link href="/about" className="text-foreground/80 hover:text-primary transition-colors">
              About
            </Link>
            <div className="flex items-center space-x-3">
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
            </div>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
      <footer className="bg-card/50 backdrop-blur-sm border-t border-border/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground">
              © {new Date().getFullYear()} {appInfo.name}
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <a
                href={`mailto:${appInfo.email}`}
                className="text-muted-foreground hover:text-primary transition-colors flex items-center"
              >
                <Mail size={16} className="mr-1" />
                <span>{appInfo.email}</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
