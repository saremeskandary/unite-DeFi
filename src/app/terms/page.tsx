import { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = {
    title: "Terms of Service - FusionSwap",
    description: "Terms of service for FusionSwap - Cross-Chain Bitcoin Swaps",
}

export default function TermsPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="space-y-6">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold text-foreground">Terms of Service</h1>
                    <p className="text-lg text-muted-foreground">
                        Last updated: {new Date().toLocaleDateString()}
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>1. Acceptance of Terms</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>
                            By accessing and using FusionSwap ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                        </p>
                        <p>
                            These Terms of Service ("Terms") govern your use of FusionSwap, a cross-chain DeFi platform that enables atomic swaps between Bitcoin and ERC20 tokens.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>2. Description of Service</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>FusionSwap provides the following services:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Cross-chain atomic swaps between Bitcoin and ERC20 tokens</li>
                            <li>Real-time price feeds and market data</li>
                            <li>Wallet integration and transaction management</li>
                            <li>Portfolio tracking and analytics</li>
                            <li>Order management and execution</li>
                        </ul>
                        <p className="text-sm text-muted-foreground">
                            The Platform operates on blockchain networks and interacts with smart contracts. All transactions are executed on-chain and are irreversible.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>3. Eligibility and Registration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>To use FusionSwap, you must:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Be at least 18 years of age</li>
                            <li>Have the legal capacity to enter into binding agreements</li>
                            <li>Comply with all applicable laws and regulations</li>
                            <li>Not be located in a jurisdiction where our services are prohibited</li>
                            <li>Have a compatible digital wallet</li>
                        </ul>
                        <p>
                            You are responsible for maintaining the security of your wallet and private keys. We are not responsible for any loss of funds due to compromised wallet security.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>4. User Responsibilities</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>As a user of FusionSwap, you agree to:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Provide accurate and complete information</li>
                            <li>Maintain the security of your wallet and private keys</li>
                            <li>Comply with all applicable laws and regulations</li>
                            <li>Not engage in fraudulent or illegal activities</li>
                            <li>Not attempt to manipulate or exploit the platform</li>
                            <li>Report any security vulnerabilities or bugs</li>
                            <li>Pay all applicable fees and taxes</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>5. Fees and Charges</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>FusionSwap may charge fees for certain services:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Transaction fees for swaps and transfers</li>
                            <li>Network gas fees (paid to blockchain networks)</li>
                            <li>Platform usage fees</li>
                            <li>Premium service fees (if applicable)</li>
                        </ul>
                        <p>
                            All fees are clearly displayed before transaction execution. You are responsible for all fees associated with your transactions.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>6. Risk Disclosure</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="font-semibold text-red-600">IMPORTANT: Cryptocurrency trading involves substantial risk.</p>
                        <p>By using FusionSwap, you acknowledge and accept the following risks:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li><strong>Market Risk:</strong> Cryptocurrency prices are highly volatile and can result in significant losses</li>
                            <li><strong>Technical Risk:</strong> Smart contract bugs, network failures, or technical issues may result in loss of funds</li>
                            <li><strong>Regulatory Risk:</strong> Changes in laws or regulations may affect the legality or availability of our services</li>
                            <li><strong>Liquidity Risk:</strong> Some tokens may have limited liquidity, affecting trade execution</li>
                            <li><strong>Security Risk:</strong> Despite security measures, no system is completely secure</li>
                            <li><strong>Irreversible Transactions:</strong> Blockchain transactions cannot be reversed once confirmed</li>
                        </ul>
                        <p className="text-sm text-muted-foreground">
                            You should only invest what you can afford to lose and consider seeking professional financial advice.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>7. Intellectual Property</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>FusionSwap and its content are protected by intellectual property laws:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>All trademarks, service marks, and logos are our property</li>
                            <li>Software, code, and platform design are protected by copyright</li>
                            <li>You may not copy, modify, or distribute our intellectual property</li>
                            <li>You retain ownership of your content and data</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>8. Prohibited Activities</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>You agree not to:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Use the platform for illegal activities or money laundering</li>
                            <li>Attempt to hack, disrupt, or interfere with the platform</li>
                            <li>Use automated trading bots without permission</li>
                            <li>Engage in market manipulation or front-running</li>
                            <li>Violate any applicable laws or regulations</li>
                            <li>Impersonate others or provide false information</li>
                            <li>Attempt to reverse engineer our software</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>9. Disclaimers and Limitations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="font-semibold">THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.</p>
                        <p>We disclaim all warranties, including:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Warranties of merchantability or fitness for a particular purpose</li>
                            <li>Warranties that the platform will be uninterrupted or error-free</li>
                            <li>Warranties regarding the accuracy of price feeds or market data</li>
                            <li>Warranties that the platform is secure or free from vulnerabilities</li>
                        </ul>
                        <p>
                            In no event shall FusionSwap be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or use.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>10. Indemnification</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>
                            You agree to indemnify and hold harmless FusionSwap, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the platform or violation of these Terms.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>11. Termination</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>We may terminate or suspend your access to FusionSwap:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>For violation of these Terms</li>
                            <li>For fraudulent or illegal activities</li>
                            <li>To comply with legal requirements</li>
                            <li>For security or technical reasons</li>
                        </ul>
                        <p>
                            You may stop using the platform at any time. Termination does not affect your obligations under these Terms.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>12. Governing Law and Disputes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>These Terms are governed by the laws of [Jurisdiction]. Any disputes shall be resolved through:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Good faith negotiations between parties</li>
                            <li>Mediation or arbitration (if required by law)</li>
                            <li>Court proceedings in the appropriate jurisdiction</li>
                        </ul>
                        <p>
                            You agree to submit to the personal jurisdiction of the courts in [Jurisdiction] for any legal proceedings.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>13. Severability</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>
                            If any provision of these Terms is found to be unenforceable or invalid, the remaining provisions will continue to be valid and enforceable to the fullest extent permitted by law.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>14. Changes to Terms</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>
                            We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting. Your continued use of FusionSwap after changes constitutes acceptance of the modified Terms.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>15. Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>For questions about these Terms of Service, please contact us:</p>
                        <div className="space-y-2">
                            <p><strong>Email:</strong> legal@fusionswap.es</p>
                            <p><strong>Website:</strong> https://www.fusionswap.es</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
} 