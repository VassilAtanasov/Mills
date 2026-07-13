import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { POINTS } from '../engine/board'
import type { Board, PointId } from '../engine/types'
import { useCaptureGhost } from './useCaptureGhost'

function boardWith(pieces: Partial<Record<PointId, 'white' | 'black'>>): Board {
  const board = {} as Record<PointId, 'white' | 'black' | null>
  for (const point of POINTS) {
    board[point] = pieces[point] ?? null
  }
  return board
}

describe('useCaptureGhost', () => {
  it('starts with no ghost', () => {
    const { result } = renderHook(({ board }) => useCaptureGhost(board), {
      initialProps: { board: boardWith({ a1: 'white' }) },
    })
    expect(result.current[0]).toBeNull()
  })

  it('shows a ghost when a point is vacated with nothing filled (a pure capture)', () => {
    const { result, rerender } = renderHook(({ board }) => useCaptureGhost(board), {
      initialProps: { board: boardWith({ a1: 'white', d2: 'black' }) },
    })

    rerender({ board: boardWith({ a1: 'white' }) }) // d2 captured

    expect(result.current[0]).toEqual({ point: 'd2', player: 'black' })
  })

  it('does not show a ghost for a placement (filled, nothing vacated)', () => {
    const { result, rerender } = renderHook(({ board }) => useCaptureGhost(board), {
      initialProps: { board: boardWith({ a1: 'white' }) },
    })

    rerender({ board: boardWith({ a1: 'white', d2: 'black' }) })

    expect(result.current[0]).toBeNull()
  })

  it('does not show a ghost for a move (one vacated, one filled by the same player)', () => {
    const { result, rerender } = renderHook(({ board }) => useCaptureGhost(board), {
      initialProps: { board: boardWith({ a1: 'white' }) },
    })

    rerender({ board: boardWith({ a4: 'white' }) }) // a1 -> a4

    expect(result.current[0]).toBeNull()
  })

  it('clears the ghost when the clear function is called', () => {
    const { result, rerender } = renderHook(({ board }) => useCaptureGhost(board), {
      initialProps: { board: boardWith({ a1: 'white', d2: 'black' }) },
    })

    rerender({ board: boardWith({ a1: 'white' }) })
    expect(result.current[0]).not.toBeNull()

    act(() => {
      result.current[1]()
    })

    expect(result.current[0]).toBeNull()
  })
})
