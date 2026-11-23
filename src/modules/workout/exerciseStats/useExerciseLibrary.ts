/**
 * The exercise library and the program's planned exercises as the stats screen sees them.
 */
import { computed, type ComputedRef } from 'vue'
import type { WorkoutLibraryExercise } from '../core/types'
import { useWorkoutStore } from '../core/store'
import { exerciseNameOptions, type ExerciseRef } from './coverage'

/**
 * Library, planned exercises and the sorted name suggestions, all reactive to the workout store.
 * @returns The computed refs.
 */
export function useExerciseLibrary(): {
  /** Built-in exercises with overrides, then custom exercises. */
  library: ComputedRef<WorkoutLibraryExercise[]>
  /** Every exercise in every week of the program. */
  planned: ComputedRef<ExerciseRef[]>
  /** Sorted unique names from the library and the program. */
  names: ComputedRef<string[]>
} {
  const store = useWorkoutStore()
  const library = computed<WorkoutLibraryExercise[]>(() => [...store.exerciseCatalog.value, ...store.customExercises.value])
  const planned = computed<ExerciseRef[]>(() => store.program.value.weeks.flatMap((week) => week.days.flatMap((day) => day.exercises)))
  const names = computed(() => exerciseNameOptions(library.value, planned.value))
  return { library, planned, names }
}
