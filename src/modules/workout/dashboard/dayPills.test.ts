import { describe, expect, it } from 'vitest'
import type { WorkoutDay, WorkoutDayExercise } from '../core/types'
import { buildDayPill } from './dayPills'

/** A workout exercise, optionally completed. */
function exercise(id: string, completed = false): WorkoutDayExercise {
  return { id, name: id, category: 'legs', sets: 3, reps: 8, weight: 20, duration: 45, rest: 60, completed, currentSet: 1 }
}

/** A day on the given date with the given shape. */
function day(date: string, type: WorkoutDay['type'], exercises: WorkoutDayExercise[] = [], extra: Partial<WorkoutDay> = {}): WorkoutDay {
  return { date, dayLabel: 'Mon', type, exercises, completed: false, ...extra }
}

describe('buildDayPill', () => {
  it('shows the day number, the label and the done count of a workout', () => {
    const pill = buildDayPill(day('2026-11-23', 'workout', [exercise('a', true), exercise('b')]), 0, 0, '2026-11-23', null)
    expect(pill).toMatchObject({ letter: 'Mon', number: 23, status: '1/2', selected: true, draggable: true })
    expect(pill.classes).toEqual(expect.arrayContaining(['workout-day-pill', 'active', 'workout-day']))
    expect(pill.classes).not.toContain('missed-day')
  })

  it('marks rest and no-plan days', () => {
    expect(buildDayPill(day('2026-11-24', 'rest'), 1, 0, '2026-11-23', null)).toMatchObject({ status: 'Rest', draggable: false })
    const noPlan = buildDayPill(day('2026-11-24', null), 1, 0, '2026-11-23', null)
    expect(noPlan.status).toBe('—')
    expect(noPlan.classes).toContain('null-day')
  })

  it('flags a past workout that was not finished as missed, but not an untracked one', () => {
    const past = buildDayPill(day('2026-11-20', 'workout', [exercise('a')]), 0, 3, '2026-11-23', null)
    expect(past.status).toBe('✕')
    expect(past.classes).toContain('missed-day')

    const untracked = buildDayPill(day('2026-11-20', 'workout', [exercise('a')], { untrackedWorkout: true }), 0, 3, '2026-11-23', null)
    expect(untracked.status).toBe('—')
    expect(untracked.classes).not.toContain('missed-day')
  })

  it('treats a manually missed day as missed even when it is today', () => {
    const pill = buildDayPill(day('2026-11-23', 'workout', [exercise('a')], { manualMissed: true }), 0, 0, '2026-11-23', null)
    expect(pill.status).toBe('✕')
  })

  it('does not flag a completed past workout', () => {
    const pill = buildDayPill(day('2026-11-20', 'workout', [exercise('a', true)]), 0, 0, '2026-11-23', null)
    expect(pill.classes).not.toContain('missed-day')
    expect(pill.classes).toContain('completed')
  })
})
