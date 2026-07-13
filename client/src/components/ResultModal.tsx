import type { KeyboardEvent } from 'react'
import type { GameResult } from '../engine/types'
import './ResultModal.css'

interface ResultModalProps {
  readonly result: GameResult
  readonly onRematch: () => void
  readonly onDismiss: () => void
}

export function ResultModal({ result, onRematch, onDismiss }: ResultModalProps) {
  const handleOverlayKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      onDismiss()
    }
  }

  return (
    <div className="result-modal-overlay" onKeyDown={handleOverlayKeyDown}>
      <div className="result-modal" role="dialog" aria-modal="true" aria-label="Game result">
        <button
          type="button"
          className="result-modal-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          ×
        </button>
        <p className="result-modal-outcome">{result.reason}</p>
        <button type="button" className="result-modal-rematch" onClick={onRematch}>
          Rematch
        </button>
      </div>
    </div>
  )
}
