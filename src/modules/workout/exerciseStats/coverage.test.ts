import { describe, expect, it } from 'vitest'
import type { WorkoutDay, WorkoutDayExercise, WorkoutWeek } from '../core/types'
import { buildRadarChart, buildWeeklyPlan, exerciseNameOptions, filterExerciseNames, getCoverageEntries, RADAR_CENTER, summarizeCoverage } from './coverage'
import type { CompletedExerciseLog, ExerciseLog } from './types'

/**
 * Builds a planned exercise.
 * @param overrides - Fields to change.
 * @returns The exercise.
 */
function exercise(overrides: Partial<WorkoutDayExercise>): WorkoutDayExercise {
  return { id: 'e', name: 'Squat', category: 'legs', sets: 3, reps: 10, weight: 40, duration: 45, rest: 60, completed: false, currentSet: 1, ...overrides }
}

/**
 * Builds a day with the given exercises.
 * @param date - ISO date.
 * @param type - Day type.
 * @param exercises - Exercises of the day.
 * @returns The day.
 */
function day(date: string, type: WorkoutDay['type'], exercises: WorkoutDayExercise[]): WorkoutDay {
  return { date, dayLabel: 'Day', type, exercises, completed: false }
}

const WEEK: WorkoutWeek = {
  weekStart: '2026-11-23',
  days: [
    day('2026-11-23', 'workout', [exercise({ id: 'squat', name: 'Squat', sets: 4 }), exercise({ id: 'pull', name: 'Pull-ups', category: 'back', sets: 3, weight: 0 })]),
    day('2026-11-24', 'rest', [exercise({ id: 'ignored', name: 'Ignored', sets: 9 })]),
    day('2026-11-25', 'workout', [exercise({ id: 'plank', name: 'Plank', category: 'core', sets: 2, repsTillFailure: true })]),
  ],
}

describe('buildRadarChart', () => {
  it('draws one axis per area, pointing up for the first, with four rings', () => {
    const chart = buildRadarChart(['Cardio', 'Conditioning', 'Mobility'], { Cardio: 0, Conditioning: 0, Mobility: 0 })
    const [top] = chart.axes
    expect(chart.rings).toHaveLength(4)
    expect(chart.axes).toHaveLength(3)
    expect(top?.x).toBeCloseTo(RADAR_CENTER)
    expect(top?.y).toBeCloseTo(RADAR_CENTER - 102)
    expect(top?.labelY).toBeCloseTo(RADAR_CENTER - 102 * 1.28)
  })

  it('scales the value polygon to the highest area', () => {
    const chart = buildRadarChart(['Cardio', 'Conditioning'], { Cardio: 4, Conditioning: 2 })
    const [first = [], second = []] = chart.value.split(' ').map((point) => point.split(',').map(Number))
    expect(first[0]).toBeCloseTo(RADAR_CENTER)
    expect(first[1]).toBeCloseTo(RADAR_CENTER - 102)
    // With two axes the second points straight down, at half the outer radius (2 of 4).
    expect(second[0]).toBeCloseTo(RADAR_CENTER)
    expect(second[1]).toBeCloseTo(RADAR_CENTER + 102 * 0.5)
  })

  it('collapses the value polygon to the centre when nothing is counted', () => {
    const chart = buildRadarChart(['Cardio'], { Cardio: 0 })
    const [x = NaN, y = NaN] = chart.value.split(',').map(Number)
    expect(x).toBeCloseTo(RADAR_CENTER)
    expect(y).toBeCloseTo(RADAR_CENTER)
  })
})

describe('getCoverageEntries', () => {
  it('plan mode counts only the workout days of the week', () => {
    const entries = getCoverageEntries({ mode: 'plan', week: WEEK, planned: [], library: [], logs: [], completed: [] })
    expect(entries.map((entry) => entry.name)).toEqual(['Squat', 'Pull-ups', 'Plank'])
  })

  it('all-time mode adds logs and completed entries, with categories from the library', () => {
    const logs: ExerciseLog[] = [{ id: 'l', created: 1, name: 'bench press', type: 'weights', date: '2026-11-01', sets: 5, reps: 5, weight: 60, notes: '' }]
    const completed: CompletedExerciseLog[] = [{ id: 'c', name: 'Squat', date: '2026-11-23', type: 'weights', sets: 4, reps: 8, weight: 40, created: 1, source: 'workout' }]
    const entries = getCoverageEntries({ mode: 'all', week: undefined, planned: [], library: [{ name: 'Bench Press', category: 'chest' }], logs, completed })
    expect(entries).toEqual([
      { name: 'bench press', category: 'chest', sets: 5, date: '2026-11-01' },
      { name: 'Squat', category: '', sets: 4, date: '2026-11-23' },
    ])
  })
})

describe('summarizeCoverage', () => {
  it('sums sets per area and counts unassigned entries and training days', () => {
    const entries = getCoverageEntries({ mode: 'plan', week: WEEK, planned: [], library: [], logs: [], completed: [] })
    const summary = summarizeCoverage(entries, {})
    expect(summary.counts.Quadriceps).toBe(4)
    expect(summary.counts.Glutes).toBe(4)
    expect(summary.counts.Back).toBe(3)
    expect(summary.counts.Biceps).toBe(3)
    expect(summary.counts.Core).toBe(2)
    expect(summary.unassigned).toBe(0)
    // Planned entries carry their day's date, so two distinct workout days count.
    expect(summary.days).toBe(2)
  })

  it('respects saved assignments and counts training days in all-time entries', () => {
    const entries = [
      { name: 'Mystery', category: '', sets: 3, date: '2026-11-01' },
      { name: 'Mystery', category: '', sets: 2, date: '2026-11-02' },
    ]
    const summary = summarizeCoverage(entries, { mystery: ['Chest'] })
    expect(summary.counts.Chest).toBe(5)
    expect(summary.unassigned).toBe(0)
    expect(summary.days).toBe(2)
    expect(summarizeCoverage(entries, { mystery: [] }).unassigned).toBe(2)
  })
})

describe('buildWeeklyPlan', () => {
  it('lists the planned exercises of workout days with their areas', () => {
    const items = buildWeeklyPlan(WEEK, {})
    expect(items.map((item) => item.name)).toEqual(['Squat', 'Pull-ups', 'Plank'])
    expect(items[2]).toMatchObject({ repsTillFailure: true, dayLabel: 'Day', areas: ['Core'] })
    expect(buildWeeklyPlan(undefined, {})).toEqual([])
  })
})

describe('exercise name suggestions', () => {
  it('lists unique sorted names and filters them by a case-insensitive query', () => {
    const names = exerciseNameOptions([{ name: 'Squat' }, { name: 'bench press' }], [{ name: 'Squat' }, { name: 'Plank' }])
    expect(names).toEqual(['bench press', 'Plank', 'Squat'])
    expect(filterExerciseNames(names, '  PL ')).toEqual(['Plank'])
  })
})
