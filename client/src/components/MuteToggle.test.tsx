import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MuteToggle } from './MuteToggle'

describe('MuteToggle', () => {
  it('is keyboard-operable and shows sound-on state by default', () => {
    const { getByRole } = render(<MuteToggle muted={false} onToggle={vi.fn()} />)
    const button = getByRole('button', { name: /mute sound/i })
    expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(button.tagName).toBe('BUTTON')
  })

  it('shows the muted state with a distinct label', () => {
    const { getByRole } = render(<MuteToggle muted={true} onToggle={vi.fn()} />)
    const button = getByRole('button', { name: /unmute sound/i })
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn()
    const { getByRole } = render(<MuteToggle muted={false} onToggle={onToggle} />)

    fireEvent.click(getByRole('button', { name: /mute sound/i }))

    expect(onToggle).toHaveBeenCalledTimes(1)
  })
})
