import { useEffect, useRef, useState } from 'react'
import { POINTS } from '../engine/board'
import type { Board, Player, PointId } from '../engine/types'

export interface CaptureGhost {
  readonly point: PointId
  readonly player: Player
}

function findPureCapture(prevBoard: Board, nextBoard: Board): CaptureGhost | null {
  let vacatedPoint: PointId | null = null
  let vacatedPlayer: Player | null = null
  let vacatedCount = 0
  let anyFilled = false

  for (const point of POINTS) {
    const prevOccupant = prevBoard[point]
    const nextOccupant = nextBoard[point]
    if (prevOccupant !== null && nextOccupant === null) {
      vacatedCount++
      vacatedPoint = point
      vacatedPlayer = prevOccupant
    }
    if (prevOccupant === null && nextOccupant !== null) {
      anyFilled = true
    }
  }

  if (vacatedCount === 1 && !anyFilled && vacatedPoint && vacatedPlayer) {
    return { point: vacatedPoint, player: vacatedPlayer }
  }
  return null
}

export function useCaptureGhost(board: Board): [CaptureGhost | null, () => void] {
  const prevBoardRef = useRef(board)
  const [ghost, setGhost] = useState<CaptureGhost | null>(null)

  useEffect(() => {
    const prevBoard = prevBoardRef.current
    if (prevBoard !== board) {
      setGhost(findPureCapture(prevBoard, board))
      prevBoardRef.current = board
    }
  }, [board])

  const clearGhost = () => setGhost(null)

  return [ghost, clearGhost]
}
