import { render, container } from '@testing-library/react'
import N8nChat from './N8nChat'

describe('N8nChat', () => {
  it('renders null — produces no visible DOM output', () => {
    const { container } = render(<N8nChat />)
    expect(container.firstChild).toBeNull()
  })
})
