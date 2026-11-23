import { describe, expect, it } from 'vitest'
import { parseWeightText, validateWeightEntry, WEIGHT_RANGE_MESSAGE } from './weightEntry'

const TODAY = '2026-11-23'

describe('parseWeightText', () => {
  it.each([
    ['', null],
    ['   ', null],
    ['0', null],
    ['abc', null],
    ['1', 1],
    [' 70.5 ', 70.5],
    ['500', 500],
    ['500.1', null],
  ])('parses %j to %s', (text, expected) => {
    expect(parseWeightText(text)).toBe(expected)
  })
})

describe('validateWeightEntry', () => {
  it('dates the entry today when the date is not editable', () => {
    expect(validateWeightEntry({ weightText: '70', dateText: '', editableDate: false, today: TODAY })).toEqual({
      ok: true,
      entry: { date: TODAY, weight: 70 },
    })
  })

  it('rejects a weight outside 1 to 500 kg with the legacy message', () => {
    expect(validateWeightEntry({ weightText: '0.5', dateText: '', editableDate: false, today: TODAY })).toEqual({
      ok: false,
      field: 'weight',
      message: WEIGHT_RANGE_MESSAGE,
    })
  })

  it('accepts a past date in developer mode and stores it as ISO', () => {
    expect(validateWeightEntry({ weightText: '69.8', dateText: '22/11/2026', editableDate: true, today: TODAY })).toEqual({
      ok: true,
      entry: { date: '2026-11-22', weight: 69.8 },
    })
  })

  it('rejects a future date', () => {
    expect(validateWeightEntry({ weightText: '70', dateText: '24/11/2026', editableDate: true, today: TODAY })).toEqual({
      ok: false,
      field: 'date',
      message: 'Date must be on or before 23/11/2026.',
    })
  })

  it('rejects an impossible or blank date', () => {
    for (const dateText of ['31/02/2026', '']) {
      expect(validateWeightEntry({ weightText: '70', dateText, editableDate: true, today: TODAY })).toEqual({
        ok: false,
        field: 'date',
        message: 'Enter a valid date as DD/MM/YYYY.',
      })
    }
  })
})
