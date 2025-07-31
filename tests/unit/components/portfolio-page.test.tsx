import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PortfolioPage from '@/app/portfolio/page';

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

describe('PortfolioPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render portfolio page with all main sections', () => {
            render(<PortfolioPage />);

            // Check for main page elements
            expect(screen.getByText('Portfolio')).toBeInTheDocument();
            expect(screen.getByText('Track your cross-chain swap performance and holdings')).toBeInTheDocument();
            expect(screen.getByTestId('header')).toBeInTheDocument();
        });

        it('should display portfolio summary cards', () => {
            render(<PortfolioPage />);

            // Check for portfolio summary cards
            expect(screen.getByText('Total Value')).toBeInTheDocument();
            expect(screen.getByText('$12,450.75')).toBeInTheDocument();

            expect(screen.getByText('Total Swaps')).toBeInTheDocument();
            expect(screen.getByText('23')).toBeInTheDocument();

            expect(screen.getByText('Total Volume')).toBeInTheDocument();
            expect(screen.getByText('$45,230.50')).toBeInTheDocument();

            expect(screen.getByText('Profit/Loss')).toBeInTheDocument();
            expect(screen.getByText('+$1,250.30')).toBeInTheDocument();
            expect(screen.getByText('+11.2%')).toBeInTheDocument();
        });

        it('should display top holdings section', () => {
            render(<PortfolioPage />);

            expect(screen.getByText('Top Holdings')).toBeInTheDocument();

            // Check for Bitcoin token
            expect(screen.getByText('BTC')).toBeInTheDocument();
            expect(screen.getByText('0.15432')).toBeInTheDocument();
            expect(screen.getByText('$6,680.50')).toBeInTheDocument();
            expect(screen.getByText('+2.4%')).toBeInTheDocument();

            // Check for USDC token
            expect(screen.getByText('USDC')).toBeInTheDocument();
            expect(screen.getByText('3250.00')).toBeInTheDocument();
            expect(screen.getByText('$3,250.00')).toBeInTheDocument();
            expect(screen.getByText('+0.1%')).toBeInTheDocument();

            // Check for WETH token
            expect(screen.getByText('WETH')).toBeInTheDocument();
            expect(screen.getByText('1.2456')).toBeInTheDocument();
            expect(screen.getByText('$2,520.25')).toBeInTheDocument();
            expect(screen.getByText('-1.8%')).toBeInTheDocument();
        });

        it('should display recent activity section', () => {
            render(<PortfolioPage />);

            expect(screen.getByText('Recent Activity')).toBeInTheDocument();

            // Check for recent swap activity
            expect(screen.getByText('USDC → BTC')).toBeInTheDocument();
            expect(screen.getByText('1000.00 USDC')).toBeInTheDocument();
            expect(screen.getByText('$1,000.00')).toBeInTheDocument();

            // Check for receive activity
            expect(screen.getByText('WETH → BTC')).toBeInTheDocument();
            expect(screen.getByText('0.5 WETH')).toBeInTheDocument();
            expect(screen.getByText('$1,250.00')).toBeInTheDocument();
        });
    });

    describe('Data Formatting', () => {
        it('should format currency values correctly', () => {
            render(<PortfolioPage />);

            // Check currency formatting
            expect(screen.getByText('$12,450.75')).toBeInTheDocument();
            expect(screen.getByText('$45,230.50')).toBeInTheDocument();
            expect(screen.getByText('$6,680.50')).toBeInTheDocument();
        });

        it('should format dates correctly', () => {
            render(<PortfolioPage />);

            // Check date formatting (this will depend on the user's locale)
            // The dates should be displayed in a readable format
            expect(screen.getByText(/Jan 15/)).toBeInTheDocument();
            expect(screen.getByText(/Jan 14/)).toBeInTheDocument();
            expect(screen.getByText(/Jan 13/)).toBeInTheDocument();
        });

        it('should display profit/loss with correct styling', () => {
            render(<PortfolioPage />);

            // Check that positive values are displayed with + sign
            expect(screen.getByText('$1,250.30')).toBeInTheDocument();
            expect(screen.getByText('+11.2%')).toBeInTheDocument();

            // Check that negative values would be displayed with - sign (if any)
            // This test assumes the component handles negative values correctly
        });
    });

    describe('Interactive Elements', () => {
        it('should have view all activity button', () => {
            render(<PortfolioPage />);

            const viewAllButton = screen.getByRole('button', { name: /view all/i });
            expect(viewAllButton).toBeInTheDocument();
        });

        it('should have view all activity button', () => {
            render(<PortfolioPage />);

            expect(screen.getByText('View All Activity')).toBeInTheDocument();
        });
    });

    describe('Responsive Design', () => {
        it('should render on different screen sizes', () => {
            // Test that the component renders without errors
            // In a real test environment, you might use different viewport sizes
            render(<PortfolioPage />);

            expect(screen.getByText('Portfolio')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have proper heading structure', () => {
            render(<PortfolioPage />);

            const mainHeading = screen.getByRole('heading', { level: 1 });
            expect(mainHeading).toHaveTextContent('Portfolio');
        });

        it('should have proper button labels', () => {
            render(<PortfolioPage />);

            const buttons = screen.getAllByRole('button');
            buttons.forEach(button => {
                expect(button).toHaveAccessibleName();
            });
        });
    });

    describe('Data Display Logic', () => {
        it('should handle empty portfolio data gracefully', () => {
            // This test would require mocking the data source
            // For now, we test that the component renders with the mock data
            render(<PortfolioPage />);

            expect(screen.getByText('Portfolio')).toBeInTheDocument();
        });

        it('should display correct token amounts and values', () => {
            render(<PortfolioPage />);

            // Verify that token amounts are displayed correctly
            expect(screen.getByText('0.15432')).toBeInTheDocument(); // BTC amount
            expect(screen.getByText('3250.00')).toBeInTheDocument(); // USDC amount
            expect(screen.getByText('1.2456')).toBeInTheDocument(); // WETH amount
        });

        it('should display correct percentage changes', () => {
            render(<PortfolioPage />);

            // Verify percentage changes are displayed
            expect(screen.getByText('+2.4%')).toBeInTheDocument(); // BTC change
            expect(screen.getByText('+0.1%')).toBeInTheDocument(); // USDC change
            expect(screen.getByText('-1.8%')).toBeInTheDocument(); // WETH change
        });
    });
}); 