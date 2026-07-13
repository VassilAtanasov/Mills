import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ModeControl } from './ModeControl'

describe('ModeControl', () => {
  it('marks the active mode as pressed', () => {
    const { getByRole } = render(<ModeControl mode="hotseat" onModeChange={vi.fn()} />)

    expect(getByRole('button', { name: '2 players' })).toHaveAttribute('aria-pressed', 'true')
    expect(getByRole('button', { name: 'vs computer' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onModeChange with the clicked mode', () => {
    const onModeChange = vi.fn()
    const { getByRole } = render(<ModeControl mode="hotseat" onModeChange={onModeChange} />)

    fireEvent.click(getByRole('button', { name: 'vs computer' }))

    expect(onModeChange).toHaveBeenCalledWith('vs-computer')
  })
})
