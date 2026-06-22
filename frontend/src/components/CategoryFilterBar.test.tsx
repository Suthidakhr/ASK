import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CategoryFilterBar from './CategoryFilterBar'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
}))

const TABS = [
  { slug: 'all',    label: 'All',    thaiName: null },
  { slug: 'rates',  label: 'Rates',  thaiName: 'ดอกเบี้ยโลก' },
  { slug: 'energy', label: 'Energy', thaiName: 'พลังงาน' },
  { slug: 'set',    label: 'SET',    thaiName: 'หุ้นไทย' },
] as const

type Tab = typeof TABS[number]

describe('CategoryFilterBar', () => {
  beforeEach(() => mockPush.mockReset())

  it('renders a tablist container', () => {
    render(<CategoryFilterBar categories={TABS} activeSlug="all" />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
  })

  it('renders a tab for each category', () => {
    render(<CategoryFilterBar categories={TABS} activeSlug="all" />)
    expect(screen.getAllByRole('tab')).toHaveLength(4)
  })

  it('sets aria-selected true on the active tab', () => {
    render(<CategoryFilterBar categories={TABS} activeSlug="energy" />)
    const energyTab = screen.getByRole('tab', { name: 'Energy' })
    expect(energyTab).toHaveAttribute('aria-selected', 'true')
  })

  it('sets aria-selected false on inactive tabs', () => {
    render(<CategoryFilterBar categories={TABS} activeSlug="energy" />)
    const allTab = screen.getByRole('tab', { name: 'All' })
    expect(allTab).toHaveAttribute('aria-selected', 'false')
  })

  it('each tab is at least 44px tall via min-h-[44px] class', () => {
    render(<CategoryFilterBar categories={TABS} activeSlug="all" />)
    const tabs = screen.getAllByRole('tab')
    tabs.forEach((tab) => {
      expect(tab.className).toMatch(/min-h-\[44px\]/)
    })
  })

  it('clicking Energy tab calls router.push with /news?category=energy', async () => {
    const user = userEvent.setup()
    render(<CategoryFilterBar categories={TABS} activeSlug="all" />)
    await user.click(screen.getByRole('tab', { name: 'Energy' }))
    expect(mockPush).toHaveBeenCalledWith('/news?category=energy')
  })

  it('clicking All tab calls router.push with /news (no query param)', async () => {
    const user = userEvent.setup()
    render(<CategoryFilterBar categories={TABS} activeSlug="energy" />)
    await user.click(screen.getByRole('tab', { name: 'All' }))
    expect(mockPush).toHaveBeenCalledWith('/news')
  })

  it('ArrowRight moves focus to next tab', () => {
    render(<CategoryFilterBar categories={TABS} activeSlug="all" />)
    const allTab = screen.getByRole('tab', { name: 'All' })
    const ratesTab = screen.getByRole('tab', { name: 'Rates' })
    allTab.focus()
    fireEvent.keyDown(allTab, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(ratesTab)
  })

  it('ArrowLeft moves focus to previous tab', () => {
    render(<CategoryFilterBar categories={TABS} activeSlug="all" />)
    const allTab = screen.getByRole('tab', { name: 'All' })
    const ratesTab = screen.getByRole('tab', { name: 'Rates' })
    ratesTab.focus()
    fireEvent.keyDown(ratesTab, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(allTab)
  })

  it('ArrowRight wraps from last tab to first', () => {
    render(<CategoryFilterBar categories={TABS} activeSlug="all" />)
    const setTab = screen.getByRole('tab', { name: 'SET' })
    const allTab = screen.getByRole('tab', { name: 'All' })
    setTab.focus()
    fireEvent.keyDown(setTab, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(allTab)
  })

  it('ArrowLeft wraps from first tab to last', () => {
    render(<CategoryFilterBar categories={TABS} activeSlug="all" />)
    const allTab = screen.getByRole('tab', { name: 'All' })
    const setTab = screen.getByRole('tab', { name: 'SET' })
    allTab.focus()
    fireEvent.keyDown(allTab, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(setTab)
  })

  it('Enter key activates the tab', async () => {
    render(<CategoryFilterBar categories={TABS} activeSlug="all" />)
    const ratesTab = screen.getByRole('tab', { name: 'Rates' })
    ratesTab.focus()
    fireEvent.keyDown(ratesTab, { key: 'Enter' })
    expect(mockPush).toHaveBeenCalledWith('/news?category=rates')
  })
})
