import React, { useState, useEffect } from 'react';
import { priceOracle } from '@/lib/price-oracle';

interface SwapHistory {
    id: string;
    amount: string;
    status: 'completed' | 'pending' | 'failed';
    date: string;
}

interface ExampleSwapComponentProps {
    onSwap: (data: { amount: string; address: string; type: string }) => void;
    onError: (error: string) => void;
    balance?: number;
    enablePartialFill?: boolean;
    swapHistory?: SwapHistory[];
}

export function ExampleSwapComponent({
    onSwap,
    onError,
    balance = 1.0,
    enablePartialFill = false,
    swapHistory = []
}: ExampleSwapComponentProps) {
    const [amount, setAmount] = useState('');
    const [address, setAddress] = useState('');
    const [bitcoinPrice, setBitcoinPrice] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [showPartialFill, setShowPartialFill] = useState(false);

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const btcPriceData = await priceOracle.getTokenPrice('BTC');
                if (btcPriceData) {
                    setBitcoinPrice(btcPriceData.price);
                }
            } catch (error) {
                console.error('Failed to fetch Bitcoin price:', error);
            }
        };

        fetchPrices();
    }, []);

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        // Validate amount
        if (!amount || parseFloat(amount) <= 0) {
            newErrors.amount = 'Amount must be positive';
        } else if (parseFloat(amount) > balance) {
            newErrors.amount = 'Insufficient balance';
        }

        // Validate address (basic Bitcoin address format)
        if (!address) {
            newErrors.address = 'Address is required';
        } else if (!/^[2mn][1-9A-HJ-NP-Za-km-z]{25,34}$/.test(address)) {
            newErrors.address = 'Invalid address format';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Validate on input changes
    useEffect(() => {
        if (amount || address) {
            validateForm();
        }
    }, [amount, address, balance]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        try {
            await onSwap({
                amount,
                address,
                type: 'btc-to-eth'
            });
        } catch (error) {
            onError(error instanceof Error ? error.message : 'Swap failed');
        } finally {
            setIsLoading(false);
        }
    };

    const isFormValid = amount && address && !errors.amount && !errors.address;

    return (
        <div className="swap-interface">
            <h2>Bitcoin Atomic Swap</h2>

            {bitcoinPrice && (
                <div className="price-display">
                    <p>Current Bitcoin Price: ${bitcoinPrice.toLocaleString()}</p>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="amount">Amount (BTC)</label>
                    <input
                        id="amount"
                        type="number"
                        step="0.00000001"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={isLoading}
                    />
                    {errors.amount && <span className="error">{errors.amount}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="address">Recipient Address</label>
                    <input
                        id="address"
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        disabled={isLoading}
                    />
                    {errors.address && <span className="error">{errors.address}</span>}
                </div>

                {enablePartialFill && (
                    <div className="form-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={showPartialFill}
                                onChange={(e) => setShowPartialFill(e.target.checked)}
                            />
                            Enable Partial Fill
                        </label>
                    </div>
                )}

                {showPartialFill && (
                    <div className="partial-fill-options">
                        <h3>Partial Fill Options</h3>
                        <div className="form-group">
                            <label htmlFor="parts">Number of Parts</label>
                            <input
                                id="parts"
                                type="number"
                                min="2"
                                max="10"
                                defaultValue="3"
                            />
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={!isFormValid || isLoading}
                >
                    {isLoading ? 'Processing...' : 'Initiate Swap'}
                </button>
            </form>

            {swapHistory.length > 0 && (
                <div className="swap-history">
                    <h3>Swap History</h3>
                    <ul>
                        {swapHistory.map((swap) => (
                            <li key={swap.id}>
                                {swap.amount} BTC - {swap.status} - {swap.date}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <style jsx>{`
        .swap-interface {
          max-width: 500px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        
        .form-group input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        
        .error {
          color: red;
          font-size: 0.9em;
          margin-top: 5px;
          display: block;
        }
        
        button {
          width: 100%;
          padding: 10px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        
        .price-display {
          background-color: #f8f9fa;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 20px;
        }
        
        .partial-fill-options {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 15px;
        }
        
        .swap-history {
          margin-top: 30px;
        }
        
        .swap-history ul {
          list-style: none;
          padding: 0;
        }
        
        .swap-history li {
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
      `}</style>
        </div>
    );
} 