import { render, screen } from '@testing-library/react'
import NewsCard from './NewsCard'
import { NewsItem } from '@/types'

const VALID_NEWS: NewsItem = {
  id: 'news-001',
  headline: 'เฟดส่งสัญญาณลดดอกเบี้ย',
  summary: 'ธนาคารกลางสหรัฐฯ แสดงสัญญาณลดดอกเบี้ย 2 ครั้งในปีนี้',
  source_url: 'https://bloomberg.com/test-article',
  content: 'Full article content for testing.',
  category: 'ดอกเบี้ยโลก',
  published_at: '2026-06-21T01:15:00Z',
  source: 'Bloomberg',
  ai_analysis: {
    summary: 'สัญญาณบวกที่ชัดเจน',
    affected_sectors: ['อสังหาฯ'],
    affected_stocks: ['SPALI'],
    sentiment: 'bullish',
    analysis_at: '2026-06-21T01:30:00Z',
  },
  stock_impacts: [
    { symbol: 'SPALI', direction: 'positive', reason: null },
    { symbol: 'KBANK', direction: 'neutral', reason: null },
    { symbol: 'AAV', direction: 'negative', reason: null },
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

  it('renders ai_analysis summary text', () => {
    render(<NewsCard news={VALID_NEWS} />)
    expect(screen.getByText('สัญญาณบวกที่ชัดเจน')).toBeInTheDocument()
  })

  it('renders "Analysis pending" when ai_analysis is null', () => {
    render(<NewsCard news={{ ...VALID_NEWS, ai_analysis: null }} />)
    expect(screen.getByText('Analysis pending')).toBeInTheDocument()
  })

  it('renders positive stock impact badge with ▲ arrow', () => {
    render(<NewsCard news={{ ...VALID_NEWS, stock_impacts: [{ symbol: 'SPALI', direction: 'positive', reason: null }] }} />)
    const badge = screen.getByText('SPALI').closest('span')
    expect(badge).toHaveTextContent('▲')
  })

  it('renders neutral stock impact badge with – arrow', () => {
    render(<NewsCard news={{ ...VALID_NEWS, stock_impacts: [{ symbol: 'KBANK', direction: 'neutral', reason: null }] }} />)
    const badge = screen.getByText('KBANK').closest('span')
    expect(badge).toHaveTextContent('–')
  })

  it('renders negative stock impact badge with ▼ arrow', () => {
    render(<NewsCard news={{ ...VALID_NEWS, stock_impacts: [{ symbol: 'AAV', direction: 'negative', reason: null }] }} />)
    const badge = screen.getByText('AAV').closest('span')
    expect(badge).toHaveTextContent('▼')
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
    render(<NewsCard news={{ ...VALID_NEWS, category: 'อื่นๆ' as never }} />)
    expect(screen.getByText('อื่นๆ')).toBeInTheDocument()
  })
})
