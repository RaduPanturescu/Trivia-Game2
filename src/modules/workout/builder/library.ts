import { isBodyweightExercise } from '../core/catalog'
import type { WorkoutExerciseDetails, WorkoutLibraryExercise } from '../core/types'
import type { ExerciseTypeFilter } from './types'

/** Shortest exercise list height in pixels. */
export const EXERCISE_LIST_MIN_HEIGHT = 300

/** Tallest exercise list height in pixels. */
export const EXERCISE_LIST_MAX_HEIGHT = 600

/** Height used when nothing valid is stored (legacy default). */
export const EXERCISE_LIST_DEFAULT_HEIGHT = 380

/**
 * The height the exercise list should use: a stored value when it is a positive number, otherwise the default. Always
 * kept within the minimum and maximum.
 * @param stored - The stored height in pixels.
 * @returns The height in pixels.
 */
export function resolveExerciseListHeight(stored: number): number {
  const usable = Number.isFinite(stored) && stored > 0 ? stored : EXERCISE_LIST_DEFAULT_HEIGHT
  return clampExerciseListHeight(usable)
}

/**
 * Rounds a height to whole pixels and keeps it within the minimum and maximum.
 * @param value - A measured or stored height in pixels.
 * @returns The height to store and show.
 */
export function clampExerciseListHeight(value: number): number {
  return Math.max(EXERCISE_LIST_MIN_HEIGHT, Math.min(EXERCISE_LIST_MAX_HEIGHT, Math.round(value)))
}

/**
 * Whether an exercise passes the type filter. Bodyweight is the explicit flag, or a zero load when there is none.
 * @param exercise - The exercise to test.
 * @param filter - `all`, `bodyweight` or `weighted`.
 * @returns `true` when the exercise is listed.
 */
export function matchesExerciseType(exercise: Pick<WorkoutExerciseDetails, 'bodyWeight' | 'weight'>, filter: ExerciseTypeFilter): boolean {
  if (filter === 'all') return true
  return filter === (isBodyweightExercise(exercise) ? 'bodyweight' : 'weighted')
}

/**
 * The exercises listed for the current filters.
 * @param exercises - Library exercises, in display order.
 * @param typeFilter - The type filter.
 * @param category - A category key, or `all`.
 * @returns A new array in the same order.
 */
export function filterExercises<T extends WorkoutLibraryExercise>(exercises: readonly T[], typeFilter: ExerciseTypeFilter, category: string): T[] {
  return exercises.filter((exercise) => matchesExerciseType(exercise, typeFilter) && (category === 'all' || exercise.category === category))
}

/**
 * Category keys to offer as filter chips. Keeps the order legacy used: categories of the library first, then the saved
 * category list. With a type filter, only categories that have a matching exercise remain.
 * @param library - Built-in and custom exercises.
 * @param categories - The full category list.
 * @param typeFilter - The type filter.
 * @returns Category keys, without `all`.
 */
export function listCategoryChips(library: readonly WorkoutLibraryExercise[], categories: readonly string[], typeFilter: ExerciseTypeFilter): string[] {
  const all = Array.from(new Set([...library.map((exercise) => exercise.category), ...categories]))
  if (typeFilter === 'all') return all
  return all.filter((category) => library.some((exercise) => exercise.category === category && matchesExerciseType(exercise, typeFilter)))
}

/**
 * Weight text shown in the library: `Body Weight` or the load in kg.
 * @param exercise - The exercise.
 * @returns The label.
 */
export function formatExerciseWeight(exercise: Pick<WorkoutExerciseDetails, 'bodyWeight' | 'weight'>): string {
  return isBodyweightExercise(exercise) ? 'Body Weight' : `${exercise.weight || 0}kg`
}

/**
 * The one-line summary under an exercise name in the library: sets, reps or till failure, and weight.
 * @param exercise - The exercise.
 * @returns The summary, parts joined by a bullet.
 */
export function formatExerciseMeta(exercise: WorkoutExerciseDetails): string {
  return [
    `${exercise.sets} sets`,
    exercise.repsTillFailure ? "'Till Failure" : `${exercise.reps} reps`,
    formatExerciseWeight(exercise),
  ].join(' • ')
}

/**
 * Whether a library exercise is a user-created one, which can be removed from the library.
 * @param id - The exercise id.
 * @returns `true` for ids created by the custom-exercise flow.
 */
export function isCustomExerciseId(id: string): boolean {
  return id.startsWith('custom-')
}
