import { useCallback, useEffect, useReducer, useRef } from 'react'
import * as audio from '../audio/audio'
import { chooseAction } from '../ai/ai'
import type { GameState, PointId } from '../engine/types'
import {
  computeHighlights,
  createInitialUiState,
  gameReducer,
  type Mode,
} from './gameReducer'
import { detectSoundEvent } from './soundEvents'

const AI_THINKING_DELAY_MS = 500

const SOUND_EFFECTS: Record<NonNullable<ReturnType<typeof detectSoundEvent>>, () => void> = {
  place: audio.playPlace,
  mill: audio.playMill,
  capture: audio.playCapture,
  win: audio.playWin,
  draw: audio.playDraw,
}

function isAiTurn(mode: Mode, game: GameState): boolean {
  if (mode !== 'vs-computer' || game.result) {
    return false
  }
  const actingPlayer = game.pendingCapture ?? game.currentPlayer
  return actingPlayer === 'black'
}

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialUiState)
  const { game, mode } = state
  const prevGameRef = useRef<GameState | null>(null)

  useEffect(() => {
    const prevGame = prevGameRef.current
    prevGameRef.current = game
    if (!prevGame) {
      return
    }
    const soundEvent = detectSoundEvent(prevGame, game)
    if (soundEvent) {
      SOUND_EFFECTS[soundEvent]()
    }
  }, [game])

  useEffect(() => {
    if (!isAiTurn(mode, game)) {
      return
    }

    const timer = setTimeout(() => {
      const action = chooseAction(game, Math.random)
      dispatch({ type: 'AI_ACTION', action })
    }, AI_THINKING_DELAY_MS)

    return () => clearTimeout(timer)
  }, [game, mode])

  const pointClicked = useCallback((point: PointId) => {
    dispatch({ type: 'POINT_CLICKED', point })
  }, [])

  const newGame = useCallback(() => {
    dispatch({ type: 'NEW_GAME' })
  }, [])

  const setMode = useCallback((nextMode: Mode) => {
    dispatch({ type: 'SET_MODE', mode: nextMode })
  }, [])

  return {
    game,
    mode,
    error: state.error,
    highlights: computeHighlights(state),
    pointClicked,
    newGame,
    setMode,
  }
}
