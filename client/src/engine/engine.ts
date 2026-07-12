import { ADJACENCY, MILLS, POINTS } from './board'
import type { Action, ActionResult, Board, GameState, Phase, Player, PointId } from './types'

function opponentOf(player: Player): Player {
  return player === 'white' ? 'black' : 'white'
}

function emptyBoard(): Board {
  const board = {} as Record<PointId, Player | null>
  for (const point of POINTS) {
    board[point] = null
  }
  return board
}

function isInMill(board: Board, point: PointId, player: Player): boolean {
  return MILLS.some(
    (line) => line.includes(point) && line.every((linePoint) => board[linePoint] === player),
  )
}

function millsThrough(
  board: Board,
  point: PointId,
  player: Player,
): readonly (readonly PointId[])[] {
  return MILLS.filter(
    (line) => line.includes(point) && line.every((linePoint) => board[linePoint] === player),
  )
}

function pointsOwnedBy(board: Board, player: Player): PointId[] {
  return POINTS.filter((point) => board[point] === player)
}

function reject(reason: string): ActionResult {
  return { ok: false, reason }
}

function nextPhaseAfterTurn(piecesInHand: Readonly<Record<Player, number>>): Phase {
  return piecesInHand.white === 0 && piecesInHand.black === 0 ? 'moving' : 'placing'
}

function isFlying(board: Board, player: Player): boolean {
  return pointsOwnedBy(board, player).length === 3
}

function moveDestinations(board: Board, from: PointId, flying: boolean): PointId[] {
  const candidates = flying ? POINTS : ADJACENCY[from]
  return candidates.filter((point) => board[point] === null)
}

export function createGame(): GameState {
  return {
    board: emptyBoard(),
    phase: 'placing',
    currentPlayer: 'white',
    piecesInHand: { white: 9, black: 9 },
    pendingCapture: null,
  }
}

export function getLegalActions(state: GameState): Action[] {
  if (state.pendingCapture) {
    const capturer = state.pendingCapture
    const opponent = opponentOf(capturer)
    const opponentPoints = pointsOwnedBy(state.board, opponent)
    const capturableFreely = opponentPoints.filter(
      (point) => !isInMill(state.board, point, opponent),
    )
    const capturable = capturableFreely.length > 0 ? capturableFreely : opponentPoints
    return capturable.map((point) => ({ type: 'capture', point }))
  }

  if (state.phase === 'placing') {
    return POINTS.filter((point) => state.board[point] === null).map((point) => ({
      type: 'place',
      point,
    }))
  }

  const player = state.currentPlayer
  const ownPoints = pointsOwnedBy(state.board, player)
  const flying = isFlying(state.board, player)
  const actions: Action[] = []
  for (const from of ownPoints) {
    for (const to of moveDestinations(state.board, from, flying)) {
      actions.push({ type: 'move', from, to })
    }
  }
  return actions
}

function applyCapture(state: GameState, point: PointId): ActionResult {
  const capturer = state.pendingCapture
  if (!capturer) {
    return reject('no capture is pending')
  }

  const opponent = opponentOf(capturer)
  const target = state.board[point]
  if (target === null) {
    return reject(`point ${point} is empty`)
  }
  if (target !== opponent) {
    return reject('cannot capture your own piece')
  }

  const opponentPoints = pointsOwnedBy(state.board, opponent)
  const capturableFreely = opponentPoints.filter((p) => !isInMill(state.board, p, opponent))
  if (isInMill(state.board, point, opponent) && capturableFreely.length > 0) {
    return reject(
      `${point} is protected by a mill while ${opponent} has unprotected pieces available`,
    )
  }

  const newBoard: Board = { ...state.board, [point]: null }
  const nextPlayer = opponentOf(capturer)

  return {
    ok: true,
    state: {
      ...state,
      board: newBoard,
      pendingCapture: null,
      currentPlayer: nextPlayer,
      phase: nextPhaseAfterTurn(state.piecesInHand),
    },
  }
}

function applyPlace(state: GameState, point: PointId): ActionResult {
  if (state.phase !== 'placing') {
    return reject('not in the placing phase')
  }
  if (state.board[point] !== null) {
    return reject(`point ${point} is occupied`)
  }

  const player = state.currentPlayer
  const newBoard: Board = { ...state.board, [point]: player }
  const newPiecesInHand = {
    ...state.piecesInHand,
    [player]: state.piecesInHand[player] - 1,
  }

  const formedMills = millsThrough(newBoard, point, player)
  if (formedMills.length > 0) {
    return {
      ok: true,
      state: {
        ...state,
        board: newBoard,
        piecesInHand: newPiecesInHand,
        pendingCapture: player,
      },
    }
  }

  return {
    ok: true,
    state: {
      ...state,
      board: newBoard,
      piecesInHand: newPiecesInHand,
      currentPlayer: opponentOf(player),
      phase: nextPhaseAfterTurn(newPiecesInHand),
    },
  }
}

function applyMove(state: GameState, from: PointId, to: PointId): ActionResult {
  if (state.phase !== 'moving') {
    return reject('not in the moving phase')
  }

  const player = state.currentPlayer
  if (state.board[from] !== player) {
    return reject(`point ${from} does not hold your piece`)
  }
  if (state.board[to] !== null) {
    return reject(`point ${to} is occupied`)
  }

  const flying = isFlying(state.board, player)
  if (!flying && !ADJACENCY[from].includes(to)) {
    return reject(`point ${to} is not adjacent to ${from}`)
  }

  const newBoard: Board = { ...state.board, [from]: null, [to]: player }

  const formedMills = millsThrough(newBoard, to, player)
  if (formedMills.length > 0) {
    return {
      ok: true,
      state: {
        ...state,
        board: newBoard,
        pendingCapture: player,
      },
    }
  }

  return {
    ok: true,
    state: {
      ...state,
      board: newBoard,
      currentPlayer: opponentOf(player),
    },
  }
}

export function applyAction(state: GameState, action: Action): ActionResult {
  if (state.pendingCapture) {
    if (action.type !== 'capture') {
      return reject('a capture is required before the turn can end')
    }
    return applyCapture(state, action.point)
  }

  if (action.type === 'capture') {
    return reject('no capture is pending')
  }

  if (action.type === 'move') {
    return applyMove(state, action.from, action.to)
  }

  return applyPlace(state, action.point)
}
