import { MILLS } from '../engine/board'
import { applyAction, getLegalActions } from '../engine/engine'
import type { Action, GameState, Player, PointId } from '../engine/types'

function opponentOf(player: Player): Player {
  return player === 'white' ? 'black' : 'white'
}

function threatPoints(state: GameState, player: Player): ReadonlySet<PointId> {
  const threats = new Set<PointId>()
  for (const line of MILLS) {
    const owned = line.filter((point) => state.board[point] === player)
    const empties = line.filter((point) => state.board[point] === null)
    if (owned.length === 2 && empties.length === 1) {
      threats.add(empties[0])
    }
  }
  return threats
}

function landingPoint(action: Action): PointId {
  return action.type === 'move' ? action.to : action.point
}

interface ScoredAction {
  readonly action: Action
  readonly score: number
}

function pickBestByScore(scored: readonly ScoredAction[], rng: () => number): Action {
  const maxScore = Math.max(...scored.map((entry) => entry.score))
  const best = scored.filter((entry) => entry.score === maxScore)
  const index = Math.min(Math.floor(rng() * best.length), best.length - 1)
  return best[index].action
}

function positionalScore(previewState: GameState, player: Player, opponent: Player): number {
  const opponentMobility = getLegalActions(previewState).length
  const ownThreats = threatPoints(previewState, player).size
  const opponentThreats = threatPoints(previewState, opponent).size
  return ownThreats * 5 - opponentThreats * 4 - opponentMobility
}

function pickPlaceOrMoveAction(
  state: GameState,
  actions: readonly Action[],
  rng: () => number,
): Action {
  const player = state.currentPlayer
  const opponent = opponentOf(player)
  const opponentThreatsBefore = threatPoints(state, opponent)

  const scored = actions.map((action): ScoredAction => {
    const preview = applyAction(state, action)
    if (!preview.ok) {
      throw new Error(`AI selected an action the engine rejected: ${preview.reason}`)
    }

    if (preview.state.pendingCapture === player) {
      return { action, score: 1_000_000 }
    }

    const blocksThreat = opponentThreatsBefore.has(landingPoint(action))
    const score = (blocksThreat ? 100_000 : 0) + positionalScore(preview.state, player, opponent)
    return { action, score }
  })

  return pickBestByScore(scored, rng)
}

function pickCaptureAction(
  state: GameState,
  actions: readonly Action[],
  rng: () => number,
): Action {
  const capturer = state.pendingCapture as Player
  const opponent = opponentOf(capturer)

  const scored = actions.map((action): ScoredAction => {
    if (action.type !== 'capture') {
      throw new Error('expected a capture action while a capture is pending')
    }

    const breaksPotentialMill = MILLS.some(
      (line) =>
        line.includes(action.point) &&
        line.filter((point) => state.board[point] === opponent).length === 2,
    )

    const preview = applyAction(state, action)
    if (!preview.ok) {
      throw new Error(`AI selected a capture the engine rejected: ${preview.reason}`)
    }
    const opponentMobilityAfter = getLegalActions(preview.state).length

    const score = (breaksPotentialMill ? 1_000 : 0) - opponentMobilityAfter
    return { action, score }
  })

  return pickBestByScore(scored, rng)
}

export function chooseAction(state: GameState, rng: () => number): Action {
  const legalActions = getLegalActions(state)
  if (legalActions.length === 0) {
    throw new Error('chooseAction called with no legal actions available')
  }

  if (state.pendingCapture) {
    return pickCaptureAction(state, legalActions, rng)
  }

  return pickPlaceOrMoveAction(state, legalActions, rng)
}
