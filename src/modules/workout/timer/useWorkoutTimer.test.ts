import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/composables/useAudio', () => ({
  SFX: { pop: '/assets/pop_sound.wav' },
  useAudio: () => ({ playSfx: vi.fn() }),
}))

/** Wednesday 25 November 2026, local noon. Only `Date` and the interval timers are faked. */
const NOW = new Date(2026, 10, 25, 12, 0, 0)

/**
 * The clock ticks every 16 ms, so a readout can lag by up to one tick. Tests step 20 ms past each boundary
 * so the expected value is the one just after that boundary.
 */
const PAST_TICK = 20

/** A Monday workout: a two-set exercise lasting 50 s with 75 s rest, and a one-set exercise lasting 40 s. */
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
  return JSON.stringify({ currentWeekStart: '2026-11-23', weeks: [{ weekStart: '2026-11-23', days }] })
}

/**
 * Loads a fresh store and timer on top of the stored program. Call after the fake clock is set up.
 * @returns The timer API and the Monday workout.
 */
async function load() {
  localStorage.clear()
  localStorage.setItem('triviaWorkoutProgram', programJson())
  vi.resetModules()
  const { useWorkoutStore } = await import('../core/store')
  const store = useWorkoutStore()
  await store.ready
  const { useWorkoutTimer } = await import('./useWorkoutTimer')
  const day = store.getDayForDate('2026-11-23')
  if (!day) throw new Error('test program has no Monday')
  return { timer: useWorkoutTimer(), day }
}

/**
 * Lists the messages of the toasts on screen, from the toast module the current load uses.
 * @returns The toast messages.
 */
async function toastMessages(): Promise<string[]> {
  const { useToast } = await import('@/shared/composables/useToast')
  return useToast().toasts.value.map((toast) => toast.message)
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('exercise phase timer', () => {
  it('runs the set, then the rest, then ends the rest without completing the exercise', async () => {
    const { timer, day } = await load()

    timer.startExercise(day, 0)
    expect(timer.phase.value).toBe('exercise')
    expect(timer.phaseRemaining.value).toBe(50)

    vi.advanceTimersByTime(49_000 + PAST_TICK)
    expect(timer.phaseRemaining.value).toBe(1)

    vi.advanceTimersByTime(1_000)
    expect(timer.phase.value).toBe('rest')
    expect(timer.phaseRemaining.value).toBe(75)
    expect(day.exercises[0]?.currentSet).toBe(2)
    expect(timer.exerciseTimerState(day, 0)).toEqual({ active: true, resting: true, remaining: 75 })

    vi.advanceTimersByTime(75_000 + PAST_TICK)
    expect(timer.phase.value).toBe('idle')
    expect(timer.activeDayDate.value).toBeNull()
    expect(day.exercises[0]?.completed).toBeFalsy()
  })

  it('completes the exercise when its last set ends', async () => {
    const { timer, day } = await load()

    timer.startExercise(day, 1)
    vi.advanceTimersByTime(40_000 + PAST_TICK)

    expect(timer.phase.value).toBe('idle')
    expect(day.exercises[1]?.completed).toBe(true)
    expect(await toastMessages()).toContain('Exercise complete')
  })

  it('skips the current phase on demand', async () => {
    const { timer, day } = await load()

    timer.startExercise(day, 0)
    timer.skipPhase()
    expect(timer.phase.value).toBe('rest')
    expect(day.exercises[0]?.currentSet).toBe(2)

    timer.skipPhase()
    expect(timer.phase.value).toBe('idle')
  })

  it('stops the phase timer when its exercise is completed by hand', async () => {
    const { timer, day } = await load()

    timer.startExercise(day, 0)
    timer.completeExercise(day, 0)

    expect(timer.phase.value).toBe('idle')
    expect(day.exercises[0]?.completed).toBe(true)
  })
})

describe('stopwatch and countdown', () => {
  it('counts a stopwatch up and holds the time when paused', async () => {
    const { timer } = await load()

    timer.toggleRun()
    vi.advanceTimersByTime(1_500)
    timer.toggleRun()
    expect(timer.displayText.value).toBe('00:01.500')
    expect(timer.startLabel.value).toBe('Resume')

    vi.advanceTimersByTime(1_000)
    expect(timer.displayText.value).toBe('00:01.500')
  })

  it('counts a countdown down and opens the done notice at zero', async () => {
    const { timer } = await load()

    timer.setMode('countdown')
    timer.countdownMinutes.value = 0
    timer.countdownSeconds.value = 3
    timer.applyCountdownDuration()
    timer.toggleRun()
    vi.advanceTimersByTime(1_000 + PAST_TICK)
    expect(timer.displayText.value).toBe('00:02')

    vi.advanceTimersByTime(2_000)
    expect(timer.countdownRunning.value).toBe(false)
    expect(timer.doneOpen.value).toBe(true)
  })

  it('warns instead of starting a countdown with no duration', async () => {
    const { timer } = await load()

    timer.setMode('countdown')
    timer.countdownMinutes.value = 0
    timer.countdownSeconds.value = 0
    timer.applyCountdownDuration()
    timer.toggleRun()

    expect(timer.countdownRunning.value).toBe(false)
    expect(await toastMessages()).toContain('Set a timer duration')
  })

  it('stops both clocks and closes the overlays when the user leaves the workout screens', async () => {
    const { timer } = await load()

    timer.openTimer()
    timer.toggleRun()
    vi.advanceTimersByTime(500)
    timer.pauseClocks()

    expect(timer.clockRunning.value).toBe(false)
    expect(timer.timerOpen.value).toBe(false)
    expect(timer.startLabel.value).toBe('Resume')
  })
})
