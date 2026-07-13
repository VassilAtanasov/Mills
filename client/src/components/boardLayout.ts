import type { PointId } from '../engine/types'

export const VIEWBOX_SIZE = 600
const MARGIN = 60
const STEP = (VIEWBOX_SIZE - MARGIN * 2) / 6

const COLUMN_INDEX: Record<string, number> = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6 }
const ROW_INDEX: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6 }

export interface PointLayout {
  readonly x: number
  readonly y: number
}

export function layoutFor(point: PointId): PointLayout {
  const column = COLUMN_INDEX[point[0]]
  const row = ROW_INDEX[point[1]]
  return { x: MARGIN + column * STEP, y: MARGIN + row * STEP }
}
