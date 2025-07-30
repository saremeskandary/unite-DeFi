"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QrCode, Check, AlertCircle } from "lucide-react"

interface BitcoinAddressInputProps {
  value: string
  onChange: (value: string) => void
}

export function BitcoinAddressInput({ value, onChange }: BitcoinAddressInputProps) {
  const [isValid, setIsValid] = useState<boolean | null>(null)

  const validateBitcoinAddress = (address: string) => {
    // Simple Bitcoin address validation (basic pattern matching)
    const patterns = [
      /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/, // Legacy
      /^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/, // P2SH
      /^bc1[a-z0-9]{39,59}$/, // Bech32
    ]

    return patterns.some((pattern) => pattern.test(address))
  }

  const handleAddressChange = (newValue: string) => {
    onChange(newValue)

    if (newValue.length > 0) {
      const valid = validateBitcoinAddress(newValue)
      setIsValid(valid)
    } else {
      setIsValid(null)
    }
  }

  const handleQRScan = () => {
    // Simulate QR code scanning
    const mockAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
    handleAddressChange(mockAddress)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-slate-300">Bitcoin Address</Label>
        <Button
          onClick={handleQRScan}
          variant="ghost"
          size="sm"
          className="text-blue-400 hover:text-blue-300 h-auto p-0"
        >
          <QrCode className="w-4 h-4 mr-1" />
          Scan QR
        </Button>
      </div>

      <div className="relative">
        <Input
          placeholder="Enter Bitcoin address (bc1... or 1... or 3...)"
          value={value}
          onChange={(e) => handleAddressChange(e.target.value)}
          className={`bg-slate-700/50 border-slate-600 text-white pr-10 ${
            isValid === false ? "border-red-500" : isValid === true ? "border-green-500" : ""
          }`}
        />

        {isValid !== null && (
          <div className="absolute right-3 top-3">
            {isValid ? <Check className="w-4 h-4 text-green-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isValid === true && (
            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
              Valid Address
            </Badge>
          )}
          {isValid === false && (
            <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/30">
              Invalid Address
            </Badge>
          )}
        </div>

        <div className="text-xs text-slate-400">Supports Legacy, P2SH, and Bech32 formats</div>
      </div>

      {isValid === false && (
        <div className="text-sm text-red-400 bg-red-500/10 rounded-lg p-2">
          Please enter a valid Bitcoin address. Supported formats: Legacy (1...), P2SH (3...), or Bech32 (bc1...)
        </div>
      )}
    </div>
  )
}
