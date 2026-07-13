import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createGame } from '../engine/engine'
import type { GameState } from '../engine/types'
import { StatusBar } from './StatusBar'

describe('StatusBar', () => {
  it('shows white to place with a fresh 9/9 hand and no captures', () => {
    render(<StatusBar state={createGame()} />)
    expect(screen.getByText(/white to place/i)).toBeInTheDocument()
    expect(screen.getByText(/phase: placing/i)).toBeInTheDocument()
    expect(screen.getAllByText(/in hand: 9/i)).toHaveLength(2)
    expect(screen.getAllByText(/captured: 0/i)).toHaveLength(2)
  })

  it('shows the current player and phase for a mid-game moving state', () => {
    const state: GameState = {
      ...createGame(),
      phase: 'moving',
      currentPlayer: 'black',
      piecesInHand: { white: 0, black: 0 },
      board: { ...createGame().board, a1: 'white', a4: 'white', a7: 'white', d1: 'black' },
    }
    render(<StatusBar state={state} />)
    expect(screen.getByText(/black to move/i)).toBeInTheDocument()
    expect(screen.getByText(/phase: moving/i)).toBeInTheDocument()
    expect(screen.getByText(/captured: 6/i)).toBeInTheDocument() // black: 9 placed - 1 on board
  })

  it('shows a capture prompt when a capture is pending', () => {
    const state: GameState = { ...createGame(), pendingCapture: 'white' }
    render(<StatusBar state={state} />)
    expect(screen.getByText(/white to capture/i)).toBeInTheDocument()
  })

  it('announces the winner once the game has a result', () => {
    const state: GameState = {
      ...createGame(),
      phase: 'moving',
      result: { type: 'win', winner: 'white', reason: 'White wins — Black has no legal moves' },
    }
    render(<StatusBar state={state} />)
    expect(screen.getByText(/white wins/i)).toBeInTheDocument()
  })

  it('announces a draw once the game has a draw result', () => {
    const state: GameState = {
      ...createGame(),
      phase: 'moving',
      result: { type: 'draw', reason: 'Draw — the same position has occurred three times' },
    }
    render(<StatusBar state={state} />)
    expect(screen.getByText(/^draw$/i)).toBeInTheDocument()
  })
})
