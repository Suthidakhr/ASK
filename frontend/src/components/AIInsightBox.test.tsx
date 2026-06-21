import { render, screen } from '@testing-library/react'
import AIInsightBox from './AIInsightBox'
import { AIAnalysis } from '@/types'

const VALID_ANALYSIS: AIAnalysis = {
  summary: 'บวกต่อกลุ่มพลังงาน',
  affected_sectors: ['พลังงาน'],
  affected_stocks: ['PTT'],
  sentiment: 'bullish',
  analysis_at: new Date().toISOString(),
}

describe('AIInsightBox', () => {
  describe('pending state (analysis === null)', () => {
    it('shows "Analysis in progress" text', () => {
      render(<AIInsightBox analysis={null} />)
      expect(screen.getByText('Analysis in progress')).toBeInTheDocument()
    })

    it('uses cocoa color (#7D5A44) on the pending text — never camel at reduced opacity', () => {
      render(<AIInsightBox analysis={null} />)
      const text = screen.getByText('Analysis in progress')
      expect(text).toHaveStyle({ color: '#7D5A44' })
    })

    it('renders an aria-hidden animated dot alongside the text', () => {
      const { container } = render(<AIInsightBox analysis={null} />)
      const dot = container.querySelector('[aria-hidden="true"]')
      expect(dot).toBeTruthy()
    })

    it('has aria-label="AI market analysis" on the container', () => {
      const { container } = render(<AIInsightBox analysis={null} />)
      const box = container.querySelector('[aria-label="AI market analysis"]')
      expect(box).toBeTruthy()
    })
  })

  describe('loaded state — fresh analysis', () => {
    it('shows the summary text', () => {
      render(<AIInsightBox analysis={VALID_ANALYSIS} />)
      expect(screen.getByText('บวกต่อกลุ่มพลังงาน')).toBeInTheDocument()
    })

    it('does not show stale indicator for recent analysis', () => {
      render(<AIInsightBox analysis={VALID_ANALYSIS} />)
      expect(screen.queryByText(/Analysis from/)).not.toBeInTheDocument()
    })

    it('has aria-label="AI market analysis" on the container', () => {
      const { container } = render(<AIInsightBox analysis={VALID_ANALYSIS} />)
      const box = container.querySelector('[aria-label="AI market analysis"]')
      expect(box).toBeTruthy()
    })
  })

  describe('stale state (analysis_at > 24h ago)', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-06-21T12:00:00Z'))
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('shows amber stale indicator for analysis older than 24h', () => {
      const stale: AIAnalysis = {
        ...VALID_ANALYSIS,
        analysis_at: '2026-06-20T10:00:00Z', // 26h ago relative to fake "now"
      }
      render(<AIInsightBox analysis={stale} />)
      expect(screen.getByText(/Analysis from/)).toBeInTheDocument()
    })

    it('stale indicator text uses staleness color (#d97706)', () => {
      const stale: AIAnalysis = {
        ...VALID_ANALYSIS,
        analysis_at: '2026-06-20T10:00:00Z',
      }
      render(<AIInsightBox analysis={stale} />)
      const indicator = screen.getByText(/Analysis from/)
      expect(indicator).toHaveStyle({ color: '#d97706' })
    })

    it('still shows summary text alongside the stale indicator', () => {
      const stale: AIAnalysis = {
        ...VALID_ANALYSIS,
        analysis_at: '2026-06-20T10:00:00Z',
      }
      render(<AIInsightBox analysis={stale} />)
      expect(screen.getByText('บวกต่อกลุ่มพลังงาน')).toBeInTheDocument()
    })

    it('does not show stale indicator for analysis within 24h', () => {
      const fresh: AIAnalysis = {
        ...VALID_ANALYSIS,
        analysis_at: '2026-06-21T11:00:00Z', // 1h ago relative to fake "now"
      }
      render(<AIInsightBox analysis={fresh} />)
      expect(screen.queryByText(/Analysis from/)).not.toBeInTheDocument()
    })

    it('has aria-label="AI market analysis" on the container in stale state', () => {
      const stale: AIAnalysis = {
        ...VALID_ANALYSIS,
        analysis_at: '2026-06-20T10:00:00Z',
      }
      const { container } = render(<AIInsightBox analysis={stale} />)
      const box = container.querySelector('[aria-label="AI market analysis"]')
      expect(box).toBeTruthy()
    })
  })
})
