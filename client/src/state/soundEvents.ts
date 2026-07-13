import { POINTS } from '../engine/board'
import { PIECES_PER_PLAYER } from '../engine/engine'
import type { GameState } from '../engine/types'

export type SoundEvent = 'place' | 'mill' | 'capture' | 'win' | 'draw'

function isFreshGame(state: GameState): boolean {
  return (
    state.phase === 'placing' &&
    state.pendingCapture === null &&
    state.result === null &&
    state.piecesInHand.white === PIECES_PER_PLAYER &&
    state.piecesInHand.black === PIECES_PER_PLAYER &&
    POINTS.every((point) => state.board[point] === null)
  )
}

/**
 * Classifies a UI game-state transition into the sound cue it should trigger, purely from
 * the before/after GameState — mirrors the useCaptureGhost prev/next-board-diff pattern.
 * A transition into a fresh game (mode switch, rematch) is never a cue: it isn't a move.
 */
export function detectSoundEvent(prev: GameState, next: GameState): SoundEvent | null {
  if (isFreshGame(next)) {
    return null
  }

  if (!prev.result && next.result) {
    return next.result.type === 'win' ? 'win' : 'draw'
  }

  if (!prev.pendingCapture && next.pendingCapture) {
    return 'mill'
  }

  if (prev.pendingCapture && !next.pendingCapture) {
    return 'capture'
  }

  if (prev.board !== next.board) {
    return 'place'
  }

  return null
}
