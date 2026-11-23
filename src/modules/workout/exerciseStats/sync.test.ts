import { beforeEach, describe, expect, it } from 'vitest'
import { effectScope } from 'vue'
import { setStorageAdapter, STORAGE_KEYS, type StorageAdapter } from '@/shared/persistence'
import { useWorkoutStore } from '../core/store'
import type { WorkoutDay, WorkoutDayExercise, WorkoutWeek } from '../core/types'
import { buildCompletedExerciseLogs, syncCompletedExerciseLogs } from './sync'
import { normalizeExerciseStats, updateExerciseStats, useExerciseStats } from './useExerciseStats'
import type { ExerciseStatsData } from './types'

/**
 * In-memory adapter so the tests never touch localStorage.
 * @returns The adapter and its backing map.
 */
function createMemoryAdapter(): StorageAdapter & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    async getItem(key) {
      return data.get(key) ?? null
    },
    async setItem(key, value) {
      data.set(key, value)
    },
    async removeItem(key) {
      data.delete(key)
    },
    async keys() {
      return [...data.keys()]
    },
  }
}

/**
 * Builds a day exercise with defaults.
 * @param overrides - Fields to change.
 * @returns The exercise.
 */
function exercise(overrides: Partial<WorkoutDayExercise>): WorkoutDayExercise {
  return { id: 'x', name: 'Exercise', category: 'chest', sets: 3, reps: 8, weight: 40, duration: 45, rest: 60, completed: true, currentSet: 1, ...overrides }
}

/** A week with one completed weights exercise, one completed bodyweight exercise and one open exercise. */
const WEEKS: WorkoutWeek[] = [{
  weekStart: '2026-11-23',
  days: [{
    date: '2026-11-23',
    dayLabel: 'Mon',
    type: 'workout',
    completed: true,
    exercises: [
      exercise({ id: 'bench-press', name: 'Bench Press', sets: 3, reps: 8, weight: 40 }),
      exercise({ id: 'push-up', name: 'Push-ups', category: 'chest', sets: 0, reps: 12, weight: 0, bodyWeight: true }),
      exercise({ id: 'open', name: 'Open', completed: false }),
    ],
  } as WorkoutDay],
}]

describe('buildCompletedExerciseLogs', () => {
  it('turns each completed exercise into a performance, typed by its load', () => {
    const logs = buildCompletedExerciseLogs(WEEKS)
    expect(logs).toEqual([
      {
        id: '2026-11-23:bench-press',
        name: 'Bench Press',
        date: '2026-11-23',
        type: 'weights',
        sets: 3,
        reps: 8,
        weight: 40,
        created: Date.parse('2026-11-23T12:00:00'),
        source: 'workout',
      },
      {
        id: '2026-11-23:push-up',
        name: 'Push-ups',
        date: '2026-11-23',
        type: 'calisthenics',
        sets: 1,
        reps: 12,
        weight: 0,
        created: Date.parse('2026-11-23T12:00:00'),
        source: 'workout',
      },
    ])
  })
})

describe('syncCompletedExerciseLogs', () => {
  let adapter: ReturnType<typeof createMemoryAdapter>

  beforeEach(() => {
    adapter = createMemoryAdapter()
    setStorageAdapter(adapter)
  })

  it('replaces the stored completed list and keeps manual logs and runs', async () => {
    const stored: ExerciseStatsData = {
      logs: [{ id: 'manual', created: 1, name: 'Squat', type: 'weights', date: '2026-11-01', sets: 5, reps: 5, weight: 80, notes: '' }],
      maxes: [],
      runs: [],
      completed: [],
      areas: { squat: ['Quadriceps'] },
    }
    adapter.data.set(STORAGE_KEYS.triviaExerciseStatsV1, JSON.stringify(stored))

    await syncCompletedExerciseLogs(WEEKS)

    const saved = JSON.parse(adapter.data.get(STORAGE_KEYS.triviaExerciseStatsV1) ?? '{}') as ExerciseStatsData
    expect(saved.completed.map((log) => log.id)).toEqual(['2026-11-23:bench-press', '2026-11-23:push-up'])
    expect(saved.logs.map((log) => log.id)).toEqual(['manual'])
    expect(saved.areas).toEqual({ squat: ['Quadriceps'] })
  })

  it('writes a fresh payload when nothing is stored, after a reset removed the key', async () => {
    await syncCompletedExerciseLogs([])
    const saved = JSON.parse(adapter.data.get(STORAGE_KEYS.triviaExerciseStatsV1) ?? '{}') as ExerciseStatsData
    expect(saved).toEqual({ logs: [], maxes: [], runs: [], completed: [], areas: {} })
  })
})

