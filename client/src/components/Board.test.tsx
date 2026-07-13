import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
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
})
