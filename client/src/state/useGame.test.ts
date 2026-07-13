import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as audio from '../audio/audio'
import type { PointId } from '../engine/types'
import { useGame } from './useGame'

vi.mock('../audio/audio', () => ({
  playPlace: vi.fn(),
  playMill: vi.fn(),
  playCapture: vi.fn(),
  playWin: vi.fn(),
  playDraw: vi.fn(),
}))

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

describe('useGame: sound triggering', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('plays a placement sound for a human move in hotseat mode', () => {
    const { result } = renderHook(() => useGame())

    act(() => {
      result.current.setMode('hotseat')
    })
    act(() => {
      result.current.pointClicked('a1')
    })

    expect(audio.playPlace).toHaveBeenCalledTimes(1)
  })

  it("plays a placement sound for the computer's own move in vs-computer mode", () => {
    const { result } = renderHook(() => useGame())

    act(() => {
      result.current.setMode('vs-computer')
    })
    act(() => {
      result.current.pointClicked('a1') // human move
    })
    expect(audio.playPlace).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(500) // computer's move dispatches through AI_ACTION
    })

    expect(audio.playPlace).toHaveBeenCalledTimes(2)
  })

  it('does not play a sound when switching modes (fresh game, not a move)', () => {
    const { result } = renderHook(() => useGame())

    act(() => {
      result.current.setMode('hotseat')
    })

    expect(audio.playPlace).not.toHaveBeenCalled()
    expect(audio.playMill).not.toHaveBeenCalled()
    expect(audio.playCapture).not.toHaveBeenCalled()
    expect(audio.playWin).not.toHaveBeenCalled()
    expect(audio.playDraw).not.toHaveBeenCalled()
  })

  it('plays the mill sound when a human move forms a mill, and the capture sound on the forced capture', () => {
    const { result } = renderHook(() => useGame())

    act(() => {
      result.current.setMode('hotseat')
    })

    const placements: readonly PointId[] = ['a4', 'e3', 'b4', 'e5', 'c4'] // white completes a4-b4-c4
    for (const point of placements) {
      act(() => {
        result.current.pointClicked(point)
      })
    }

    expect(audio.playMill).toHaveBeenCalledTimes(1)
    expect(result.current.game.pendingCapture).toBe('white')

    act(() => {
      result.current.pointClicked('e3') // capture black's e3 piece
    })

    expect(audio.playCapture).toHaveBeenCalledTimes(1)
  })
})
