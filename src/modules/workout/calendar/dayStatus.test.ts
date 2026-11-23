import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ensureProgram } from '../core/schedule'
import type { WorkoutProgram, WorkoutScheduleContext } from '../core/types'
import { applyCalendarDayStatus } from './dayStatus'

/** Wednesday 25 November 2026, local noon. The current week starts Monday 23 November. */
const NOW = new Date(2026, 10, 25, 12, 0, 0)

/** Lets pending repository watchers and saves run. */
async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

/** A fresh program for the current week, built from the default layout. Thursday (index 3) is a workout. */
function setup(): { program: WorkoutProgram; ctx: WorkoutScheduleContext } {
  const ctx: WorkoutScheduleContext = { templates: {}, overrides: {} }
  return { program: ensureProgram({}, ctx, NOW), ctx }
}

/** Looks up a stored day by date. */
function dayOf(program: WorkoutProgram, date: string) {
  const day = program.weeks.flatMap((week) => week.days).find((item) => item.date === date)
  if (!day) throw new Error(`no day ${date}`)
  return day
}

describe('applyCalendarDayStatus', () => {
  it('marks a workout day completed and completes its exercises', () => {
    const { program, ctx } = setup()
    expect(applyCalendarDayStatus(program, ctx, '2026-11-26', 'completed', NOW)).toBe(true)
    const day = dayOf(program, '2026-11-26')
    expect(day).toMatchObject({ type: 'workout', completed: true, manualCompleted: true, manualMissed: false })
    expect(day.exercises.length).toBeGreaterThan(0)
    expect(day.exercises.every((exercise) => exercise.completed === true)).toBe(true)
  })

  it('marks a workout day missed', () => {
    const { program, ctx } = setup()
    applyCalendarDayStatus(program, ctx, '2026-11-26', 'missed', NOW)
    expect(dayOf(program, '2026-11-26')).toMatchObject({ type: 'workout', completed: false, manualMissed: true, manualCompleted: false })
  })

  it('turns a workout into rest, keeps its exercises aside, and restores them when it becomes a workout again', () => {
    const { program, ctx } = setup()
    const before = dayOf(program, '2026-11-26').exercises.map((exercise) => exercise.name)
    applyCalendarDayStatus(program, ctx, '2026-11-26', 'rest', NOW)
    const rest = dayOf(program, '2026-11-26')
    expect(rest).toMatchObject({ type: 'rest', exercises: [], completed: false, manualCompleted: false, manualMissed: false })
    expect(rest.savedExercisesForWorkout?.map((exercise) => exercise.name)).toEqual(before)

    applyCalendarDayStatus(program, ctx, '2026-11-26', 'missed', NOW)
    const restored = dayOf(program, '2026-11-26')
    expect(restored.type).toBe('workout')
    expect(restored.exercises.map((exercise) => exercise.name)).toEqual(before)
    expect(restored.savedExercisesForWorkout).toBeUndefined()
  })

  it('removes the untracked flag from the day it changes', () => {
    const { program, ctx } = setup()
    dayOf(program, '2026-11-26').untrackedWorkout = true
    applyCalendarDayStatus(program, ctx, '2026-11-26', 'missed', NOW)
    expect(dayOf(program, '2026-11-26').untrackedWorkout).toBeUndefined()
  })

  it('appends a missing week, clearing its days before today', () => {
    const { program, ctx } = setup()
    // The week of 16 November is not in the program yet.
    expect(applyCalendarDayStatus(program, ctx, '2026-11-18', 'rest', NOW)).toBe(true)
    const week = program.weeks[program.weeks.length - 1]
    expect(week?.weekStart).toBe('2026-11-16')
    expect(week?.days[2]).toMatchObject({ date: '2026-11-18', type: 'rest' })
    expect(week?.days[0]).toMatchObject({ date: '2026-11-16', type: null, exercises: [] })
  })
})

describe('applyCalendarDayStatus persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('saves the changed day to triviaWorkoutProgram through the workout store', async () => {
    vi.resetModules()
    const { useWorkoutStore } = await import('../core/store')
    const store = useWorkoutStore()
    await store.ready
    applyCalendarDayStatus(store.program.value, { templates: store.weeklyTemplates.value, overrides: store.exerciseOverrides.value }, '2026-11-26', 'rest', NOW)
    await settle()
    const saved = JSON.parse(localStorage.getItem('triviaWorkoutProgram') ?? 'null') as WorkoutProgram
    expect(dayOf(saved, '2026-11-26')).toMatchObject({ type: 'rest', exercises: [] })
  })
})
