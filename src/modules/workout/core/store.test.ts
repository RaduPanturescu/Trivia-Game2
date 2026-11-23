import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/** Wednesday 25 November 2026, local noon. Only `Date` is faked, so timers and promises still run. */
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
  const { useWorkoutStore } = await import('./store')
  const store = useWorkoutStore()
  await store.ready
  return store
}

/** A week starting Monday 23 November with one workout on Monday and rest on the other days. */
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

describe('useWorkoutStore loading', () => {
  it('creates and saves the current week when nothing is stored', async () => {
    const store = await loadStore()
    await settle()
    expect(store.program.value.weeks.map((week) => week.weekStart)).toEqual(['2026-11-23'])
    const saved = JSON.parse(localStorage.getItem('triviaWorkoutProgram') ?? 'null')
    expect(saved.currentWeekStart).toBe('2026-11-23')
    expect(saved.weeks).toHaveLength(1)
  })

  it('runs the pre-start template repair exactly once', async () => {
    // Program started on Tuesday, so the Monday workout was done before the program and the Monday template is rest.
    const stored = {
      triviaWorkoutProgram: weekJson(),
      triviaWorkoutWeeklyTemplate: REST_TEMPLATES,
      triviaWorkoutProgramStartDate: '2026-11-24',
    }
    const first = await loadStore(stored)
    await settle()
    expect(first.weeklyTemplates.value[0]?.type).toBe('workout')
    expect(localStorage.getItem('triviaWorkoutPreStartTemplateRepairV1')).toBe('1')

    // Second load with the flag set: the same stored template must not be rewritten.
    const second = await loadStore({ ...stored, triviaWorkoutPreStartTemplateRepairV1: '1', triviaWorkoutWeeklyTemplate: REST_TEMPLATES })
    await settle()
    expect(second.weeklyTemplates.value[0]?.type).toBe('rest')
  })
})

describe('useWorkoutStore operations', () => {
  it('adds categories in lower case and only removes unused custom ones', async () => {
    const store = await loadStore()
    expect(store.addCategory('  Cardio ')).toBe('cardio')
    expect(store.categories.value).toContain('cardio')
    expect(store.addCategory('   ')).toBeNull()
    expect(store.removeCategory('cardio')).toBe(true)
    expect(store.removeCategory('chest')).toBe(false)
    await settle()
    expect(JSON.parse(localStorage.getItem('triviaWorkoutCategories') ?? '[]')).not.toContain('cardio')
  })

  it('keeps body weight entries sorted and replaces an entry for the same date', async () => {
    const store = await loadStore()
    store.addBodyWeight({ date: '2026-11-25', weight: 80 })
    store.addBodyWeight({ date: '2026-11-24', weight: 81 })
    store.addBodyWeight({ date: '2026-11-25', weight: 79.5 })
    expect(store.bodyWeightEntries.value).toEqual([{ date: '2026-11-24', weight: 81 }, { date: '2026-11-25', weight: 79.5 }])
  })

  it('saves, renames and deletes named plans; a blank name is refused', async () => {
    const store = await loadStore()
    expect(store.saveNamedPlan('   ')).toBe(false)
    expect(store.saveNamedPlan(' Push ')).toBe(true)
    const [plan] = store.savedPlans.value
    expect(plan?.name).toBe('Push')
    expect(store.renamePlan(plan?.id ?? '', 'Pull')).toBe(true)
    expect(store.savedPlans.value[0]?.name).toBe('Pull')
    expect(store.switchPlan(plan?.id ?? '')).toBe(true)
    store.deletePlan(plan?.id ?? '')
    expect(store.savedPlans.value).toEqual([])
  })

  it('a new program archives the old one and starts with rest days', async () => {
    const store = await loadStore({ triviaWorkoutProgram: weekJson(), triviaWorkoutWeeklyTemplate: REST_TEMPLATES })
    store.resetProgram(NOW)
    await settle()
    expect(store.program.value.weeks).toHaveLength(1)
    expect(store.program.value.weeks[0]?.days.every((day) => day.type === 'rest')).toBe(true)
    expect(store.storedProgramStartDate.value).toBe('2026-11-25')
    expect(JSON.parse(localStorage.getItem('triviaWorkoutMetricBaseline') ?? '{}').version).toBe(2)
  })
})

describe('useWorkoutStore resetStats', () => {
  it('re-locks the six workout milestones and the custom achievements', async () => {
    const store = await loadStore({ triviaWorkoutProgram: weekJson(), triviaWorkoutProgramStartDate: '2026-11-23' })
    const { useAchievements, WORKOUT_MILESTONE_ACHIEVEMENTS } = await import('@/shared/achievements')
    const achievements = useAchievements()
    await achievements.ready
    for (const milestone of WORKOUT_MILESTONE_ACHIEVEMENTS) achievements.unlock(milestone.id)
    expect(achievements.list.value.filter((item) => WORKOUT_MILESTONE_ACHIEVEMENTS.some((m) => m.id === item.id) && item.unlocked)).toHaveLength(6)

    store.resetStats(NOW)

    const after = achievements.list.value
    for (const milestone of WORKOUT_MILESTONE_ACHIEVEMENTS) {
      expect(after.find((item) => item.id === milestone.id)?.unlocked).toBe(false)
    }
  })
})
