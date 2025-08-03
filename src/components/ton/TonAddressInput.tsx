"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    CheckCircle,
    XCircle,
    QrCode,
    Camera,
    AlertCircle,
    Copy,
    Paste,
    BookOpen,
    User,
    ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TonAddressInputProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    allowENS?: boolean;
    showQRScanner?: boolean;
    showAddressBook?: boolean;
    className?: string;
    error?: string;
    onValidationChange?: (isValid: boolean, type?: 'address' | 'ens' | 'domain') => void;
}

interface AddressValidation {
    isValid: boolean;
    type?: 'raw' | 'user_friendly' | 'bounce' | 'non_bounce';
    workchain?: number;
    isTestnet?: boolean;
    format?: 'base64' | 'base64url';
    error?: string;
}

interface AddressBookEntry {
    name: string;
    address: string;
    type: 'personal' | 'contract' | 'exchange';
    verified?: boolean;
}

// Sample address book entries
const SAMPLE_ADDRESS_BOOK: AddressBookEntry[] = [
    {
        name: "My Wallet",
        address: "UQBFiKW4Zw6-7gYrHT5_ydvYZtOeLQTgBv7TRDHT2VrJvLK3",
        type: "personal",
        verified: true,
    },
    {
        name: "DeDust DEX",
        address: "EQBfBWT7X2BHg9tXAxzhz2aKiNTU1tpt5NsiK0uSDW_YAJ67",
        type: "contract",
        verified: true,
    },
];

export function TonAddressInput({
    value,
    onChange,
    label = "TON Address",
    placeholder = "Enter TON address (UQ... or EQ...)",
    required = false,
    disabled = false,
    allowENS = true,
    showQRScanner = true,
    showAddressBook = true,
    className,
    error,
    onValidationChange,
}: TonAddressInputProps) {
    const [validation, setValidation] = useState<AddressValidation>({ isValid: false });
    const [isQROpen, setIsQROpen] = useState(false);
    const [isAddressBookOpen, setIsAddressBookOpen] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Validate TON address
    const validateAddress = useCallback(async (address: string): Promise<AddressValidation> => {
        if (!address.trim()) {
            return { isValid: false };
        }

        try {
            const trimmedAddress = address.trim();

            // Check if it's a raw address (workchain:hash format)
            if (trimmedAddress.includes(':')) {
                const parts = trimmedAddress.split(':');
                if (parts.length === 2) {
                    const workchain = parseInt(parts[0]);
                    const hash = parts[1];

                    if (!isNaN(workchain) && hash.length === 64 && /^[0-9a-fA-F]+$/.test(hash)) {
                        return {
                            isValid: true,
                            type: 'raw',
                            workchain,
                            format: 'base64',
                        };
                    }
                }
            }

            // Check user-friendly format
            if (trimmedAddress.length === 48) {
                const firstTwo = trimmedAddress.substring(0, 2);

                if (['UQ', 'EQ', 'kQ'].includes(firstTwo)) {
                    const isValidBase64 = /^[A-Za-z0-9_-]+$/.test(trimmedAddress.substring(2));

                    if (isValidBase64) {
                        const isBounce = firstTwo === 'EQ' || firstTwo === 'kQ';
                        const isTestnet = firstTwo === 'kQ';

                        return {
                            isValid: true,
                            type: isBounce ? 'bounce' : 'non_bounce',
                            workchain: 0,
                            isTestnet,
                            format: 'base64url',
                        };
                    }
                }
            }

            return {
                isValid: false,
                error: 'Invalid TON address format',
            };
        } catch (error) {
            console.error('Address validation error:', error);
            return {
                isValid: false,
                error: 'Failed to validate address',
            };
        }
    }, []);

    // Validate address when value changes
    useEffect(() => {
        const validate = async () => {
            const result = await validateAddress(value);
            setValidation(result);
            onValidationChange?.(result.isValid, 'address');
        };

        if (value) {
            validate();
        } else {
            setValidation({ isValid: false });
            onValidationChange?.(false);
        }
    }, [value, validateAddress, onValidationChange]);

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            onChange(text.trim());
            toast.success('Address pasted from clipboard');
        } catch (error) {
            toast.error('Failed to paste from clipboard');
        }
    };

    const handleCopy = () => {
        if (value) {
            navigator.clipboard.writeText(value).then(() => {
                toast.success('Address copied to clipboard');
            }).catch(() => {
                toast.error('Failed to copy address');
            });
        }
    };

    const openInExplorer = () => {
        if (value && validation.isValid) {
            const explorerUrl = `https://tonviewer.com/address/${value}`;
            window.open(explorerUrl, '_blank');
        }
    };

    const getValidationIcon = () => {
        if (!value) return null;
        if (isValidating) return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />;
        if (validation.isValid) return <CheckCircle className="w-4 h-4 text-green-500" />;
        return <XCircle className="w-4 h-4 text-red-500" />;
    };

    const getValidationMessage = () => {
        if (!value) return null;
        if (isValidating) return "Validating address...";
        if (validation.isValid) {
            const typeLabels = {
                raw: 'Raw Address',
                user_friendly: 'User-Friendly',
                bounce: 'Bounceable',
                non_bounce: 'Non-Bounceable',
            };
            return `Valid ${typeLabels[validation.type as keyof typeof typeLabels] || 'TON'} address`;
        }
        return validation.error || "Invalid TON address format";
    };

    return (
        <div className={cn("space-y-2", className)}>
            {label && (
                <Label htmlFor="ton-address-input" className="text-sm font-medium">
                    {label} {required && <span className="text-red-500">*</span>}
                </Label>
            )}

            <div className="relative">
                <Input
                    ref={inputRef}
                    id="ton-address-input"
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={cn(
                        "pr-24 font-mono text-sm",
                        validation.isValid && value ? "border-green-500 focus:border-green-500" : "",
                        validation.error && value ? "border-red-500 focus:border-red-500" : "",
                        error ? "border-red-500" : ""
                    )}
                />

                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {getValidationIcon()}

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handlePaste}
                                    disabled={disabled}
                                    className="h-6 w-6 p-0"
                                >
                                    <Paste className="w-3 h-3" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Paste from clipboard</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {value && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCopy}
                                        className="h-6 w-6 p-0"
                                    >
                                        <Copy className="w-3 h-3" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Copy address</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </div>

            {/* Validation message and explorer link */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {getValidationMessage() && (
                        <div className={cn(
                            "text-xs flex items-center gap-1",
                            validation.isValid ? "text-green-600 dark:text-green-400" :
                                validation.error ? "text-red-600 dark:text-red-400" :
                                    "text-muted-foreground"
                        )}>
                            {getValidationMessage()}
                        </div>
                    )}

                    {validation.isValid && validation.isTestnet && (
                        <Badge variant="outline" className="text-xs">
                            Testnet
                        </Badge>
                    )}
                </div>

                {validation.isValid && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={openInExplorer}
                        className="h-6 px-2 text-xs"
                    >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Explorer
                    </Button>
                )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    onClick={() => toast.info('QR Scanner not implemented yet')}
                    className="flex-1"
                >
                    <QrCode className="w-4 h-4 mr-1" />
                    Scan QR
                </Button>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    onClick={() => toast.info('Address Book not implemented yet')}
                    className="flex-1"
                >
                    <BookOpen className="w-4 h-4 mr-1" />
                    Address Book
                </Button>
            </div>

            {/* Error message */}
            {error && (
                <div className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}
        </div>
    );
} 