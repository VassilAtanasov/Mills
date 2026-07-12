import { describe, expect, it } from 'vitest'
import { POINTS } from './board'
import { applyAction, createGame, getLegalActions } from './engine'
import type { Board, GameState, Player, PointId } from './types'

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
    phase: 'placing',
    currentPlayer: 'white',
    piecesInHand: { white: 9, black: 9 },
    pendingCapture: null,
    ...overrides,
  }
}

describe('createGame', () => {
  it('starts an empty board with white to place first', () => {
    const state = createGame()
    expect(state.phase).toBe('placing')
    expect(state.currentPlayer).toBe('white')
    expect(state.piecesInHand).toEqual({ white: 9, black: 9 })
    expect(state.pendingCapture).toBeNull()
    expect(POINTS.every((point) => state.board[point] === null)).toBe(true)
  })
})

describe('getLegalActions during placing', () => {
  it('returns a place action for every empty point', () => {
    const state = createGame()
    const actions = getLegalActions(state)
    expect(actions).toHaveLength(24)
    expect(actions.every((action) => action.type === 'place')).toBe(true)
  })
})

describe('placing', () => {
  it('rejects placing on an occupied point and leaves state unchanged', () => {
    const state = createGame()
    const placed = applyAction(state, { type: 'place', point: 'a1' })
    if (!placed.ok) throw new Error('expected placement to succeed')

    const result = applyAction(placed.state, { type: 'place', point: 'a1' })

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected rejection')
    expect(result.reason).toMatch(/occupied/)
  })

  it('alternates the current player after each placement', () => {
    const state = createGame()
    const afterWhite = applyAction(state, { type: 'place', point: 'a1' })
    if (!afterWhite.ok) throw new Error('expected placement to succeed')
    expect(afterWhite.state.currentPlayer).toBe('black')

    const afterBlack = applyAction(afterWhite.state, { type: 'place', point: 'a4' })
    if (!afterBlack.ok) throw new Error('expected placement to succeed')
    expect(afterBlack.state.currentPlayer).toBe('white')
  })

  it('decrements the placing player pieces in hand', () => {
    const state = createGame()
    const result = applyAction(state, { type: 'place', point: 'a1' })
    if (!result.ok) throw new Error('expected placement to succeed')
    expect(result.state.piecesInHand).toEqual({ white: 8, black: 9 })
  })

  it('transitions to the moving phase once all 18 pieces are placed without forming a mill', () => {
    const whitePoints: PointId[] = ['a1', 'a7', 'b4', 'c3', 'c5', 'd2', 'e4', 'f2', 'g4']
    const blackPoints: PointId[] = ['a4', 'b2', 'b6', 'd1', 'd3', 'e3', 'e5', 'g1', 'g7']

    let state = createGame()
    for (let i = 0; i < 9; i++) {
      const white = applyAction(state, { type: 'place', point: whitePoints[i] })
      if (!white.ok) throw new Error(`white placement ${i} rejected: unexpected`)
      expect(white.state.pendingCapture).toBeNull()
      const black = applyAction(white.state, { type: 'place', point: blackPoints[i] })
      if (!black.ok) throw new Error(`black placement ${i} rejected: unexpected`)
      expect(black.state.pendingCapture).toBeNull()
      state = black.state
    }

    expect(state.piecesInHand).toEqual({ white: 0, black: 0 })
    expect(state.phase).toBe('moving')
  })

  it('rejects placing once the placing phase has ended', () => {
    const state = stateWith({ phase: 'moving' })
    const result = applyAction(state, { type: 'place', point: 'a1' })
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected rejection')
    expect(result.reason).toMatch(/placing phase/)
  })
})

