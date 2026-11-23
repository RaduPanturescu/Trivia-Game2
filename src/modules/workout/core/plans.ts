import { asArray, type WorkoutLibraryExercise, type WorkoutProgram, type WorkoutSavedPlan, type WorkoutWeeklyTemplates } from './types'

/**
 * Deep copy of a JSON-compatible value. Used so saved snapshots and live state never share objects.
 * @param value - Any JSON-compatible value (reactive proxies included).
 * @returns A copy with no shared references.
 */
export function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

/**
 * Parses the stored saved-plan list. Anything that is not an array gives `[]`.
 * @param raw - The parsed `triviaWorkoutSavedPlans` value.
 * @returns The plans.
 */
export function listSavedPlans(raw: unknown): WorkoutSavedPlan[] {
  return asArray<WorkoutSavedPlan>(raw)
}

/** Inputs for {@link createWorkoutPlanSnapshot}. */
export interface WorkoutPlanSnapshotInput {
  /** Plan name as typed. */
  name: string
  /** The live program. */
  program: WorkoutProgram
  /** The live weekly templates. */
  templates: WorkoutWeeklyTemplates
  /** The live category list. */
  categories: string[]
  /** The live custom library. */
  customExercises: WorkoutLibraryExercise[]
}

/**
 * Snapshots the whole program under a name so it can be switched back to later.
 * @param input - The current state and the plan name.
 * @param now - The save time, used for the id and `savedAt`.
 * @returns A new saved plan with deep copies of everything.
 */
export function createWorkoutPlanSnapshot(input: WorkoutPlanSnapshotInput, now: Date = new Date()): WorkoutSavedPlan {
  return {
    id: `plan-${now.getTime()}`,
    name: input.name,
    savedAt: now.toISOString(),
    currentWeekStart: input.program.currentWeekStart,
    weeks: cloneJson(input.program.weeks),
    weeklyTemplates: cloneJson(input.templates),
    categories: [...input.categories],
    customExercises: cloneJson(input.customExercises),
  }
}

/**
 * The state a saved plan restores when the user switches to it.
 * @param plan - The plan to load.
 * @param currentCategories - Categories in effect, kept when the plan has none stored.
 * @returns The new program, templates, categories and custom library. The caller stores them.
 */
export function loadWorkoutPlan(
  plan: WorkoutSavedPlan,
  currentCategories: string[],
): { program: WorkoutProgram; templates: WorkoutWeeklyTemplates; categories: string[]; customExercises: WorkoutLibraryExercise[] } {
  return {
    program: {
      currentWeekStart: plan.currentWeekStart || plan.weeks[0]?.weekStart || '',
      weeks: cloneJson(plan.weeks),
    },
    templates: plan.weeklyTemplates ?? {},
    categories: plan.categories ?? currentCategories,
    customExercises: plan.customExercises ?? [],
  }
}

/**
 * Returns the plan list with one plan renamed. The name is trimmed by the caller.
 * @param plans - The saved plans.
 * @param id - The plan to rename.
 * @param name - The new name.
 * @returns A new list.
 */
export function renameSavedPlan(plans: readonly WorkoutSavedPlan[], id: string, name: string): WorkoutSavedPlan[] {
  return plans.map((plan) => (plan.id === id ? { ...plan, name } : plan))
}

/**
 * Returns the plan list without one plan.
 * @param plans - The saved plans.
 * @param id - The plan to delete.
 * @returns A new list.
 */
export function deleteSavedPlan(plans: readonly WorkoutSavedPlan[], id: string): WorkoutSavedPlan[] {
  return plans.filter((plan) => plan.id !== id)
}
