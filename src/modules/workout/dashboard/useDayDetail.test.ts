import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'

vi.mock('@/shared/composables/useAudio', () => ({
  SFX: { pop: '/assets/pop_sound.wav' },
  useAudio: () => ({ playSfx: vi.fn() }),
}))

/** Wednesday 25 November 2026, local noon. Only `Date` is faked, so promises still run. */
const NOW = new Date(2026, 10, 25, 12, 0, 0)

/** A Wednesday workout with three exercises: Squat, Row and Press. */
function weekJson(): string {
  const exercise = (name: string, index: number) => ({
    id: `${name.toLowerCase()}-2026-11-25-${index}`, name, category: 'legs', sets: 2, reps: 8, weight: 20, duration: 50, rest: 75,
  })
  const day = (date: string, dayLabel: string, type: 'workout' | 'rest', exercises: object[] = []) => ({ date, dayLabel, type, exercises, completed: false })
  return JSON.stringify({
    currentWeekStart: '2026-11-23',
    weeks: [{
      weekStart: '2026-11-23',
      days: [
        day('2026-11-23', 'Mon', 'rest'),
        day('2026-11-24', 'Tue', 'rest'),
        day('2026-11-25', 'Wed', 'workout', [exercise('Squat', 0), exercise('Row', 1), exercise('Press', 2)]),
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

/**
 * Loads a fresh store, timer and day detail controller for the Wednesday workout.
 * @returns The pieces the test needs.
 */
async function load() {
  localStorage.clear()
  localStorage.setItem('triviaWorkoutProgram', weekJson())
  localStorage.setItem('triviaWorkoutProgramStartDate', '2026-11-23')
  vi.resetModules()
  const { useWorkoutStore } = await import('../core/store')
  const store = useWorkoutStore()
  await store.ready
  store.selectedDayIndex.value = 2
  const { useWorkoutTimer } = await import('../timer/useWorkoutTimer')
  const { useDayDetail } = await import('./useDayDetail')
  const selected = computed(() => store.getViewWeek(NOW).days[store.selectedDayIndex.value] ?? null)
  return { store, timer: useWorkoutTimer(), detail: useDayDetail(selected), selected }
}

describe('useDayDetail reorder', () => {
  it('moves the exercise and saves the weekday template in the new order', async () => {
    const { store, detail } = await load()
    detail.reorder(0, 2)

    const names = store.getViewWeek(NOW).days[2]?.exercises.map((exercise) => exercise.name)
    expect(names).toEqual(['Row', 'Press', 'Squat'])
    const template = store.weeklyTemplates.value[2]?.exercises.map((exercise) => exercise.name)
    expect(template).toEqual(['Row', 'Press', 'Squat'])
  })

  it('keeps the running timer on the exercise it was started for', async () => {
    const { store, timer, detail, selected } = await load()
    const day = selected.value
    expect(day).not.toBeNull()
    timer.startExercise(day!, 0)
    expect(timer.activeExerciseIndex.value).toBe(0)

    detail.reorder(0, 2)

    expect(timer.activeExerciseIndex.value).toBe(2)
    expect(store.getViewWeek(NOW).days[2]?.exercises[2]?.name).toBe('Squat')
    timer.resetActive()
  })

  it('does nothing for a move to the same place', async () => {
    const { store, detail } = await load()
    detail.reorder(1, 1)
    expect(store.getViewWeek(NOW).days[2]?.exercises.map((exercise) => exercise.name)).toEqual(['Squat', 'Row', 'Press'])
  })
})
