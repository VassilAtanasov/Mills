import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useGame } from './useGame'

describe('useGame: vs-computer AI turn', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('schedules and plays a computer action ~0.5s after switching to vs-computer mode', () => {
    const { result } = renderHook(() => useGame())

    act(() => {
      result.current.setMode('vs-computer')
    })
    act(() => {
      result.current.pointClicked('a1')
    })

    expect(result.current.game.currentPlayer).toBe('black')
    expect(result.current.game.board.a1).toBe('white')

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current.game.currentPlayer).toBe('white')
    const blackMoves = Object.values(result.current.game.board).filter(
      (occupant) => occupant === 'black',
    )
    expect(blackMoves).toHaveLength(1)
  })

  it('does not let a human click act on behalf of black mid-computer-turn', () => {
    const { result } = renderHook(() => useGame())

    act(() => {
      result.current.setMode('vs-computer')
    })
    act(() => {
      result.current.pointClicked('a1')
    })

    // it's black's (the computer's) turn now, before the thinking delay fires
    act(() => {
      result.current.pointClicked('a4')
    })

    expect(result.current.game.board.a4).toBeNull()
    expect(result.current.game.currentPlayer).toBe('black')
  })

  it('never schedules a computer turn in hotseat mode', () => {
    const { result } = renderHook(() => useGame())

    act(() => {
      result.current.setMode('hotseat')
    })
    act(() => {
      result.current.pointClicked('a1')
    })

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.game.currentPlayer).toBe('black')
    const blackMoves = Object.values(result.current.game.board).filter(
      (occupant) => occupant === 'black',
    )
    expect(blackMoves).toHaveLength(0)
  })
})
