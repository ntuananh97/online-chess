import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MovesPanel } from './MovesPanel'

describe('MovesPanel', () => {
  it('shows empty state when moves array is empty', () => {
    render(<MovesPanel moves={[]} />)
    expect(screen.getByText('No moves yet.')).toBeInTheDocument()
  })

  it('renders move number and white move', () => {
    render(<MovesPanel moves={['e4']} />)
    expect(screen.getByText('1.')).toBeInTheDocument()
    expect(screen.getByText('e4')).toBeInTheDocument()
  })

  it('renders a full paired move on one row', () => {
    render(<MovesPanel moves={['e4', 'e5']} />)
    expect(screen.getByText('1.')).toBeInTheDocument()
    expect(screen.getByText('e4')).toBeInTheDocument()
    expect(screen.getByText('e5')).toBeInTheDocument()
  })

  it('renders two pairs across two rows', () => {
    render(<MovesPanel moves={['e4', 'e5', 'Nf3', 'Nc6']} />)
    expect(screen.getByText('1.')).toBeInTheDocument()
    expect(screen.getByText('2.')).toBeInTheDocument()
    expect(screen.getByText('Nf3')).toBeInTheDocument()
    expect(screen.getByText('Nc6')).toBeInTheDocument()
  })

  it('handles odd number of moves - last black cell is empty', () => {
    render(<MovesPanel moves={['e4', 'e5', 'Nf3']} />)
    expect(screen.getByText('2.')).toBeInTheDocument()
    expect(screen.getByText('Nf3')).toBeInTheDocument()
  })
})
