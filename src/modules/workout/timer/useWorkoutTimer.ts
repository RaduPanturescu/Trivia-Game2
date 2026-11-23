/**
 * App-wide workout timers: the per-exercise phase timer (set and rest) and the stopwatch / countdown overlay.
 * Ports legacy `startWorkoutExercise`, `skipWorkoutTimerPhase`, `updateWorkoutClocks`, `startStopwatch`,
 * `pauseWorkoutClocks` and the duration controls. Both timers are wall-clock based, so a background tab catches up
 * when it is shown again. The state is module-level, so every caller sees the same timer.
 */
import { computed, ref, type ComputedRef, type Ref } from 'vue'
import { SFX, useAudio } from '@/shared/composables/useAudio'
import { useToast } from '@/shared/composables/useToast'
import * as session from '../core/session'
import { useWorkoutStore } from '../core/store'
import type { WorkoutDay } from '../core/types'
import type { ExerciseTimerState } from './exerciseRows'
import { formatCountdownStopwatchTime, formatStopwatchTime } from './format'

/** Phase of the exercise timer: `exercise` while a set is performed, `rest` between sets, `idle` when nothing runs. */
export type WorkoutTimerPhase = 'idle' | 'exercise' | 'rest'

/** Mode of the stopwatch overlay: counting up, or counting down from a chosen duration. */
export type StopwatchMode = 'stopwatch' | 'countdown'

/** Public surface of the workout timers returned by {@link useWorkoutTimer}. */
export interface WorkoutTimerApi {
  /** Current phase of the exercise timer. */
  phase: Readonly<Ref<WorkoutTimerPhase>>
  /** Date of the day whose exercise the phase timer runs for, or `null`. */
  activeDayDate: Readonly<Ref<string | null>>
  /** Index of the exercise the phase timer runs for, or `null`. */
  activeExerciseIndex: Readonly<Ref<number | null>>
  /** Whole seconds left in the current phase. */
  phaseRemaining: Readonly<Ref<number>>
  /** Timer state of one exercise, for its row on Workout Now. */
  exerciseTimerState(day: WorkoutDay, exerciseIndex: number): ExerciseTimerState
  /** Starts the exercise phase for an exercise and marks it as the active one. Legacy `startWorkoutExercise`. */
  startExercise(day: WorkoutDay, exerciseIndex: number): void
  /** Ends the current phase now: moves to the rest phase, or completes the exercise after its last set. Legacy skip. */
  skipPhase(): void
  /** Marks an exercise done. Stops the phase timer first when it runs for this exercise. */
  completeExercise(day: WorkoutDay, exerciseIndex: number): void
  /** Stops the phase timer and forgets its exercise, whichever exercise it runs for. Legacy `stopWorkoutTimer` reset. */
  resetActive(): void
  /** Keeps the phase timer on its exercise after the exercises of `dayDate` were moved from `fromIndex` to `toIndex`. */
  followExerciseMove(dayDate: string, fromIndex: number, toIndex: number): void
  /** Whether the stopwatch overlay is open. */
  timerOpen: Readonly<Ref<boolean>>
  /** Whether the "Timer done!" notice is open. */
  doneOpen: Readonly<Ref<boolean>>
  /** Opens the stopwatch overlay and brings its readout up to date. */
  openTimer(): void
  /** Closes the stopwatch overlay. A running clock keeps running. */
  closeTimer(): void
  /** Closes the "Timer done!" notice. */
  closeDone(): void
  /** Current stopwatch mode. */
  stopwatchMode: Readonly<Ref<StopwatchMode>>
  /** `true` in countdown mode. */
  isCountdown: ComputedRef<boolean>
  /** Switches the overlay between stopwatch and countdown. */
  setMode(mode: StopwatchMode): void
  /** Countdown minutes as typed, 0 to 59. Applied by {@link WorkoutTimerApi.applyCountdownDuration}. */
  countdownMinutes: Ref<number>
  /** Countdown seconds as typed, 0 to 59. Applied by {@link WorkoutTimerApi.applyCountdownDuration}. */
  countdownSeconds: Ref<number>
  /** Clamps the typed countdown duration and, when the countdown is not running, makes it the new full duration. */
  applyCountdownDuration(): void
  /** Steps the minutes or seconds of the countdown by `step`, then applies it. */
  adjustCountdown(unit: 'minutes' | 'seconds', step: number): void
  /** Whether the countdown is running. The duration inputs are disabled while it runs. */
  countdownRunning: Readonly<Ref<boolean>>
  /** Readout on the stopwatch face: `MM:SS.mmm` or the countdown `MM:SS`. */
  displayText: ComputedRef<string>
  /** Progress ring angle for the countdown, as a CSS `deg` value. */
  progressDegrees: ComputedRef<string>
  /** Whether the shown clock is running. */
  clockRunning: ComputedRef<boolean>
  /** Label of the start / pause button. */
  startLabel: ComputedRef<string>
  /** Starts or pauses the clock of the current mode. Warns when the countdown has no duration. */
  toggleRun(): void
  /** Stops the clock of the current mode and returns it to zero, or to the chosen duration for the countdown. */
  resetClock(): void
  /** Stops the stopwatch and countdown and closes both overlays. Called when the user leaves the workout screens. */
  pauseClocks(): void
}

