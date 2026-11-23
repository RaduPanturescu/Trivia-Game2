import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { parseWorkoutImport, serializeWorkoutExport, workoutExportFileName } from './planFile'

/** Wednesday 25 November 2026, local noon. Only `Date` is faked, so promises still run. */
const NOW = new Date(2026, 10, 25, 12, 0, 0)

/** Lets pending repository watchers and saves run. */
async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

/** Loads a fresh workout store on top of the given raw storage values. */
async function loadStore(stored: Record<string, string> = {}) {
  localStorage.clear()
  for (const [key, value] of Object.entries(stored)) localStorage.setItem(key, value)
  vi.resetModules()
  const { useWorkoutStore } = await import('../core/store')
  const store = useWorkoutStore()
  await store.ready
  return store
}

/** A week starting Monday 23 November with one squat workout on Monday and rest on the other days. */
function weekJson(): string {
  const day = (date: string, dayLabel: string, type: 'workout' | 'rest', exercises: object[] = []) => ({ date, dayLabel, type, exercises, completed: false })
  return JSON.stringify({
    currentWeekStart: '2026-11-23',
    weeks: [{
      weekStart: '2026-11-23',
      days: [
        day('2026-11-23', 'Mon', 'workout', [{ id: 'squat-2026-11-23-0', name: 'Back Squat', category: 'legs', sets: 4, reps: 8, weight: 35, duration: 50, rest: 75 }]),
        day('2026-11-24', 'Tue', 'rest'),
        day('2026-11-25', 'Wed', 'rest'),
        day('2026-11-26', 'Thu', 'rest'),
        day('2026-11-27', 'Fri', 'rest'),
        day('2026-11-28', 'Sat', 'rest'),
        day('2026-11-29', 'Sun', 'rest'),
      ],
    }],
  })
}

/** Seven rest templates as stored. */
const REST_TEMPLATES = JSON.stringify(Object.fromEntries(Array.from({ length: 7 }, (_, index) => [index, { type: 'rest', exercises: [] }])))

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('export file name', () => {
  it('is workout-program-<date>.json', () => {
    expect(workoutExportFileName(NOW)).toBe('workout-program-2026-11-25.json')
  })
})

describe('export then import through the store', () => {
  it('restores the weeks, templates and categories as a saved plan named after the file', async () => {
    const source = await loadStore({
      triviaWorkoutProgram: weekJson(),
      triviaWorkoutWeeklyTemplate: REST_TEMPLATES,
      triviaWorkoutProgramStartDate: '2026-11-23',
    })
    await settle()
    source.getProgramStartDate(NOW)
    const text = serializeWorkoutExport(source.buildExport(NOW))
    const exported = JSON.parse(text) as { format: string; weeks: unknown; weeklyTemplates: unknown; categories: unknown }
    expect(exported.format).toBe('bianka-workout-program')

    const target = await loadStore()
    await settle()
    target.importProgram(parseWorkoutImport(text), 'backup.json', NOW)
    await settle()

    expect(JSON.parse(JSON.stringify(target.program.value.weeks))).toEqual(exported.weeks)
    expect(JSON.parse(JSON.stringify(target.weeklyTemplates.value))).toEqual(exported.weeklyTemplates)
    expect(JSON.parse(JSON.stringify(target.categories.value))).toEqual(exported.categories)
    const plans = target.savedPlans.value
    expect(plans).toHaveLength(1)
    expect(plans[0]?.name).toBe('backup.json')
  })

  it('keeps the program start date from the file', async () => {
    const source = await loadStore({
      triviaWorkoutProgram: weekJson(),
      triviaWorkoutWeeklyTemplate: REST_TEMPLATES,
      triviaWorkoutProgramStartDate: '2026-11-23',
    })
    await settle()
    const exported = JSON.parse(serializeWorkoutExport(source.buildExport(NOW))) as { programStartDate: string }
    expect(exported.programStartDate).toBe('2026-11-23')
  })
})

describe('parseWorkoutImport', () => {
  it('rejects JSON that is not a workout export with the legacy message', () => {
    expect(() => parseWorkoutImport(JSON.stringify({ format: 'something-else', weeks: [] }))).toThrow('This file is not a valid workout program export.')
  })

  it('rejects text that is not JSON', () => {
    expect(() => parseWorkoutImport('not json')).toThrow(SyntaxError)
  })
})
