import { describe, expect, it } from 'vitest'
import { ADJACENCY, MILLS, POINTS } from './board'

describe('board', () => {
  it('has the standard 24 points', () => {
    expect(POINTS).toHaveLength(24)
    expect(new Set(POINTS).size).toBe(24)
  })

  it('has a symmetric adjacency graph with no diagonals', () => {
    for (const point of POINTS) {
      for (const neighbor of ADJACENCY[point]) {
        expect(ADJACENCY[neighbor]).toContain(point)
      }
    }
  })

  it('has exactly 16 mill lines of 3 points each', () => {
    expect(MILLS).toHaveLength(16)
    for (const line of MILLS) {
      expect(line).toHaveLength(3)
      for (const point of line) {
        expect(POINTS).toContain(point)
      }
    }
  })

  it('has no duplicate mill lines', () => {
    const serialized = MILLS.map((line) => [...line].sort().join(','))
    expect(new Set(serialized).size).toBe(MILLS.length)
  })
})
