"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { SettingsIcon, Bell, Shield, Palette, Save } from "lucide-react"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    slippageTolerance: "0.5",
    gasPrice: "standard",
    notifications: {
      orderUpdates: true,
      priceAlerts: false,
      newsletter: true,
    },
    privacy: {
      analytics: true,
      crashReports: true,
    },
    appearance: {
      theme: "dark",
      currency: "USD",
    },
  })

  const handleSave = () => {
    // Save settings logic
    console.log("Settings saved:", settings)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
            <p className="text-slate-400">Customize your FusionSwap experience</p>
          </div>

          <div className="space-y-6">
            {/* Trading Settings */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <SettingsIcon className="w-5 h-5 mr-2" />
                  Trading Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Default Slippage Tolerance</Label>
                    <Select
                      value={settings.slippageTolerance}
                      onValueChange={(value) => setSettings({ ...settings, slippageTolerance: value })}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="0.1">0.1%</SelectItem>
                        <SelectItem value="0.5">0.5%</SelectItem>
                        <SelectItem value="1.0">1.0%</SelectItem>
                        <SelectItem value="2.0">2.0%</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Gas Price Strategy</Label>
                    <Select
                      value={settings.gasPrice}
                      onValueChange={(value) => setSettings({ ...settings, gasPrice: value })}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="slow">Slow (Lower fees)</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="fast">Fast (Higher fees)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-slate-300">Order Updates</Label>
                      <p className="text-sm text-slate-400">Get notified about swap progress and completion</p>
                    </div>
                    <Switch
                      checked={settings.notifications.orderUpdates}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, orderUpdates: checked },
                        })
                      }
                    />
                  </div>

                  <Separator className="bg-slate-600" />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-slate-300">Price Alerts</Label>
                      <p className="text-sm text-slate-400">Receive alerts for significant price movements</p>
                    </div>
                    <Switch
                      checked={settings.notifications.priceAlerts}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, priceAlerts: checked },
                        })
                      }
                    />
                  </div>

                  <Separator className="bg-slate-600" />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-slate-300">Newsletter</Label>
                      <p className="text-sm text-slate-400">Stay updated with FusionSwap news and features</p>
                    </div>
                    <Switch
                      checked={settings.notifications.newsletter}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, newsletter: checked },
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Privacy & Security */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Privacy & Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-slate-300">Analytics</Label>
                      <p className="text-sm text-slate-400">Help improve FusionSwap by sharing usage data</p>
                    </div>
                    <Switch
                      checked={settings.privacy.analytics}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          privacy: { ...settings.privacy, analytics: checked },
                        })
                      }
                    />
                  </div>

                  <Separator className="bg-slate-600" />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-slate-300">Crash Reports</Label>
                      <p className="text-sm text-slate-400">Automatically send crash reports to help fix issues</p>
                    </div>
                    <Switch
                      checked={settings.privacy.crashReports}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          privacy: { ...settings.privacy, crashReports: checked },
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  Appearance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Theme</Label>
                    <Select
                      value={settings.appearance.theme}
                      onValueChange={(value) =>
                        setSettings({
                          ...settings,
                          appearance: { ...settings.appearance, theme: value },
                        })
                      }
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Currency</Label>
                    <Select
                      value={settings.appearance.currency}
                      onValueChange={(value) =>
                        setSettings({
                          ...settings,
                          appearance: { ...settings.appearance, currency: value },
                        })
                      }
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="JPY">JPY (¥)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
