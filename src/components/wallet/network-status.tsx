"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useEnhancedWallet } from "@/hooks/use-enhanced-wallet"
import { AlertTriangle, CheckCircle } from "lucide-react"
import { toast } from "sonner"

export function NetworkStatus() {
    const { isConnected, chainId, network, switchToSupportedNetwork } = useEnhancedWallet()

    if (!isConnected) {
        return null
    }

    const getNetworkInfo = (chainId: number | null) => {
        switch (chainId) {
            case 1:
                return { name: 'Ethereum Mainnet', color: 'bg-green-500', supported: true }
            case 5:
                return { name: 'Goerli Testnet', color: 'bg-blue-500', supported: true }
            case 11155111:
                return { name: 'Sepolia Testnet', color: 'bg-purple-500', supported: true }
            default:
                return { name: `Chain ID ${chainId}`, color: 'bg-red-500', supported: false }
        }
    }

    const networkInfo = getNetworkInfo(chainId)

    const handleSwitchNetwork = async () => {
        try {
            const success = await switchToSupportedNetwork()
            if (success) {
                toast.success("Switched to Sepolia Testnet")
            } else {
                toast.error("Failed to switch network. Please switch manually in MetaMask.")
            }
        } catch (error) {
            toast.error("Failed to switch network")
        }
    }

    return (
        <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
                {networkInfo.supported ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
                <Badge
                    variant="secondary"
                    className={`${networkInfo.color} text-white text-xs`}
                >
                    {networkInfo.name}
                </Badge>
            </div>

            {!networkInfo.supported && (
                <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSwitchNetwork}
                    className="text-xs h-6 px-2"
                >
                    Switch Network
                </Button>
            )}
        </div>
    )
} 