describe('mill formation', () => {
  it('requires a capture before the turn can end', () => {
    let state = createGame()
    for (const [player, point] of [
      ['white', 'a4'],
      ['black', 'e3'],
      ['white', 'b4'],
      ['black', 'e5'],
    ] as const) {
      expect(state.currentPlayer).toBe(player)
      const result = applyAction(state, { type: 'place', point })
      if (!result.ok) throw new Error('expected placement to succeed')
      state = result.state
    }

    // white completes the a4-b4-c4 mill
    const millResult = applyAction(state, { type: 'place', point: 'c4' })
    if (!millResult.ok) throw new Error('expected placement to succeed')
    expect(millResult.state.pendingCapture).toBe('white')
    expect(millResult.state.currentPlayer).toBe('white')

    const legalAfterMill = getLegalActions(millResult.state)
    expect(legalAfterMill.every((action) => action.type === 'capture')).toBe(true)

    const blockedPlace = applyAction(millResult.state, { type: 'place', point: 'g1' })
    expect(blockedPlace.ok).toBe(false)
    if (blockedPlace.ok) throw new Error('expected rejection')
    expect(blockedPlace.reason).toMatch(/capture is required/)
  })

  it('forming two mills in one move still yields exactly one capture', () => {
    let state = createGame()
    for (const [player, point] of [
      ['white', 'a4'],
      ['black', 'e3'],
      ['white', 'b4'],
      ['black', 'e5'],
      ['white', 'c3'],
      ['black', 'f2'],
      ['white', 'c5'],
      ['black', 'f6'],
    ] as const) {
      expect(state.currentPlayer).toBe(player)
      const result = applyAction(state, { type: 'place', point })
      if (!result.ok) throw new Error('expected placement to succeed')
      state = result.state
    }

    // white completes both a4-b4-c4 and c3-c4-c5 with a single placement
    const doubleMill = applyAction(state, { type: 'place', point: 'c4' })
    if (!doubleMill.ok) throw new Error('expected placement to succeed')
    expect(doubleMill.state.pendingCapture).toBe('white')

    const captureOptions = getLegalActions(doubleMill.state)
    expect(captureOptions).toHaveLength(4) // black's 4 free pieces: e3, e5, f2, f6

    const afterCapture = applyAction(doubleMill.state, { type: 'capture', point: 'e3' })
    if (!afterCapture.ok) throw new Error('expected capture to succeed')
    expect(afterCapture.state.board.e3).toBeNull()
    expect(afterCapture.state.pendingCapture).toBeNull()
    expect(afterCapture.state.currentPlayer).toBe('black')
  })
})

describe('capture rules', () => {
  it('allows capturing a free (non-mill) piece while the opponent has other free pieces', () => {
    const state = stateWith({
      board: boardWith({ b2: 'black', b4: 'black', b6: 'black', d2: 'black' }),
      currentPlayer: 'white',
      pendingCapture: 'white',
    })

    const legal = getLegalActions(state)
    expect(legal).toEqual([{ type: 'capture', point: 'd2' }])

    const result = applyAction(state, { type: 'capture', point: 'd2' })
    if (!result.ok) throw new Error('expected capture to succeed')
    expect(result.state.board.d2).toBeNull()
  })

  it('rejects capturing a mill piece while the opponent has free pieces elsewhere', () => {
    const state = stateWith({
      board: boardWith({ b2: 'black', b4: 'black', b6: 'black', d2: 'black' }),
      currentPlayer: 'white',
      pendingCapture: 'white',
    })

    const result = applyAction(state, { type: 'capture', point: 'b4' })
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected rejection')
    expect(result.reason).toMatch(/protected/)
  })

  it('allows capturing a mill piece when all opponent pieces are in mills', () => {
    const state = stateWith({
      board: boardWith({ b2: 'black', b4: 'black', b6: 'black' }),
      currentPlayer: 'white',
      pendingCapture: 'white',
    })

    const legal = getLegalActions(state)
    expect(legal.map((a) => (a.type === 'capture' ? a.point : null)).sort()).toEqual([
      'b2',
      'b4',
      'b6',
    ])

    const result = applyAction(state, { type: 'capture', point: 'b4' })
    if (!result.ok) throw new Error('expected capture to succeed')
    expect(result.state.board.b4).toBeNull()
  })

  it('rejects capturing an empty point', () => {
    const state = stateWith({ currentPlayer: 'white', pendingCapture: 'white' })
    const result = applyAction(state, { type: 'capture', point: 'a1' })
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected rejection')
    expect(result.reason).toMatch(/empty/)
  })

  it('rejects capturing your own piece', () => {
    const state = stateWith({
      board: boardWith({ a1: 'white' }),
      currentPlayer: 'white',
      pendingCapture: 'white',
    })
    const result = applyAction(state, { type: 'capture', point: 'a1' })
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected rejection')
    expect(result.reason).toMatch(/own piece/)
  })

  it('rejects a capture action when no capture is pending', () => {
    const state = stateWith({ board: boardWith({ a1: 'black' }) })
    const result = applyAction(state, { type: 'capture', point: 'a1' })
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected rejection')
    expect(result.reason).toMatch(/no capture is pending/)
  })
})

function movingState(overrides: Partial<GameState>): GameState {
  return stateWith({
    phase: 'moving',
    piecesInHand: { white: 0, black: 0 },
    ...overrides,
  })
}

