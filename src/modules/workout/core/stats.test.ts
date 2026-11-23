import { describe, expect, it } from 'vitest'
import { calculateWorkoutStreak, formatKilogramStat, getFirstWorkoutDate, getWorkoutStatsSnapshot, snapshotWorkoutMetricBaseline } from './stats'
import type { WorkoutDay, WorkoutDayType, WorkoutProgram, WorkoutWeek } from './types'

/** Wednesday 25 November 2026, local noon. */
const NOW = new Date(2026, 10, 25, 12, 0, 0)

/** Builds a day with `total` exercises (3 sets, 10 reps, 20 kg each), the first `done` of them completed. */
function day(date: string, type: WorkoutDayType, done: number, total: number): WorkoutDay {
  return {
    date,
    dayLabel: 'x',
    type,
    completed: false,
    exercises: Array.from({ length: total }, (_, index) => ({
      id: `e-${date}-${index}`,
      name: 'Exercise',
      category: 'legs',
      sets: 3,
      reps: 10,
      weight: 20,
      duration: 30,
      rest: 30,
      completed: index < done,
      currentSet: 1,
    })),
  }
}

/** Two weeks: a streak that is broken on 17 Nov, rebuilt, and today (25 Nov) still open. */
function program(): WorkoutProgram {
  const weekOne: WorkoutWeek = {
    weekStart: '2026-11-16',
    days: [
      day('2026-11-16', 'workout', 2, 2),
      day('2026-11-17', 'workout', 0, 2),
      day('2026-11-18', 'rest', 0, 0),
      day('2026-11-19', 'workout', 2, 2),
      day('2026-11-20', 'workout', 2, 2),
      day('2026-11-21', 'rest', 0, 0),
      day('2026-11-22', 'rest', 0, 0),
    ],
  }
  const weekTwo: WorkoutWeek = {
    weekStart: '2026-11-23',
    days: [
      day('2026-11-23', 'workout', 2, 2),
      day('2026-11-24', 'workout', 2, 2),
      day('2026-11-25', 'workout', 0, 2),
      day('2026-11-26', 'rest', 0, 0),
      day('2026-11-27', 'rest', 0, 0),
      day('2026-11-28', 'rest', 0, 0),
      day('2026-11-29', 'rest', 0, 0),
    ],
  }
  return { currentWeekStart: '2026-11-23', weeks: [weekTwo, weekOne] }
}

const TEMPLATES = { 0: { type: 'workout' as const, exercises: [] }, 1: { type: 'workout' as const, exercises: [] }, 2: { type: 'rest' as const, exercises: [] }, 3: { type: 'workout' as const, exercises: [] }, 4: { type: 'workout' as const, exercises: [] }, 5: { type: 'rest' as const, exercises: [] }, 6: { type: 'rest' as const, exercises: [] } }

describe('calculateWorkoutStreak', () => {
  it('counts completed workouts since the start, keeps streaks through rest days, and resets on a missed workout', () => {
    // 16 done, 17 missed (reset), 19 and 20 done, 23 and 24 done, 25 still open today.
    expect(calculateWorkoutStreak(program(), TEMPLATES, '2026-11-16', NOW)).toBe(4)
  })

  it('starts counting from the program start date', () => {
    expect(calculateWorkoutStreak(program(), TEMPLATES, '2026-11-18', NOW)).toBe(4)
  })
})

describe('getWorkoutStatsSnapshot', () => {
  it('adds the live program to the baseline and skips work already archived', () => {
    const stats = getWorkoutStatsSnapshot({
      program: program(),
      ctx: { templates: TEMPLATES, overrides: {} },
      programStartDate: '2026-11-16',
      baseline: {
        version: 2,
        workouts: 5,
        sets: 10,
        reps: 80,
        kg: 100,
        completedExercises: 7,
        completedExerciseKeys: ['2026-11-16:e-2026-11-16-0'],
        completedWorkoutKeys: ['2026-10-01'],
      },
      points: 42,
    }, NOW)
    // Completed workout days: 16, 19, 20, 23, 24 (none archived).
    expect(stats.workouts).toBe(5 + 5)
    // Completed exercises: 10 live, minus the one archived key, plus 7 archived.
    expect(stats.exercises).toBe(7 + 9)
    expect(stats.sets).toBe(10 + 9 * 3)
    expect(stats.reps).toBe(80 + 9 * 10 * 3)
    expect(stats.kg).toBe(100 + 9 * 20 * 10 * 3)
    expect(stats.streak).toBe(4)
    expect(stats.points).toBe(42)
  })

  it('treats a baseline without version 2 as empty', () => {
    const stats = getWorkoutStatsSnapshot({ program: program(), ctx: { templates: TEMPLATES, overrides: {} }, programStartDate: '2026-11-16', baseline: { workouts: 99 }, points: 0 }, NOW)
    expect(stats.workouts).toBe(5)
  })
})

describe('snapshotWorkoutMetricBaseline', () => {
  it('archives completed days and exercises once, so a second snapshot adds nothing', () => {
    const first = snapshotWorkoutMetricBaseline({}, program())
    expect(first.workouts).toBe(5)
    expect(first.completedExercises).toBe(10)
    expect([...first.completedWorkoutKeys].sort()).toEqual(['2026-11-16', '2026-11-19', '2026-11-20', '2026-11-23', '2026-11-24'])
    const second = snapshotWorkoutMetricBaseline(first, program())
    expect(second.workouts).toBe(5)
    expect(second.completedExercises).toBe(10)
    expect(second.completedExerciseKeys).toHaveLength(10)
  })
})

describe('getFirstWorkoutDate and formatKilogramStat', () => {
  it('returns the earliest completed workout, archived or live', () => {
    expect(getFirstWorkoutDate(program(), {})).toBe('2026-11-16')
    expect(getFirstWorkoutDate({ currentWeekStart: '', weeks: [] }, { version: 2, completedWorkoutKeys: ['2026-03-02'] })).toBe('2026-03-02')
    expect(getFirstWorkoutDate({ currentWeekStart: '', weeks: [] }, {})).toBeNull()
  })

  it('formats large totals in thousands', () => {
    expect(formatKilogramStat(250)).toBe('250')
    expect(formatKilogramStat(12.25)).toBe('12.3')
    expect(formatKilogramStat(12500)).toBe('12.5k')
    expect(formatKilogramStat(20000)).toBe('20k')
  })
})
