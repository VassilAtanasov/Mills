export type Player = 'white' | 'black'

export type PointId =
  | 'a1'
  | 'a4'
  | 'a7'
  | 'b2'
  | 'b4'
  | 'b6'
  | 'c3'
  | 'c4'
  | 'c5'
  | 'd1'
  | 'd2'
  | 'd3'
  | 'd5'
  | 'd6'
  | 'd7'
  | 'e3'
  | 'e4'
  | 'e5'
  | 'f2'
  | 'f4'
  | 'f6'
  | 'g1'
  | 'g4'
  | 'g7'

export type Phase = 'placing' | 'moving'

export type Board = Readonly<Record<PointId, Player | null>>

export type GameResult =
  { type: 'win'; winner: Player; reason: string } | { type: 'draw'; reason: string }

export interface GameState {
  readonly board: Board
  readonly phase: Phase
  readonly currentPlayer: Player
  readonly piecesInHand: Readonly<Record<Player, number>>
  readonly pendingCapture: Player | null
  readonly movesWithoutProgress: number
  readonly positionCounts: Readonly<Record<string, number>>
  readonly result: GameResult | null
}

export type Action =
  | { type: 'place'; point: PointId }
  | { type: 'move'; from: PointId; to: PointId }
  | { type: 'capture'; point: PointId }

export type ActionResult = { ok: true; state: GameState } | { ok: false; reason: string }
