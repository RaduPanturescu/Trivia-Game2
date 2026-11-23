import { describe, expect, it } from 'vitest'
import { displayDateError, formatDisplayDate, isoDate, parseDisplayDate, parseLocalDate } from './dates'

describe('dates', () => {
  it('formats ISO strings and Dates as DD/MM/YYYY', () => {
    expect(formatDisplayDate('2026-11-27')).toBe('27/11/2026')
    expect(formatDisplayDate(new Date(2026, 0, 5))).toBe('05/01/2026')
    expect(formatDisplayDate('')).toBe('')
  })

  it('parses valid DD/MM/YYYY input and rejects impossible dates', () => {
    expect(parseDisplayDate(' 27/11/2026 ')).toBe('2026-11-27')
    expect(parseDisplayDate('31/02/2026')).toBe('')
    expect(parseDisplayDate('2026-11-27')).toBe('')
  })

  it('returns validation messages for display dates', () => {
    expect(displayDateError('')).toBe('')
    expect(displayDateError('', { required: true })).toBe('Enter a valid date as DD/MM/YYYY.')
    expect(displayDateError('01/01/2027', { maxDate: '2026-11-23' })).toBe('Date must be on or before 23/11/2026.')
    expect(displayDateError('23/11/2026', { maxDate: '2026-11-23' })).toBe('')
  })

  it('reads ISO dates as local midnight and returns them as ISO again', () => {
    const date = parseLocalDate('2026-11-27')
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([2026, 10, 27, 0])
    expect(isoDate('2026-11-27')).toBe('2026-11-27')
    expect(isoDate(new Date(2026, 10, 3, 23, 30))).toBe('2026-11-03')
  })
})
