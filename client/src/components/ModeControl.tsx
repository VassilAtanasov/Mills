import type { Mode } from '../state/gameReducer'
import './ModeControl.css'

interface ModeControlProps {
  readonly mode: Mode
  readonly onModeChange: (mode: Mode) => void
}

export function ModeControl({ mode, onModeChange }: ModeControlProps) {
  return (
    <div className="mode-control" role="group" aria-label="Game mode">
      <button
        type="button"
        className="mode-control-button"
        aria-pressed={mode === 'hotseat'}
        onClick={() => onModeChange('hotseat')}
      >
        2 players
      </button>
      <button
        type="button"
        className="mode-control-button"
        aria-pressed={mode === 'vs-computer'}
        onClick={() => onModeChange('vs-computer')}
      >
        vs computer
      </button>
    </div>
  )
}
