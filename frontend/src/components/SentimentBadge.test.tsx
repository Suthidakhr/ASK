import { render, screen } from '@testing-library/react'
import SentimentBadge from './SentimentBadge'

describe('SentimentBadge', () => {
  describe('bullish state', () => {
    it('renders ● dot and BULLISH label', () => {
      render(<SentimentBadge sentiment="bullish" />)
      expect(screen.getByText('BULLISH')).toBeInTheDocument()
      expect(screen.getByText('●')).toBeInTheDocument()
    })

    it('has aria-label "Market sentiment: bullish" on the badge element', () => {
      const { container } = render(<SentimentBadge sentiment="bullish" />)
      const badge = container.querySelector('[aria-label="Market sentiment: bullish"]')
      expect(badge).toBeTruthy()
    })

    it('applies positive text color (#15803d) on the badge element', () => {
      const { container } = render(<SentimentBadge sentiment="bullish" />)
      const badge = container.querySelector('[aria-label="Market sentiment: bullish"]') as HTMLElement
      expect(badge).toHaveStyle({ color: '#15803d' })
    })
  })

  describe('bearish state', () => {
    it('renders ● dot and BEARISH label', () => {
      render(<SentimentBadge sentiment="bearish" />)
      expect(screen.getByText('BEARISH')).toBeInTheDocument()
      expect(screen.getByText('●')).toBeInTheDocument()
    })

    it('has aria-label "Market sentiment: bearish" on the badge element', () => {
      const { container } = render(<SentimentBadge sentiment="bearish" />)
      const badge = container.querySelector('[aria-label="Market sentiment: bearish"]')
      expect(badge).toBeTruthy()
    })

    it('applies negative text color (#dc2626) on the badge element', () => {
      const { container } = render(<SentimentBadge sentiment="bearish" />)
      const badge = container.querySelector('[aria-label="Market sentiment: bearish"]') as HTMLElement
      expect(badge).toHaveStyle({ color: '#dc2626' })
    })
  })

  describe('neutral state', () => {
    it('renders ● dot and NEUTRAL label', () => {
      render(<SentimentBadge sentiment="neutral" />)
      expect(screen.getByText('NEUTRAL')).toBeInTheDocument()
      expect(screen.getByText('●')).toBeInTheDocument()
    })

    it('has aria-label "Market sentiment: neutral" on the badge element', () => {
      const { container } = render(<SentimentBadge sentiment="neutral" />)
      const badge = container.querySelector('[aria-label="Market sentiment: neutral"]')
      expect(badge).toBeTruthy()
    })

    it('applies neutral-text color (#6b6560) on the badge element', () => {
      const { container } = render(<SentimentBadge sentiment="neutral" />)
      const badge = container.querySelector('[aria-label="Market sentiment: neutral"]') as HTMLElement
      expect(badge).toHaveStyle({ color: '#6b6560' })
    })
  })
})
