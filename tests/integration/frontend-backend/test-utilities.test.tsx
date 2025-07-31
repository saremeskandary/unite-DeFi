import * as React from 'react'
import { render, screen } from './test-utilities'

// Simple test component
const TestComponent = () => (
    <div data-testid="test-component">Test Component</div>
)

describe('Test Utilities', () => {
    it('should render with providers', () => {
        render(<TestComponent />)
        expect(screen.getByTestId('test-component')).toBeInTheDocument()
    })

    it('should have mock utilities available', () => {
        // Import mock utilities to ensure they're available
        const { mockWalletContext, mockBlockchainIntegration } = require('./test-utilities')

        expect(mockWalletContext).toBeDefined()
        expect(mockWalletContext.isConnected).toBe(true)
        expect(mockBlockchainIntegration).toBeDefined()
        expect(mockBlockchainIntegration.status).toBe('connected')
    })
}) 