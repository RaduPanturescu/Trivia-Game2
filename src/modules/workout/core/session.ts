/**
 * Exercise and day completion for a workout in progress. Ports legacy `startWorkoutExercise`, `completeWorkoutExercise`,
 * `completeWorkoutDay` and the set/finish branches of `skipWorkoutTimerPhase`. Changes go to the store's program, which
 * the persistence layer saves; achievements are checked after every completion, as legacy did.
 */
import { useToast } from '@/shared/composables/useToast'
import { checkWorkoutMilestones } from './milestones'
import type { WorkoutStore } from './store'
import { isWorkoutDayCompleted } from './schedule'
import type { WorkoutDay, WorkoutDayExercise } from './types'

/** The store members the session operations read and change. */
export type WorkoutSessionStore = Pick<WorkoutStore, 'program' | 'evaluateAchievements'>

/**
 * Prepares an exercise for the timer: clears the day's manual marks and untracked flag, and keeps the set counter within
 * the set count. Legacy `startWorkoutExercise`, before the timer starts.
 * @param day - The day that holds the exercise. Mutated.
 * @param exerciseIndex - Index of the exercise in `day.exercises`.
 * @returns The exercise, or `null` when it cannot start (not a workout day, unknown, or already completed).
 */
export function beginExercise(day: WorkoutDay, exerciseIndex: number): WorkoutDayExercise | null {
  if (day.type !== 'workout') return null
  const exercise = day.exercises[exerciseIndex]
  if (!exercise || exercise.completed) return null

  day.untrackedWorkout = false
  const totalSets = Number(exercise.sets || 1)
  if (Number(exercise.currentSet || 1) > totalSets) exercise.currentSet = totalSets
  day.manualCompleted = false
  day.manualMissed = false
  return exercise
}

/**
 * Ends a set that is not the last one: moves the set counter on and announces the finished set.
 * Legacy timer skip during an exercise phase.
 * @param day - The day that holds the exercise. Mutated.
 * @param exerciseIndex - Index of the exercise in `day.exercises`.
 */
export function completeSet(day: WorkoutDay, exerciseIndex: number): void {
  const exercise = day.exercises[exerciseIndex]
  if (!exercise) return
  const currentSet = Number(exercise.currentSet || 1)
  const totalSets = Number(exercise.sets || 1)
  exercise.currentSet = currentSet + 1
  showTaskCompleteToast(`Set ${currentSet}/${totalSets} complete`)
}

/**
 * Completes an exercise whose last set the timer just finished. Announces it, then checks the day.
 * Legacy timer skip on the last set.
 * @param store - The workout store.
 * @param day - The day that holds the exercise. Mutated.
 * @param exerciseIndex - Index of the exercise in `day.exercises`.
 * @param now - The current time, for achievement triggers.
 */
export function finishExercise(store: WorkoutSessionStore, day: WorkoutDay, exerciseIndex: number, now: Date = new Date()): void {
  markExerciseDone(store, day, exerciseIndex, now, 'Exercise complete')
}

/**
 * Marks an exercise done from its Complete control. Checks the day.
 * Legacy `completeWorkoutExercise`, completion branch.
 * @param store - The workout store.
 * @param day - The day that holds the exercise. Mutated.
 * @param exerciseIndex - Index of the exercise in `day.exercises`.
 * @param now - The current time, for achievement triggers.
 */
export function completeExercise(store: WorkoutSessionStore, day: WorkoutDay, exerciseIndex: number, now: Date = new Date()): void {
  markExerciseDone(store, day, exerciseIndex, now, null)
}

/**
 * Clears an exercise's completion and recounts the day. The caller confirms with the user first.
 * Legacy `completeWorkoutExercise`, undo branch.
 * @param store - The workout store.
 * @param day - The day that holds the exercise. Mutated.
 * @param exerciseIndex - Index of the exercise in `day.exercises`.
 * @param now - The current time, for achievement triggers.
 */
