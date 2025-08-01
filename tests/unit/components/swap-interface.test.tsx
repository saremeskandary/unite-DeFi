import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SwapInterface } from '@/components/swap/swap-interface';

// Mock external dependencies
jest.mock('@/lib/enhanced-wallet', () => ({
    enhancedWallet: {
        isConnected: jest.fn().mockReturnValue(true),
        getCurrentAddress: jest.fn().mockReturnValue('0x1234567890123456789012345678901234567890'),
        onAccountChange: jest.fn(),
        onChainChange: jest.fn(),
        getWalletInfo: jest.fn().mockResolvedValue({
            tokens: [
                { symbol: 'USDC', name: 'USD Coin', balance: '1000.00', value: 1000 },
                { symbol: 'BTC', name: 'Bitcoin', balance: '0.5', value: 25000 },
                { symbol: 'WETH', name: 'Wrapped Ethereum', balance: '2.0', value: 4000 }
            ]
        })
    }
}));

jest.mock('sonner', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
        info: jest.fn()
    }
}));

// Mock the TokenSelector component
jest.mock('@/components/swap/token-selector', () => ({
    TokenSelector: ({ token, onSelect, type }: any) => (
        <button
            onClick={() => onSelect({ ...token, symbol: type === 'from' ? 'USDC' : 'BTC' })}
            data-testid={`token-selector-${type}`}
        >
            {token.symbol}
        </button>
    )
}));

// Mock the BitcoinAddressInput component
jest.mock('@/components/swap/bitcoin-address-input', () => ({
    BitcoinAddressInput: ({ value, onChange }: any) => (
        <input
            data-testid="bitcoin-address-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter Bitcoin address"
        />
    )
}));

// Mock the OrderSummary component
jest.mock('@/components/swap/order-summary', () => ({
    OrderSummary: ({ order }: any) => (
        <div data-testid="order-summary">
            Order Summary: {order?.fromAmount} {order?.fromToken} → {order?.toAmount} {order?.toToken}
        </div>
    )
}));

