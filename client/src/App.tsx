import { useState } from 'react'
import { Board } from './components/Board'
import { ModeControl } from './components/ModeControl'
import { ResultModal } from './components/ResultModal'
import { StatusBar } from './components/StatusBar'
import { useGame } from './state/useGame'
import './styles/theme.css'
import './App.css'

function App() {
  const { game, mode, error, highlights, pointClicked, newGame, setMode } = useGame()
  const [modalDismissed, setModalDismissed] = useState(false)

  const handleRematch = () => {
    setModalDismissed(false)
    newGame()
  }

  return (
    <main className="app">
      <h1>Nine Men&apos;s Morris</h1>
      <ModeControl mode={mode} onModeChange={setMode} />
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