export function undoExercise(store: WorkoutSessionStore, day: WorkoutDay, exerciseIndex: number, now: Date = new Date()): void {
  const exercise = day.exercises[exerciseIndex]
  if (!exercise) return
  day.untrackedWorkout = false
  exercise.completed = false
  exercise.currentSet = 1
  day.manualCompleted = false
  day.manualMissed = false
  day.completed = isWorkoutDayCompleted(day)
  checkAchievements(store, now)
}

/**
 * Recounts a workout day after a change. When the day has just become complete, announces it and checks achievements.
 * Legacy `completeWorkoutDay`.
 * @param store - The workout store.
 * @param day - The day to recount. Mutated.
 * @param now - The current time, for achievement triggers.
 */
export function completeWorkoutDay(store: WorkoutSessionStore, day: WorkoutDay, now: Date = new Date()): void {
  if (day.type !== 'workout') return
  const wasCompleted = day.completed
  day.completed = isWorkoutDayCompleted(day)
  if (day.completed && !wasCompleted) {
    showTaskCompleteToast('Workout for the day complete!')
    checkAchievements(store, now)
  }
}

/**
 * Moves one exercise of a day to another position. Legacy `reorderWorkoutExercise`, without the save.
 * @param day - The day whose exercises are reordered. Mutated.
 * @param fromIndex - Index of the exercise to move.
 * @param toIndex - Index it moves to.
 * @returns `true` when the order changed.
 */
export function reorderExercise(day: WorkoutDay, fromIndex: number, toIndex: number): boolean {
  const count = day.exercises.length
  const valid = Number.isInteger(fromIndex) && Number.isInteger(toIndex)
    && fromIndex >= 0 && toIndex >= 0 && fromIndex < count && toIndex < count && fromIndex !== toIndex
  if (!valid) return false
  const [moved] = day.exercises.splice(fromIndex, 1)
  if (moved) day.exercises.splice(toIndex, 0, moved)
  return true
}

/**
 * Where an exercise index ends up after {@link reorderExercise}, so a running timer keeps following the same exercise.
 * @param index - The index before the move.
 * @param fromIndex - Index the exercise was moved from.
 * @param toIndex - Index it was moved to.
 * @returns The index after the move.
 */
export function indexAfterMove(index: number, fromIndex: number, toIndex: number): number {
  if (index === fromIndex) return toIndex
  if (fromIndex < index && index <= toIndex) return index - 1
  if (toIndex <= index && index < fromIndex) return index + 1
  return index
}

/**
 * Shared completion for the Complete control and the timer's last set.
 * @param store - The workout store.
 * @param day - The day that holds the exercise. Mutated.
 * @param exerciseIndex - Index of the exercise in `day.exercises`.
 * @param now - The current time.
 * @param announcement - Toast text to show before the day is checked, or `null` for none.
 */
function markExerciseDone(store: WorkoutSessionStore, day: WorkoutDay, exerciseIndex: number, now: Date, announcement: string | null): void {
  const exercise = day.exercises[exerciseIndex]
  if (!exercise) return
  day.untrackedWorkout = false
  exercise.completed = true
  exercise.currentSet = Number(exercise.sets || 1)
  day.manualCompleted = false
  day.manualMissed = false
  if (announcement) showTaskCompleteToast(announcement)
  completeWorkoutDay(store, day, now)
  checkAchievements(store, now)
}

/**
 * Unlocks the workout milestones the program has reached and passes the stats to the achievements store.
 * @param store - The workout store.
 * @param now - The current time.
 */
function checkAchievements(store: WorkoutSessionStore, now: Date): void {
  checkWorkoutMilestones(store.program.value)
  store.evaluateAchievements(now)
}

/**
 * Shows the green task-complete toast. Legacy `showTaskCompleteToast`.
 * @param description - Text shown under the heading.
 */
function showTaskCompleteToast(description: string): void {
  useToast().show({ title: 'Task Complete', message: description, icon: { emoji: '✅' }, variant: 'task' })
}
