import type { Player } from '../engine/types'
import type { Mode } from './gameReducer'

function capitalize(player: Player): string {
  return player.charAt(0).toUpperCase() + player.slice(1)
}

export function playerLabel(player: Player, mode: Mode): string {
  if (mode !== 'vs-computer') {
    return capitalize(player)
  }
  return player === 'white' ? 'You' : 'Computer'
}

export function winMessage(winner: Player, mode: Mode): string {
  if (mode === 'vs-computer' && winner === 'white') {
    return 'You win'
  }
  return `${playerLabel(winner, mode)} wins`
}

/**
 * Engine-generated result reasons always follow one of two templates:
 * "<Winner> wins — <Loser> has fewer than three pieces" or
 * "<Winner> wins — <Loser> has no legal moves" (draw reasons never mention a player).
 * Rewriting them for vs-computer copy is a fixed find/replace over those templates,
 * not general text generation — keeps the engine's reason strings untouched (D-2).
 */
export function formatResultReason(reason: string, mode: Mode): string {
  if (mode !== 'vs-computer') {
    return reason
  }
  return reason
    .replace(/^White wins/, 'You win')
    .replace(/^Black wins/, 'Computer wins')
    .replace(/White has/, 'you have')
    .replace(/Black has/, 'the computer has')
}
