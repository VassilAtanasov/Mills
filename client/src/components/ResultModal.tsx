import type { GameResult } from '../engine/types'
import './ResultModal.css'

interface ResultModalProps {
  readonly result: GameResult
  readonly onRematch: () => void
}

export function ResultModal({ result, onRematch }: ResultModalProps) {
  return (
    <div className="result-modal-overlay">
      <div className="result-modal" role="dialog" aria-modal="true" aria-label="Game result">
        <p className="result-modal-outcome">{result.reason}</p>
        <button type="button" className="result-modal-rematch" onClick={onRematch}>
          Rematch
        </button>
      </div>
    </div>
  )
}