/** Interval between clock updates while anything runs, in milliseconds. */
const TICK_MS = 16

/** Default exercise duration when the exercise has none, as in the legacy app. */
const DEFAULT_DURATION = 45

/** Default rest between sets when the exercise has none, as in the legacy app. */
const DEFAULT_REST = 60

/** Largest value of a countdown minute or second input. */
const MAX_UNIT = 59

const phase = ref<WorkoutTimerPhase>('idle')
const activeDayDate = ref<string | null>(null)
const activeExerciseIndex = ref<number | null>(null)
const phaseRemaining = ref(0)
let phaseEndsAt = 0

const stopwatchMode = ref<StopwatchMode>('stopwatch')
const stopwatchRunning = ref(false)
const stopwatchElapsed = ref(0)
let stopwatchStartedAt = 0

const countdownRunning = ref(false)
const countdownRemaining = ref(60)
const countdownTotal = ref(60)
let countdownEndsAt = 0
const countdownMinutes = ref(1)
const countdownSeconds = ref(0)

const timerOpen = ref(false)
const doneOpen = ref(false)

let tickHandle: ReturnType<typeof setInterval> | undefined

const isCountdown = computed(() => stopwatchMode.value === 'countdown')
const clockRunning = computed(() => (isCountdown.value ? countdownRunning.value : stopwatchRunning.value))

const displayText = computed(() =>
  isCountdown.value ? formatCountdownStopwatchTime(countdownRemaining.value) : formatStopwatchTime(stopwatchElapsed.value),
)

const progressDegrees = computed(() => {
  const progress = isCountdown.value && countdownTotal.value > 0
    ? (countdownTotal.value - countdownRemaining.value) / countdownTotal.value
    : 0
  return `${Math.min(1, Math.max(0, progress)) * 360}deg`
})

const startLabel = computed(() => {
  if (clockRunning.value) return 'Pause'
  const shown = isCountdown.value ? countdownRemaining.value : stopwatchElapsed.value
  const resumable = isCountdown.value ? shown > 0 && shown < countdownTotal.value : shown > 0
  return resumable ? 'Resume' : 'Start'
})

/**
 * Starts the interval that drives both timers, unless it already runs.
 */
function ensureTicking(): void {
  tickHandle ??= setInterval(tick, TICK_MS)
}

/**
 * Stops the interval once neither timer needs it.
 */
function stopTickingIfIdle(): void {
  if (phase.value !== 'idle' || stopwatchRunning.value || countdownRunning.value) return
  if (tickHandle !== undefined) {
    clearInterval(tickHandle)
    tickHandle = undefined
  }
}

/**
 * One interval step: refreshes the stopwatch and countdown, and the exercise phase.
 */
