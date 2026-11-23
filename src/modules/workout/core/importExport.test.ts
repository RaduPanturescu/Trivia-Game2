import { describe, expect, it } from 'vitest'
import { applyWorkoutImport, buildWorkoutExport, isValidWorkoutImport } from './importExport'
import { createDefaultWorkoutWeek, ensureProgram, getMonday } from './schedule'
import type { WorkoutScheduleContext } from './types'

/** Wednesday 25 November 2026, local noon. */
const NOW = new Date(2026, 10, 25, 12, 0, 0)
const CTX: WorkoutScheduleContext = { templates: {}, overrides: {} }

/** A real export of the default program, round-tripped through JSON as a file would be. */
function exportJson(): unknown {
  const program = ensureProgram({}, CTX, NOW)
  const payload = buildWorkoutExport({ program, templates: {}, categories: ['chest'], customExercises: [], overrides: {}, programStartDate: '2026-11-23' }, NOW)
  return JSON.parse(JSON.stringify(payload))
}

describe('isValidWorkoutImport', () => {
  it('accepts an export', () => {
    expect(isValidWorkoutImport(exportJson())).toBe(true)
  })

  it('rejects anything that is not a workout export', () => {
    const valid = exportJson() as Record<string, unknown>
    expect(isValidWorkoutImport(undefined)).toBe(false)
    expect(isValidWorkoutImport('{"weeks":[]}')).toBe(false)
    expect(isValidWorkoutImport({})).toBe(false)
    expect(isValidWorkoutImport({ ...valid, format: 'other' })).toBe(false)
    expect(isValidWorkoutImport({ ...valid, weeks: [] })).toBe(false)
    expect(isValidWorkoutImport({ ...valid, programStartDate: '2026-02-30' })).toBe(false)
    expect(isValidWorkoutImport({ ...valid, categories: [1, 2] })).toBe(false)
    const weeks = valid.weeks as { days: unknown[] }[]
    expect(isValidWorkoutImport({ ...valid, weeks: [{ ...weeks[0], days: (weeks[0] ?? { days: [] }).days.slice(0, 6) }] })).toBe(false)
    expect(isValidWorkoutImport({ ...valid, weeks: [{ ...weeks[0], days: [{ date: '2026-11-23', type: 'lunch', exercises: [] }, ...(weeks[0]?.days.slice(1) ?? [])] }] })).toBe(false)
  })
})

describe('applyWorkoutImport', () => {
  it('fills missing weekday templates from the latest imported week and selects the current week', () => {
    const oldWeek = createDefaultWorkoutWeek(getMonday('2026-11-16'), CTX)
    const payload = { ...(exportJson() as object), weeklyTemplates: undefined, weeks: [oldWeek] } as unknown as Parameters<typeof applyWorkoutImport>[0]
    const state = applyWorkoutImport(payload, { categories: ['legs'], overrides: {} }, NOW)
    // The file carries its own categories and start date, which win over the current ones.

    expect(state.templates[0]?.type).toBe('workout')
    expect(state.templates[2]?.type).toBe('rest')
    expect(state.categories).toEqual(['chest'])
    expect(state.programStartDate).toBe('2026-11-23')
    expect(state.program.currentWeekStart).toBe('2026-11-23')
    expect(state.program.weeks.map((week) => week.weekStart)).toEqual(['2026-11-23', '2026-11-16'])
  })
})
