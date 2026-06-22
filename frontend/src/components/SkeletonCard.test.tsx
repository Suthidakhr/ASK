import { render, screen } from '@testing-library/react'
import SkeletonCard from './SkeletonCard'

describe('SkeletonCard', () => {
  it('renders without throwing', () => {
    expect(() => render(<SkeletonCard />)).not.toThrow()
  })

  it('has role="status" for screen reader announcement', () => {
    render(<SkeletonCard />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('has accessible label for screen readers', () => {
    render(<SkeletonCard />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading news')
  })

  it('contains no spinner and no loading text', () => {
    render(<SkeletonCard />)
    expect(screen.queryByText(/loading/i)).toBeNull()
    expect(screen.queryByRole('progressbar')).toBeNull()
  })
})
