import './MuteToggle.css'

interface MuteToggleProps {
  readonly muted: boolean
  readonly onToggle: () => void
}

export function MuteToggle({ muted, onToggle }: MuteToggleProps) {
  return (
    <button
      type="button"
      className="mute-toggle"
      aria-pressed={muted}
      aria-label={muted ? 'Unmute sound' : 'Mute sound'}
      onClick={onToggle}
    >
      <span aria-hidden="true">{muted ? '🔇' : '🔊'}</span>
    </button>
  )
}
