import { describe, expect, it } from 'vitest'
import { formatResultReason, playerLabel, winMessage } from './playerCopy'

describe('playerLabel', () => {
  it('returns You/Computer in vs-computer mode', () => {
    expect(playerLabel('white', 'vs-computer')).toBe('You')
    expect(playerLabel('black', 'vs-computer')).toBe('Computer')
  })

  it('returns capitalized White/Black in hotseat mode', () => {
    expect(playerLabel('white', 'hotseat')).toBe('White')
    expect(playerLabel('black', 'hotseat')).toBe('Black')
  })
})

describe('winMessage', () => {
  it('says "You win" when the human wins in vs-computer mode', () => {
    expect(winMessage('white', 'vs-computer')).toBe('You win')
  })

  it('says "Computer wins" when the computer wins in vs-computer mode', () => {
    expect(winMessage('black', 'vs-computer')).toBe('Computer wins')
  })

  it('says "White wins"/"Black wins" in hotseat mode', () => {
    expect(winMessage('white', 'hotseat')).toBe('White wins')
    expect(winMessage('black', 'hotseat')).toBe('Black wins')
  })
})

describe('formatResultReason', () => {
  it('rewrites a human win reason in vs-computer mode', () => {
    expect(formatResultReason('White wins — Black has no legal moves', 'vs-computer')).toBe(
      'You win — the computer has no legal moves',
    )
  })

  it('rewrites a computer win reason in vs-computer mode', () => {
    expect(
      formatResultReason('Black wins — White has fewer than three pieces', 'vs-computer'),
    ).toBe('Computer wins — you have fewer than three pieces')
  })

  it('leaves draw reasons unchanged in vs-computer mode', () => {
    expect(formatResultReason('Draw — 50 moves without a mill or capture', 'vs-computer')).toBe(
      'Draw — 50 moves without a mill or capture',
    )
  })

  it('leaves any reason unchanged in hotseat mode', () => {
    expect(formatResultReason('White wins — Black has no legal moves', 'hotseat')).toBe(
      'White wins — Black has no legal moves',
    )
  })
})
