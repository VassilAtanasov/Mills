import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the heading, status bar, and board for a fresh game', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /nine men's morris/i })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /nine men's morris board/i })).toBeInTheDocument()
    expect(screen.getByText(/white to place/i)).toBeInTheDocument()
  })

  it('places a piece via Tab-then-Enter keyboard interaction, with no mouse involved', () => {
    render(<App />)

    const point = screen.getByRole('button', { name: /^point a1, empty/i })
    point.focus()
    expect(point).toHaveFocus()
    fireEvent.keyDown(point, { key: 'Enter' })

    expect(screen.getByText(/black to place/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^point a1, white piece/i })).toBeInTheDocument()
  })

  it('renders no result modal while the game is in progress', () => {
    render(<App />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