function tick(): void {
  updateClocks(true)
  if (phase.value !== 'idle') updatePhase()
}

/**
 * Refreshes the phase readout and ends the phase once its time is up.
 */
function updatePhase(): void {
  const left = phaseEndsAt - Date.now()
  phaseRemaining.value = Math.max(0, Math.ceil(left / 1000))
  if (left <= 0) skipPhase()
}

/**
 * Begins a phase of the exercise timer.
 * @param next - The phase to start.
 * @param seconds - Length of the phase.
 */
function startPhase(next: Exclude<WorkoutTimerPhase, 'idle'>, seconds: number): void {
  phase.value = next
  phaseEndsAt = Date.now() + seconds * 1000
  phaseRemaining.value = seconds
  ensureTicking()
}

/**
 * Stops the exercise timer and forgets its exercise.
 */
function clearPhase(): void {
  phase.value = 'idle'
  activeDayDate.value = null
  activeExerciseIndex.value = null
  phaseRemaining.value = 0
  stopTickingIfIdle()
}

/**
 * Ends the current phase. The set runs to its rest, the rest ends the exercise's active state, and the last set completes
 * the exercise. Legacy `skipWorkoutTimerPhase`.
 */
function skipPhase(): void {
  if (phase.value === 'idle') return
  const day = activeDayDate.value === null ? null : useWorkoutStore().getDayForDate(activeDayDate.value)
  const index = activeExerciseIndex.value
  const exercise = day && index !== null ? day.exercises[index] : undefined
  if (!day || index === null || !exercise || phase.value === 'rest') {
    clearPhase()
    return
  }

  if (Number(exercise.currentSet || 1) >= Number(exercise.sets || 1)) {
    clearPhase()
    session.finishExercise(useWorkoutStore(), day, index)
    return
  }
  session.completeSet(day, index)
  startPhase('rest', Math.max(1, Number(exercise.rest || DEFAULT_REST)))
}

/**
 * Refreshes the stopwatch and countdown readouts. Ends the countdown when it reaches zero.
 * @param showCompletion - `true` to show the "Timer done!" notice when the countdown ends.
 */
function updateClocks(showCompletion: boolean): void {
  const now = Date.now()
  if (stopwatchRunning.value) stopwatchElapsed.value = Math.max(0, now - stopwatchStartedAt)
  if (countdownRunning.value) {
    countdownRemaining.value = Math.max(0, (countdownEndsAt - now) / 1000)
    if (countdownRemaining.value === 0) {
      countdownRunning.value = false
      if (showCompletion) {
        doneOpen.value = true
        useAudio().playSfx(SFX.pop)
      }
    }
  }
  stopTickingIfIdle()
}

/**
 * Clamps a duration unit to 0..59 and reads it as a whole number.
 * @param value - Typed value.
 * @returns The clamped whole number.
 */
function clampUnit(value: number): number {
  return Math.max(0, Math.min(MAX_UNIT, Math.floor(Number(value) || 0)))
}

/**
 * Starts or pauses the stopwatch, or the countdown in countdown mode.
 */
function toggleRun(): void {
  updateClocks(true)
  if (isCountdown.value) {
    if (countdownRunning.value) {
      countdownRunning.value = false
    } else {
      if (countdownRemaining.value <= 0) applyCountdownDuration()
      if (countdownRemaining.value <= 0) {
        useToast().show({ title: 'Notice', message: 'Set a timer duration', icon: { emoji: '⚠️' } })
        return
      }
      countdownEndsAt = Date.now() + countdownRemaining.value * 1000
      countdownRunning.value = true
    }
  } else if (stopwatchRunning.value) {
    stopwatchRunning.value = false
  } else {
    stopwatchStartedAt = Date.now() - stopwatchElapsed.value
    stopwatchRunning.value = true
  }
  if (clockRunning.value) ensureTicking()
  updateClocks(true)
}

/**
 * Applies the typed countdown duration. While the countdown runs the duration is kept until it stops.
 */
