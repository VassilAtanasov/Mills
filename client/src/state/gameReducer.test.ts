import { describe, expect, it } from 'vitest'
import { PIECES_PER_PLAYER } from '../engine/engine'
import type { GameState } from '../engine/types'
import { computeHighlights, createInitialUiState, gameReducer, type UiState } from './gameReducer'

function stateWith(overrides: Partial<UiState>): UiState {
  return { ...createInitialUiState(), ...overrides }
}

function movingGame(overrides: Partial<GameState>): GameState {
  const base = createInitialUiState().game
  return {
    ...base,
    phase: 'moving',
    piecesInHand: { white: 0, black: 0 },
    ...overrides,
  }
}

describe('gameReducer: placing phase', () => {
  it('places a piece on an empty point and advances the turn', () => {
    const state = createInitialUiState()
    const next = gameReducer(state, { type: 'POINT_CLICKED', point: 'a1' })
    expect(next.game.board.a1).toBe('white')
    expect(next.game.currentPlayer).toBe('black')
    expect(next.error).toBeNull()
  })

  it('surfaces the engine rejection reason verbatim when clicking an occupied point', () => {
    const hotseat = stateWith({ mode: 'hotseat' })
    const placed = gameReducer(hotseat, { type: 'POINT_CLICKED', point: 'a1' })
    const rejected = gameReducer(placed, { type: 'POINT_CLICKED', point: 'a1' })
    expect(rejected.error).toBe('point a1 is occupied')
    expect(rejected.game).toBe(placed.game) // unchanged
  })
})

describe('computeHighlights: placing phase', () => {
  it('marks every empty point as a legal target', () => {
    const highlights = computeHighlights(createInitialUiState())
    expect(highlights.legalTargets.size).toBe(24)
    expect(highlights.capturable.size).toBe(0)
    expect(highlights.selected).toBeNull()
  })
})

describe('gameReducer: moving/flying selection', () => {
  it('selects an own piece without calling the engine', () => {
    const game = movingGame({ board: { ...createInitialUiState().game.board, a1: 'white' } })
    const state = stateWith({ game })
    const next = gameReducer(state, { type: 'POINT_CLICKED', point: 'a1' })
    expect(next.selected).toBe('a1')
    expect(next.game).toBe(game) // no engine call, no state change
  })

  it('changes the selection when a different own piece is clicked', () => {
    const game = movingGame({
      board: { ...createInitialUiState().game.board, a1: 'white', d1: 'white' },
    })
    const state = stateWith({ game, selected: 'a1' })
    const next = gameReducer(state, { type: 'POINT_CLICKED', point: 'd1' })
    expect(next.selected).toBe('d1')
  })

  it('deselects when the already-selected piece is clicked again', () => {
    const game = movingGame({ board: { ...createInitialUiState().game.board, a1: 'white' } })
    const state = stateWith({ game, selected: 'a1' })
    const next = gameReducer(state, { type: 'POINT_CLICKED', point: 'a1' })
    expect(next.selected).toBeNull()
  })

  it('moves the selected piece to a legal destination and clears the selection', () => {
    const game = movingGame({ board: { ...createInitialUiState().game.board, a1: 'white' } })
    const state = stateWith({ game, selected: 'a1' })
    const next = gameReducer(state, { type: 'POINT_CLICKED', point: 'a4' })
    expect(next.game.board.a1).toBeNull()
    expect(next.game.board.a4).toBe('white')
    expect(next.selected).toBeNull()
  })

  it('surfaces the rejection reason for an illegal move and keeps the selection', () => {
    const game = movingGame({ board: { ...createInitialUiState().game.board, a1: 'white' } })
    const state = stateWith({ game, selected: 'a1' })
    const next = gameReducer(state, { type: 'POINT_CLICKED', point: 'g7' })
    expect(next.error).toBe('point g7 is not adjacent to a1')
    expect(next.selected).toBe('a1')
  })

  it('does nothing when clicking a non-own point with no selection', () => {
    const game = movingGame({ board: { ...createInitialUiState().game.board, a4: 'black' } })
    const state = stateWith({ game })
    const next = gameReducer(state, { type: 'POINT_CLICKED', point: 'a4' })
    expect(next).toBe(state)
  })
})

