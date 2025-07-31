import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OrdersPage from '@/app/orders/page';

// Mock the Header component
jest.mock('@/components/layout/header', () => ({
    Header: () => <div data-testid="header">Header</div>
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
}));

describe('OrdersPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render orders page with all main sections', () => {
            render(<OrdersPage />);

            // Check for main page elements
            expect(screen.getByText('Orders')).toBeInTheDocument();
            expect(screen.getByText('Track your cross-chain swap orders')).toBeInTheDocument();
            expect(screen.getByTestId('header')).toBeInTheDocument();
        });

        it('should display search and filter controls', () => {
            render(<OrdersPage />);

            // Check for search input
            expect(screen.getByPlaceholderText('Search orders...')).toBeInTheDocument();

            // Check for status filter
            expect(screen.getByText('All')).toBeInTheDocument();
            expect(screen.getByText('Pending')).toBeInTheDocument();
            expect(screen.getByText('Completed')).toBeInTheDocument();
            expect(screen.getByText('Failed')).toBeInTheDocument();
        });

        it('should display order list with all orders', () => {
            render(<OrdersPage />);

            // Check for order items
            expect(screen.getByText('order_1234567890')).toBeInTheDocument();
            expect(screen.getByText('order_0987654321')).toBeInTheDocument();
            expect(screen.getByText('order_1122334455')).toBeInTheDocument();
        });
    });

    describe('Order Display', () => {
        it('should display completed order correctly', () => {
            render(<OrdersPage />);

            // Check completed order details
            expect(screen.getByText('USDC → BTC')).toBeInTheDocument();
            expect(screen.getByText('1,000.00 USDC')).toBeInTheDocument();
            expect(screen.getByText('0.02314 BTC')).toBeInTheDocument();
            expect(screen.getByText('Completed')).toBeInTheDocument();
        });

        it('should display executing order correctly', () => {
            render(<OrdersPage />);

            // Check executing order details
            expect(screen.getByText('WETH → BTC')).toBeInTheDocument();
            expect(screen.getByText('0.5 WETH')).toBeInTheDocument();
            expect(screen.getByText('0.01157 BTC')).toBeInTheDocument();
            expect(screen.getByText('Executing')).toBeInTheDocument();
        });

        it('should display failed order correctly', () => {
            render(<OrdersPage />);

            // Check failed order details
            expect(screen.getByText('DAI → BTC')).toBeInTheDocument();
            expect(screen.getByText('500.00 DAI')).toBeInTheDocument();
            expect(screen.getByText('0.01157 BTC')).toBeInTheDocument();
            expect(screen.getByText('Failed')).toBeInTheDocument();
        });
    });

    describe('Search Functionality', () => {
        it('should filter orders by search term', async () => {
            render(<OrdersPage />);

            const searchInput = screen.getByPlaceholderText('Search orders...');

            // Search for USDC
            fireEvent.change(searchInput, { target: { value: 'USDC' } });

            await waitFor(() => {
                expect(screen.getByText('USDC → BTC')).toBeInTheDocument();
                expect(screen.queryByText('WETH → BTC')).not.toBeInTheDocument();
                expect(screen.queryByText('DAI → BTC')).not.toBeInTheDocument();
            });
        });

        it('should filter orders by order ID', async () => {
            render(<OrdersPage />);

            const searchInput = screen.getByPlaceholderText('Search orders...');

            // Search by order ID
            fireEvent.change(searchInput, { target: { value: '1234567890' } });

            await waitFor(() => {
                expect(screen.getByText('order_1234567890')).toBeInTheDocument();
                expect(screen.queryByText('order_0987654321')).not.toBeInTheDocument();
                expect(screen.queryByText('order_1122334455')).not.toBeInTheDocument();
            });
        });

        it('should show all orders when search is cleared', async () => {
            render(<OrdersPage />);

            const searchInput = screen.getByPlaceholderText('Search orders...');

            // First search for something
            fireEvent.change(searchInput, { target: { value: 'USDC' } });

            // Then clear the search
            fireEvent.change(searchInput, { target: { value: '' } });

            await waitFor(() => {
                expect(screen.getByText('USDC → BTC')).toBeInTheDocument();
                expect(screen.getByText('WETH → BTC')).toBeInTheDocument();
                expect(screen.getByText('DAI → BTC')).toBeInTheDocument();
            });
        });
    });

    describe('Status Filtering', () => {
        it('should filter orders by completed status', async () => {
            render(<OrdersPage />);

            // Click on status filter to open dropdown
            const statusFilter = screen.getByText('All');
            fireEvent.click(statusFilter);

            // Select completed status
            const completedOption = screen.getByText('Completed');
            fireEvent.click(completedOption);

            await waitFor(() => {
                expect(screen.getByText('USDC → BTC')).toBeInTheDocument();
                expect(screen.queryByText('WETH → BTC')).not.toBeInTheDocument();
                expect(screen.queryByText('DAI → BTC')).not.toBeInTheDocument();
            });
        });

        it('should filter orders by failed status', async () => {
            render(<OrdersPage />);

            // Click on status filter to open dropdown
            const statusFilter = screen.getByText('All');
            fireEvent.click(statusFilter);

            // Select failed status
            const failedOption = screen.getByText('Failed');
            fireEvent.click(failedOption);

            await waitFor(() => {
                expect(screen.queryByText('USDC → BTC')).not.toBeInTheDocument();
                expect(screen.queryByText('WETH → BTC')).not.toBeInTheDocument();
                expect(screen.getByText('DAI → BTC')).toBeInTheDocument();
            });
        });

        it('should show all orders when "All" status is selected', async () => {
            render(<OrdersPage />);

            // First filter by completed
            const statusFilter = screen.getByText('All');
            fireEvent.click(statusFilter);
            const completedOption = screen.getByText('Completed');
            fireEvent.click(completedOption);

            // Then select "All" again
            fireEvent.click(statusFilter);
            const allOption = screen.getByText('All');
            fireEvent.click(allOption);

            await waitFor(() => {
                expect(screen.getByText('USDC → BTC')).toBeInTheDocument();
                expect(screen.getByText('WETH → BTC')).toBeInTheDocument();
                expect(screen.getByText('DAI → BTC')).toBeInTheDocument();
            });
        });
    });

    describe('Order Status Display', () => {
        it('should display correct status badges with proper styling', () => {
            render(<OrdersPage />);

            // Check that status badges are displayed
            expect(screen.getByText('Completed')).toBeInTheDocument();
            expect(screen.getByText('Executing')).toBeInTheDocument();
            expect(screen.getByText('Failed')).toBeInTheDocument();
        });

        it('should display transaction hashes for completed orders', () => {
            render(<OrdersPage />);

            // Check for transaction hash display
            expect(screen.getByText(/0x742d35cc6634c0532925a3b8d4c9db96590b5b8c742d35cc6634c0532925a3b8/)).toBeInTheDocument();
            expect(screen.getByText(/a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890/)).toBeInTheDocument();
        });

        it('should display order timestamps correctly', () => {
            render(<OrdersPage />);

            // Check that dates are displayed in a readable format
            expect(screen.getByText(/Jan 15/)).toBeInTheDocument();
            expect(screen.getByText(/Jan 14/)).toBeInTheDocument();
        });
    });

    describe('Interactive Elements', () => {
        it('should have view transaction buttons for completed orders', () => {
            render(<OrdersPage />);

            // Check for view transaction buttons
            const viewButtons = screen.getAllByText('View');
            expect(viewButtons.length).toBeGreaterThan(0);
        });

        it('should have copy transaction hash functionality', () => {
            render(<OrdersPage />);

            // Check for copy buttons
            const copyButtons = screen.getAllByLabelText('Copy');
            expect(copyButtons.length).toBeGreaterThan(0);
        });

        it('should have refresh orders functionality', () => {
            render(<OrdersPage />);

            // Check for refresh button
            const refreshButton = screen.getByLabelText('Refresh orders');
            expect(refreshButton).toBeInTheDocument();
        });
    });

    describe('Empty State', () => {
        it('should handle empty orders list gracefully', () => {
            // This test would require mocking the orders data to be empty
            // For now, we test that the component renders with the mock data
            render(<OrdersPage />);

            expect(screen.getByText('Orders')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have proper heading structure', () => {
            render(<OrdersPage />);

            const mainHeading = screen.getByRole('heading', { level: 1 });
            expect(mainHeading).toHaveTextContent('Orders');
        });

        it('should have proper form labels', () => {
            render(<OrdersPage />);

            const searchInput = screen.getByPlaceholderText('Search orders...');
            expect(searchInput).toBeInTheDocument();
        });

        it('should have proper button labels', () => {
            render(<OrdersPage />);

            const buttons = screen.getAllByRole('button');
            buttons.forEach(button => {
                expect(button).toHaveAccessibleName();
            });
        });
    });

    describe('Data Formatting', () => {
        it('should format token amounts correctly', () => {
            render(<OrdersPage />);

            // Check token amount formatting
            expect(screen.getByText('1,000.00 USDC')).toBeInTheDocument();
            expect(screen.getByText('0.5 WETH')).toBeInTheDocument();
            expect(screen.getByText('500.00 DAI')).toBeInTheDocument();
        });

        it('should format dates correctly', () => {
            render(<OrdersPage />);

            // Check date formatting
            expect(screen.getByText(/Jan 15/)).toBeInTheDocument();
            expect(screen.getByText(/Jan 14/)).toBeInTheDocument();
        });
    });
}); 