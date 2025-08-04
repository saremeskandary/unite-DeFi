import LayoutClient from "@/components/layout-client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Zap, Globe, Users, Code, BarChart3 } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  return (
    <LayoutClient>
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">About Swap Chain</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Swap Chain is a revolutionary cross-chain DeFi platform that enables seamless token swaps
            across multiple blockchains including TON, TRON, Bitcoin, and Ethereum using atomic swaps
            powered by 1inch Fusion+.
          </p>
        </div>

        {/* Mission Section */}
        <Card className="p-8 mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Our Mission</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            We're building the future of decentralized finance by breaking down the barriers between
            different blockchain ecosystems. Our platform enables users to access liquidity across
            multiple chains without the need for centralized exchanges or complex bridge protocols.
          </p>
        </Card>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Trustless Swaps</h3>
            <p className="text-muted-foreground text-sm">
              Atomic swaps ensure your funds are always secure without intermediaries or custodial risks
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Lightning Fast</h3>
            <p className="text-muted-foreground text-sm">
              Complete cross-chain swaps in minutes with optimized routing and execution
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Multi-Chain</h3>
            <p className="text-muted-foreground text-sm">
              Support for TON, TRON, Bitcoin, and Ethereum with more chains coming soon
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">User-Friendly</h3>
            <p className="text-muted-foreground text-sm">
              Intuitive interface designed for both beginners and advanced DeFi users
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Code className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Open Source</h3>
            <p className="text-muted-foreground text-sm">
              Transparent, auditable codebase that anyone can review and contribute to
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Real-time Analytics</h3>
            <p className="text-muted-foreground text-sm">
              Live tracking of swap status, transaction history, and market data
            </p>
          </Card>
        </div>

        {/* Technology Section */}
        <Card className="p-8 mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Technology Stack</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Frontend</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Next.js 14 with App Router</li>
                <li>• TypeScript for type safety</li>
                <li>• Tailwind CSS for styling</li>
                <li>• Shadcn/ui components</li>
                <li>• React Hook Form</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Blockchain Integration</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• 1inch Fusion+ API</li>
                <li>• Multi-chain wallet support</li>
                <li>• Atomic swap protocols</li>
                <li>• Real-time transaction monitoring</li>
                <li>• Cross-chain liquidity aggregation</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <Card className="p-6 text-center">
            <div className="text-2xl font-bold text-foreground">$2.4M</div>
            <div className="text-sm text-muted-foreground">24h Volume</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-2xl font-bold text-foreground">1,247</div>
            <div className="text-sm text-muted-foreground">Total Swaps</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-2xl font-bold text-foreground">4</div>
            <div className="text-sm text-muted-foreground">Supported Chains</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-2xl font-bold text-foreground">99.9%</div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Link href="/">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              Start Swapping Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </LayoutClient>
  )
}
