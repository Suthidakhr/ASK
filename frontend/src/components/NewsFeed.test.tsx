import { render, screen } from '@testing-library/react'
import NewsFeed from './NewsFeed'
import { NewsItem } from '@/types'

vi.mock('next/link', () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

const makeNews = (overrides: Partial<NewsItem> & { id: string; category: NewsItem['category'] }): NewsItem => ({
  headline: `News ${overrides.id}`,
  summary: 'Summary text',
  source_url: 'https://example.com/article',
  content: 'Article content.',
  published_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  source: 'Reuters',
  ai_analysis: null,
  stock_impacts: [],
  featured: false,
  ...overrides,
})

const NEWS: NewsItem[] = [
  makeNews({ id: 'n1', category: 'พลังงาน', headline: 'Energy news' }),
  makeNews({ id: 'n2', category: 'เทคโนโลยี', headline: 'Tech news' }),
  makeNews({ id: 'n3', category: 'พลังงาน', headline: 'Another energy news' }),
]

const FRESH_TIME = new Date(Date.now() - 10 * 60 * 1000).toISOString() // 10 min ago
const STALE_TIME = new Date(Date.now() - 90 * 60 * 1000).toISOString() // 90 min ago

describe('NewsFeed', () => {
  it('renders all news cards from the news prop', () => {
    render(<NewsFeed news={NEWS} last_updated={FRESH_TIME} activeCategory="All" error={null} />)
    expect(screen.getByText('Energy news')).toBeInTheDocument()
    expect(screen.getByText('Tech news')).toBeInTheDocument()
    expect(screen.getByText('Another energy news')).toBeInTheDocument()
  })

  it('renders with empty news array without throwing', () => {
    expect(() =>
      render(<NewsFeed news={[]} last_updated={null} activeCategory="All" error={null} />)
    ).not.toThrow()
  })

  it('shows English empty state message when news array is empty', () => {
    render(<NewsFeed news={[]} last_updated={null} activeCategory="Energy" error={null} />)
    expect(screen.getByText(/No new articles in Energy today/)).toBeInTheDocument()
    expect(screen.getByText(/Check back during market hours/)).toBeInTheDocument()
  })

  it('empty state uses activeCategory name', () => {
    render(<NewsFeed news={[]} last_updated={null} activeCategory="Tech" error={null} />)
    expect(screen.getByText(/No new articles in Tech today/)).toBeInTheDocument()
  })

  it('shows error state with timestamp when error prop is provided', () => {
    const errorTime = new Date().toISOString()
    render(<NewsFeed news={[]} last_updated={null} activeCategory="All" error={errorTime} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/Market data temporarily unavailable/)).toBeInTheDocument()
    expect(screen.getByText(/Last attempted/)).toBeInTheDocument()
  })

  it('shows staleness banner when last_updated is >60 min ago during market hours', () => {
    // Thursday 10:00 Bangkok time = Wednesday 03:00 UTC
    const marketHourNow = new Date('2026-06-18T03:00:00Z').getTime()
    vi.useFakeTimers({ now: marketHourNow })
    const stale = new Date(marketHourNow - 90 * 60 * 1000).toISOString()
    render(<NewsFeed news={NEWS} last_updated={stale} activeCategory="All" error={null} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/New articles may be delayed/)).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('does NOT show staleness banner outside market hours (20:00 Bangkok = 13:00 UTC)', () => {
    const offHoursNow = new Date('2026-06-18T13:00:00Z').getTime()
    vi.useFakeTimers({ now: offHoursNow })
    const stale = new Date(offHoursNow - 90 * 60 * 1000).toISOString()
    render(<NewsFeed news={NEWS} last_updated={stale} activeCategory="All" error={null} />)
    expect(screen.queryByText(/New articles may be delayed/)).toBeNull()
    vi.useRealTimers()
  })

  it('does NOT show staleness banner when last_updated is recent (<60 min)', () => {
    const marketHourNow = new Date('2026-06-18T03:00:00Z').getTime()
    vi.useFakeTimers({ now: marketHourNow })
    const fresh = new Date(marketHourNow - 30 * 60 * 1000).toISOString()
    render(<NewsFeed news={NEWS} last_updated={fresh} activeCategory="All" error={null} />)
    expect(screen.queryByText(/New articles may be delayed/)).toBeNull()
    vi.useRealTimers()
  })

  it('search input has aria-label "Search news, stocks, and sectors"', () => {
    render(<NewsFeed news={NEWS} last_updated={FRESH_TIME} activeCategory="All" error={null} />)
    expect(
      screen.getByRole('searchbox', { name: 'Search news, stocks, and sectors' })
    ).toBeInTheDocument()
  })

  it('does not contain internal category filter buttons (moved to CategoryFilterBar)', () => {
    render(<NewsFeed news={NEWS} last_updated={FRESH_TIME} activeCategory="All" error={null} />)
    // CategoryFilterBar renders a tablist; NewsFeed should not
    expect(screen.queryByRole('tablist')).toBeNull()
  })
})
