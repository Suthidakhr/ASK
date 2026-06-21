import { render, screen } from '@testing-library/react'
import AISummaryCard from './AISummaryCard'
import { AISummary } from '@/types'

const VALID_SUMMARY: AISummary = {
  date: '21 Jun 2026',
  overview: 'วันนี้ตลาดหุ้นไทยมีแนวโน้มบวก',
  key_points: [
    'กลุ่มที่น่าสนใจวันนี้: ท่องเที่ยว, ก่อสร้าง',
    'กลุ่มที่ต้องระวัง: สายการบิน',
  ],
  watch_sectors: ['ท่องเที่ยว', 'ก่อสร้าง'],
  avoid_sectors: ['สายการบิน'],
  set_range_low: 1378.0,
  set_range_high: 1395.0,
}

describe('AISummaryCard', () => {
  it('renders overview text', () => {
    render(<AISummaryCard summary={VALID_SUMMARY} />)
    expect(screen.getByText('วันนี้ตลาดหุ้นไทยมีแนวโน้มบวก')).toBeInTheDocument()
  })

  it('renders all key_points', () => {
    render(<AISummaryCard summary={VALID_SUMMARY} />)
    expect(screen.getByText('กลุ่มที่น่าสนใจวันนี้: ท่องเที่ยว, ก่อสร้าง')).toBeInTheDocument()
    expect(screen.getByText('กลุ่มที่ต้องระวัง: สายการบิน')).toBeInTheDocument()
  })

  it('renders the date', () => {
    render(<AISummaryCard summary={VALID_SUMMARY} />)
    expect(screen.getByText('21 Jun 2026')).toBeInTheDocument()
  })

  it('renders SET target range from set_range_low and set_range_high', () => {
    render(<AISummaryCard summary={VALID_SUMMARY} />)
    expect(screen.getByText('SET Target Range')).toBeInTheDocument()
  })
})
