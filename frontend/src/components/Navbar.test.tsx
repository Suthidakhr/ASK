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
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

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
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('News')).toBeInTheDocument()
    expect(screen.getByText('Trends')).toBeInTheDocument()
    expect(screen.getByText('About')).toBeInTheDocument()
  })

  it('active tab (pathname /) applies khaki color to Home', () => {
    render(<Navbar />)
    const homeLink = screen.getByText('Home').closest('a')
    expect(homeLink).toHaveStyle({ color: '#D7C9B8' })
  })

  it('inactive tab (News) has reduced opacity color', () => {
    render(<Navbar />)
    const newsLink = screen.getByText('News').closest('a')
    expect(newsLink).toHaveStyle({ color: 'rgba(255,255,255,0.5)' })
  })

  it('Thai sub-labels have aria-hidden="true"', () => {
    render(<Navbar />)
    const thaiLabels = screen.getAllByText(/หน้าหลัก|ข่าว|แนวโน้ม|เกี่ยวกับ/)
    thaiLabels.forEach((el) => {
      expect(el).toHaveAttribute('aria-hidden', 'true')
    })
  })

  it('header has hidden class for mobile-only hiding', () => {
    const { container } = render(<Navbar />)
    const header = container.querySelector('header')
    expect(header?.className).toContain('hidden')
  })
})
