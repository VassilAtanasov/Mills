import { Board } from './components/Board'
import { StatusBar } from './components/StatusBar'
import { createGame } from './engine/engine'
import './styles/theme.css'
import './App.css'

function App() {
  const state = createGame()

  return (
    <main className="app">
      <h1>Nine Men&apos;s Morris</h1>
      <StatusBar state={state} />
      <Board state={state} />
    </main>
  )
}

export default App
