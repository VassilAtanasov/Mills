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

    // 3 rings of 8 edges each + 4 spokes of 2 edges each = 32 undirected edges = 64 directed entries.
    // A diagonal (or any other extra) edge would push this total past the standard board's shape.
    const totalDirectedEdges = POINTS.reduce((sum, point) => sum + ADJACENCY[point].length, 0)
    expect(totalDirectedEdges).toBe(64)
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
