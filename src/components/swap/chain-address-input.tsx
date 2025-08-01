"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle } from "lucide-react"

interface ChainAddressInputProps {
    chain: string
    value: string
    onChange: (value: string) => void
    placeholder?: string
    required?: boolean
}

export function ChainAddressInput({
    chain,
    value,
    onChange,
    placeholder = "Enter address",
    required = false
}: ChainAddressInputProps) {
    const [isValid, setIsValid] = useState<boolean | null>(null)

    const validateAddress = (address: string, chainType: string): boolean => {
        if (!address) return false

        switch (chainType) {
            case 'BTC':
            case 'DOGE':
            case 'LTC':
            case 'BCH':
                return /^[2mn][1-9A-HJ-NP-Za-km-z]{25,34}$/.test(address)
            case 'ETH':
            case 'MATIC':
            case 'BSC':
                return /^0x[a-fA-F0-9]{40}$/.test(address)
            case 'TRON':
                return /^T[A-Za-z1-9]{33}$/.test(address)
            case 'ADA':
                return /^addr1[a-z0-9]{98}$/.test(address)
            case 'SOL':
                return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
            default:
                return false
        }
    }

    const handleChange = (newValue: string) => {
        onChange(newValue)
        if (newValue) {
            setIsValid(validateAddress(newValue, chain))
        } else {
            setIsValid(null)
        }
    }

    const getChainIcon = (chainType: string) => {
        const iconMap: { [key: string]: string } = {
            BTC: "₿",
            DOGE: "Ð",
            LTC: "Ł",
            BCH: "₿",
            ETH: "Ξ",
            TRON: "T",
            ADA: "₳",
            SOL: "◎",
            MATIC: "M",
            BSC: "B"
        }
        return iconMap[chainType] || chainType
    }

    const getAddressFormat = (chainType: string) => {
        const formatMap: { [key: string]: string } = {
            BTC: "bc1q... or 1A1zP1...",
            DOGE: "D...",
            LTC: "L...",
            BCH: "bitcoincash:...",
            ETH: "0x...",
            TRON: "T...",
            ADA: "addr1...",
            SOL: "...",
            MATIC: "0x...",
            BSC: "0x..."
        }
        return formatMap[chainType] || "Enter address"
    }

    return (
        <div className="space-y-2">
            <Label className="text-muted-foreground text-sm flex items-center space-x-2">
                <span>To Address ({chain})</span>
                <Badge variant="outline" className="text-xs">
                    {getChainIcon(chain)}
                </Badge>
                {required && <span className="text-red-500">*</span>}
            </Label>

            <div className="relative">
                <Input
                    type="text"
                    placeholder={placeholder || getAddressFormat(chain)}
                    value={value}
                    onChange={(e) => handleChange(e.target.value)}
                    className={`bg-muted/50 border-border text-foreground pr-10 ${isValid === true ? 'border-green-500' :
                            isValid === false ? 'border-red-500' : ''
                        }`}
                />

                {isValid !== null && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {isValid ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                    </div>
                )}
            </div>

            {isValid === false && (
                <div className="flex items-center space-x-2 text-xs text-red-500">
                    <AlertCircle className="w-3 h-3" />
                    <span>Invalid {chain} address format</span>
                </div>
            )}

            {isValid === true && (
                <div className="flex items-center space-x-2 text-xs text-green-500">
                    <CheckCircle className="w-3 h-3" />
                    <span>Valid {chain} address</span>
                </div>
            )}
        </div>
    )
} 