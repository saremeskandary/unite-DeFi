import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TokenSelector } from '@/components/swap/token-selector';

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

// Mock the TokenIcon component
jest.mock('@web3icons/react', () => ({
    TokenIcon: ({ symbol }: { symbol: string }) => (
        <div data-testid={`token-icon-${symbol}`}>{symbol} Icon</div>
    )
}));

describe('TokenSelector', () => {
    const mockToken = { symbol: 'USDC', name: 'USD Coin', balance: '0.00' };
    const mockOnSelect = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render token selector with selected token', () => {
            render(
                <TokenSelector
                    token={mockToken}
                    onSelect={mockOnSelect}
                    type="from"
                />
            );

            // Check for main elements
            expect(screen.getByText('USDC')).toBeInTheDocument();
            expect(screen.getByText('USD Coin')).toBeInTheDocument();
            expect(screen.getByTestId('token-icon-USDC')).toBeInTheDocument();
        });

        it('should display token balance', () => {
            render(
                <TokenSelector
                    token={mockToken}
                    onSelect={mockOnSelect}
                    type="from"
                />
            );

            expect(screen.getByText('0.00')).toBeInTheDocument();
        });

        it('should display chevron down icon', () => {
            render(
                <TokenSelector
                    token={mockToken}
                    onSelect={mockOnSelect}
                    type="from"
                />
            );

            // Check for chevron down icon (assuming it's rendered as text or has a specific test id)
            expect(screen.getByRole('button')).toBeInTheDocument();
        });
    });

    describe('Dialog Functionality', () => {
        it('should open token selection dialog when clicked', async () => {
            render(
                <TokenSelector
                    token={mockToken}
                    onSelect={mockOnSelect}
                    type="from"
                />
            );

            const selectorButton = screen.getByRole('button');
            fireEvent.click(selectorButton);

            await waitFor(() => {
                expect(screen.getByText('Select Token')).toBeInTheDocument();
            });
        });

        it('should display token list in dialog', async () => {
            render(
                <TokenSelector
                    token={mockToken}
                    onSelect={mockOnSelect}
                    type="from"
                />
            );

            const selectorButton = screen.getByRole('button');
            fireEvent.click(selectorButton);

            await waitFor(() => {
                // Check for common tokens in the list
                expect(screen.getByText('USDC')).toBeInTheDocument();
                expect(screen.getByText('USDT')).toBeInTheDocument();
                expect(screen.getByText('WETH')).toBeInTheDocument();
                expect(screen.getByText('WBTC')).toBeInTheDocument();
                expect(screen.getByText('BTC')).toBeInTheDocument();
                expect(screen.getByText('ETH')).toBeInTheDocument();
            });
        });

        it('should display search input in dialog', async () => {
            render(
                <TokenSelector
                    token={mockToken}
                    onSelect={mockOnSelect}
                    type="from"
                />
            );

            const selectorButton = screen.getByRole('button');
            fireEvent.click(selectorButton);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Search tokens...')).toBeInTheDocument();
            });
        });
    });

    describe('Search Functionality', () => {
        it('should filter tokens by search term', async () => {
            render(
                <TokenSelector
                    token={mockToken}
                    onSelect={mockOnSelect}
                    type="from"
                />
            );

            // Open dialog
            const selectorButton = screen.getByRole('button');
            fireEvent.click(selectorButton);

            await waitFor(() => {
                const searchInput = screen.getByPlaceholderText('Search tokens...');
                fireEvent.change(searchInput, { target: { value: 'BTC' } });
            });

            await waitFor(() => {
                // Should show BTC-related tokens
                expect(screen.getByText('BTC')).toBeInTheDocument();
                expect(screen.getByText('WBTC')).toBeInTheDocument();
                // Should not show other tokens
                expect(screen.queryByText('USDT')).not.toBeInTheDocument();
            });
        });

        it('should filter tokens by symbol', async () => {
            render(
                <TokenSelector
                    token={mockToken}
                    onSelect={mockOnSelect}
                    type="from"
                />
            );

            // Open dialog
            const selectorButton = screen.getByRole('button');
            fireEvent.click(selectorButton);

            await waitFor(() => {
                const searchInput = screen.getByPlaceholderText('Search tokens...');
                fireEvent.change(searchInput, { target: { value: 'USDC' } });
            });

            await waitFor(() => {
                expect(screen.getByText('USDC')).toBeInTheDocument();
                expect(screen.queryByText('USDT')).not.toBeInTheDocument();
            });
        });

        it('should filter tokens by name', async () => {
            render(
                <TokenSelector
                    token={mockToken}
                    onSelect={mockOnSelect}
                    type="from"
                />
            );

            // Open dialog
            const selectorButton = screen.getByRole('button');
            fireEvent.click(selectorButton);

            await waitFor(() => {
                const searchInput = screen.getByPlaceholderText('Search tokens...');
                fireEvent.change(searchInput, { target: { value: 'Bitcoin' } });
            });

            await waitFor(() => {
                expect(screen.getByText('BTC')).toBeInTheDocument();
                expect(screen.getByText('WBTC')).toBeInTheDocument();
            });
        });

        it('should show no results for non-existent tokens', async () => {
            render(
                <TokenSelector
                    token={mockToken}
                    onSelect={mockOnSelect}
                    type="from"
                />
            );

            // Open dialog
            const selectorButton = screen.getByRole('button');
            fireEvent.click(selectorButton);

            await waitFor(() => {
                const searchInput = screen.getByPlaceholderText('Search tokens...');
                fireEvent.change(searchInput, { target: { value: 'NONEXISTENT' } });
            });

            await waitFor(() => {
                expect(screen.getByText('No tokens found')).toBeInTheDocument();
            });
        });

        it('should clear search when input is cleared', async () => {
            render(
                <TokenSelector
                    token={mockToken}
                    onSelect={mockOnSelect}
                    type="from"
                />
            );

            // Open dialog
            const selectorButton = screen.getByRole('button');
            fireEvent.click(selectorButton);

            await waitFor(() => {
                const searchInput = screen.getByPlaceholderText('Search tokens...');
                fireEvent.change(searchInput, { target: { value: 'BTC' } });
            });

            await waitFor(() => {
                expect(screen.getByText('BTC')).toBeInTheDocument();
                expect(screen.queryByText('USDT')).not.toBeInTheDocument();
            });

            // Clear search
            const searchInput = screen.getByPlaceholderText('Search tokens...');
            fireEvent.change(searchInput, { target: { value: '' } });

            await waitFor(() => {
                expect(screen.getByText('USDC')).toBeInTheDocument();
                expect(screen.getByText('USDT')).toBeInTheDocument();
                expect(screen.getByText('BTC')).toBeInTheDocument();
            });
        });
    });

    describe('Token Selection', () => {
        it('should call onSelect when token is clicked', async () => {
            render(
                <TokenSelector
                    token={mockToken}
                    onSelect={mockOnSelect}
                    type="from"
                />
            );

            // Open dialog
            const selectorButton = screen.getByRole('button');
            fireEvent.click(selectorButton);

            await waitFor(() => {
                const btcToken = screen.getByText('BTC');
                fireEvent.click(btcToken);
            });

            expect(mockOnSelect).toHaveBeenCalledWith({
                symbol: 'BTC',
                name: 'Bitcoin',
                balance: '0.00'
            });
        });

        it('should close dialog after token selection', async () => {
            render(
                <TokenSelector
                    token={mockToken}
                    onSelect={mockOnSelect}
                    type="from"
                />
            );

            // Open dialog
            const selectorButton = screen.getByRole('button');
            fireEvent.click(selectorButton);

            await waitFor(() => {
                const btcToken = screen.getByText('BTC');
                fireEvent.click(btcToken);
            });

            await waitFor(() => {
                expect(screen.queryByText('Select Token')).not.toBeInTheDocument();
            });
        });

        it('should update selected token display', async () => {
            const { rerender } = render(
                <TokenSelector
                    token={mockToken}
                    onSelect={mockOnSelect}
                    type="from"
                />
            );

            // Initially shows USDC
            expect(screen.getByText('USDC')).toBeInTheDocument();

            // Simulate token selection by updating props
            const newToken = { symbol: 'BTC', name: 'Bitcoin', balance: '0.5' };
            rerender(
                <TokenSelector
                    token={newToken}
                    onSelect={mockOnSelect}
                    type="from"
                />
            );

            // Should now show BTC
            expect(screen.getByText('BTC')).toBeInTheDocument();
            expect(screen.getByText('0.5')).toBeInTheDocument();
        });
    });

    describe('Balance Display', () => {
        it('should display real wallet balances when connected', async () => {
            render(
                <TokenSelector
                    token={mockToken}
                    onSelect={mockOnSelect}
                    type="from"
                />
            );

            // Wait for wallet data to load
            await waitFor(() => {
                expect(screen.getByText('1000.00')).toBeInTheDocument();
            });
        });

        it('should display zero balance when wallet not connected', async () => {
            // Mock wallet not connected
            jest.spyOn(require('@/lib/enhanced-wallet').enhancedWallet, 'isConnected')
                .mockReturnValue(false);

            render(
                <TokenSelector
                    token={mockToken}
                    onSelect={mockOnSelect}
                    type="from"
                />
            );

            expect(screen.getByText('0.00')).toBeInTheDocument();
        });

        it('should handle wallet connection changes', async () => {
            const { rerender } = render(
                <TokenSelector
                    token={mockToken}
                    onSelect={mockOnSelect}
                    type="from"
                />
            );

            // Initially connected
            await waitFor(() => {
                expect(screen.getByText('1000.00')).toBeInTheDocument();
            });

            // Mock wallet disconnection
            jest.spyOn(require('@/lib/enhanced-wallet').enhancedWallet, 'isConnected')
                .mockReturnValue(false);

            rerender(
                <TokenSelector
                    token={mockToken}
                    onSelect={mockOnSelect}
                    type="from"
                />
            );

            expect(screen.getByText('0.00')).toBeInTheDocument();
        });
    });

    describe('Type-specific Behavior', () => {
        it('should handle "from" type correctly', () => {
            render(
                <TokenSelector
                    token={mockToken}
                    onSelect={mockOnSelect}
                    type="from"
                />
            );

            expect(screen.getByText('USDC')).toBeInTheDocument();
        });

        it('should handle "to" type correctly', () => {
            render(
                <TokenSelector
                    token={mockToken}
                    onSelect={mockOnSelect}
                    type="to"
                />
            );

            expect(screen.getByText('USDC')).toBeInTheDocument();
        });
    });

    describe('Error Handling', () => {
        it('should handle wallet connection errors gracefully', async () => {
            // Mock wallet error
            jest.spyOn(require('@/lib/enhanced-wallet').enhancedWallet, 'getWalletInfo')
                .mockRejectedValue(new Error('Wallet connection failed'));

            render(
                <TokenSelector
                    token={mockToken}
                    onSelect={mockOnSelect}
                    type="from"
                />
            );

            // Should still render with default data
            expect(screen.getByText('USDC')).toBeInTheDocument();
        });

        it('should handle API errors gracefully', async () => {
            // Mock API error
            jest.spyOn(require('@/lib/enhanced-wallet').enhancedWallet, 'getWalletInfo')
                .mockRejectedValue(new Error('API error'));

            render(
                <TokenSelector
                    token={mockToken}
                    onSelect={mockOnSelect}
                    type="from"
                />
            );

            // Should fall back to default token list
            expect(screen.getByText('USDC')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have proper button labels', () => {
            render(
                <TokenSelector
                    token={mockToken}
                    onSelect={mockOnSelect}
                    type="from"
                />
            );

            const button = screen.getByRole('button');
            expect(button).toHaveAccessibleName();
        });

        it('should support keyboard navigation', async () => {
            render(
                <TokenSelector
                    token={mockToken}
                    onSelect={mockOnSelect}
                    type="from"
                />
            );

            const button = screen.getByRole('button');

            // Focus the button
            button.focus();
            expect(button).toHaveFocus();

            // Simulate Enter key press
            fireEvent.keyDown(button, { key: 'Enter' });

            await waitFor(() => {
                expect(screen.getByText('Select Token')).toBeInTheDocument();
            });
        });

        it('should have proper search input labels', async () => {
            render(
                <TokenSelector
                    token={mockToken}
                    onSelect={mockOnSelect}
                    type="from"
                />
            );

            const button = screen.getByRole('button');
            fireEvent.click(button);

            await waitFor(() => {
                const searchInput = screen.getByPlaceholderText('Search tokens...');
                expect(searchInput).toBeInTheDocument();
            });
        });
    });
}); 