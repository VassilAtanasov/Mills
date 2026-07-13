import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createGame } from '../engine/engine'
import type { GameState } from '../engine/types'
import { Board } from './Board'

describe('Board', () => {
  it('renders all 24 points with no pieces on a fresh game', () => {
    const state = createGame()
    const { container } = render(<Board state={state} />)

    const points = container.querySelectorAll('[data-point]')
    expect(points).toHaveLength(24)
    expect(container.querySelectorAll('[data-state="empty"]')).toHaveLength(24)
    expect(container.querySelectorAll('.piece')).toHaveLength(0)
  })

  it('renders a piece for every occupied point, matching the board state', () => {
    const state: GameState = {
      ...createGame(),
      board: {
        ...createGame().board,
        a1: 'white',
        a4: 'black',
        d1: 'white',
      },
    }
    const { container } = render(<Board state={state} />)

    expect(container.querySelectorAll('.piece')).toHaveLength(3)
    expect(container.querySelector('[data-point="a1"] .piece[data-player="white"]')).not.toBeNull()
    expect(container.querySelector('[data-point="a4"] .piece[data-player="black"]')).not.toBeNull()
    expect(container.querySelector('[data-point="d1"] .piece[data-player="white"]')).not.toBeNull()
    expect(container.querySelector('[data-point="a7"] .piece')).toBeNull()
  })

  it('draws a line for every adjacency edge exactly once', () => {
    const state = createGame()
    const { container } = render(<Board state={state} />)

    // 3 rings of 8 edges each + 4 spokes of 2 edges each = 32 undirected edges
    expect(container.querySelectorAll('.board-lines line')).toHaveLength(32)
  })

  it('distinguishes white and black pieces by more than fill color', () => {
    const state: GameState = {
      ...createGame(),
      board: { ...createGame().board, a1: 'white', a4: 'black' },
    }
    const { container } = render(<Board state={state} />)

    const whitePiece = container.querySelector('[data-point="a1"] .piece')
    const blackPiece = container.querySelector('[data-point="a4"] .piece')
    expect(whitePiece?.querySelector('circle[fill="none"]')).not.toBeNull() // ring mark
    expect(blackPiece?.querySelectorAll('line')).toHaveLength(2) // cross mark
  })

  it('marks legal-target, selected, and capturable points from data-driven props', () => {
    const state = createGame()
    const { container } = render(
      <Board
        state={state}
        selected="a1"
        legalTargets={new Set(['a4', 'd1'])}
        capturable={new Set(['g7'])}
      />,
    )

    expect(container.querySelector('[data-point="a1"][data-selected="true"]')).not.toBeNull()
    expect(container.querySelector('[data-point="a4"][data-legal-target="true"]')).not.toBeNull()
    expect(container.querySelector('[data-point="d1"][data-legal-target="true"]')).not.toBeNull()
    expect(container.querySelector('[data-point="g7"][data-capturable="true"]')).not.toBeNull()
    expect(container.querySelector('[data-point="a7"][data-legal-target="true"]')).toBeNull()
  })

  it('marks a point in-mill only when its board state completes a mill line', () => {
    const state: GameState = {
      ...createGame(),
      board: { ...createGame().board, a1: 'white', a4: 'white', a7: 'white', d1: 'black' },
    }
    const { container } = render(<Board state={state} />)

    expect(container.querySelector('[data-point="a1"][data-in-mill="true"]')).not.toBeNull()
    expect(container.querySelector('[data-point="a4"][data-in-mill="true"]')).not.toBeNull()
    expect(container.querySelector('[data-point="a7"][data-in-mill="true"]')).not.toBeNull()
    expect(container.querySelector('[data-point="d1"][data-in-mill="false"]')).not.toBeNull()
  })

  it('invokes onPointClick with the clicked point id', () => {
    const onPointClick = vi.fn()
    const state = createGame()
    const { container } = render(<Board state={state} onPointClick={onPointClick} />)

    const point = container.querySelector('[data-point="d1"]')
    if (!point) throw new Error('expected point d1 to render')
    fireEvent.click(point)

    expect(onPointClick).toHaveBeenCalledTimes(1)
    expect(onPointClick).toHaveBeenCalledWith('d1')
  })

  it('de-emphasizes the board once the game has a result', () => {
    const state: GameState = {
      ...createGame(),
      result: { type: 'win', winner: 'white', reason: 'White wins — Black has no legal moves' },
    }
    const { container } = render(<Board state={state} />)

    const svg = container.querySelector('svg.board')
    expect(svg?.getAttribute('data-game-over')).toBe('true')
    expect(svg?.classList.contains('board-deemphasized')).toBe(true)
  })

  it('does not de-emphasize the board while the game is in progress', () => {
    const state = createGame()
    const { container } = render(<Board state={state} />)

    const svg = container.querySelector('svg.board')
    expect(svg?.getAttribute('data-game-over')).toBe('false')
    expect(svg?.classList.contains('board-deemphasized')).toBe(false)
  })

  it('gives every point a keyboard-focusable button role and a position/state ARIA label', () => {
    const state = createGame()
    const { container } = render(
      <Board state={state} legalTargets={new Set(['a1'])} />,
    )

    const points = container.querySelectorAll('[data-point]')
    expect(points).toHaveLength(24)
    for (const point of points) {
      expect(point.getAttribute('role')).toBe('button')
      expect(point.getAttribute('tabindex')).toBe('0')
      expect(point.getAttribute('aria-label')).toMatch(/^Point \w+, /)
    }
    expect(container.querySelector('[data-point="a1"]')?.getAttribute('aria-label')).toBe(
      'Point a1, empty, legal move',
    )
  })

  it('reflects occupant, selected, capturable, and in-mill state in the ARIA label', () => {
    const state: GameState = {
      ...createGame(),
      board: { ...createGame().board, a1: 'white', a4: 'white', a7: 'white', d1: 'black' },
    }
    const { container } = render(
      <Board state={state} selected="a1" capturable={new Set(['d1'])} />,
    )

    expect(container.querySelector('[data-point="a1"]')?.getAttribute('aria-label')).toBe(
      'Point a1, white piece, selected, in a mill',
    )
    expect(container.querySelector('[data-point="d1"]')?.getAttribute('aria-label')).toBe(
      'Point d1, black piece, capturable',
    )
  })

  it('invokes onPointClick when Enter or Space is pressed on a focused point', () => {
    const onPointClick = vi.fn()
    const state = createGame()
    const { container } = render(<Board state={state} onPointClick={onPointClick} />)

    const point = container.querySelector('[data-point="d1"]')
    if (!point) throw new Error('expected point d1 to render')

    fireEvent.keyDown(point, { key: 'Enter' })
    fireEvent.keyDown(point, { key: ' ' })

    expect(onPointClick).toHaveBeenCalledTimes(2)
    expect(onPointClick).toHaveBeenNthCalledWith(1, 'd1')
    expect(onPointClick).toHaveBeenNthCalledWith(2, 'd1')
  })

  it('does not invoke onPointClick for unrelated keys', () => {
    const onPointClick = vi.fn()
    const state = createGame()
    const { container } = render(<Board state={state} onPointClick={onPointClick} />)

    const point = container.querySelector('[data-point="d1"]')
    if (!point) throw new Error('expected point d1 to render')
    fireEvent.keyDown(point, { key: 'Tab' })

    expect(onPointClick).not.toHaveBeenCalled()
  })

  it('renders a fading ghost piece at a point that was just captured', () => {
    const before: GameState = {
      ...createGame(),
      board: { ...createGame().board, a1: 'white', d2: 'black' },
    }
    const { container, rerender } = render(<Board state={before} />)
    expect(container.querySelectorAll('.piece-ghost')).toHaveLength(0)

    const after: GameState = { ...before, board: { ...before.board, d2: null } }
    rerender(<Board state={after} />)

    const ghost = container.querySelector('[data-point="d2"] .piece-ghost')
    expect(ghost).not.toBeNull()
    expect(ghost?.querySelector('.piece[data-player="black"]')).not.toBeNull()
  })

  it('does not render a ghost piece for a placement or a move', () => {
    const before: GameState = { ...createGame(), board: { ...createGame().board, a1: 'white' } }
    const { container, rerender } = render(<Board state={before} />)

    const placed: GameState = { ...before, board: { ...before.board, d2: 'black' } }
    rerender(<Board state={placed} />)
    expect(container.querySelectorAll('.piece-ghost')).toHaveLength(0)

    const moved: GameState = {
      ...placed,
      board: { ...placed.board, a1: null, a4: 'white' },
    }
    rerender(<Board state={moved} />)
    expect(container.querySelectorAll('.piece-ghost')).toHaveLength(0)
  })
})
