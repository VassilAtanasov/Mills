import { POINTS } from '../engine/board'
import { PIECES_PER_PLAYER } from '../engine/engine'
import type { GameState, Player } from '../engine/types'
import './StatusBar.css'

interface StatusBarProps {
  readonly state: GameState
}

const PLAYERS: readonly Player[] = ['white', 'black']

function capitalize(player: Player): string {
  return player.charAt(0).toUpperCase() + player.slice(1)
}

function piecesOnBoard(state: GameState, player: Player): number {
  return POINTS.filter((point) => state.board[point] === player).length
}

function turnMessage(state: GameState): string {
  if (state.result) {
    return state.result.type === 'win' ? `${capitalize(state.result.winner)} wins` : 'Draw'
  }
  if (state.pendingCapture) {
    return `${capitalize(state.currentPlayer)} to capture`
  }
  return `${capitalize(state.currentPlayer)} to ${state.phase === 'placing' ? 'place' : 'move'}`
}

export function StatusBar({ state }: StatusBarProps) {
  return (
    <section className="status-bar" aria-label="Game status">
      <p className="status-turn">{turnMessage(state)}</p>
      <p className="status-phase">Phase: {state.phase}</p>
      <dl className="status-players">
        {PLAYERS.map((player) => {
          const onBoard = piecesOnBoard(state, player)
          const placed = PIECES_PER_PLAYER - state.piecesInHand[player]
          const captured = placed - onBoard
          return (
            <div className="status-player" key={player} data-player={player}>
              <dt>{capitalize(player)}</dt>
              <dd>In hand: {state.piecesInHand[player]}</dd>
              <dd>Captured: {captured}</dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}
