import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createGame } from '../engine/engine'
import type { GameState } from '../engine/types'
import { StatusBar } from './StatusBar'

describe('StatusBar: hotseat copy', () => {
  it('shows white to place with a fresh 9/9 hand and no captures', () => {
    render(<StatusBar state={createGame()} mode="hotseat" />)
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
    const { container } = render(<StatusBar state={state} mode="hotseat" />)
    expect(screen.getByText(/black to move/i)).toBeInTheDocument()
    expect(screen.getByText(/phase: moving/i)).toBeInTheDocument()

    const whiteRow = container.querySelector('[data-player="white"]')
    const blackRow = container.querySelector('[data-player="black"]')
    if (!whiteRow || !blackRow) throw new Error('expected both player rows to render')
    expect(within(whiteRow as HTMLElement).getByText(/captured: 6/i)).toBeInTheDocument() // 9 placed - 3 on board
    expect(within(blackRow as HTMLElement).getByText(/captured: 8/i)).toBeInTheDocument() // 9 placed - 1 on board
  })

  it('shows a capture prompt when a capture is pending', () => {
    const state: GameState = { ...createGame(), pendingCapture: 'white' }
    render(<StatusBar state={state} mode="hotseat" />)
    expect(screen.getByText(/white to capture/i)).toBeInTheDocument()
  })

  it('announces the winner once the game has a result', () => {
    const state: GameState = {
      ...createGame(),
      phase: 'moving',
      result: { type: 'win', winner: 'white', reason: 'White wins — Black has no legal moves' },
    }
    render(<StatusBar state={state} mode="hotseat" />)
    expect(screen.getByText(/white wins/i)).toBeInTheDocument()
  })

  it('announces a draw once the game has a draw result', () => {
    const state: GameState = {
      ...createGame(),
      phase: 'moving',
      result: { type: 'draw', reason: 'Draw — the same position has occurred three times' },
    }
    render(<StatusBar state={state} mode="hotseat" />)
    expect(screen.getByText(/^draw$/i)).toBeInTheDocument()
  })
})

describe('StatusBar: vs-computer copy', () => {
  it('shows "You to place" for the human (White) turn, with You/Computer player rows', () => {
    render(<StatusBar state={createGame()} mode="vs-computer" />)
    expect(screen.getByText(/you to place/i)).toBeInTheDocument()
    expect(screen.getByText('You')).toBeInTheDocument()
    expect(screen.getByText('Computer')).toBeInTheDocument()
  })

  it('shows "Computer is thinking…" while it is black\'s turn to place or move', () => {
    const state: GameState = {
      ...createGame(),
      phase: 'moving',
      currentPlayer: 'black',
      piecesInHand: { white: 0, black: 0 },
      board: { ...createGame().board, a1: 'white', d7: 'black' },
    }
    render(<StatusBar state={state} mode="vs-computer" />)
    expect(screen.getByText(/computer is thinking/i)).toBeInTheDocument()
  })

  it('shows "Computer is thinking…" while a computer capture is pending', () => {
    const state: GameState = { ...createGame(), pendingCapture: 'black' }
    render(<StatusBar state={state} mode="vs-computer" />)
    expect(screen.getByText(/computer is thinking/i)).toBeInTheDocument()
  })

  it('shows "You to capture" while the human has a pending capture', () => {
    const state: GameState = { ...createGame(), pendingCapture: 'white' }
    render(<StatusBar state={state} mode="vs-computer" />)
    expect(screen.getByText(/you to capture/i)).toBeInTheDocument()
  })

  it('announces "You win" when the human wins', () => {
    const state: GameState = {
      ...createGame(),
      phase: 'moving',
      result: { type: 'win', winner: 'white', reason: 'White wins — Black has no legal moves' },
    }
    render(<StatusBar state={state} mode="vs-computer" />)
    expect(screen.getByText(/you win/i)).toBeInTheDocument()
  })

  it('announces "Computer wins" when the computer wins', () => {
    const state: GameState = {
      ...createGame(),
      phase: 'moving',
      result: { type: 'win', winner: 'black', reason: 'Black wins — White has no legal moves' },
    }
    render(<StatusBar state={state} mode="vs-computer" />)
    expect(screen.getByText(/computer wins/i)).toBeInTheDocument()
  })
})
