/**
 * Keeps the stored `completed` list in step with the program: every completed workout exercise becomes a performance
 * entry. Ported from the legacy `syncCompletedExerciseLogs`.
 */
import { watch, type Ref } from 'vue'
import { isBodyweightExercise } from '../core/catalog'
import type { WorkoutProgram, WorkoutWeek } from '../core/types'
import { exerciseKey } from './areas'
import { updateExerciseStats } from './useExerciseStats'
import type { CompletedExerciseLog } from './types'

/**
 * Lists a performance for every completed exercise of the program, in week and day order.
 * @param weeks - The program's weeks.
 * @returns The performance entries.
 */
export function buildCompletedExerciseLogs(weeks: readonly WorkoutWeek[]): CompletedExerciseLog[] {
  return weeks.flatMap((week) => week.days.flatMap((day) => day.exercises
    .filter((exercise) => exercise.completed)
    .map((exercise): CompletedExerciseLog => ({
      id: `${day.date}:${exercise.id || exerciseKey(exercise.name)}`,
      name: exercise.name,
      date: day.date,
      type: isBodyweightExercise(exercise) ? 'calisthenics' : 'weights',
      sets: Number(exercise.sets || 1),
      reps: Number(exercise.reps || 0),
      weight: Number(exercise.weight || 0),
      created: Date.parse(`${day.date}T12:00:00`) || 0,
      source: 'workout',
    }))))
}

/**
 * Replaces the stored `completed` list with the entries built from the program.
 * @param weeks - The program's weeks.
 * @returns Resolves once the write has settled.
 */
export async function syncCompletedExerciseLogs(weeks: readonly WorkoutWeek[]): Promise<void> {
  await updateExerciseStats((data) => {
    data.completed = buildCompletedExerciseLogs(weeks)
  })
}

/**
 * Runs {@link syncCompletedExerciseLogs} after every change to the program. Called once by the workout store.
 * @param program - The store's program ref.
 */
export function watchCompletedExerciseLogs(program: Ref<WorkoutProgram>): void {
  watch(program, (value) => {
    void syncCompletedExerciseLogs(value.weeks)
  }, { deep: true })
}
