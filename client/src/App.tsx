import { Board } from './components/Board'
import { StatusBar } from './components/StatusBar'
import { useGame } from './state/useGame'
import './styles/theme.css'
import './App.css'

function App() {
  const { game, error, highlights, pointClicked } = useGame()

  return (
    <main className="app">
      <h1>Nine Men&apos;s Morris</h1>
      <StatusBar state={game} />
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
    </main>
  )
}

export default App
