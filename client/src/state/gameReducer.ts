import { applyAction, createGame, getLegalActions } from '../engine/engine'
import type { Action, GameState, PointId } from '../engine/types'

export type Mode = 'hotseat' | 'vs-computer'

export interface UiState {
  readonly game: GameState
  readonly selected: PointId | null
  readonly error: string | null
  readonly mode: Mode
}

export type UiAction =
  | { type: 'POINT_CLICKED'; point: PointId }
  | { type: 'NEW_GAME' }
  | { type: 'SET_MODE'; mode: Mode }
  | { type: 'AI_ACTION'; action: Action }

export function createInitialUiState(): UiState {
  return { game: createGame(), selected: null, error: null, mode: 'vs-computer' }
}

export function gameReducer(state: UiState, action: UiAction): UiState {
  if (action.type === 'NEW_GAME') {
    return { ...createInitialUiState(), mode: state.mode }
  }

  if (action.type === 'SET_MODE') {
    return { ...createInitialUiState(), mode: action.mode }
  }

  if (action.type === 'AI_ACTION') {
    const result = applyAction(state.game, action.action)
    if (result.ok) {
      return { ...state, game: result.state, selected: null, error: null }
    }
    return { ...state, error: result.reason }
  }

  const { point } = action
  const { game, selected, mode } = state

  if (game.result) {
    return state
  }

  const actingPlayer = game.pendingCapture ?? game.currentPlayer
  if (mode === 'vs-computer' && actingPlayer === 'black') {
    return state
  }

  if (game.pendingCapture) {
    const result = applyAction(game, { type: 'capture', point })
    if (result.ok) {
      return { ...state, game: result.state, selected: null, error: null }
    }
    return { ...state, error: result.reason }
  }

  if (game.phase === 'placing') {
    const result = applyAction(game, { type: 'place', point })
    if (result.ok) {
      return { ...state, game: result.state, selected: null, error: null }
    }
    return { ...state, error: result.reason }
  }

  const isOwnPiece = game.board[point] === game.currentPlayer
  if (isOwnPiece) {
    return { ...state, selected: selected === point ? null : point, error: null }
  }

  if (selected === null) {
    return state
  }

  const result = applyAction(game, { type: 'move', from: selected, to: point })
  if (result.ok) {
    return { ...state, game: result.state, selected: null, error: null }
  }
  return { ...state, error: result.reason }
}

export interface Highlights {
  readonly selected: PointId | null
  readonly legalTargets: ReadonlySet<PointId>
  readonly capturable: ReadonlySet<PointId>
}

export function computeHighlights(state: UiState): Highlights {
  const { game, selected } = state

  if (game.result) {
    return { selected: null, legalTargets: new Set(), capturable: new Set() }
  }

  if (game.pendingCapture) {
    const capturable = new Set(
      getLegalActions(game)
        .filter(
          (action): action is { type: 'capture'; point: PointId } => action.type === 'capture',
        )
        .map((action) => action.point),
    )
    return { selected: null, legalTargets: new Set(), capturable }
  }

  if (game.phase === 'placing') {
    const legalTargets = new Set(
      getLegalActions(game)
        .filter((action): action is { type: 'place'; point: PointId } => action.type === 'place')
        .map((action) => action.point),
    )
    return { selected: null, legalTargets, capturable: new Set() }
  }

  if (selected) {
    const legalTargets = new Set(
      getLegalActions(game)
        .filter(
          (action): action is { type: 'move'; from: PointId; to: PointId } =>
            action.type === 'move' && action.from === selected,
        )
        .map((action) => action.to),
    )
    return { selected, legalTargets, capturable: new Set() }
  }

  return { selected: null, legalTargets: new Set(), capturable: new Set() }
}
