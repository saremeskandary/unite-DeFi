import React from 'react'
import { render, screen } from '@testing-library/react'
import PortfolioPage from '@/app/portfolio/page'

describe('PortfolioPage Test', () => {
  it('should render PortfolioPage correctly', () => {
    render(<PortfolioPage />)
    expect(screen.getByRole('heading', { name: 'Portfolio' })).toBeInTheDocument()
  })
}) 