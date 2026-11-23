import { describe, expect, it } from 'vitest'
import {
  cardioDurationSeconds,
  cardioFormatDuration,
  cardioFormatPace,
  cardioKmPerTenMinutes,
  describeCardioRun,
  sortCardioRuns,
  summarizeCardioRuns,
} from './cardio'
import type { CardioRun } from './types'

/**
 * Builds a run with sensible defaults.
 * @param overrides - Fields to change.
 * @returns The run.
 */
function run(overrides: Partial<CardioRun>): CardioRun {
  return { id: 'r', created: 1, date: '2026-11-20', distance: 5, duration: 1500, type: 'easy', elevation: 0, heartRate: 0, cadence: 0, rpe: 0, notes: '', ...overrides }
}

describe('cardioDurationSeconds', () => {
  it('parses MM:SS and HH:MM:SS', () => {
    expect(cardioDurationSeconds('45:30')).toBe(2730)
    expect(cardioDurationSeconds('00:45:30')).toBe(2730)
    expect(cardioDurationSeconds(' 1:02:03 ')).toBe(3723)
  })

  it('rejects seconds or minutes of 60 or more, negatives, and text', () => {
    expect(cardioDurationSeconds('1:60')).toBe(0)
    expect(cardioDurationSeconds('1:00:75')).toBe(0)
    expect(cardioDurationSeconds('5:-1')).toBe(0)
    expect(cardioDurationSeconds('abc')).toBe(0)
    expect(cardioDurationSeconds('')).toBe(0)
    expect(cardioDurationSeconds('1:2:3:4')).toBe(0)
  })
})

describe('cardioFormatDuration', () => {
  it('formats minutes and seconds, adding hours from one hour', () => {
    expect(cardioFormatDuration(2730)).toBe('45:30')
    expect(cardioFormatDuration(3725)).toBe('1:02:05')
    expect(cardioFormatDuration(-5)).toBe('0:00')
  })
})

describe('pace and speed', () => {
  it('gives seconds per kilometre as a pace', () => {
    expect(cardioFormatPace(1500, 5)).toBe('5:00 /km')
    expect(cardioFormatPace(0, 5)).toBe('—')
    expect(cardioFormatPace(1500, 0)).toBe('—')
  })

  it('gives kilometres per ten minutes as a speed', () => {
    expect(cardioKmPerTenMinutes(5, 1500)).toBe('2 km / 10 min')
    expect(cardioKmPerTenMinutes(5, 0)).toBe('—')
  })
})

describe('run lists', () => {
  it('sorts newest first, then by save time', () => {
    const sorted = sortCardioRuns([
      run({ id: 'old', date: '2026-11-01', created: 5 }),
      run({ id: 'same-day-early', date: '2026-11-20', created: 1 }),
      run({ id: 'same-day-late', date: '2026-11-20', created: 2 }),
    ])
    expect(sorted.map((item) => item.id)).toEqual(['same-day-late', 'same-day-early', 'old'])
  })

  it('totals distance and time and finds the fastest run', () => {
    const summary = summarizeCardioRuns([
      run({ id: 'slow', distance: 10, duration: 4000 }),
      run({ id: 'fast', distance: 5, duration: 1200 }),
    ])
    expect(summary.totalKm).toBe(15)
    expect(summary.totalSeconds).toBe(5200)
    expect(summary.bestPaceRun?.id).toBe('fast')
    expect(summarizeCardioRuns([]).bestPaceRun).toBeNull()
  })

  it('describes a run with its pace, speed and metadata', () => {
    const view = describeCardioRun(run({ elevation: 120, heartRate: 150, notes: 'hills' }))
    expect(view.title).toBe('5 km · 25:00 · 5:00 /km · 2 km / 10 min')
    expect(view.meta).toBe('20/11/2026 · easy run · 120 m elevation · 150 bpm avg')
  })
})
