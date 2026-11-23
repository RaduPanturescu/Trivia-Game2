import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { WorkoutStore } from './store'
import type { WorkoutDay, WorkoutProgram } from './types'

vi.mock('@/shared/composables/useAudio', () => ({
  SFX: { pop: '/assets/pop_sound.wav' },
  useAudio: () => ({ playSfx: vi.fn() }),
}))

/** Wednesday 25 November 2026, local noon. Only `Date` is faked, so promises still run. */
const NOW = new Date(2026, 10, 25, 12, 0, 0)
const MONDAY = '2026-11-23'
const TUESDAY = '2026-11-24'

/** Lets pending repository watchers and saves run. */
async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

/** A Monday workout with two exercises (two sets and one set), then rest days. */
function programJson(): string {
  const exercises = [
    { id: 'squat-2026-11-23-0', name: 'Back Squat', category: 'legs', sets: 2, reps: 8, weight: 35, duration: 50, rest: 75 },
    { id: 'row-2026-11-23-1', name: 'Row', category: 'back', sets: 1, reps: 10, weight: 20, duration: 40, rest: 60 },
  ]
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const days = labels.map((dayLabel, index) => {
    const date = `2026-11-${String(23 + index).padStart(2, '0')}`
    return index === 0
      ? { date, dayLabel, type: 'workout', exercises, completed: false }
      : { date, dayLabel, type: 'rest', exercises: [], completed: false }
  })
  return JSON.stringify({ currentWeekStart: MONDAY, weeks: [{ weekStart: MONDAY, days }] })
}

/**
 * Loads a fresh store and session module on top of the stored program.
 * @returns The store and the session module.
 */
async function load() {
  localStorage.clear()
  localStorage.setItem('triviaWorkoutProgram', programJson())
  vi.resetModules()
  const { useWorkoutStore } = await import('./store')
  const store = useWorkoutStore()
  await store.ready
  const session = await import('./session')
  return { store, session }
}

/**
 * Lists the messages of the toasts on screen. Reads the toast module that the current load uses.
 * @returns The toast messages.
 */
async function toastMessages(): Promise<string[]> {
  const { useToast } = await import('@/shared/composables/useToast')
  return useToast().toasts.value.map((toast) => toast.message)
}

/**
 * Returns the Monday workout of the test program.
 * @param store - The loaded store.
 * @returns The day.
 */
function mondayOf(store: WorkoutStore): WorkoutDay {
  const day = store.getDayForDate(MONDAY)
  if (!day) throw new Error('test program has no Monday')
  return day
}

/**
 * Reads the program as last saved to localStorage.
 * @returns The stored program.
 */
async function savedProgram(): Promise<WorkoutProgram> {
  await settle()
  return JSON.parse(localStorage.getItem('triviaWorkoutProgram') ?? 'null') as WorkoutProgram
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('completeExercise and completeWorkoutDay', () => {
  it('marks the exercise done, completes the day at half its exercises, and saves it', async () => {
    const { store, session } = await load()
    const evaluate = vi.spyOn(store, 'evaluateAchievements')
    const day = mondayOf(store)

    session.completeExercise(store, day, 1, NOW)

    expect(day.exercises[1]).toMatchObject({ completed: true, currentSet: 1 })
    expect(day.completed).toBe(true)
    expect(await toastMessages()).toContain('Workout for the day complete!')
    expect(evaluate).toHaveBeenCalledWith(NOW)

    const saved = await savedProgram()
    const savedDay = saved.weeks[0]?.days[0]
    expect(savedDay?.exercises[1]?.completed).toBe(true)
    expect(savedDay?.completed).toBe(true)
  })

  it('does not announce a day that was already complete', async () => {
    const { store, session } = await load()
    const day = mondayOf(store)
    session.completeExercise(store, day, 1, NOW)
    const count = async () => (await toastMessages()).filter((message) => message === 'Workout for the day complete!').length
    const before = await count()

    session.completeWorkoutDay(store, day, NOW)

    expect(await count()).toBe(before)
  })
})

describe('undoExercise', () => {
  it('clears the exercise and recounts the day, and saves it', async () => {
    const { store, session } = await load()
    const day = mondayOf(store)
    session.completeExercise(store, day, 1, NOW)
    expect(day.completed).toBe(true)

    session.undoExercise(store, day, 1, NOW)

    expect(day.exercises[1]).toMatchObject({ completed: false, currentSet: 1 })
    expect(day.completed).toBe(false)
    const saved = await savedProgram()
    expect(saved.weeks[0]?.days[0]?.exercises[1]?.completed).toBe(false)
  })
})

describe('beginExercise, completeSet and finishExercise', () => {
  it('refuses rest days, unknown and completed exercises', async () => {
    const { store, session } = await load()
    const day = mondayOf(store)
    session.completeExercise(store, day, 1, NOW)

    expect(session.beginExercise(day, 1)).toBeNull()
    expect(session.beginExercise(day, 5)).toBeNull()
    const tuesday = store.getDayForDate(TUESDAY)
    expect(tuesday && session.beginExercise(tuesday, 0)).toBeNull()
    expect(session.beginExercise(day, 0)).not.toBeNull()
  })

  it('moves the set counter on and announces the finished set', async () => {
    const { store, session } = await load()
    const day = mondayOf(store)
    session.beginExercise(day, 0)

    session.completeSet(day, 0)

    expect(day.exercises[0]?.currentSet).toBe(2)
    expect(day.exercises[0]?.completed).toBeFalsy()
    expect(await toastMessages()).toContain('Set 1/2 complete')
  })

  it('announces the finished exercise when the last set ends', async () => {
    const { store, session } = await load()
    const day = mondayOf(store)

    session.finishExercise(store, day, 1, NOW)

    expect(day.exercises[1]).toMatchObject({ completed: true, currentSet: 1 })
    expect(await toastMessages()).toContain('Exercise complete')
  })
})
