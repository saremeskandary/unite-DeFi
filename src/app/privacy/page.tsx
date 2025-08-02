import { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = {
    title: "Privacy Policy - FusionSwap",
    description: "Privacy policy for FusionSwap - Cross-Chain Bitcoin Swaps",
}

export default function PrivacyPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="space-y-6">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold text-foreground">Privacy Policy</h1>
                    <p className="text-lg text-muted-foreground">
                        Last updated: {new Date().toLocaleDateString()}
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>1. Introduction</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>
                            FusionSwap ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our cross-chain DeFi platform for atomic swaps between Bitcoin and ERC20 tokens.
                        </p>
                        <p>
                            By using FusionSwap, you agree to the collection and use of information in accordance with this policy.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>2. Information We Collect</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h3 className="font-semibold mb-2">2.1 Personal Information</h3>
                            <p>We may collect personal information that you voluntarily provide, including:</p>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li>Wallet addresses</li>
                                <li>Transaction data</li>
                                <li>Communication preferences</li>
                                <li>Feedback and support requests</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">2.2 Automatically Collected Information</h3>
                            <p>We automatically collect certain information when you use our platform:</p>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li>IP addresses and device information</li>
                                <li>Browser type and version</li>
                                <li>Usage patterns and analytics data</li>
                                <li>Blockchain transaction data (publicly available)</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>3. How We Use Your Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>We use the collected information for the following purposes:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Providing and maintaining our DeFi services</li>
                            <li>Processing transactions and swaps</li>
                            <li>Improving platform functionality and user experience</li>
                            <li>Analyzing usage patterns and performance</li>
                            <li>Providing customer support</li>
                            <li>Ensuring platform security and preventing fraud</li>
                            <li>Complying with legal obligations</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>4. Information Sharing and Disclosure</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>We do not sell, trade, or otherwise transfer your personal information to third parties, except in the following circumstances:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>With your explicit consent</li>
                            <li>To comply with legal obligations or court orders</li>
                            <li>To protect our rights, property, or safety</li>
                            <li>To service providers who assist in platform operations (under strict confidentiality agreements)</li>
                            <li>In connection with a business transfer or merger</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>5. Blockchain and Decentralization</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>
                            FusionSwap operates on blockchain networks where transaction data is publicly visible. Please be aware that:
                        </p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Blockchain transactions are immutable and publicly accessible</li>
                            <li>Wallet addresses and transaction amounts are visible on the blockchain</li>
                            <li>We cannot control or modify blockchain data once recorded</li>
                            <li>Consider using privacy-enhancing tools for additional anonymity</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>6. Data Security</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>We implement appropriate security measures to protect your information:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Encryption of sensitive data in transit and at rest</li>
                            <li>Regular security audits and updates</li>
                            <li>Access controls and authentication measures</li>
                            <li>Secure development practices</li>
                        </ul>
                        <p className="text-sm text-muted-foreground">
                            However, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>7. Your Rights and Choices</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>You have the following rights regarding your personal information:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Access and review your personal data</li>
                            <li>Request correction of inaccurate information</li>
                            <li>Request deletion of your personal data (subject to legal requirements)</li>
                            <li>Opt-out of non-essential communications</li>
                            <li>Withdraw consent for data processing</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>8. Cookies and Tracking</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>We use cookies and similar technologies to:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Remember your preferences and settings</li>
                            <li>Analyze platform usage and performance</li>
                            <li>Provide personalized content and features</li>
                            <li>Ensure platform security</li>
                        </ul>
                        <p>You can control cookie settings through your browser preferences.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>9. Third-Party Services</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>Our platform may integrate with third-party services including:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Blockchain networks and nodes</li>
                            <li>Price feeds and market data providers</li>
                            <li>Analytics and monitoring services</li>
                            <li>Customer support platforms</li>
                        </ul>
                        <p>These services have their own privacy policies, and we encourage you to review them.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>10. Children's Privacy</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>
                            FusionSwap is not intended for use by individuals under 18 years of age. We do not knowingly collect personal information from children under 18. If you believe we have collected such information, please contact us immediately.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>11. International Data Transfers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>
                            Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with applicable laws.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>12. Changes to This Privacy Policy</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>
                            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. Your continued use of FusionSwap after such changes constitutes acceptance of the updated policy.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>13. Contact Us</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>If you have any questions about this Privacy Policy or our data practices, please contact us:</p>
                        <div className="space-y-2">
                            <p><strong>Email:</strong> privacy@fusionswap.es</p>
                            <p><strong>Website:</strong> https://www.fusionswap.es</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
} 