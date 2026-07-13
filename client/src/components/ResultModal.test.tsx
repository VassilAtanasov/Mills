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

  it('moves focus into the dialog as soon as it mounts, so Escape is reachable without an explicit Tab', () => {
    const result: GameResult = { type: 'draw', reason: 'Draw — 50 moves without a mill or capture' }
    render(<ResultModal result={result} onRematch={() => {}} onDismiss={() => {}} />)

    expect(document.activeElement).toBe(screen.getByRole('button', { name: /dismiss/i }))
  })

  it('calls onDismiss when Escape is pressed from wherever focus landed on mount', () => {
    const onDismiss = vi.fn()
    const result: GameResult = { type: 'draw', reason: 'Draw — 50 moves without a mill or capture' }
    render(<ResultModal result={result} onRematch={() => {}} onDismiss={onDismiss} />)

    // Do not target the dialog element directly: fire on whatever the browser's real
    // focus-follows-mount behavior put focus on, to catch event-scoping regressions.
    if (!document.activeElement) throw new Error('expected an element to have focus')
    fireEvent.keyDown(document.activeElement, { key: 'Escape' })

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('traps Tab focus between dismiss and rematch, wrapping in both directions', () => {
    const result: GameResult = { type: 'draw', reason: 'Draw — 50 moves without a mill or capture' }
    render(<ResultModal result={result} onRematch={() => {}} onDismiss={() => {}} />)

    const dismiss = screen.getByRole('button', { name: /dismiss/i })
    const rematch = screen.getByRole('button', { name: /rematch/i })

    rematch.focus()
    fireEvent.keyDown(rematch, { key: 'Tab' })
    expect(document.activeElement).toBe(dismiss)

    fireEvent.keyDown(dismiss, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(rematch)
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