describe('stored payload repository', () => {
  beforeEach(() => {
    setStorageAdapter(createMemoryAdapter())
  })

  it('repairs malformed fields the way the legacy screen did', () => {
    const data = normalizeExerciseStats({
      logs: [{ id: 'a' }, null, 'bad'],
      maxes: [{ id: 'm', name: 'Squat' }],
      runs: 'not an array',
      completed: null,
      areas: ['not', 'an', 'object'],
    })
    expect(data.logs).toEqual([{ id: 'a' }])
    expect(data.maxes).toEqual([{ id: 'm', name: 'Squat', tests: [] }])
    expect(data.runs).toEqual([])
    expect(data.completed).toEqual([])
    expect(data.areas).toEqual({})
    expect(normalizeExerciseStats('junk')).toEqual({ logs: [], maxes: [], runs: [], completed: [], areas: {} })
  })

  it('updates the stored payload and the shared state', async () => {
    const { state, load, update } = useExerciseStats()
    await load()
    const saved = await update((data) => {
      data.runs.push({ id: 'r', created: 1, date: '2026-11-20', distance: 5, duration: 1500, type: 'easy', elevation: 0, heartRate: 0, cadence: 0, rpe: 0, notes: '' })
    })
    expect(saved).toBe(true)
    expect(state.value.runs).toHaveLength(1)
    await load()
    expect(state.value.runs.map((run) => run.id)).toEqual(['r'])
    await expect(updateExerciseStats((data) => {
      data.areas.x = []
    })).resolves.toBe(true)
  })
})

describe('workout store exercise log sync', () => {
  it('keeps syncing completed logs after the component that first created the store unmounts', async () => {
    const adapter = createMemoryAdapter()
    const day = (date: string, dayLabel: string, type: 'workout' | 'rest', exercises: object[] = []) => ({ date, dayLabel, type, exercises, completed: false })
    adapter.data.set(STORAGE_KEYS.triviaWorkoutProgram, JSON.stringify({
      currentWeekStart: '2026-11-23',
      weeks: [{
        weekStart: '2026-11-23',
        days: [
          day('2026-11-23', 'Mon', 'workout', [{ id: 'bench-press-2026-11-23-0', name: 'Bench Press', category: 'chest', sets: 3, reps: 8, weight: 40, duration: 45, rest: 60, completed: false, currentSet: 1 }]),
          day('2026-11-24', 'Tue', 'rest'),
          day('2026-11-25', 'Wed', 'rest'),
          day('2026-11-26', 'Thu', 'rest'),
          day('2026-11-27', 'Fri', 'rest'),
          day('2026-11-28', 'Sat', 'rest'),
          day('2026-11-29', 'Sun', 'rest'),
        ],
      }],
    }))
    setStorageAdapter(adapter)

    // The first call comes from a component-like scope, which is stopped before the program changes.
    const component = effectScope()
    const store = component.run(() => useWorkoutStore())
    if (!store) throw new Error('component scope was not active')
    await store.ready
    // Let the sync caused by loading the stored program finish, so only the change below can write `completed`.
    await new Promise((resolve) => setTimeout(resolve, 0))
    component.stop()

    const exercise = store.program.value.weeks[0]?.days[0]?.exercises?.[0]
    if (!exercise) throw new Error('fixture has no exercise')
    exercise.completed = true

    await new Promise((resolve) => setTimeout(resolve, 0))
    const saved = JSON.parse(adapter.data.get(STORAGE_KEYS.triviaExerciseStatsV1) ?? '{}') as ExerciseStatsData
    expect(saved.completed.map((log) => log.name)).toEqual(['Bench Press'])
  })
})
