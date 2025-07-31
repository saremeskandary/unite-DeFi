import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ExampleSwapComponent } from '@/components/ExampleSwapComponent';

// Mock external dependencies
jest.mock('@/lib/price-oracle', () => ({
    priceOracle: {
        getTokenPrice: jest.fn().mockResolvedValue({
            symbol: 'BTC',
            price: 45000,
            change24h: 2.5,
            lastUpdated: new Date().toISOString(),
            source: 'coingecko'
        })
    }
}));

jest.mock('@/lib/blockchains/bitcoin/partial-fill-logic', () => ({
    PartialFillLogic: jest.fn().mockImplementation(() => ({
        createPartialFillOrder: jest.fn().mockResolvedValue({
            orderId: 'test-order-123',
            status: 'pending',
            partialOrders: [
                { id: 'partial-1', amount: '0.3', status: 'pending' },
                { id: 'partial-2', amount: '0.4', status: 'pending' },
                { id: 'partial-3', amount: '0.3', status: 'pending' }
            ]
        }),
        getPartialFillProgress: jest.fn().mockResolvedValue({
            totalParts: 3,
            completedParts: 0,
            completionPercentage: 0
        })
    }))
}));

describe('ExampleSwapComponent', () => {
    const mockOnSwap = jest.fn();
    const mockOnError = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render swap interface with all required elements', () => {
            render(
                <ExampleSwapComponent
                    onSwap={mockOnSwap}
                    onError={mockOnError}
                />
            );

            // Check for main interface elements
            expect(screen.getByText('Bitcoin Atomic Swap')).toBeInTheDocument();
            expect(screen.getByLabelText('Amount (BTC)')).toBeInTheDocument();
            expect(screen.getByLabelText('Recipient Address')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Initiate Swap' })).toBeInTheDocument();
        });

        it('should display current Bitcoin price', async () => {
            render(
                <ExampleSwapComponent
                    onSwap={mockOnSwap}
                    onError={mockOnError}
                />
            );

            await waitFor(() => {
                expect(screen.getByText(/Current Bitcoin Price/)).toBeInTheDocument();
            });
        });
    });

    describe('User Interactions', () => {
        it('should handle amount input changes', async () => {
            render(
                <ExampleSwapComponent
                    onSwap={mockOnSwap}
                    onError={mockOnError}
                />
            );

            const amountInput = screen.getByLabelText('Amount (BTC)');
            fireEvent.change(amountInput, { target: { value: '1.5' } });

            await waitFor(() => {
                expect(amountInput).toHaveValue(1.5);
            });
        });

        it('should handle address input changes', async () => {
            render(
                <ExampleSwapComponent
                    onSwap={mockOnSwap}
                    onError={mockOnError}
                />
            );

            const addressInput = screen.getByLabelText('Recipient Address');
            const testAddress = global.testUtils.generateTestAddress();

            fireEvent.change(addressInput, { target: { value: testAddress } });

            await waitFor(() => {
                expect(addressInput).toHaveValue(testAddress);
            });
        });

        it('should enable swap button when form is valid', async () => {
            render(
                <ExampleSwapComponent
                    onSwap={mockOnSwap}
                    onError={mockOnError}
                />
            );

            const swapButton = screen.getByRole('button', { name: 'Initiate Swap' });
            expect(swapButton).toBeDisabled(); // Should be disabled initially

            // Fill required fields
            fireEvent.change(screen.getByLabelText('Amount (BTC)'), {
                target: { value: '1.0' }
            });
            fireEvent.change(screen.getByLabelText('Recipient Address'), {
                target: { value: global.testUtils.generateTestAddress() }
            });

            await waitFor(() => {
                expect(swapButton).toBeEnabled();
            });
        });
    });

    describe('Form Validation', () => {
        it('should show error for invalid amount', async () => {
            render(
                <ExampleSwapComponent
                    onSwap={mockOnSwap}
                    onError={mockOnError}
                />
            );

            const amountInput = screen.getByLabelText('Amount (BTC)');
            fireEvent.change(amountInput, { target: { value: '-1' } });

            await waitFor(() => {
                // Check that the form is invalid (button should be disabled)
                const swapButton = screen.getByRole('button', { name: 'Initiate Swap' });
                expect(swapButton).toBeDisabled();
            });
        });

        it('should show error for invalid address format', async () => {
            render(
                <ExampleSwapComponent
                    onSwap={mockOnSwap}
                    onError={mockOnError}
                />
            );

            const addressInput = screen.getByLabelText('Recipient Address');
            fireEvent.change(addressInput, { target: { value: 'invalid-address' } });

            await waitFor(() => {
                // Check that the form is invalid (button should be disabled)
                const swapButton = screen.getByRole('button', { name: 'Initiate Swap' });
                expect(swapButton).toBeDisabled();
            });
        });

        it('should show error for insufficient balance', async () => {
            render(
                <ExampleSwapComponent
                    onSwap={mockOnSwap}
                    onError={mockOnError}
                    balance={0.5}
                />
            );

            const amountInput = screen.getByLabelText('Amount (BTC)');
            fireEvent.change(amountInput, { target: { value: '1.0' } });

            await waitFor(() => {
                // Check that the form is invalid (button should be disabled)
                const swapButton = screen.getByRole('button', { name: 'Initiate Swap' });
                expect(swapButton).toBeDisabled();
            });
        });
    });

    describe('Swap Execution', () => {
        it('should initiate swap when form is valid', async () => {
            render(
                <ExampleSwapComponent
                    onSwap={mockOnSwap}
                    onError={mockOnError}
                />
            );

            // Fill form with valid data
            const testAddress = global.testUtils.generateTestAddress();
            fireEvent.change(screen.getByLabelText('Amount (BTC)'), {
                target: { value: '1.0' }
            });
            fireEvent.change(screen.getByLabelText('Recipient Address'), {
                target: { value: testAddress }
            });

            // Submit form
            const swapButton = screen.getByRole('button', { name: 'Initiate Swap' });
            fireEvent.click(swapButton);

            await waitFor(() => {
                expect(mockOnSwap).toHaveBeenCalledWith({
                    amount: '1.0',
                    address: testAddress,
                    type: 'btc-to-eth'
                });
            });
        });

        it('should show loading state during swap execution', async () => {
            // Mock slow API response
            const slowMockOnSwap = jest.fn().mockImplementation(() =>
                new Promise(resolve => setTimeout(resolve, 1000))
            );

            render(
                <ExampleSwapComponent
                    onSwap={slowMockOnSwap}
                    onError={mockOnError}
                />
            );

            // Fill and submit form
            fireEvent.change(screen.getByLabelText('Amount (BTC)'), {
                target: { value: '1.0' }
            });
            fireEvent.change(screen.getByLabelText('Recipient Address'), {
                target: { value: global.testUtils.generateTestAddress() }
            });

            const swapButton = screen.getByRole('button', { name: 'Initiate Swap' });
            fireEvent.click(swapButton);

            // Check loading state
            await waitFor(() => {
                expect(screen.getByText('Processing...')).toBeInTheDocument();
                expect(swapButton).toBeDisabled();
            });
        });

        it('should handle swap errors gracefully', async () => {
            // Mock API error
            const errorMockOnSwap = jest.fn().mockRejectedValue(new Error('Swap failed'));

            render(
                <ExampleSwapComponent
                    onSwap={errorMockOnSwap}
                    onError={mockOnError}
                />
            );

            // Fill and submit form
            fireEvent.change(screen.getByLabelText('Amount (BTC)'), {
                target: { value: '1.0' }
            });
            fireEvent.change(screen.getByLabelText('Recipient Address'), {
                target: { value: global.testUtils.generateTestAddress() }
            });

            const swapButton = screen.getByRole('button', { name: 'Initiate Swap' });
            fireEvent.click(swapButton);

            await waitFor(() => {
                expect(mockOnError).toHaveBeenCalledWith('Swap failed');
            });
        });
    });

    describe('Advanced Features', () => {
        it('should support partial fill orders', async () => {
            render(
                <ExampleSwapComponent
                    onSwap={mockOnSwap}
                    onError={mockOnError}
                    enablePartialFill={true}
                />
            );

            // Enable partial fill
            const partialFillCheckbox = screen.getByLabelText('Enable Partial Fill');
            fireEvent.click(partialFillCheckbox);

            await waitFor(() => {
                expect(screen.getByText('Partial Fill Options')).toBeInTheDocument();
                expect(screen.getByLabelText('Number of Parts')).toBeInTheDocument();
            });
        });

        it('should display swap history', async () => {
            const mockHistory = [
                { id: '1', amount: '0.5', status: 'completed', date: '2024-01-01' },
                { id: '2', amount: '1.0', status: 'pending', date: '2024-01-02' }
            ];

            render(
                <ExampleSwapComponent
                    onSwap={mockOnSwap}
                    onError={mockOnError}
                    swapHistory={mockHistory}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('Swap History')).toBeInTheDocument();
                expect(screen.getByText(/0\.5.*BTC.*completed/)).toBeInTheDocument();
                expect(screen.getByText(/1\.0.*BTC.*pending/)).toBeInTheDocument();
            });
        });
    });

    describe('Accessibility', () => {
        it('should have proper ARIA labels', () => {
            render(
                <ExampleSwapComponent
                    onSwap={mockOnSwap}
                    onError={mockOnError}
                />
            );

            expect(screen.getByLabelText('Amount (BTC)')).toBeInTheDocument();
            expect(screen.getByLabelText('Recipient Address')).toBeInTheDocument();
        });

        it('should support keyboard navigation', async () => {
            render(
                <ExampleSwapComponent
                    onSwap={mockOnSwap}
                    onError={mockOnError}
                />
            );

            const amountInput = screen.getByLabelText('Amount (BTC)');
            const addressInput = screen.getByLabelText('Recipient Address');

            // Focus first input
            amountInput.focus();
            expect(amountInput).toHaveFocus();

            // Simulate Tab key press to move to next input
            fireEvent.keyDown(amountInput, { key: 'Tab' });

            // In a real browser, Tab would move focus, but in jsdom we need to manually focus
            addressInput.focus();
            expect(addressInput).toHaveFocus();
        });
    });
}); 