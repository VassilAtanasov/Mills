import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('loads directly into a vs-computer game, with the human to place first, no setup screen', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /nine men's morris/i })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /nine men's morris board/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'vs computer' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByText(/you to place/i)).toBeInTheDocument()
  })

  it('places a piece via Tab-then-Enter keyboard interaction, then shows the computer thinking', () => {
    render(<App />)

    const point = screen.getByRole('button', { name: /^point a1, empty/i })
    point.focus()
    expect(point).toHaveFocus()
    fireEvent.keyDown(point, { key: 'Enter' })

    expect(screen.getByText(/computer is thinking/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^point a1, white piece/i })).toBeInTheDocument()
  })

  it('renders no result modal while the game is in progress', () => {
    render(<App />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('switches to hotseat mode and uses White/Black copy there', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '2 players' }))
    expect(screen.getByText(/white to place/i)).toBeInTheDocument()

    const point = screen.getByRole('button', { name: /^point a1, empty/i })
    fireEvent.click(point)
    expect(screen.getByText(/black to place/i)).toBeInTheDocument()
  })
})