function applyCountdownDuration(): void {
  countdownMinutes.value = clampUnit(countdownMinutes.value)
  countdownSeconds.value = clampUnit(countdownSeconds.value)
  if (countdownRunning.value) return
  countdownTotal.value = countdownMinutes.value * 60 + countdownSeconds.value
  countdownRemaining.value = countdownTotal.value
}

/**
 * Steps the countdown minutes or seconds, then applies the new duration.
 * @param unit - Which input to step.
 * @param step - How far to move: `1` or `-1`.
 */
function adjustCountdown(unit: 'minutes' | 'seconds', step: number): void {
  const target = unit === 'minutes' ? countdownMinutes : countdownSeconds
  target.value = clampUnit(target.value + step)
  applyCountdownDuration()
}

/**
 * Stops the clock of the current mode and returns it to its start.
 */
function resetClock(): void {
  updateClocks(true)
  if (isCountdown.value) {
    countdownRunning.value = false
    applyCountdownDuration()
  } else {
    stopwatchRunning.value = false
    stopwatchElapsed.value = 0
  }
  updateClocks(true)
}

/**
 * Switches the overlay mode, after bringing the current readout up to date.
 * @param mode - The mode to show.
 */
function setMode(mode: StopwatchMode): void {
  updateClocks(true)
  stopwatchMode.value = mode
}

/**
 * Pauses the stopwatch and countdown without showing the notice, and closes both overlays.
 */
function pauseClocks(): void {
  updateClocks(false)
  stopwatchRunning.value = false
  countdownRunning.value = false
  doneOpen.value = false
  timerOpen.value = false
  stopTickingIfIdle()
}

/**
 * Whether an exercise is the one the phase timer runs for.
 * @param day - The day holding the exercise.
 * @param exerciseIndex - Index of the exercise.
 * @returns `true` while that exercise is in its exercise or rest phase.
 */
function isActive(day: WorkoutDay, exerciseIndex: number): boolean {
  return phase.value !== 'idle' && activeDayDate.value === day.date && activeExerciseIndex.value === exerciseIndex
}

const api: WorkoutTimerApi = {
  phase,
  activeDayDate,
  activeExerciseIndex,
  phaseRemaining,
  exerciseTimerState(day, exerciseIndex) {
    const active = isActive(day, exerciseIndex)
    return { active, resting: active && phase.value === 'rest', remaining: phaseRemaining.value }
  },
  startExercise(day, exerciseIndex) {
    const exercise = session.beginExercise(day, exerciseIndex)
    if (!exercise) return
    activeDayDate.value = day.date
    activeExerciseIndex.value = exerciseIndex
    startPhase('exercise', Number(exercise.duration || DEFAULT_DURATION))
  },
  skipPhase,
  completeExercise(day, exerciseIndex) {
    if (isActive(day, exerciseIndex)) clearPhase()
    session.completeExercise(useWorkoutStore(), day, exerciseIndex)
  },
  resetActive: clearPhase,
  followExerciseMove(dayDate, fromIndex, toIndex) {
    if (activeDayDate.value !== dayDate || activeExerciseIndex.value === null) return
    activeExerciseIndex.value = session.indexAfterMove(activeExerciseIndex.value, fromIndex, toIndex)
  },
  timerOpen,
  doneOpen,
  openTimer() {
    timerOpen.value = true
    updateClocks(true)
  },
  closeTimer() {
    timerOpen.value = false
  },
  closeDone() {
    doneOpen.value = false
  },
  stopwatchMode,
  isCountdown,
  setMode,
  countdownMinutes,
  countdownSeconds,
  applyCountdownDuration,
  adjustCountdown,
  countdownRunning,
  displayText,
  progressDegrees,
  clockRunning,
  startLabel,
  toggleRun,
  resetClock,
  pauseClocks,
}

/**
 * Returns the app-wide workout timers. All callers share the same state.
 * @returns The shared {@link WorkoutTimerApi}.
 */
export function useWorkoutTimer(): WorkoutTimerApi {
  return api
}