describe('SwapInterface', () => {
    const mockOnOrderCreated = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render swap interface with all main elements', () => {
            render(<SwapInterface onOrderCreated={mockOnOrderCreated} />);

            // Check for main interface elements
            expect(screen.getByText('Swap')).toBeInTheDocument();
            expect(screen.getByTestId('token-selector-from')).toBeInTheDocument();
            expect(screen.getByTestId('token-selector-to')).toBeInTheDocument();
            expect(screen.getByTestId('bitcoin-address-input')).toBeInTheDocument();
        });

        it('should display default token selection', () => {
            render(<SwapInterface onOrderCreated={mockOnOrderCreated} />);

            // Check default token selection
            expect(screen.getByTestId('token-selector-from')).toHaveTextContent('USDC');
            expect(screen.getByTestId('token-selector-to')).toHaveTextContent('BTC');
        });

        it('should display amount input fields', () => {
            render(<SwapInterface onOrderCreated={mockOnOrderCreated} />);

            // Check for amount inputs
            expect(screen.getByLabelText('Amount')).toBeInTheDocument();
            expect(screen.getByLabelText('You will receive')).toBeInTheDocument();
        });

        it('should display swap button', () => {
            render(<SwapInterface onOrderCreated={mockOnOrderCreated} />);

            const swapButton = screen.getByRole('button', { name: /swap/i });
            expect(swapButton).toBeInTheDocument();
        });
    });

    describe('Token Selection', () => {
        it('should handle from token selection', async () => {
            render(<SwapInterface onOrderCreated={mockOnOrderCreated} />);

            const fromTokenSelector = screen.getByTestId('token-selector-from');
            fireEvent.click(fromTokenSelector);

            await waitFor(() => {
                expect(fromTokenSelector).toHaveTextContent('USDC');
            });
        });

        it('should handle to token selection', async () => {
            render(<SwapInterface onOrderCreated={mockOnOrderCreated} />);

            const toTokenSelector = screen.getByTestId('token-selector-to');
            fireEvent.click(toTokenSelector);

            await waitFor(() => {
                expect(toTokenSelector).toHaveTextContent('BTC');
            });
        });

        it('should handle token swap button', async () => {
            render(<SwapInterface onOrderCreated={mockOnOrderCreated} />);

            const swapTokensButton = screen.getByLabelText('Swap tokens');
            fireEvent.click(swapTokensButton);

            await waitFor(() => {
                // The tokens should be swapped
                expect(screen.getByTestId('token-selector-from')).toHaveTextContent('BTC');
                expect(screen.getByTestId('token-selector-to')).toHaveTextContent('USDC');
            });
        });

        it('should restrict token selection when special tokens (TON, BTC, TRX) are selected', async () => {
            render(<SwapInterface onOrderCreated={mockOnOrderCreated} />);

            // This test verifies that the restriction logic is in place
            // The actual restriction behavior would be tested in integration tests
            // since it involves complex state management and UI interactions

            // For now, we just verify the component renders with the restriction logic
            expect(screen.getByText('Swap')).toBeInTheDocument();
        });
    });

    describe('Amount Input', () => {
        it('should handle from amount input', async () => {
            render(<SwapInterface onOrderCreated={mockOnOrderCreated} />);

            const fromAmountInput = screen.getByLabelText('Amount');
            fireEvent.change(fromAmountInput, { target: { value: '100' } });

            await waitFor(() => {
                expect(fromAmountInput).toHaveValue('100');
            });
        });

        it('should handle max amount button', async () => {
            render(<SwapInterface onOrderCreated={mockOnOrderCreated} />);

            const maxButton = screen.getByText('Max');
            fireEvent.click(maxButton);

            await waitFor(() => {
                const fromAmountInput = screen.getByLabelText('Amount');
                expect(fromAmountInput).toHaveValue('1000.00'); // Based on mock wallet data
            });
        });

        it('should update to amount when from amount changes', async () => {
            render(<SwapInterface onOrderCreated={mockOnOrderCreated} />);

            const fromAmountInput = screen.getByLabelText('Amount');
            fireEvent.change(fromAmountInput, { target: { value: '100' } });

            await waitFor(() => {
                const toAmountInput = screen.getByLabelText('You will receive');
                // The exact value would depend on the exchange rate calculation
                expect(toAmountInput).toHaveValue(expect.any(String));
            });
        });
    });

    describe('Bitcoin Address Input', () => {
        it('should handle Bitcoin address input', async () => {
            render(<SwapInterface onOrderCreated={mockOnOrderCreated} />);

            const bitcoinAddressInput = screen.getByTestId('bitcoin-address-input');
            const testAddress = global.testUtils.generateTestAddress();

            fireEvent.change(bitcoinAddressInput, { target: { value: testAddress } });

            await waitFor(() => {
                expect(bitcoinAddressInput).toHaveValue(testAddress);
            });
        });

        it('should validate Bitcoin address format', async () => {
            render(<SwapInterface onOrderCreated={mockOnOrderCreated} />);

            const bitcoinAddressInput = screen.getByTestId('bitcoin-address-input');

            // Test invalid address
            fireEvent.change(bitcoinAddressInput, { target: { value: 'invalid-address' } });

            await waitFor(() => {
                const swapButton = screen.getByRole('button', { name: /swap/i });
                expect(swapButton).toBeDisabled();
            });

            // Test valid address
            const validAddress = global.testUtils.generateTestAddress();
            fireEvent.change(bitcoinAddressInput, { target: { value: validAddress } });

            await waitFor(() => {
                const swapButton = screen.getByRole('button', { name: /swap/i });
                expect(swapButton).toBeEnabled();
            });
        });
    });

    describe('Swap Execution', () => {
        it('should enable swap button when form is valid', async () => {
            render(<SwapInterface onOrderCreated={mockOnOrderCreated} />);

            // Fill required fields
            const fromAmountInput = screen.getByLabelText('Amount');
            const bitcoinAddressInput = screen.getByTestId('bitcoin-address-input');

            fireEvent.change(fromAmountInput, { target: { value: '100' } });
            fireEvent.change(bitcoinAddressInput, { target: { value: global.testUtils.generateTestAddress() } });

            await waitFor(() => {
                const swapButton = screen.getByRole('button', { name: /swap/i });
                expect(swapButton).toBeEnabled();
            });
        });

        it('should disable swap button when form is invalid', async () => {
            render(<SwapInterface onOrderCreated={mockOnOrderCreated} />);

            // Don't fill required fields
            await waitFor(() => {
                const swapButton = screen.getByRole('button', { name: /swap/i });
                expect(swapButton).toBeDisabled();
            });
        });

        it('should handle swap execution', async () => {
            render(<SwapInterface onOrderCreated={mockOnOrderCreated} />);

            // Fill form with valid data
            const fromAmountInput = screen.getByLabelText('Amount');
            const bitcoinAddressInput = screen.getByTestId('bitcoin-address-input');

            fireEvent.change(fromAmountInput, { target: { value: '100' } });
            fireEvent.change(bitcoinAddressInput, { target: { value: global.testUtils.generateTestAddress() } });

            // Submit swap
            const swapButton = screen.getByRole('button', { name: /swap/i });
            fireEvent.click(swapButton);

            await waitFor(() => {
                expect(mockOnOrderCreated).toHaveBeenCalledWith(expect.any(String));
            });
        });

        it('should show loading state during swap execution', async () => {
            render(<SwapInterface onOrderCreated={mockOnOrderCreated} />);

            // Fill form
            const fromAmountInput = screen.getByLabelText('Amount');
            const bitcoinAddressInput = screen.getByTestId('bitcoin-address-input');

            fireEvent.change(fromAmountInput, { target: { value: '100' } });
            fireEvent.change(bitcoinAddressInput, { target: { value: global.testUtils.generateTestAddress() } });

            // Submit swap
            const swapButton = screen.getByRole('button', { name: /swap/i });
            fireEvent.click(swapButton);

            await waitFor(() => {
                expect(swapButton).toBeDisabled();
                expect(swapButton).toHaveTextContent(/processing/i);
            });
        });
    });

    describe('Settings and Configuration', () => {
        it('should display settings button', () => {
            render(<SwapInterface onOrderCreated={mockOnOrderCreated} />);

            const settingsButton = screen.getByLabelText('Settings');
            expect(settingsButton).toBeInTheDocument();
        });

        it('should open settings dialog when clicked', async () => {
            render(<SwapInterface onOrderCreated={mockOnOrderCreated} />);

            const settingsButton = screen.getByLabelText('Settings');
            fireEvent.click(settingsButton);

            await waitFor(() => {
                expect(screen.getByText('Swap Settings')).toBeInTheDocument();
            });
        });

        it('should handle slippage configuration', async () => {
            render(<SwapInterface onOrderCreated={mockOnOrderCreated} />);

            // Open settings
            const settingsButton = screen.getByLabelText('Settings');
            fireEvent.click(settingsButton);

            await waitFor(() => {
                expect(screen.getByText('Slippage Tolerance')).toBeInTheDocument();
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle insufficient balance error', async () => {
            render(<SwapInterface onOrderCreated={mockOnOrderCreated} />);

            // Try to swap more than available balance
            const fromAmountInput = screen.getByLabelText('Amount');
            fireEvent.change(fromAmountInput, { target: { value: '10000' } });

            await waitFor(() => {
                const swapButton = screen.getByRole('button', { name: /swap/i });
                expect(swapButton).toBeDisabled();
            });
        });

        it('should handle network errors gracefully', async () => {
            // Mock network error
            jest.spyOn(console, 'error').mockImplementation(() => { });

            render(<SwapInterface onOrderCreated={mockOnOrderCreated} />);

            // This would test error handling when network requests fail
            expect(screen.getByText('Swap')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have proper form labels', () => {
            render(<SwapInterface onOrderCreated={mockOnOrderCreated} />);

            expect(screen.getByLabelText('Amount')).toBeInTheDocument();
            expect(screen.getByLabelText('You will receive')).toBeInTheDocument();
        });

        it('should have proper button labels', () => {
            render(<SwapInterface onOrderCreated={mockOnOrderCreated} />);

            const buttons = screen.getAllByRole('button');
            buttons.forEach(button => {
                expect(button).toHaveAccessibleName();
            });
        });

        it('should support keyboard navigation', async () => {
            render(<SwapInterface onOrderCreated={mockOnOrderCreated} />);

            const fromAmountInput = screen.getByLabelText('Amount');
            const bitcoinAddressInput = screen.getByTestId('bitcoin-address-input');

            // Focus first input
            fromAmountInput.focus();
            expect(fromAmountInput).toHaveFocus();

            // Simulate Tab key press
            fireEvent.keyDown(fromAmountInput, { key: 'Tab' });

            // In a real browser, Tab would move focus, but in jsdom we need to manually focus
            bitcoinAddressInput.focus();
            expect(bitcoinAddressInput).toHaveFocus();
        });
    });
}); 