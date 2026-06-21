import { render, screen } from '@testing-library/react'
import SectorHeatmap from './SectorHeatmap'
import { SectorPerformance } from '@/types'

const VALID_SECTORS: SectorPerformance[] = [
  { name: 'ก่อสร้าง', change_pct: 2.41, level: 'strong_up' },
  { name: 'เกษตร', change_pct: -0.08, level: 'flat' },
  { name: 'สายการบิน', change_pct: -1.21, level: 'down' },
]

describe('SectorHeatmap', () => {
  it('renders each sector name', () => {
    render(<SectorHeatmap sectors={VALID_SECTORS} />)
    expect(screen.getByText('ก่อสร้าง')).toBeInTheDocument()
    expect(screen.getByText('เกษตร')).toBeInTheDocument()
    expect(screen.getByText('สายการบิน')).toBeInTheDocument()
  })

  it('strong_up sector renders with + prefix', () => {
    render(<SectorHeatmap sectors={VALID_SECTORS} />)
    expect(screen.getByText('+2.41%')).toBeInTheDocument()
  })

  it('down sector renders negative percentage without + prefix', () => {
    render(<SectorHeatmap sectors={VALID_SECTORS} />)
    expect(screen.getByText('-1.21%')).toBeInTheDocument()
  })

  it('flat/zero sector renders without + prefix', () => {
    render(<SectorHeatmap sectors={VALID_SECTORS} />)
    expect(screen.getByText('-0.08%')).toBeInTheDocument()
  })

  it('renders with empty sectors array without throwing', () => {
    expect(() => render(<SectorHeatmap sectors={[]} />)).not.toThrow()
  })
})
