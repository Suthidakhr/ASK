import { render, screen } from '@testing-library/react'
import MarketOverviewWidget from './MarketOverviewWidget'
import { MarketIndex } from '@/types'

const VALID_INDICES: MarketIndex[] = [
  { name: 'SET Index', symbol: 'SET', price: 1384.52, change: 8.21, change_pct: 0.60, market: 'ตลาดหลักทรัพย์ไทย' },
  { name: 'Nikkei 225', symbol: 'NKY', price: 38947.00, change: -124.50, change_pct: -0.32, market: 'ตลาดญี่ปุ่น' },
]

describe('MarketOverviewWidget', () => {
  it('renders each index name', () => {
    render(<MarketOverviewWidget indices={VALID_INDICES} />)
    expect(screen.getByText('SET Index')).toBeInTheDocument()
    expect(screen.getByText('Nikkei 225')).toBeInTheDocument()
  })

  it('positive change renders ▲ arrow', () => {
    render(<MarketOverviewWidget indices={VALID_INDICES} />)
    const arrows = screen.getAllByText(/▲/)
    expect(arrows.length).toBeGreaterThan(0)
  })

  it('negative change renders ▼ arrow', () => {
    render(<MarketOverviewWidget indices={VALID_INDICES} />)
    const arrows = screen.getAllByText(/▼/)
    expect(arrows.length).toBeGreaterThan(0)
  })

  it('renders with empty indices array without throwing', () => {
    expect(() => render(<MarketOverviewWidget indices={[]} />)).not.toThrow()
  })
})