describe('computeHighlights: moving/flying selection', () => {
  it('reports only the selected piece adjacent destinations as legal targets', () => {
    const game = movingGame({ board: { ...createInitialUiState().game.board, a1: 'white' } })
    const highlights = computeHighlights(stateWith({ game, selected: 'a1' }))
    expect(highlights.selected).toBe('a1')
    expect([...highlights.legalTargets].sort()).toEqual(['a4', 'd1'])
  })

  it('reports no legal targets when nothing is selected', () => {
    const game = movingGame({ board: { ...createInitialUiState().game.board, a1: 'white' } })
    const highlights = computeHighlights(stateWith({ game }))
    expect(highlights.legalTargets.size).toBe(0)
  })
})

describe('gameReducer: forced capture', () => {
  it('requires a capture click and highlights only capturable points', () => {
    const board = { ...createInitialUiState().game.board }
    const game = movingGame({
      board: {
        ...board,
        a4: 'white',
        b4: 'white',
        c5: 'white',
        d1: 'white',
        d2: 'black',
        e3: 'black',
      },
    })

    // select c5, then move it to c4 to complete the a4-b4-c4 mill
    const selected = gameReducer(stateWith({ game }), { type: 'POINT_CLICKED', point: 'c5' })
    const afterMove = gameReducer(selected, { type: 'POINT_CLICKED', point: 'c4' })
    expect(afterMove.game.pendingCapture).toBe('white')

    const highlights = computeHighlights(afterMove)
    expect([...highlights.capturable].sort()).toEqual(['d2', 'e3'])
    expect(highlights.legalTargets.size).toBe(0)

    const captured = gameReducer(afterMove, { type: 'POINT_CLICKED', point: 'd2' })
    expect(captured.game.board.d2).toBeNull()
    expect(captured.game.pendingCapture).toBeNull()
    expect(captured.game.currentPlayer).toBe('black')
  })

  it('rejects placing/selecting while a capture is pending', () => {
    const game = movingGame({
      pendingCapture: 'white',
      board: { ...createInitialUiState().game.board, d2: 'black' },
    })
    const next = gameReducer(stateWith({ game }), { type: 'POINT_CLICKED', point: 'a1' })
    expect(next.error).toMatch(/empty/)
  })
})

describe('gameReducer: terminal state', () => {
  it('ignores clicks once the game has a result', () => {
    const game = movingGame({
      result: { type: 'win', winner: 'white', reason: 'White wins — Black has no legal moves' },
    })
    const state = stateWith({ game })
    const next = gameReducer(state, { type: 'POINT_CLICKED', point: 'a1' })
    expect(next).toBe(state)
  })
})

describe('createInitialUiState', () => {
  it('starts with a fresh game, no selection, and no error', () => {
    const state = createInitialUiState()
    expect(state.game.piecesInHand).toEqual({
      white: PIECES_PER_PLAYER,
      black: PIECES_PER_PLAYER,
    })
    expect(state.selected).toBeNull()
    expect(state.error).toBeNull()
  })
})

