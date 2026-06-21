import { render, screen } from '@testing-library/react'
import TickerBar from './TickerBar'
import { TickerItem } from '@/types'

const VALID_TICKER: TickerItem[] = [
  { symbol: 'SET', price: 1384.52, change: 8.21, change_pct: 0.60 },
  { symbol: 'GOLD', price: 2389.80, change: -12.30, change_pct: -0.51 },
]

describe('TickerBar', () => {
  it('renders each ticker symbol', () => {
    render(<TickerBar items={VALID_TICKER} />)
    // Items are doubled for the marquee; getAllByText handles multiple
    expect(screen.getAllByText('SET').length).toBeGreaterThan(0)
    expect(screen.getAllByText('GOLD').length).toBeGreaterThan(0)
  })

  it('positive change renders ▲ arrow', () => {
    render(<TickerBar items={VALID_TICKER} />)
    // ▲ and the percentage share a <span> — regex matches the combined textContent
    const arrows = screen.getAllByText(/▲/)
    expect(arrows.length).toBeGreaterThan(0)
  })

  it('negative change renders ▼ arrow', () => {
    render(<TickerBar items={VALID_TICKER} />)
    const arrows = screen.getAllByText(/▼/)
    expect(arrows.length).toBeGreaterThan(0)
  })

  it('percentage formatted to 2 decimal places', () => {
    render(<TickerBar items={VALID_TICKER} />)
    // "▲ 0.60%" is the full textContent of the span; regex substring match works
    expect(screen.getAllByText(/0\.60%/).length).toBeGreaterThan(0)
  })

  it('renders with empty items array without throwing', () => {
    expect(() => render(<TickerBar items={[]} />)).not.toThrow()
  })
})
