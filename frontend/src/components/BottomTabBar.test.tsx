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

import BottomTabBar from './BottomTabBar'

describe('BottomTabBar', () => {
  it('renders all 4 tab labels', () => {
    render(<BottomTabBar />)
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('News')).toBeInTheDocument()
    expect(screen.getByText('Stocks')).toBeInTheDocument()
    expect(screen.getByText('Trends')).toBeInTheDocument()
  })

  it('active tab (pathname /) applies khaki color to Overview link', () => {
    render(<BottomTabBar />)
    const overviewLink = screen.getByText('Overview').closest('a')
    expect(overviewLink).toHaveStyle({ color: '#D7C9B8' })
  })

  it('inactive tabs (pathname /) have reduced opacity color', () => {
    render(<BottomTabBar />)
    const newsLink = screen.getByText('News').closest('a')
    const stocksLink = screen.getByText('Stocks').closest('a')
    const trendsLink = screen.getByText('Trends').closest('a')
    expect(newsLink).toHaveStyle({ color: 'rgba(255,255,255,0.45)' })
    expect(stocksLink).toHaveStyle({ color: 'rgba(255,255,255,0.45)' })
    expect(trendsLink).toHaveStyle({ color: 'rgba(255,255,255,0.45)' })
  })

  it('Thai sub-labels have aria-hidden="true"', () => {
    render(<BottomTabBar />)
    const thaiLabels = screen.getAllByText(/ภาพรวม|ข่าว|หุ้น|แนวโน้ม/)
    thaiLabels.forEach((el) => {
      expect(el).toHaveAttribute('aria-hidden', 'true')
    })
  })

  it('each tab renders an anchor with the correct href', () => {
    render(<BottomTabBar />)
    expect(screen.getByText('Overview').closest('a')).toHaveAttribute('href', '/')
    expect(screen.getByText('News').closest('a')).toHaveAttribute('href', '/news')
    expect(screen.getByText('Stocks').closest('a')).toHaveAttribute('href', '/stocks')
    expect(screen.getByText('Trends').closest('a')).toHaveAttribute('href', '/trends')
  })

  it('nav has lg:hidden class to hide on desktop', () => {
    const { container } = render(<BottomTabBar />)
    const nav = container.querySelector('nav')
    expect(nav?.className).toContain('lg:hidden')
  })
})