describe('gameReducer: SET_MODE', () => {
  it('defaults to vs-computer mode on load, with the human as White to move first', () => {
    const initial = createInitialUiState()
    expect(initial.mode).toBe('vs-computer')
    expect(initial.game.currentPlayer).toBe('white')
    expect(initial.game.phase).toBe('placing')
  })

  it('switches mode and starts a fresh game immediately', () => {
    const game = movingGame({ board: { ...createInitialUiState().game.board, a1: 'white' } })
    const state = stateWith({ game, selected: 'a1', error: 'stale error', mode: 'hotseat' })

    const next = gameReducer(state, { type: 'SET_MODE', mode: 'vs-computer' })

    expect(next.mode).toBe('vs-computer')
    expect(next.game.board.a1).toBeNull()
    expect(next.game.phase).toBe('placing')
    expect(next.selected).toBeNull()
    expect(next.error).toBeNull()
  })

  it('keeps vs-computer mode across a NEW_GAME (rematch)', () => {
    const game = movingGame({
      result: { type: 'win', winner: 'white', reason: 'White wins — Black has no legal moves' },
    })
    const state = stateWith({ game, mode: 'vs-computer' })

    const next = gameReducer(state, { type: 'NEW_GAME' })

    expect(next.mode).toBe('vs-computer')
    expect(next.game.result).toBeNull()
  })

  it('keeps hotseat mode across a NEW_GAME (rematch) too', () => {
    const game = movingGame({
      result: { type: 'draw', reason: 'Draw — 50 moves without a mill or capture' },
    })
    const state = stateWith({ game, mode: 'hotseat' })

    const next = gameReducer(state, { type: 'NEW_GAME' })

    expect(next.mode).toBe('hotseat')
    expect(next.game.result).toBeNull()
  })
})

describe('gameReducer: AI_ACTION', () => {
  it('applies the given action through the same engine path as human actions', () => {
    const state = stateWith({ mode: 'vs-computer' })

    const next = gameReducer(state, { type: 'AI_ACTION', action: { type: 'place', point: 'a1' } })

    expect(next.game.board.a1).toBe('white')
    expect(next.game.currentPlayer).toBe('black')
    expect(next.error).toBeNull()
  })

  it('surfaces a rejection reason if the AI action is somehow illegal', () => {
    const placed = gameReducer(stateWith({ mode: 'vs-computer' }), {
      type: 'AI_ACTION',
      action: { type: 'place', point: 'a1' },
    })

    const next = gameReducer(placed, { type: 'AI_ACTION', action: { type: 'place', point: 'a1' } })

    expect(next.error).toBe('point a1 is occupied')
  })
})

describe('gameReducer: vs-computer blocks human action on the computer turn', () => {
  it('ignores a POINT_CLICKED for black while it is the computer turn', () => {
    const game = movingGame({ board: { ...createInitialUiState().game.board, a4: 'black' } })
    const game2 = { ...game, currentPlayer: 'black' as const }
    const state = stateWith({ game: game2, mode: 'vs-computer' })

    const next = gameReducer(state, { type: 'POINT_CLICKED', point: 'a4' })

    expect(next).toBe(state)
  })

  it('ignores a POINT_CLICKED during a pending black capture', () => {
    const game = movingGame({
      pendingCapture: 'black',
      currentPlayer: 'black',
      board: { ...createInitialUiState().game.board, d2: 'white' },
    })
    const state = stateWith({ game, mode: 'vs-computer' })

    const next = gameReducer(state, { type: 'POINT_CLICKED', point: 'd2' })

    expect(next).toBe(state)
  })
})

describe('gameReducer: NEW_GAME', () => {
  it('resets to a fresh game from a terminal state', () => {
    const game = movingGame({
      board: { ...createInitialUiState().game.board, a1: 'white' },
      result: { type: 'win', winner: 'white', reason: 'White wins — Black has no legal moves' },
    })
    const state = stateWith({ game, selected: null, error: 'stale error' })

    const next = gameReducer(state, { type: 'NEW_GAME' })

    expect(next.game.result).toBeNull()
    expect(next.game.phase).toBe('placing')
    expect(next.game.piecesInHand).toEqual({
      white: PIECES_PER_PLAYER,
      black: PIECES_PER_PLAYER,
    })
    expect(next.selected).toBeNull()
    expect(next.error).toBeNull()
  })

  it('resets mid-game state too, not only terminal states', () => {
    const game = movingGame({ board: { ...createInitialUiState().game.board, a1: 'white' } })
    const state = stateWith({ game, selected: 'a1', error: 'point x is occupied' })

    const next = gameReducer(state, { type: 'NEW_GAME' })

    expect(next.game.board.a1).toBeNull()
    expect(next.selected).toBeNull()
    expect(next.error).toBeNull()
  })
})
