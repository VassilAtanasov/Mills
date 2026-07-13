import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { GameResult } from '../engine/types'
import { ResultModal } from './ResultModal'

describe('ResultModal', () => {
  it('shows the win outcome and reason verbatim from the engine', () => {
    const result: GameResult = {
      type: 'win',
      winner: 'white',
      reason: 'White wins — Black has no legal moves',
    }
    render(<ResultModal result={result} onRematch={() => {}} />)
    expect(screen.getByText('White wins — Black has no legal moves')).toBeInTheDocument()
  })

  it('shows the draw reason verbatim from the engine', () => {
    const result: GameResult = {
      type: 'draw',
      reason: 'Draw — the same position has occurred three times',
    }
    render(<ResultModal result={result} onRematch={() => {}} />)
    expect(
      screen.getByText('Draw — the same position has occurred three times'),
    ).toBeInTheDocument()
  })

  it('calls onRematch when the rematch button is clicked', () => {
    const onRematch = vi.fn()
    const result: GameResult = { type: 'draw', reason: 'Draw — 50 moves without a mill or capture' }
    render(<ResultModal result={result} onRematch={onRematch} />)

    fireEvent.click(screen.getByRole('button', { name: /rematch/i }))
    expect(onRematch).toHaveBeenCalledTimes(1)
  })

  it('renders no confetti/particle markup — just the outcome text and rematch control', () => {
    const result: GameResult = { type: 'draw', reason: 'Draw — 50 moves without a mill or capture' }
    const { container } = render(<ResultModal result={result} onRematch={() => {}} />)
    expect(
      container.querySelectorAll('svg, canvas, [class*="confetti"], [class*="particle"]'),
    ).toHaveLength(0)
  })
})
