import { render, screen } from '@testing-library/react'
import React from 'react'

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

import Navbar from './Navbar'

describe('Navbar', () => {
  it('renders ASK brand name', () => {
    render(<Navbar />)
    expect(screen.getByText('ASK')).toBeInTheDocument()
  })

  it('renders tagline subtitle', () => {
    render(<Navbar />)
    expect(screen.getByText('From news to understanding.')).toBeInTheDocument()
  })

  it('renders all 4 nav tabs', () => {
    render(<Navbar />)
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('News')).toBeInTheDocument()
    expect(screen.getByText('Stocks')).toBeInTheDocument()
    expect(screen.getByText('Trends')).toBeInTheDocument()
  })

  it('active tab (pathname /) applies khaki color to Overview', () => {
    render(<Navbar />)
    const overviewLink = screen.getByText('Overview').closest('a')
    expect(overviewLink).toHaveStyle({ color: '#D7C9B8' })
  })

  it('inactive tab (News) has reduced opacity color', () => {
    render(<Navbar />)
    const newsLink = screen.getByText('News').closest('a')
    expect(newsLink).toHaveStyle({ color: 'rgba(255,255,255,0.5)' })
  })
})
