import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/** Wednesday 25 November 2026, local noon. Only `Date` is faked, so promises still run. */
const NOW = new Date(2026, 10, 25, 12, 0, 0)

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

/** A week starting Monday 23 November whose Wednesday (selected) is a workout with one squat. */
function weekJson(): string {
  const day = (date: string, dayLabel: string, type: 'workout' | 'rest', exercises: object[] = []) => ({ date, dayLabel, type, exercises, completed: false })
  const squat = { id: 'squat-2026-11-25-0', name: 'Back Squat', category: 'legs', sets: 4, reps: 8, weight: 35, duration: 50, rest: 75 }
  return JSON.stringify({
    currentWeekStart: '2026-11-23',
    weeks: [{
      weekStart: '2026-11-23',
      days: [
        day('2026-11-23', 'Mon', 'rest'),
        day('2026-11-24', 'Tue', 'rest'),
        day('2026-11-25', 'Wed', 'workout', [squat]),
        day('2026-11-26', 'Thu', 'rest'),
        day('2026-11-27', 'Fri', 'rest'),
        day('2026-11-28', 'Sat', 'rest'),
        day('2026-11-29', 'Sun', 'rest'),
      ],
    }],
  })
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('setSelectedDayType', () => {
  it('keeps the exercises aside on rest and restores them on workout', async () => {
    const store = await loadStore({ triviaWorkoutProgram: weekJson(), triviaWorkoutProgramStartDate: '2026-11-23' })
    const { setSelectedDayType } = await import('./selectedDayType')
    store.selectedDayIndex.value = 2

    setSelectedDayType('rest')
    const restDay = store.getViewWeek(NOW).days[2]
    expect(restDay).toMatchObject({ type: 'rest', exercises: [] })
    expect(restDay?.savedExercisesForWorkout?.[0]?.name).toBe('Back Squat')

    setSelectedDayType('workout')
    const workoutDay = store.getViewWeek(NOW).days[2]
    expect(workoutDay?.type).toBe('workout')
    expect(workoutDay?.exercises).toHaveLength(1)
    expect(workoutDay?.exercises[0]).toMatchObject({ name: 'Back Squat', completed: false, currentSet: 1 })
    expect(workoutDay?.savedExercisesForWorkout).toBeUndefined()
  })

  it('marks a workout turned on for a past day as untracked', async () => {
    const store = await loadStore({ triviaWorkoutProgram: weekJson(), triviaWorkoutProgramStartDate: '2026-11-23' })
    const { setSelectedDayType } = await import('./selectedDayType')
    store.selectedDayIndex.value = 0

    setSelectedDayType('workout')
    expect(store.getViewWeek(NOW).days[0]).toMatchObject({ type: 'workout', untrackedWorkout: true })
  })

  it('stops the timer running for the changed day, and leaves other days alone', async () => {
    const store = await loadStore({ triviaWorkoutProgram: weekJson(), triviaWorkoutProgramStartDate: '2026-11-23' })
    const { setSelectedDayType } = await import('./selectedDayType')
    const { useWorkoutTimer } = await import('../timer/useWorkoutTimer')
    const timer = useWorkoutTimer()
    store.selectedDayIndex.value = 2
    timer.startExercise(store.getViewWeek(NOW).days[2]!, 0)
    expect(timer.activeDayDate.value).toBe('2026-11-25')

    store.selectedDayIndex.value = 3
    setSelectedDayType('workout')
    expect(timer.activeDayDate.value).toBe('2026-11-25')

    store.selectedDayIndex.value = 2
    setSelectedDayType('rest')
    expect(timer.phase.value).toBe('idle')
    expect(timer.activeDayDate.value).toBeNull()
    expect(timer.activeExerciseIndex.value).toBeNull()
  })
})
