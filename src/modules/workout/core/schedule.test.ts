import { describe, expect, it } from 'vitest'
import { WORKOUT_EXERCISE_CATALOG } from './catalog'
import { createDefaultWorkoutWeek, ensureProgram, estimateWorkoutMinutes, getMonday, getWorkoutCompletionThreshold, getWorkoutDayIndex, getWorkoutMenuDayStatus, getWorkoutProgramStartDate, isWorkoutDayCompleted } from './schedule'
import type { WorkoutDay, WorkoutProgram, WorkoutScheduleContext } from './types'

/** Wednesday 25 November 2026, local noon. The current week is the one starting Monday 23 November. */
const NOW = new Date(2026, 10, 25, 12, 0, 0)
const EMPTY_CTX: WorkoutScheduleContext = { templates: {}, overrides: {} }

/** A realistic legacy `triviaWorkoutProgram` payload: one week from 16 November, with one completed exercise. */
const LEGACY_PROGRAM_JSON = JSON.stringify({
  currentWeekStart: '2026-11-16',
  weeks: [{
    weekStart: '2026-11-16',
    days: [
      { date: '2026-11-16', dayLabel: 'Mon', type: 'workout', exercises: [{ id: 'bench-press-2026-11-16-0', name: 'Bench Press', category: 'chest', sets: 4, reps: 8, weight: 20, duration: 45, rest: 60, description: 'Press.', completed: true, currentSet: 4 }], completed: false },
      { date: '2026-11-17', dayLabel: 'Tue', type: 'rest', exercises: [], completed: false },
      { date: '2026-11-18', dayLabel: 'Wed', type: 'rest', exercises: [], completed: false },
      { date: '2026-11-19', dayLabel: 'Thu', type: 'rest', exercises: [], completed: false },
      { date: '2026-11-20', dayLabel: 'Fri', type: 'rest', exercises: [], completed: false },
      { date: '2026-11-21', dayLabel: 'Sat', type: 'rest', exercises: [], completed: false },
      { date: '2026-11-22', dayLabel: 'Sun', type: 'rest', exercises: [], completed: false },
    ],
  }],
})

/** Builds a day with `total` exercises, the first `done` of them completed. */
function dayWith(date: string, type: WorkoutDay['type'], done: number, total: number): WorkoutDay {
  return {
    date,
    dayLabel: 'x',
    type,
    completed: false,
    exercises: Array.from({ length: total }, (_, index) => ({
      id: `e-${date}-${index}`,
      name: 'Exercise',
      category: 'core',
      sets: 1,
      reps: 1,
      weight: 0,
      duration: 30,
      rest: 30,
      completed: index < done,
      currentSet: 1,
    })),
  }
}

describe('getMonday', () => {
  it('returns the same Monday for a Monday and the Monday six days earlier for a Sunday', () => {
    const monday = getMonday('2026-11-23')
    expect([monday.getFullYear(), monday.getMonth(), monday.getDate()]).toEqual([2026, 10, 23])
    const sunday = getMonday(new Date(2026, 10, 29, 20))
    expect([sunday.getMonth(), sunday.getDate(), sunday.getHours()]).toEqual([10, 23, 0])
  })

  it('maps weekdays to Monday-first indexes', () => {
    expect(getWorkoutDayIndex('2026-11-23')).toBe(0)
    expect(getWorkoutDayIndex('2026-11-29')).toBe(6)
  })
})

describe('createDefaultWorkoutWeek', () => {
  it('builds seven days with the built-in layout and dated exercise ids', () => {
    const week = createDefaultWorkoutWeek(getMonday(NOW), EMPTY_CTX)
    expect(week.weekStart).toBe('2026-11-23')
    expect(week.days).toHaveLength(7)
    expect(week.days.map((day) => day.type)).toEqual(['workout', 'workout', 'rest', 'workout', 'workout', 'workout', 'rest'])
    expect(week.days[0]?.exercises.map((exercise) => exercise.id)).toEqual(['bench-press-2026-11-23-0', 'lunge-2026-11-23-1'])
    expect(week.days[0]?.exercises.every((exercise) => exercise.completed === false && exercise.currentSet === 1)).toBe(true)
  })

  it('uses a saved weekly template instead of the built-in layout for that weekday', () => {
    const ctx: WorkoutScheduleContext = {
      templates: { 2: { type: 'workout', exercises: [{ name: 'Plank', category: 'core', sets: 2, reps: 1, weight: 0, duration: 30, rest: 30 }] } },
      overrides: {},
    }
    const week = createDefaultWorkoutWeek(getMonday(NOW), ctx)
    expect(week.days[2]?.type).toBe('workout')
    expect(week.days[2]?.exercises).toEqual([expect.objectContaining({ id: 'exercise-2026-11-25-0', name: 'Plank', completed: false })])
  })

  it('applies catalog overrides to the built-in exercises it copies', () => {
    const week = createDefaultWorkoutWeek(getMonday(NOW), { templates: {}, overrides: { 'bench-press': { sets: 5 } } })
    expect(week.days[0]?.exercises[0]?.sets).toBe(5)
    expect(WORKOUT_EXERCISE_CATALOG[0]?.sets).toBe(4)
  })
})