describe('moving phase', () => {
  it('rejects moving to a non-adjacent point', () => {
    const state = movingState({ board: boardWith({ a1: 'white' }) })
    const result = applyAction(state, { type: 'move', from: 'a1', to: 'g7' })
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected rejection')
    expect(result.reason).toMatch(/not adjacent/)
  })

  it('rejects moving to an occupied point', () => {
    const state = movingState({ board: boardWith({ a1: 'white', a4: 'black' }) })
    const result = applyAction(state, { type: 'move', from: 'a1', to: 'a4' })
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected rejection')
    expect(result.reason).toMatch(/occupied/)
  })

  it("rejects moving a point that isn't the current player's piece", () => {
    const state = movingState({ board: boardWith({ a4: 'black' }), currentPlayer: 'white' })
    const result = applyAction(state, { type: 'move', from: 'a4', to: 'a7' })
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected rejection')
    expect(result.reason).toMatch(/does not hold your piece/)
  })

  it('moves to an adjacent empty point and passes the turn', () => {
    const state = movingState({ board: boardWith({ a1: 'white' }), currentPlayer: 'white' })
    const result = applyAction(state, { type: 'move', from: 'a1', to: 'a4' })
    if (!result.ok) throw new Error('expected move to succeed')
    expect(result.state.board.a1).toBeNull()
    expect(result.state.board.a4).toBe('white')
    expect(result.state.currentPlayer).toBe('black')
    expect(result.state.phase).toBe('moving')
  })

  it('reports only adjacency-legal moves for a non-flying player', () => {
    const state = movingState({ board: boardWith({ a1: 'white' }), currentPlayer: 'white' })
    const legal = getLegalActions(state)
    expect(legal).toHaveLength(2) // a1's adjacency: a4, d1
    expect(legal.every((action) => action.type === 'move' && action.from === 'a1')).toBe(true)
  })
})

describe('flying phase', () => {
  it('allows moving to any empty point at exactly three pieces', () => {
    const state = movingState({
      board: boardWith({ a1: 'white', b2: 'white', c3: 'white' }),
      currentPlayer: 'white',
    })
    const result = applyAction(state, { type: 'move', from: 'a1', to: 'g7' })
    if (!result.ok) throw new Error('expected flying move to succeed')
    expect(result.state.board.a1).toBeNull()
    expect(result.state.board.g7).toBe('white')
  })

  it('reports every empty point as a legal destination at exactly three pieces', () => {
    const state = movingState({
      board: boardWith({ a1: 'white', b2: 'white', c3: 'white' }),
      currentPlayer: 'white',
    })
    const legal = getLegalActions(state)
    expect(legal).toHaveLength(3 * 21) // 3 pieces x 21 empty points
  })

  it('does not allow flying at four or more pieces', () => {
    const state = movingState({
      board: boardWith({ a1: 'white', b2: 'white', c3: 'white', d5: 'white' }),
      currentPlayer: 'white',
    })
    const result = applyAction(state, { type: 'move', from: 'a1', to: 'g7' })
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected rejection')
    expect(result.reason).toMatch(/not adjacent/)
  })

  it('governs each player by their own piece count in a mixed state', () => {
    const state = movingState({
      board: boardWith({
        a1: 'white',
        b2: 'white',
        c3: 'white', // white: 3 pieces, flying
        d5: 'black',
        e3: 'black',
        f2: 'black',
        g4: 'black', // black: 4 pieces, adjacency only
      }),
      currentPlayer: 'white',
    })

    const whiteFly = applyAction(state, { type: 'move', from: 'a1', to: 'g7' })
    if (!whiteFly.ok) throw new Error('expected white flying move to succeed')
    expect(whiteFly.state.currentPlayer).toBe('black')

    const blackNonAdjacent = applyAction(whiteFly.state, { type: 'move', from: 'd5', to: 'a1' })
    expect(blackNonAdjacent.ok).toBe(false)
    if (blackNonAdjacent.ok) throw new Error('expected rejection')
    expect(blackNonAdjacent.reason).toMatch(/not adjacent/)

    const blackAdjacent = applyAction(whiteFly.state, { type: 'move', from: 'd5', to: 'c5' })
    if (!blackAdjacent.ok) throw new Error('expected adjacent black move to succeed')
    expect(blackAdjacent.state.board.c5).toBe('black')
  })
})

describe('mill formed by a move', () => {
  it('triggers the same required-capture flow as placing', () => {
    const state = movingState({
      board: boardWith({
        a4: 'white',
        b4: 'white',
        c5: 'white',
        d1: 'white',
        d2: 'black',
        e3: 'black',
      }),
      currentPlayer: 'white',
    })

    // c5 -> c4 completes the a4-b4-c4 mill
    const millMove = applyAction(state, { type: 'move', from: 'c5', to: 'c4' })
    if (!millMove.ok) throw new Error('expected move to succeed')
    expect(millMove.state.board.c4).toBe('white')
    expect(millMove.state.pendingCapture).toBe('white')
    expect(millMove.state.currentPlayer).toBe('white')

    const legal = getLegalActions(millMove.state)
    expect(legal.every((action) => action.type === 'capture')).toBe(true)
    expect(legal).toHaveLength(2)

    const afterCapture = applyAction(millMove.state, { type: 'capture', point: 'd2' })
    if (!afterCapture.ok) throw new Error('expected capture to succeed')
    expect(afterCapture.state.board.d2).toBeNull()
    expect(afterCapture.state.pendingCapture).toBeNull()
    expect(afterCapture.state.currentPlayer).toBe('black')
    expect(afterCapture.state.phase).toBe('moving')
  })
})
