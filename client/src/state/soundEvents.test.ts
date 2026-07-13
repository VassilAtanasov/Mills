import { describe, expect, it } from 'vitest'
import { POINTS } from '../engine/board'
import { createGame } from '../engine/engine'
import type { Board, GameState, Player, PointId } from '../engine/types'
import { detectSoundEvent } from './soundEvents'

function boardWith(pieces: Partial<Record<PointId, Player>>): Board {
  const board = {} as Record<PointId, Player | null>
  for (const point of POINTS) {
    board[point] = pieces[point] ?? null
  }
  return board
}

function stateWith(overrides: Partial<GameState>): GameState {
  return {
    board: boardWith({}),
    phase: 'moving',
    currentPlayer: 'white',
    piecesInHand: { white: 0, black: 0 },
    pendingCapture: null,
    movesWithoutProgress: 0,
    positionCounts: {},
    result: null,
    ...overrides,
  }
}

describe('detectSoundEvent', () => {
  it('detects a placement/move when only the board changed', () => {
    const prev = stateWith({ board: boardWith({ a1: 'white' }) })
    const next = stateWith({ board: boardWith({ a4: 'white' }) })
    expect(detectSoundEvent(prev, next)).toBe('place')
  })

  it('detects a mill when a capture becomes newly pending', () => {
    const prev = stateWith({ board: boardWith({ a1: 'white', a4: 'white' }) })
    const next = stateWith({
      board: boardWith({ a1: 'white', a4: 'white', a7: 'white' }),
      pendingCapture: 'white',
    })
    expect(detectSoundEvent(prev, next)).toBe('mill')
  })

  it('detects a capture when a pending capture clears', () => {
    const prev = stateWith({
      pendingCapture: 'white',
      board: boardWith({ a1: 'white', a4: 'white', a7: 'white', d2: 'black' }),
    })
    const next = stateWith({
      pendingCapture: null,
      board: boardWith({ a1: 'white', a4: 'white', a7: 'white' }),
    })
    expect(detectSoundEvent(prev, next)).toBe('capture')
  })

  it('detects a win when the game newly has a win result', () => {
    const prev = stateWith({ board: boardWith({ a1: 'white', a4: 'white', a7: 'white' }) })
    const next = stateWith({
      board: boardWith({ a1: 'white', a4: 'white', a7: 'white' }),
      result: { type: 'win', winner: 'white', reason: 'White wins — Black has no legal moves' },
    })
    expect(detectSoundEvent(prev, next)).toBe('win')
  })

  it('detects a draw when the game newly has a draw result', () => {
    const prev = stateWith({})
    const next = stateWith({
      result: { type: 'draw', reason: 'Draw — the same position has occurred three times' },
    })
    expect(detectSoundEvent(prev, next)).toBe('draw')
  })

  it('prioritizes win over capture when the winning move is itself a capture', () => {
    const prev = stateWith({
      pendingCapture: 'white',
      phase: 'moving',
      board: boardWith({ a1: 'white', a4: 'white', a7: 'white', d2: 'black', d3: 'black' }),
    })
    const next = stateWith({
      pendingCapture: null,
      phase: 'moving',
      board: boardWith({ a1: 'white', a4: 'white', a7: 'white', d3: 'black' }),
      result: { type: 'win', winner: 'white', reason: 'White wins — Black has fewer than three pieces' },
    })
    expect(detectSoundEvent(prev, next)).toBe('win')
  })

  it('returns null for a transition into a fresh game (mode switch or rematch)', () => {
    const prev = stateWith({
      board: boardWith({ a1: 'white' }),
      result: { type: 'win', winner: 'white', reason: 'White wins — Black has no legal moves' },
    })
    const next = createGame()
    expect(detectSoundEvent(prev, next)).toBeNull()
  })

  it('returns null when nothing meaningfully changed', () => {
    const state = stateWith({ board: boardWith({ a1: 'white' }) })
    expect(detectSoundEvent(state, state)).toBeNull()
  })
})