describe('ensureProgram', () => {
  it('creates the current week when nothing is stored', () => {
    const program = ensureProgram(undefined, EMPTY_CTX, NOW)
    expect(program.currentWeekStart).toBe('2026-11-23')
    expect(program.weeks.map((week) => week.weekStart)).toEqual(['2026-11-23'])
  })

  it('keeps a legacy-shaped stored program and prepends the current week', () => {
    const program = ensureProgram(JSON.parse(LEGACY_PROGRAM_JSON), EMPTY_CTX, NOW)
    expect(program.currentWeekStart).toBe('2026-11-16')
    expect(program.weeks.map((week) => week.weekStart)).toEqual(['2026-11-23', '2026-11-16'])
    expect(program.weeks[1]?.days[0]?.exercises[0]).toMatchObject({ id: 'bench-press-2026-11-16-0', completed: true, currentSet: 4 })
  })

  it('replaces a stored program with no weeks', () => {
    const program = ensureProgram({ currentWeekStart: '2026-10-01', weeks: [] }, EMPTY_CTX, NOW)
    expect(program.weeks).toHaveLength(1)
    expect(program.weeks[0]?.weekStart).toBe('2026-11-23')
  })
})

describe('completion', () => {
  it('threshold is half the exercises rounded up', () => {
    expect(getWorkoutCompletionThreshold(dayWith('2026-11-23', 'workout', 0, 0))).toBe(0)
    expect(getWorkoutCompletionThreshold(dayWith('2026-11-23', 'workout', 0, 3))).toBe(2)
  })

  it('a workout counts as done at the threshold; manual marks override the count', () => {
    expect(isWorkoutDayCompleted(dayWith('2026-11-23', 'workout', 1, 4))).toBe(false)
    expect(isWorkoutDayCompleted(dayWith('2026-11-23', 'workout', 2, 4))).toBe(true)
    expect(isWorkoutDayCompleted({ ...dayWith('2026-11-23', 'workout', 4, 4), manualMissed: true })).toBe(false)
    expect(isWorkoutDayCompleted({ ...dayWith('2026-11-23', 'workout', 0, 4), manualCompleted: true })).toBe(true)
    expect(isWorkoutDayCompleted(dayWith('2026-11-23', 'rest', 0, 0))).toBe(false)
  })
})

describe('menu status and start date', () => {
  it('describes today and falls back to "No plan" when no day exists', () => {
    const program: WorkoutProgram = { currentWeekStart: '2026-11-23', weeks: [createDefaultWorkoutWeek(getMonday(NOW), EMPTY_CTX)] }
    // Wednesday is a rest day in the built-in layout.
    expect(getWorkoutMenuDayStatus(program, EMPTY_CTX, NOW)).toEqual({ type: 'rest', label: 'Rest Day' })
    const tuesday = new Date(2026, 10, 24, 12)
    expect(getWorkoutMenuDayStatus(program, EMPTY_CTX, tuesday)).toEqual({ type: 'workout', label: 'Workout Day' })
    expect(getWorkoutMenuDayStatus({ currentWeekStart: '', weeks: [] }, { templates: { 2: { type: null, exercises: [] } }, overrides: {} }, NOW).label).toBe('No plan')
  })

  it('uses a stored date, or infers the earliest scheduled day up to today and only then', () => {
    const program: WorkoutProgram = { currentWeekStart: '2026-11-16', weeks: JSON.parse(LEGACY_PROGRAM_JSON).weeks }
    expect(getWorkoutProgramStartDate('2026-11-01', program, NOW)).toBe('2026-11-01')
    expect(getWorkoutProgramStartDate('', program, NOW)).toBe('2026-11-16')
    expect(getWorkoutProgramStartDate('', { currentWeekStart: '', weeks: [] }, NOW)).toBe('2026-11-25')
  })
})

describe('estimateWorkoutMinutes', () => {
  it('adds set time and rest between sets, rounded up to five minutes', () => {
    // 4 sets x 45 s + 3 rests x 60 s = 360 s, which rounds up to 10 minutes.
    expect(estimateWorkoutMinutes([{ sets: 4, duration: 45, rest: 60 }])).toBe(10)
    expect(estimateWorkoutMinutes([])).toBe(0)
  })
})
