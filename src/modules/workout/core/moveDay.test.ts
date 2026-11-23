import { describe, expect, it } from 'vitest'
import { ensureProgram } from './schedule'
import { moveWorkoutDay } from './moveDay'
import type { WorkoutScheduleContext } from './types'

/** Wednesday 25 November 2026, local noon. The current week is Monday 23 November. */
const NOW = new Date(2026, 10, 25, 12, 0, 0)

/** A fresh program for the current week, built from the default layout. */
function setup() {
  const ctx: WorkoutScheduleContext = { templates: {}, overrides: {} }
  const program = ensureProgram({}, ctx, NOW)
  return { program, ctx }
}

describe('moveWorkoutDay', () => {
  it('moves a future workout to a future rest day, updating the templates and selecting the target', () => {
    const { program, ctx } = setup()
    // Thursday (3) is a workout, Sunday (6) a rest day; both are in the future.
    const result = moveWorkoutDay(program, ctx, 3, 6, { programStartDate: '2026-11-23', activeDayDate: null, now: NOW })
    expect(result).toEqual({ status: 'moved', sourceLabel: 'Thu', targetLabel: 'Sun', selectedIndex: 6 })
    const week = program.weeks[0]
    expect(week?.days[3]).toMatchObject({ type: 'rest', exercises: [] })
    expect(week?.days[6]?.type).toBe('workout')
    expect(week?.days[6]?.exercises.length).toBeGreaterThan(0)
    expect(ctx.templates[3]?.type).toBe('rest')
    expect(ctx.templates[6]?.type).toBe('workout')
  })

  it('asks for confirmation before replacing an existing workout', () => {
    const { program, ctx } = setup()
    // Thursday (3) to Friday (4), which is also a workout.
    expect(moveWorkoutDay(program, ctx, 3, 4, { programStartDate: null, activeDayDate: null, now: NOW })).toEqual({ status: 'needs-confirm', targetLabel: 'Fri' })
    expect(program.weeks[0]?.days[3]?.type).toBe('workout')
    expect(moveWorkoutDay(program, ctx, 3, 4, { programStartDate: null, activeDayDate: null, confirmed: true, now: NOW }).status).toBe('moved')
    expect(program.weeks[0]?.days[3]?.type).toBe('rest')
  })

  it('blocks past days, days with progress, and the active workout day', () => {
    const { program, ctx } = setup()
    // Monday (0) is in the past and has no "untracked" flag or start date, so it cannot move.
    expect(moveWorkoutDay(program, ctx, 0, 6, { programStartDate: null, activeDayDate: null, now: NOW })).toEqual({ status: 'blocked' })
    expect(moveWorkoutDay(program, ctx, 3, 6, { programStartDate: '2026-11-23', activeDayDate: '2026-11-26', now: NOW })).toEqual({ status: 'blocked' })
    const thursday = program.weeks[0]?.days[3]
    if (thursday) thursday.manualCompleted = true
    expect(moveWorkoutDay(program, ctx, 3, 6, { programStartDate: '2026-11-23', activeDayDate: null, now: NOW })).toEqual({ status: 'blocked' })
  })

  it('ignores moves from a non-workout day or onto the same day', () => {
    const { program, ctx } = setup()
    expect(moveWorkoutDay(program, ctx, 2, 6, { programStartDate: null, activeDayDate: null, now: NOW })).toEqual({ status: 'ignored' })
    expect(moveWorkoutDay(program, ctx, 3, 3, { programStartDate: null, activeDayDate: null, now: NOW })).toEqual({ status: 'ignored' })
  })
})
