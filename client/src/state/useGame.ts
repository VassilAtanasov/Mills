import { useCallback, useReducer } from 'react'
import type { PointId } from '../engine/types'
import { computeHighlights, createInitialUiState, gameReducer } from './gameReducer'

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialUiState)

  const pointClicked = useCallback((point: PointId) => {
    dispatch({ type: 'POINT_CLICKED', point })
  }, [])

  const newGame = useCallback(() => {
    dispatch({ type: 'NEW_GAME' })
  }, [])

  return {
    game: state.game,
    error: state.error,
    highlights: computeHighlights(state),
    pointClicked,
    newGame,
  }
}
