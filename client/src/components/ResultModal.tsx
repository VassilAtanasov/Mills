import { useEffect, useRef, type KeyboardEvent } from 'react'
import type { GameResult } from '../engine/types'
import type { Mode } from '../state/gameReducer'
import { formatResultReason } from '../state/playerCopy'
import './ResultModal.css'

interface ResultModalProps {
  readonly result: GameResult
  readonly mode: Mode
  readonly onRematch: () => void
  readonly onDismiss: () => void
}

export function ResultModal({ result, mode, onRematch, onDismiss }: ResultModalProps) {
  const dismissRef = useRef<HTMLButtonElement>(null)
  const rematchRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    dismissRef.current?.focus()
  }, [])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      onDismiss()
      return
    }
    if (event.key !== 'Tab') {
      return
    }

    const first = dismissRef.current
    const last = rematchRef.current
    if (!first || !last) {
      return
    }

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div className="result-modal-overlay">
      <div
        className="result-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Game result"
        onKeyDown={handleKeyDown}
      >
        <button
          type="button"
          ref={dismissRef}
          className="result-modal-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          ×
        </button>
        <p className="result-modal-outcome">{formatResultReason(result.reason, mode)}</p>
        <button type="button" ref={rematchRef} className="result-modal-rematch" onClick={onRematch}>
          Rematch
        </button>
      </div>
    </div>
  )
}
