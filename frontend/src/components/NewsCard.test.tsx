import { render, screen } from '@testing-library/react'
import NewsCard from './NewsCard'
import { NewsItem } from '@/types'

const VALID_NEWS: NewsItem = {
  id: 'news-001',
  title: 'เฟดส่งสัญญาณลดดอกเบี้ย',
  summary: 'ธนาคารกลางสหรัฐฯ แสดงสัญญาณลดดอกเบี้ย 2 ครั้งในปีนี้',
  category: 'ดอกเบี้ยโลก',
  published_at: '2026-06-21T01:15:00Z',
  source: 'Bloomberg',
  ai_analysis: 'สัญญาณบวกที่ชัดเจน',
  stock_impacts: [
    { symbol: 'SPALI', direction: 'positive' },
    { symbol: 'KBANK', direction: 'neutral' },
    { symbol: 'AAV', direction: 'negative' },
  ],
  featured: false,
}

describe('NewsCard', () => {
  it('renders the headline', () => {
    render(<NewsCard news={VALID_NEWS} />)
    expect(screen.getByText('เฟดส่งสัญญาณลดดอกเบี้ย')).toBeInTheDocument()
  })

  it('renders the source name', () => {
    render(<NewsCard news={VALID_NEWS} />)
    expect(screen.getByText('Bloomberg')).toBeInTheDocument()
  })

  it('renders category label — maps Thai category to English code', () => {
    render(<NewsCard news={VALID_NEWS} />)
    expect(screen.getByText('RATES')).toBeInTheDocument()
  })

  it('renders ai_analysis text', () => {
    render(<NewsCard news={VALID_NEWS} />)
    expect(screen.getByText('สัญญาณบวกที่ชัดเจน')).toBeInTheDocument()
  })

  it('renders positive stock impact badge with ▲ arrow', () => {
    render(<NewsCard news={VALID_NEWS} />)
    expect(screen.getByText('SPALI')).toBeInTheDocument()
  })

  it('renders neutral stock impact badge with – arrow', () => {
    render(<NewsCard news={VALID_NEWS} />)
    expect(screen.getByText('KBANK')).toBeInTheDocument()
  })

  it('renders negative stock impact badge with ▼ arrow', () => {
    render(<NewsCard news={VALID_NEWS} />)
    expect(screen.getByText('AAV')).toBeInTheDocument()
  })

  it('featured card applies camel left border style', () => {
    render(<NewsCard news={{ ...VALID_NEWS, featured: true }} />)
    const article = screen.getByRole('article')
    expect(article).toHaveStyle({ borderLeftColor: '#B2967D' })
  })

  it('non-featured card does not apply camel left border', () => {
    render(<NewsCard news={VALID_NEWS} />)
    const article = screen.getByRole('article')
    expect(article).not.toHaveStyle({ borderLeftColor: '#B2967D' })
  })

  it('renders with empty stock_impacts without throwing', () => {
    expect(() => render(<NewsCard news={{ ...VALID_NEWS, stock_impacts: [] }} />)).not.toThrow()
  })

  it('unknown category falls back gracefully', () => {
    render(<NewsCard news={{ ...VALID_NEWS, category: 'อื่นๆ' }} />)
    expect(screen.getByText('อื่นๆ')).toBeInTheDocument()
  })
})
