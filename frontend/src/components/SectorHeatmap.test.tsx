import { render, screen } from '@testing-library/react'
import SectorHeatmap from './SectorHeatmap'
import { SectorPerformance } from '@/types'

const UPDATED_AT = '2026-06-27T03:00:00Z'

const VALID_SECTORS: SectorPerformance[] = [
  { sector_name: 'ก่อสร้าง', change_pct: 2.41, direction: 'positive', top_article_id: 'news-001', updated_at: UPDATED_AT },
  { sector_name: 'เกษตร', change_pct: -0.08, direction: 'neutral', top_article_id: null, updated_at: UPDATED_AT },
  { sector_name: 'สายการบิน', change_pct: -1.21, direction: 'negative', top_article_id: null, updated_at: UPDATED_AT },
]

describe('SectorHeatmap', () => {
  it('renders each sector name', () => {
    render(<SectorHeatmap sectors={VALID_SECTORS} />)
    expect(screen.getByText('ก่อสร้าง')).toBeInTheDocument()
    expect(screen.getByText('เกษตร')).toBeInTheDocument()
    expect(screen.getByText('สายการบิน')).toBeInTheDocument()
  })

  it('positive sector renders with + prefix', () => {
    render(<SectorHeatmap sectors={VALID_SECTORS} />)
    expect(screen.getByText('+2.41%')).toBeInTheDocument()
  })

  it('negative sector renders negative percentage without + prefix', () => {
    render(<SectorHeatmap sectors={VALID_SECTORS} />)
    expect(screen.getByText('-1.21%')).toBeInTheDocument()
  })

  it('neutral sector renders without + prefix', () => {
    render(<SectorHeatmap sectors={VALID_SECTORS} />)
    expect(screen.getByText('-0.08%')).toBeInTheDocument()
  })

  it('renders with empty sectors array without throwing', () => {
    expect(() => render(<SectorHeatmap sectors={[]} />)).not.toThrow()
  })
})
