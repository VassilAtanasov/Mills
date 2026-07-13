import { describe, expect, it } from 'vitest'
import { POINTS } from '../engine/board'
import { getLegalActions } from '../engine/engine'
import type { Board, GameState, Player, PointId } from '../engine/types'
import { chooseAction } from './ai'

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
    currentPlayer: 'black',
    piecesInHand: { white: 0, black: 0 },
    pendingCapture: null,
    movesWithoutProgress: 0,
    positionCounts: {},
    result: null,
    ...overrides,
  }
}

const zeroRng = () => 0

describe('chooseAction: completing a mill', () => {
  it('completes its own mill when a mill-completing move is available', () => {
    // black has c3, c4 on the c3-c4-c5 line; d3 free move puts a piece on c5? use adjacency instead.
    // Black owns c3, c4 (two of the c-file mill) and a piece at d5 adjacent to c5 (the empty slot).
    const state = stateWith({
      board: boardWith({ c3: 'black', c4: 'black', d5: 'black', a1: 'white', a4: 'white' }),
    })

    const action = chooseAction(state, zeroRng)

    expect(action).toEqual({ type: 'move', from: 'd5', to: 'c5' })
  })

  it('prefers completing a mill over blocking an opponent threat it could otherwise block', () => {
    const state = stateWith({
      board: boardWith({
        // black can complete c3-c4-c5 by moving d5 -> c5, or block white's a-file threat by
        // moving d7 -> a7. Completing its own mill must win.
        c3: 'black',
        c4: 'black',
        d5: 'black',
        d7: 'black',
        a1: 'white',
        a4: 'white',
      }),
    })

    const action = chooseAction(state, zeroRng)

    expect(action).toEqual({ type: 'move', from: 'd5', to: 'c5' })
  })
})

describe('chooseAction: blocking an opponent mill', () => {
  it('blocks an opponent mill completable next turn when a blocking action exists', () => {
    // White owns a1, a4 (two of the a-file mill); the only empty slot is a7.
    // Black has a single piece adjacent to a7 (d7) and no mill of its own available.
    const state = stateWith({
      board: boardWith({ a1: 'white', a4: 'white', d7: 'black', g1: 'black' }),
    })

    const action = chooseAction(state, zeroRng)

    expect(action).toEqual({ type: 'move', from: 'd7', to: 'a7' })
  })
})

describe('chooseAction: capture target selection', () => {
  it('prefers a capture target that breaks an opponent potential mill over an isolated piece', () => {
    // black is capturing (just formed a mill). White has two pieces on the a-file mill (a1, a4 —
    // a potential mill) and one isolated piece elsewhere (g7). Capturing a1 or a4 breaks the
    // potential mill; capturing g7 does not.
    const state = stateWith({
      pendingCapture: 'black',
      currentPlayer: 'black',
      board: boardWith({ a1: 'white', a4: 'white', g7: 'white', b4: 'black' }),
    })

    const action = chooseAction(state, zeroRng)

    expect(action.type).toBe('capture')
    if (action.type === 'capture') {
      expect(['a1', 'a4']).toContain(action.point)
    }
  })

  it('only selects capture actions reported as legal by the engine', () => {
    const state = stateWith({
      pendingCapture: 'black',
      currentPlayer: 'black',
      board: boardWith({ a1: 'white', a4: 'white', g7: 'white', b4: 'black' }),
    })
    const legal = getLegalActions(state)

    const action = chooseAction(state, zeroRng)

    expect(legal).toContainEqual(action)
  })
})

describe('chooseAction: tie-breaking', () => {
  it('breaks ties between equally scored actions uniformly at random via the injected rng', () => {
    // Perfectly symmetric position: black has one piece with two equally good moves and no
    // mill/block tactics available for either.
    const state = stateWith({
      board: boardWith({ e4: 'black' }),
    })

    const chosenWithZero = chooseAction(state, () => 0)
    const chosenWithNearOne = chooseAction(state, () => 0.999999)

    expect(chosenWithZero).not.toEqual(chosenWithNearOne)
  })

  it('never calls into engine legality logic itself — every result is among the legal actions', () => {
    const state = stateWith({
      board: boardWith({ e4: 'black', a1: 'white', a4: 'white' }),
    })
    const legal = getLegalActions(state)

    for (const rngValue of [0, 0.25, 0.5, 0.75, 0.99]) {
      const action = chooseAction(state, () => rngValue)
      expect(legal).toContainEqual(action)
    }
  })
})
