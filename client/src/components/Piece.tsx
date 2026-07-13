import type { Player } from '../engine/types'

interface PieceProps {
  readonly player: Player
  readonly cx: number
  readonly cy: number
  readonly radius?: number
}

const DEFAULT_RADIUS = 20

export function Piece({ player, cx, cy, radius = DEFAULT_RADIUS }: PieceProps) {
  const gradientId = player === 'white' ? 'piece-white-gradient' : 'piece-black-gradient'
  const markColor = player === 'white' ? 'var(--piece-white-mark)' : 'var(--piece-black-mark)'

  return (
    <g className="piece" data-player={player}>
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={`url(#${gradientId})`}
        stroke="var(--wood-line-soft)"
        strokeWidth={1}
      />
      {player === 'white' ? (
        <circle cx={cx} cy={cy} r={radius * 0.45} fill="none" stroke={markColor} strokeWidth={2} />
      ) : (
        <g stroke={markColor} strokeWidth={3} strokeLinecap="round">
          <line x1={cx - radius * 0.35} y1={cy} x2={cx + radius * 0.35} y2={cy} />
          <line x1={cx} y1={cy - radius * 0.35} x2={cx} y2={cy + radius * 0.35} />
        </g>
      )}
    </g>
  )
}
