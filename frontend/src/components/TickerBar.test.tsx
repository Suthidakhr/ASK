import { render, screen } from '@testing-library/react'
import TickerBar from './TickerBar'
import { TickerItem } from '@/types'

const VALID_TICKER: TickerItem[] = [
  { symbol: 'SET', price: 1384.52, change_pct: 0.60, direction: 'positive' },
  { symbol: 'GOLD', price: 2389.80, change_pct: -0.51, direction: 'negative' },
]

describe('TickerBar', () => {
  it('renders each ticker symbol', () => {
    render(<TickerBar items={VALID_TICKER} />)
    expect(screen.getAllByText('SET').length).toBeGreaterThan(0)
    expect(screen.getAllByText('GOLD').length).toBeGreaterThan(0)
  })

  it('positive direction renders ▲ arrow', () => {
    render(<TickerBar items={VALID_TICKER} />)
    const arrows = screen.getAllByText(/▲/)
    expect(arrows.length).toBeGreaterThan(0)
  })

  it('negative direction renders ▼ arrow', () => {
    render(<TickerBar items={VALID_TICKER} />)
    const arrows = screen.getAllByText(/▼/)
    expect(arrows.length).toBeGreaterThan(0)
  })

  it('percentage formatted to 2 decimal places', () => {
    render(<TickerBar items={VALID_TICKER} />)
    expect(screen.getAllByText(/0\.60%/).length).toBeGreaterThan(0)
  })

  it('neutral direction renders – dash', () => {
    const neutralTicker: TickerItem[] = [
      { symbol: 'KBK', price: 143.0, change_pct: 0.0, direction: 'neutral' },
    ]
    render(<TickerBar items={neutralTicker} />)
    expect(screen.getAllByText(/–/).length).toBeGreaterThan(0)
  })

  it('renders with empty items array without throwing', () => {
    expect(() => render(<TickerBar items={[]} />)).not.toThrow()
  })
})
