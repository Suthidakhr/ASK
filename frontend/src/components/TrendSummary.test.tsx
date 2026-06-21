import { render, screen } from '@testing-library/react'
import TrendSummary from './TrendSummary'
import { TrendItem } from '@/types'

const VALID_TRENDS: TrendItem[] = [
  { rank: 1, title: 'Fed Pivot', description: 'ตลาดตอบรับด้วย Risk-on mode', sentiment: 'bullish' },
  { rank: 2, title: 'ต้นทุนพลังงานสูง', description: 'น้ำมัน Brent เหนือ $86', sentiment: 'bearish' },
  { rank: 3, title: 'ค่าเงินบาท', description: 'บาทแข็งค่าจาก capital inflow', sentiment: 'neutral' },
]

describe('TrendSummary', () => {
  it('renders each trend title', () => {
    render(<TrendSummary trends={VALID_TRENDS} />)
    expect(screen.getByText('Fed Pivot')).toBeInTheDocument()
    expect(screen.getByText('ต้นทุนพลังงานสูง')).toBeInTheDocument()
    expect(screen.getByText('ค่าเงินบาท')).toBeInTheDocument()
  })

  it('bullish trend renders ▲ BULLISH label', () => {
    render(<TrendSummary trends={VALID_TRENDS} />)
    expect(screen.getByText('▲ BULLISH')).toBeInTheDocument()
  })

  it('bearish trend renders ▼ BEARISH label', () => {
    render(<TrendSummary trends={VALID_TRENDS} />)
    expect(screen.getByText('▼ BEARISH')).toBeInTheDocument()
  })

  it('neutral trend renders – NEUTRAL label', () => {
    render(<TrendSummary trends={VALID_TRENDS} />)
    expect(screen.getByText('– NEUTRAL')).toBeInTheDocument()
  })

  it('renders with empty trends array without throwing', () => {
    expect(() => render(<TrendSummary trends={[]} />)).not.toThrow()
  })
})
