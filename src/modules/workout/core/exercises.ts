import { isoDate } from '@/shared/dates'
import { isWorkoutDayCompleted } from './schedule'
import type { WorkoutExerciseDetails, WorkoutLibraryExercise, WorkoutProgram, WorkoutWeeklyTemplates } from './types'

/**
 * Whether a scheduled or templated exercise is a copy of the library exercise `exerciseId`.
 * Copies keep the library id as a prefix of their own id.
 * @param exercise - The exercise to test. Template entries have no id and never match by id.
 * @param exerciseId - The library exercise id.
 * @returns `true` for a copy.
 */
function isCopyOf(exercise: { id?: string }, exerciseId: string): boolean {
  return exercise.id === exerciseId || String(exercise.id || '').startsWith(`${exerciseId}-`)
}

/**
 * Deletes a custom exercise from the library and from every scheduled day, then refreshes each day's completion flag.
 * @param customExercises - The custom library.
 * @param program - The program. Updated in place.
 * @param exerciseId - The custom exercise id.
 * @returns The library without the exercise. The caller stores it.
 */
export function removeCustomExercise(
  customExercises: readonly WorkoutLibraryExercise[],
  program: WorkoutProgram,
  exerciseId: string,
): WorkoutLibraryExercise[] {
  for (const week of program.weeks) {
    for (const day of week.days) {
      day.exercises = day.exercises.filter((exercise) => exercise.id !== exerciseId)
      day.completed = isWorkoutDayCompleted(day)
    }
  }
  return customExercises.filter((exercise) => exercise.id !== exerciseId)
}

/**
 * Pushes an edit of a library exercise into its copies: weekly templates, and scheduled days from today on that are not
 * completed. A copy has the library id as a prefix. Template entries without an id match by name and category instead.
 * @param templates - The weekly templates. Updated in place.
 * @param program - The program. Updated in place.
 * @param exerciseId - The library exercise id that changed.
 * @param updates - The fields that changed.
 * @param previous - The exercise before the edit, used to find id-less template entries.
 * @param now - The current time.
 */
export function updateLibraryExerciseCopies(
  templates: WorkoutWeeklyTemplates,
  program: WorkoutProgram,
  exerciseId: string,
  updates: Partial<WorkoutExerciseDetails>,
  previous: Pick<WorkoutExerciseDetails, 'name' | 'category'>,
  now: Date = new Date(),
): void {
  for (const template of Object.values(templates)) {
    if (!template) continue
    template.exercises = template.exercises.map((exercise: WorkoutExerciseDetails & { id?: string }) => {
      const idless = !exercise.id && exercise.name === previous.name && exercise.category === previous.category
      return isCopyOf(exercise, exerciseId) || idless ? { ...exercise, ...updates } : exercise
    })
  }

  const today = isoDate(now)
  for (const week of program.weeks) {
    for (const day of week.days) {
      if (day.date < today) continue
      day.exercises = day.exercises.map((exercise) => {
        if (!isCopyOf(exercise, exerciseId) || exercise.completed) return exercise
        return { ...exercise, ...updates, id: exercise.id, completed: false, currentSet: exercise.currentSet || 1 }
      })
    }
  }
}
