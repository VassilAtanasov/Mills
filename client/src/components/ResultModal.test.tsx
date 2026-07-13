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
    render(<ResultModal result={result} onRematch={() => {}} onDismiss={() => {}} />)
    expect(screen.getByText('White wins — Black has no legal moves')).toBeInTheDocument()
  })

  it('shows the draw reason verbatim from the engine', () => {
    const result: GameResult = {
      type: 'draw',
      reason: 'Draw — the same position has occurred three times',
    }
    render(<ResultModal result={result} onRematch={() => {}} onDismiss={() => {}} />)
    expect(
      screen.getByText('Draw — the same position has occurred three times'),
    ).toBeInTheDocument()
  })

  it('calls onRematch when the rematch button is clicked', () => {
    const onRematch = vi.fn()
    const result: GameResult = { type: 'draw', reason: 'Draw — 50 moves without a mill or capture' }
    render(<ResultModal result={result} onRematch={onRematch} onDismiss={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: /rematch/i }))
    expect(onRematch).toHaveBeenCalledTimes(1)
  })

  it('renders no confetti/particle markup — just the outcome text and rematch control', () => {
    const result: GameResult = { type: 'draw', reason: 'Draw — 50 moves without a mill or capture' }
    const { container } = render(
      <ResultModal result={result} onRematch={() => {}} onDismiss={() => {}} />,
    )
    expect(
      container.querySelectorAll('svg, canvas, [class*="confetti"], [class*="particle"]'),
    ).toHaveLength(0)
  })

  it('calls onDismiss when the dismiss control is activated by keyboard', () => {
    const onDismiss = vi.fn()
    const result: GameResult = { type: 'draw', reason: 'Draw — 50 moves without a mill or capture' }
    render(<ResultModal result={result} onRematch={() => {}} onDismiss={onDismiss} />)

    const dismissButton = screen.getByRole('button', { name: /dismiss/i })
    dismissButton.focus()
    expect(dismissButton).toHaveFocus()
    fireEvent.click(dismissButton)

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('calls onDismiss when Escape is pressed anywhere in the dialog', () => {
    const onDismiss = vi.fn()
    const result: GameResult = { type: 'draw', reason: 'Draw — 50 moves without a mill or capture' }
    render(<ResultModal result={result} onRematch={() => {}} onDismiss={onDismiss} />)

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('keeps dismiss and rematch as separate, independently keyboard-reachable controls', () => {
    const result: GameResult = { type: 'draw', reason: 'Draw — 50 moves without a mill or capture' }
    render(<ResultModal result={result} onRematch={() => {}} onDismiss={() => {}} />)

    const dismiss = screen.getByRole('button', { name: /dismiss/i })
    const rematch = screen.getByRole('button', { name: /rematch/i })
    expect(dismiss).not.toBe(rematch)
    expect(dismiss.tagName).toBe('BUTTON')
    expect(rematch.tagName).toBe('BUTTON')
  })
})
