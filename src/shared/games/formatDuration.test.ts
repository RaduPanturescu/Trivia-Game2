import { describe, expect, it } from 'vitest'
import { formatDuration } from './formatDuration'

describe('formatDuration', () => {
  it('formats zero as 0:00', () => {
    expect(formatDuration(0)).toBe('0:00')
  })

  it('pads seconds to two digits', () => {
    expect(formatDuration(5)).toBe('0:05')
    expect(formatDuration(65)).toBe('1:05')
  })

  it('keeps counting minutes past one hour', () => {
    expect(formatDuration(3723)).toBe('62:03')
  })
})
