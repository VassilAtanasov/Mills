import { useState } from 'react'
import { setMuted } from './audio/audio'
import { Board } from './components/Board'
import { ModeControl } from './components/ModeControl'
import { MuteToggle } from './components/MuteToggle'
import { ResultModal } from './components/ResultModal'
import { StatusBar } from './components/StatusBar'
import { useGame } from './state/useGame'
import './styles/theme.css'
import './App.css'

function App() {
  const { game, mode, error, highlights, pointClicked, newGame, setMode } = useGame()
  const [modalDismissed, setModalDismissed] = useState(false)
  const [muted, setMutedState] = useState(false)

  const handleRematch = () => {
    setModalDismissed(false)
    newGame()
  }

  const handleMuteToggle = () => {
    const next = !muted
    setMutedState(next)
    setMuted(next)
  }

  return (
    <main className="app">
      <h1>Nine Men&apos;s Morris</h1>
      <div className="app-controls">
        <ModeControl mode={mode} onModeChange={setMode} />
        <MuteToggle muted={muted} onToggle={handleMuteToggle} />
      </div>
      <StatusBar state={game} mode={mode} />
      {error ? (
        <p className="app-error" role="alert">
          {error}
        </p>
      ) : null}
      <Board
        state={game}
        selected={highlights.selected}
        legalTargets={highlights.legalTargets}
        capturable={highlights.capturable}
        onPointClick={pointClicked}
      />
      {game.result && !modalDismissed ? (
        <ResultModal
          result={game.result}
          mode={mode}
          onRematch={handleRematch}
          onDismiss={() => setModalDismissed(true)}
        />
      ) : null}
    </main>
  )
}

export default App
