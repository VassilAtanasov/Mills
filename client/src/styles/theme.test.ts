/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const themePath = join(dirname(fileURLToPath(import.meta.url)), 'theme.css')

describe('theme.css: reduced motion', () => {
  it('defines a single central @media (prefers-reduced-motion: reduce) override', () => {
    const themeCss = readFileSync(themePath, 'utf-8')
    const matches = themeCss.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)/g) ?? []
    expect(matches).toHaveLength(1) // exactly one central place, not scattered per-component

    const marker = '@media (prefers-reduced-motion: reduce)'
    const markerIndex = themeCss.indexOf(marker)
    expect(markerIndex).toBeGreaterThanOrEqual(0)
    const block = themeCss.slice(markerIndex)
    expect(block).toMatch(/animation-duration:\s*0(\.\d+)?ms\s*!important/)
    expect(block).toMatch(/transition-duration:\s*0(\.\d+)?ms\s*!important/)
  })
})
