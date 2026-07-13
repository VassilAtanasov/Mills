import { POINTS } from '../engine/board'
import { PIECES_PER_PLAYER } from '../engine/engine'
import type { GameState, Player } from '../engine/types'
import type { Mode } from '../state/gameReducer'
import { playerLabel, winMessage } from '../state/playerCopy'
import './StatusBar.css'

interface StatusBarProps {
  readonly state: GameState
  readonly mode: Mode
}

const PLAYERS: readonly Player[] = ['white', 'black']

function piecesOnBoard(state: GameState, player: Player): number {
  return POINTS.filter((point) => state.board[point] === player).length
}

function turnMessage(state: GameState, mode: Mode): string {
  if (state.result) {
    return state.result.type === 'win' ? winMessage(state.result.winner, mode) : 'Draw'
  }

  const actingPlayer = state.pendingCapture ?? state.currentPlayer
  if (mode === 'vs-computer' && actingPlayer === 'black') {
    return 'Computer is thinking…'
  }

  const label = playerLabel(actingPlayer, mode)
  if (state.pendingCapture) {
    return `${label} to capture`
  }
  return `${label} to ${state.phase === 'placing' ? 'place' : 'move'}`
}

export function StatusBar({ state, mode }: StatusBarProps) {
  return (
    <section className="status-bar" aria-label="Game status">
      <p className="status-turn">{turnMessage(state, mode)}</p>
      <p className="status-phase">Phase: {state.phase}</p>
      <dl className="status-players">
        {PLAYERS.map((player) => {
          const onBoard = piecesOnBoard(state, player)
          const placed = PIECES_PER_PLAYER - state.piecesInHand[player]
          const captured = placed - onBoard
          return (
            <div className="status-player" key={player} data-player={player}>
              <dt>{playerLabel(player, mode)}</dt>
              <dd>In hand: {state.piecesInHand[player]}</dd>
              <dd>Captured: {captured}</dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}
