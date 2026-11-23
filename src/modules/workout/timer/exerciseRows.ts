/**
 * Text and button state for one exercise row on the Workout Now screen. Ports the row builder and
 * `refreshWorkoutNowControls` from the legacy app.
 */
import { isBodyweightExercise } from '../core/catalog'
import type { WorkoutDayExercise } from '../core/types'
import { formatCountdownTime } from './format'

/** What the timer is doing with one exercise right now. */
export interface ExerciseTimerState {
  /** `true` while this exercise is in its exercise or rest phase. */
  active: boolean
  /** `true` while this exercise is in its rest phase. */
  resting: boolean
  /** Seconds left in the current phase. */
  remaining: number
}

/** Labels and flags for the controls of one exercise row. */
export interface ExerciseRowControls {
  /** Text of the start button. */
  startLabel: string
  /** `true` while the start button cannot be pressed. */
  startDisabled: boolean
  /** Text of the complete button. */
  completeLabel: string
  /** `true` when the exercise is done. */
  completed: boolean
  /** `true` while the exercise is resting between sets. */
  resting: boolean
  /** `true` while the skip button should show. */
  skipVisible: boolean
}

/**
 * The one-line summary under an exercise name: sets, reps or failure, load, and rest.
 * @param exercise - The scheduled exercise.
 * @returns Parts joined with a bullet.
 */
export function describeExercise(exercise: WorkoutDayExercise): string {
  return [
    `${exercise.sets} sets`,
    exercise.repsTillFailure ? "'Till Failure" : `${exercise.reps} reps`,
    isBodyweightExercise(exercise) ? 'Body Weight' : `${exercise.weight || 0} kg`,
    `${exercise.rest || 60}s rest`,
  ].join(' • ')
}

/**
 * Button labels and flags for an exercise row.
 * @param exercise - The scheduled exercise.
 * @param timer - What the timer is doing with this exercise.
 * @returns The row controls.
 */
export function getExerciseRowControls(exercise: WorkoutDayExercise, timer: ExerciseTimerState): ExerciseRowControls {
  const totalSets = Number(exercise.sets || 1)
  const currentSet = Math.min(Number(exercise.currentSet || 1), totalSets)
  const completed = !!exercise.completed
  let startLabel: string
  if (timer.resting) startLabel = `Rest ${formatCountdownTime(timer.remaining)}`
  else if (timer.active) startLabel = `Timer ${timer.remaining}s`
  else if (completed) startLabel = 'Completed ✓'
  else if (totalSets > 1) startLabel = `Start Set ${currentSet}/${totalSets}`
  else startLabel = 'Start Exercise'

  return {
    startLabel,
    startDisabled: timer.active || completed,
    completeLabel: completed ? 'Completed ✓' : 'Complete',
    completed,
    resting: timer.resting,
    skipVisible: timer.active,
  }
}
