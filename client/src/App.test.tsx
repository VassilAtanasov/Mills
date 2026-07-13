import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the heading, status bar, and board for a fresh game', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /nine men's morris/i })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /nine men's morris board/i })).toBeInTheDocument()
    expect(screen.getByText(/white to place/i)).toBeInTheDocument()
  })
})
