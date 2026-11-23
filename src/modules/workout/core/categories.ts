import { DEFAULT_WORKOUT_CATEGORIES, getWorkoutExerciseCatalog } from './catalog'
import { asArray, type WorkoutExerciseOverrides, type WorkoutLibraryExercise, type WorkoutProgram, type WorkoutSavedPlan, type WorkoutWeeklyTemplates } from './types'

/**
 * Full category list: the built-in categories first, then any saved ones that are not built-in.
 * @param saved - The stored `triviaWorkoutCategories` value. Malformed or empty gives only the built-ins.
 * @returns A new list without duplicates.
 */
export function getWorkoutCategories(saved: unknown): string[] {
  const list = asArray<string>(saved)
  if (list.length === 0) return [...DEFAULT_WORKOUT_CATEGORIES]
  return Array.from(new Set([...DEFAULT_WORKOUT_CATEGORIES, ...list]))
}

/**
 * Display label for a category key: first letter capitalised.
 * @param category - The stored key, e.g. `upper body`.
 * @returns `Upper body`, or `''` for an empty key.
 */
export function formatWorkoutCategoryLabel(category: string): string {
  const label = String(category || '')
  return label ? `${label.charAt(0).toUpperCase()}${label.slice(1)}` : label
}

/** Result of {@link addWorkoutCategory}. */
export interface WorkoutCategoryAddResult {
  /** The normalised key that was added or already existed. */
  category: string
  /** The full list to store. */
  categories: string[]
}

/**
 * Adds a category. The name is trimmed and lower-cased; an existing category is not duplicated.
 * @param saved - The stored `triviaWorkoutCategories` value.
 * @param input - What the user typed.
 * @returns The key and the list to store, or `null` when the input is blank.
 */
export function addWorkoutCategory(saved: unknown, input: string): WorkoutCategoryAddResult | null {
  const category = input.trim().toLowerCase()
  if (!category) return null
  const categories = getWorkoutCategories(saved)
  if (!categories.includes(category)) categories.push(category)
  return { category, categories }
}

/** Everything a category may be in use by. */
export interface WorkoutCategoryUsage {
  /** Catalog overrides in effect. */
  overrides: WorkoutExerciseOverrides
  /** Custom library exercises. */
  customExercises: WorkoutLibraryExercise[]
  /** The live program. */
  program: WorkoutProgram
  /** Saved plans. */
  savedPlans: WorkoutSavedPlan[]
  /** Weekly templates. */
  templates: WorkoutWeeklyTemplates
}

/**
 * Whether a category can be removed: it must be a custom one and nothing may use it. Anything in the library, the
 * program, a saved plan or a weekly template counts as use.
 * @param category - The category key.
 * @param usage - Where the category may be used.
 * @returns `true` when the category can be removed.
 */
export function isRemovableWorkoutCategory(category: string, usage: WorkoutCategoryUsage): boolean {
  if ((DEFAULT_WORKOUT_CATEGORIES as readonly string[]).includes(category)) return false
  const library = [...getWorkoutExerciseCatalog(usage.overrides), ...usage.customExercises]
  if (library.some((exercise) => exercise.category === category)) return false
  if (usage.program.weeks.some((week) => week.days.some((day) => day.exercises.some((exercise) => exercise.category === category)))) return false
  const inSavedPlan = usage.savedPlans.some((plan) =>
    (plan.customExercises ?? []).some((exercise) => exercise.category === category)
    || (plan.weeks ?? []).some((week) => (week.days ?? []).some((day) => (day.exercises ?? []).some((exercise) => exercise.category === category)))
    || Object.values(plan.weeklyTemplates ?? {}).some((template) => (template?.exercises ?? []).some((exercise) => exercise.category === category)),
  )
  if (inSavedPlan) return false
  return !Object.values(usage.templates).some((template) => (template?.exercises ?? []).some((exercise) => exercise.category === category))
}

/**
 * The category list without one category. Callers must check {@link isRemovableWorkoutCategory} first.
 * @param saved - The stored `triviaWorkoutCategories` value.
 * @param category - The key to drop.
 * @returns The full list to store.
 */
export function removeWorkoutCategory(saved: unknown, category: string): string[] {
  return getWorkoutCategories(saved).filter((item) => item !== category)
}
