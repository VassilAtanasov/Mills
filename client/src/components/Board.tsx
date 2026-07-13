import { ADJACENCY, POINTS } from '../engine/board'
import { isInMill } from '../engine/engine'
import type { GameState, PointId } from '../engine/types'
import './Board.css'
import { layoutFor, VIEWBOX_SIZE } from './boardLayout'
import { Piece } from './Piece'

interface BoardProps {
  readonly state: GameState
  readonly selected?: PointId | null
  readonly legalTargets?: ReadonlySet<PointId>
  readonly capturable?: ReadonlySet<PointId>
  readonly onPointClick?: (point: PointId) => void
}

function boardEdges(): readonly (readonly [PointId, PointId])[] {
  const edges: [PointId, PointId][] = []
  for (const point of POINTS) {
    for (const neighbor of ADJACENCY[point]) {
      if (POINTS.indexOf(neighbor) > POINTS.indexOf(point)) {
        edges.push([point, neighbor])
      }
    }
  }
  return edges
}

const EDGES = boardEdges()

const EMPTY_SET: ReadonlySet<PointId> = new Set()

export function Board({
  state,
  selected = null,
  legalTargets = EMPTY_SET,
  capturable = EMPTY_SET,
  onPointClick,
}: BoardProps) {
  return (
    <svg
      className="board"
      viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
      role="img"
      aria-label="Nine Men's Morris board"
    >
      <defs>
        <radialGradient id="board-wood-gradient" cx="35%" cy="30%" r="80%">
          <stop offset="0%" style={{ stopColor: 'var(--wood-board-light)' }} />
          <stop offset="55%" style={{ stopColor: 'var(--wood-board-mid)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--wood-board-dark)' }} />
        </radialGradient>
        <radialGradient id="piece-white-gradient" cx="35%" cy="30%" r="75%">
          <stop offset="0%" style={{ stopColor: 'var(--piece-white-highlight)' }} />
          <stop offset="60%" style={{ stopColor: 'var(--piece-white-base)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--piece-white-shadow)' }} />
        </radialGradient>
        <radialGradient id="piece-black-gradient" cx="35%" cy="30%" r="75%">
          <stop offset="0%" style={{ stopColor: 'var(--piece-black-highlight)' }} />
          <stop offset="60%" style={{ stopColor: 'var(--piece-black-base)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--piece-black-shadow)' }} />
        </radialGradient>
        <filter id="wood-noise" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves={2}
            seed={7}
            stitchTiles="stitch"
            result="noise"
          />
          <feColorMatrix
            in="noise"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.08 0"
          />
        </filter>
      </defs>

      <rect
        className="board-panel"
        x={0}
        y={0}
        width={VIEWBOX_SIZE}
        height={VIEWBOX_SIZE}
        fill="url(#board-wood-gradient)"
      />
      <rect
        className="board-panel"
        x={0}
        y={0}
        width={VIEWBOX_SIZE}
        height={VIEWBOX_SIZE}
        filter="url(#wood-noise)"
      />

      <g className="board-lines">
        {EDGES.map(([from, to]) => {
          const a = layoutFor(from)
          const b = layoutFor(to)
          return <line key={`${from}-${to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
        })}
      </g>

      <g className="board-points">
        {POINTS.map((point) => {
          const { x, y } = layoutFor(point)
          const occupant = state.board[point]
          const inMill = occupant !== null && isInMill(state.board, point, occupant)
          return (
            <g
              key={point}
              className="board-point"
              data-point={point}
              data-state={occupant ?? 'empty'}
              data-selected={selected === point}
              data-legal-target={legalTargets.has(point)}
              data-capturable={capturable.has(point)}
              data-in-mill={inMill}
              onClick={onPointClick ? () => onPointClick(point) : undefined}
            >
              <circle className="point-hit-area" cx={x} cy={y} r={26} />
              <circle className="point-marker" cx={x} cy={y} r={6} />
              {occupant ? <Piece player={occupant} cx={x} cy={y} /> : null}
            </g>
          )
        })}
      </g>
    </svg>
  )
}
