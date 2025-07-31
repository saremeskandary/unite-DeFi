import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OrderStatusPanel } from '@/components/orders/order-status-panel';

// Mock the useRealTimeOrderStatus hook
jest.mock('@/hooks/useOrderStatus', () => ({
    useRealTimeOrderStatus: jest.fn()
}));

// Mock clipboard API
Object.assign(navigator, {
    clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
    },
});

describe('OrderStatusPanel', () => {
    const mockUseRealTimeOrderStatus = require('@/hooks/useOrderStatus').useRealTimeOrderStatus;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render order status panel with order ID', () => {
            const mockOrder = {
                id: 'order_1234567890',
                status: 'pending',
                fromToken: 'USDC',
                toToken: 'BTC',
                fromAmount: '1000.00',
                toAmount: '0.02314',
                createdAt: '2024-01-15T10:30:00Z',
                estimatedCompletion: '2024-01-15T10:45:00Z'
            };

            mockUseRealTimeOrderStatus.mockReturnValue({
                orderStatus: mockOrder,
                isLoading: false,
                error: null,
                isMonitoring: true,
                startMonitoring: jest.fn(),
                stopMonitoring: jest.fn(),
                refreshStatus: jest.fn()
            });

            render(<OrderStatusPanel orderId="order_1234567890" />);

            expect(screen.getByText('Order Status')).toBeInTheDocument();
            expect(screen.getByText('order_1234567890')).toBeInTheDocument();
        });

        it('should display order details correctly', () => {
            const mockOrder = {
                id: 'order_1234567890',
                status: 'pending',
                fromToken: 'USDC',
                toToken: 'BTC',
                fromAmount: '1000.00',
                toAmount: '0.02314',
                createdAt: '2024-01-15T10:30:00Z',
                estimatedCompletion: '2024-01-15T10:45:00Z'
            };

            mockUseRealTimeOrderStatus.mockReturnValue({
                orderStatus: mockOrder,
                isLoading: false,
                error: null,
                isMonitoring: true,
                startMonitoring: jest.fn(),
                stopMonitoring: jest.fn(),
                refreshStatus: jest.fn()
            });

            render(<OrderStatusPanel orderId="order_1234567890" />);

            expect(screen.getByText('USDC → BTC')).toBeInTheDocument();
            expect(screen.getByText('1,000.00 USDC')).toBeInTheDocument();
            expect(screen.getByText('0.02314 BTC')).toBeInTheDocument();
        });

        it('should show empty state when no order ID is provided', () => {
            mockUseRealTimeOrderStatus.mockReturnValue({
                orderStatus: null,
                isLoading: false,
                error: null,
                isMonitoring: false,
                startMonitoring: jest.fn(),
                stopMonitoring: jest.fn(),
                refreshStatus: jest.fn()
            });

            render(<OrderStatusPanel orderId={null} />);

            expect(screen.getByText('No Order Selected')).toBeInTheDocument();
            expect(screen.getByText('Select an order to view its status')).toBeInTheDocument();
        });
    });

    describe('Status Display', () => {
        it('should display pending status correctly', () => {
            const mockOrder = {
                id: 'order_1234567890',
                status: 'pending',
                fromToken: 'USDC',
                toToken: 'BTC',
                fromAmount: '1000.00',
                toAmount: '0.02314',
                createdAt: '2024-01-15T10:30:00Z',
                estimatedCompletion: '2024-01-15T10:45:00Z'
            };

            mockUseRealTimeOrderStatus.mockReturnValue({
                orderStatus: mockOrder,
                isLoading: false,
                error: null,
                isMonitoring: true,
                startMonitoring: jest.fn(),
                stopMonitoring: jest.fn(),
                refreshStatus: jest.fn()
            });

            render(<OrderStatusPanel orderId="order_1234567890" />);

            expect(screen.getByText('Pending')).toBeInTheDocument();
        });

        it('should display funding status correctly', () => {
            const mockOrder = {
                id: 'order_1234567890',
                status: 'funding',
                fromToken: 'USDC',
                toToken: 'BTC',
                fromAmount: '1000.00',
                toAmount: '0.02314',
                createdAt: '2024-01-15T10:30:00Z',
                estimatedCompletion: '2024-01-15T10:45:00Z'
            };

            mockUseRealTimeOrderStatus.mockReturnValue({
                orderStatus: mockOrder,
                isLoading: false,
                error: null,
                isMonitoring: true,
                startMonitoring: jest.fn(),
                stopMonitoring: jest.fn(),
                refreshStatus: jest.fn()
            });

            render(<OrderStatusPanel orderId="order_1234567890" />);

            expect(screen.getByText('Funding')).toBeInTheDocument();
        });

        it('should display executing status correctly', () => {
            const mockOrder = {
                id: 'order_1234567890',
                status: 'executing',
                fromToken: 'USDC',
                toToken: 'BTC',
                fromAmount: '1000.00',
                toAmount: '0.02314',
                createdAt: '2024-01-15T10:30:00Z',
                estimatedCompletion: '2024-01-15T10:45:00Z'
            };

            mockUseRealTimeOrderStatus.mockReturnValue({
                orderStatus: mockOrder,
                isLoading: false,
                error: null,
                isMonitoring: true,
                startMonitoring: jest.fn(),
                stopMonitoring: jest.fn(),
                refreshStatus: jest.fn()
            });

            render(<OrderStatusPanel orderId="order_1234567890" />);

            expect(screen.getByText('Executing')).toBeInTheDocument();
        });

        it('should display completed status correctly', () => {
            const mockOrder = {
                id: 'order_1234567890',
                status: 'completed',
                fromToken: 'USDC',
                toToken: 'BTC',
                fromAmount: '1000.00',
                toAmount: '0.02314',
                createdAt: '2024-01-15T10:30:00Z',
                completedAt: '2024-01-15T10:45:00Z'
            };

            mockUseRealTimeOrderStatus.mockReturnValue({
                orderStatus: mockOrder,
                isLoading: false,
                error: null,
                isMonitoring: false,
                startMonitoring: jest.fn(),
                stopMonitoring: jest.fn(),
                refreshStatus: jest.fn()
            });

            render(<OrderStatusPanel orderId="order_1234567890" />);

            expect(screen.getByText('Completed')).toBeInTheDocument();
        });

        it('should display failed status correctly', () => {
            const mockOrder = {
                id: 'order_1234567890',
                status: 'failed',
                fromToken: 'USDC',
                toToken: 'BTC',
                fromAmount: '1000.00',
                toAmount: '0.02314',
                createdAt: '2024-01-15T10:30:00Z',
                error: 'Transaction failed'
            };

            mockUseRealTimeOrderStatus.mockReturnValue({
                orderStatus: mockOrder,
                isLoading: false,
                error: null,
                isMonitoring: false,
                startMonitoring: jest.fn(),
                stopMonitoring: jest.fn(),
                refreshStatus: jest.fn()
            });

            render(<OrderStatusPanel orderId="order_1234567890" />);

            expect(screen.getByText('Failed')).toBeInTheDocument();
        });
    });

    describe('Progress Tracking', () => {
        it('should display progress bar for active orders', () => {
            const mockOrder = {
                id: 'order_1234567890',
                status: 'executing',
                fromToken: 'USDC',
                toToken: 'BTC',
                fromAmount: '1000.00',
                toAmount: '0.02314',
                createdAt: '2024-01-15T10:30:00Z',
                estimatedCompletion: '2024-01-15T10:45:00Z',
                progress: 65
            };

            mockUseRealTimeOrderStatus.mockReturnValue({
                orderStatus: mockOrder,
                isLoading: false,
                error: null,
                isMonitoring: true,
                startMonitoring: jest.fn(),
                stopMonitoring: jest.fn(),
                refreshStatus: jest.fn()
            });

            render(<OrderStatusPanel orderId="order_1234567890" />);

            expect(screen.getByText('65%')).toBeInTheDocument();
        });

        it('should display time remaining for active orders', () => {
            const mockOrder = {
                id: 'order_1234567890',
                status: 'executing',
                fromToken: 'USDC',
                toToken: 'BTC',
                fromAmount: '1000.00',
                toAmount: '0.02314',
                createdAt: '2024-01-15T10:30:00Z',
                estimatedCompletion: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes from now
            };

            mockUseRealTimeOrderStatus.mockReturnValue({
                orderStatus: mockOrder,
                isLoading: false,
                error: null,
                isMonitoring: true,
                startMonitoring: jest.fn(),
                stopMonitoring: jest.fn(),
                refreshStatus: jest.fn()
            });

            render(<OrderStatusPanel orderId="order_1234567890" />);

            // Should display time remaining
            expect(screen.getByText(/Time Remaining/)).toBeInTheDocument();
        });
    });

    describe('Transaction Details', () => {
        it('should display transaction hashes for completed orders', () => {
            const mockOrder = {
                id: 'order_1234567890',
                status: 'completed',
                fromToken: 'USDC',
                toToken: 'BTC',
                fromAmount: '1000.00',
                toAmount: '0.02314',
                createdAt: '2024-01-15T10:30:00Z',
                completedAt: '2024-01-15T10:45:00Z',
                txHashes: {
                    ethereum: '0x742d35cc6634c0532925a3b8d4c9db96590b5b8c742d35cc6634c0532925a3b8',
                    bitcoin: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890'
                }
            };

            mockUseRealTimeOrderStatus.mockReturnValue({
                orderStatus: mockOrder,
                isLoading: false,
                error: null,
                isMonitoring: false,
                startMonitoring: jest.fn(),
                stopMonitoring: jest.fn(),
                refreshStatus: jest.fn()
            });

            render(<OrderStatusPanel orderId="order_1234567890" />);

            expect(screen.getByText('Ethereum Transaction')).toBeInTheDocument();
            expect(screen.getByText('Bitcoin Transaction')).toBeInTheDocument();
            expect(screen.getByText(/0x742d35cc6634c0532925a3b8d4c9db96590b5b8c742d35cc6634c0532925a3b8/)).toBeInTheDocument();
            expect(screen.getByText(/a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890/)).toBeInTheDocument();
        });

        it('should handle copy transaction hash functionality', async () => {
            const mockOrder = {
                id: 'order_1234567890',
                status: 'completed',
                fromToken: 'USDC',
                toToken: 'BTC',
                fromAmount: '1000.00',
                toAmount: '0.02314',
                createdAt: '2024-01-15T10:30:00Z',
                completedAt: '2024-01-15T10:45:00Z',
                txHashes: {
                    ethereum: '0x742d35cc6634c0532925a3b8d4c9db96590b5b8c742d35cc6634c0532925a3b8'
                }
            };

            mockUseRealTimeOrderStatus.mockReturnValue({
                orderStatus: mockOrder,
                isLoading: false,
                error: null,
                isMonitoring: false,
                startMonitoring: jest.fn(),
                stopMonitoring: jest.fn(),
                refreshStatus: jest.fn()
            });

            render(<OrderStatusPanel orderId="order_1234567890" />);

            const copyButton = screen.getByLabelText('Copy');
            fireEvent.click(copyButton);

            await waitFor(() => {
                expect(navigator.clipboard.writeText).toHaveBeenCalledWith('0x742d35cc6634c0532925a3b8d4c9db96590b5b8c742d35cc6634c0532925a3b8');
            });
        });

        it('should handle view transaction functionality', () => {
            const mockOrder = {
                id: 'order_1234567890',
                status: 'completed',
                fromToken: 'USDC',
                toToken: 'BTC',
                fromAmount: '1000.00',
                toAmount: '0.02314',
                createdAt: '2024-01-15T10:30:00Z',
                completedAt: '2024-01-15T10:45:00Z',
                txHashes: {
                    ethereum: '0x742d35cc6634c0532925a3b8d4c9db96590b5b8c742d35cc6634c0532925a3b8'
                }
            };

            mockUseRealTimeOrderStatus.mockReturnValue({
                orderStatus: mockOrder,
                isLoading: false,
                error: null,
                isMonitoring: false,
                startMonitoring: jest.fn(),
                stopMonitoring: jest.fn(),
                refreshStatus: jest.fn()
            });

            render(<OrderStatusPanel orderId="order_1234567890" />);

            const viewButton = screen.getByText('View');
            expect(viewButton).toBeInTheDocument();
        });
    });

    describe('Real-time Monitoring', () => {
        it('should start monitoring when order ID is provided', () => {
            const mockStartMonitoring = jest.fn();
            const mockStopMonitoring = jest.fn();

            mockUseRealTimeOrderStatus.mockReturnValue({
                orderStatus: null,
                isLoading: false,
                error: null,
                isMonitoring: false,
                startMonitoring: mockStartMonitoring,
                stopMonitoring: mockStopMonitoring,
                refreshStatus: jest.fn()
            });

            render(<OrderStatusPanel orderId="order_1234567890" />);

            expect(mockStartMonitoring).toHaveBeenCalled();
        });

        it('should stop monitoring when order ID is null', () => {
            const mockStartMonitoring = jest.fn();
            const mockStopMonitoring = jest.fn();

            mockUseRealTimeOrderStatus.mockReturnValue({
                orderStatus: null,
                isLoading: false,
                error: null,
                isMonitoring: false,
                startMonitoring: mockStartMonitoring,
                stopMonitoring: mockStopMonitoring,
                refreshStatus: jest.fn()
            });

            render(<OrderStatusPanel orderId={null} />);

            expect(mockStopMonitoring).toHaveBeenCalled();
        });

        it('should handle refresh status functionality', async () => {
            const mockRefreshStatus = jest.fn();
            const mockOrder = {
                id: 'order_1234567890',
                status: 'pending',
                fromToken: 'USDC',
                toToken: 'BTC',
                fromAmount: '1000.00',
                toAmount: '0.02314',
                createdAt: '2024-01-15T10:30:00Z',
                estimatedCompletion: '2024-01-15T10:45:00Z'
            };

            mockUseRealTimeOrderStatus.mockReturnValue({
                orderStatus: mockOrder,
                isLoading: false,
                error: null,
                isMonitoring: true,
                startMonitoring: jest.fn(),
                stopMonitoring: jest.fn(),
                refreshStatus: mockRefreshStatus
            });

            render(<OrderStatusPanel orderId="order_1234567890" />);

            const refreshButton = screen.getByLabelText('Refresh status');
            fireEvent.click(refreshButton);

            expect(mockRefreshStatus).toHaveBeenCalled();
        });
    });

    describe('Loading States', () => {
        it('should display loading state when fetching order data', () => {
            mockUseRealTimeOrderStatus.mockReturnValue({
                orderStatus: null,
                isLoading: true,
                error: null,
                isMonitoring: false,
                startMonitoring: jest.fn(),
                stopMonitoring: jest.fn(),
                refreshStatus: jest.fn()
            });

            render(<OrderStatusPanel orderId="order_1234567890" />);

            expect(screen.getByText('Loading...')).toBeInTheDocument();
        });

        it('should display error state when order fetch fails', () => {
            mockUseRealTimeOrderStatus.mockReturnValue({
                orderStatus: null,
                isLoading: false,
                error: 'Failed to fetch order',
                isMonitoring: false,
                startMonitoring: jest.fn(),
                stopMonitoring: jest.fn(),
                refreshStatus: jest.fn()
            });

            render(<OrderStatusPanel orderId="order_1234567890" />);

            expect(screen.getByText('Error loading order')).toBeInTheDocument();
            expect(screen.getByText('Failed to fetch order')).toBeInTheDocument();
        });
    });

    describe('Error Handling', () => {
        it('should display error message for failed orders', () => {
            const mockOrder = {
                id: 'order_1234567890',
                status: 'failed',
                fromToken: 'USDC',
                toToken: 'BTC',
                fromAmount: '1000.00',
                toAmount: '0.02314',
                createdAt: '2024-01-15T10:30:00Z',
                error: 'Insufficient balance'
            };

            mockUseRealTimeOrderStatus.mockReturnValue({
                orderStatus: mockOrder,
                isLoading: false,
                error: null,
                isMonitoring: false,
                startMonitoring: jest.fn(),
                stopMonitoring: jest.fn(),
                refreshStatus: jest.fn()
            });

            render(<OrderStatusPanel orderId="order_1234567890" />);

            expect(screen.getByText('Error: Insufficient balance')).toBeInTheDocument();
        });

        it('should handle network errors gracefully', () => {
            mockUseRealTimeOrderStatus.mockReturnValue({
                orderStatus: null,
                isLoading: false,
                error: 'Network error',
                isMonitoring: false,
                startMonitoring: jest.fn(),
                stopMonitoring: jest.fn(),
                refreshStatus: jest.fn()
            });

            render(<OrderStatusPanel orderId="order_1234567890" />);

            expect(screen.getByText('Network error')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have proper heading structure', () => {
            const mockOrder = {
                id: 'order_1234567890',
                status: 'pending',
                fromToken: 'USDC',
                toToken: 'BTC',
                fromAmount: '1000.00',
                toAmount: '0.02314',
                createdAt: '2024-01-15T10:30:00Z',
                estimatedCompletion: '2024-01-15T10:45:00Z'
            };

            mockUseRealTimeOrderStatus.mockReturnValue({
                orderStatus: mockOrder,
                isLoading: false,
                error: null,
                isMonitoring: true,
                startMonitoring: jest.fn(),
                stopMonitoring: jest.fn(),
                refreshStatus: jest.fn()
            });

            render(<OrderStatusPanel orderId="order_1234567890" />);

            const heading = screen.getByRole('heading', { level: 2 });
            expect(heading).toHaveTextContent('Order Status');
        });

        it('should have proper button labels', () => {
            const mockOrder = {
                id: 'order_1234567890',
                status: 'completed',
                fromToken: 'USDC',
                toToken: 'BTC',
                fromAmount: '1000.00',
                toAmount: '0.02314',
                createdAt: '2024-01-15T10:30:00Z',
                completedAt: '2024-01-15T10:45:00Z',
                txHashes: {
                    ethereum: '0x742d35cc6634c0532925a3b8d4c9db96590b5b8c742d35cc6634c0532925a3b8'
                }
            };

            mockUseRealTimeOrderStatus.mockReturnValue({
                orderStatus: mockOrder,
                isLoading: false,
                error: null,
                isMonitoring: false,
                startMonitoring: jest.fn(),
                stopMonitoring: jest.fn(),
                refreshStatus: jest.fn()
            });

            render(<OrderStatusPanel orderId="order_1234567890" />);

            const buttons = screen.getAllByRole('button');
            buttons.forEach(button => {
                expect(button).toHaveAccessibleName();
            });
        });
    });
}); 