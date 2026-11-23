/**
 * Stored shapes of the workout module. Every type mirrors the JSON the legacy app writes under the
 * `triviaWorkout*` keys, so existing user data keeps loading. Stored data is not trusted at runtime:
 * the core validates or normalises it where legacy did.
 */

/**
 * Kind of a scheduled day. `null` is a legacy "no plan" day (past days of a week created after the fact).
 */
export type WorkoutDayType = 'workout' | 'rest' | null

/**
 * Fields that describe how an exercise is performed. Shared by catalog entries, custom exercises,
 * weekly template entries and day entries.
 */
export interface WorkoutExerciseDetails {
  /** Display name. */
  name: string
  /** Category key, e.g. `chest` or a user-added category. Lower case. */
  category: string
  /** Number of sets. */
  sets: number
  /** Repetitions per set. `0` when the exercise is performed till failure. */
  reps: number
  /** Load in kilograms. `0` for bodyweight exercises. */
  weight: number
  /** Expected seconds per set, used for the workout time estimate. */
  duration: number
  /** Rest seconds between sets, used for the workout time estimate. */
  rest: number
  /** Short instruction text shown in the exercise details. */
  description?: string
  /** `true` for bodyweight exercises. Legacy falls back to `weight === 0` when absent. */
  bodyWeight?: boolean
  /** `true` when the set is done till failure instead of a fixed rep count. */
  repsTillFailure?: boolean
}

/** An exercise in the library: a built-in catalog entry (overridable) or a user-created custom exercise. */
export interface WorkoutLibraryExercise extends WorkoutExerciseDetails {
  /** Stable id. Built-ins use slugs such as `bench-press`; custom ones use `custom-<timestamp>`. */
  id: string
}

/** An exercise as stored inside a weekly template. Templates never store id, completion or set progress. */
export type WorkoutTemplateExercise = WorkoutExerciseDetails

/** An exercise scheduled on one day, with its own id and progress. */
export interface WorkoutDayExercise extends WorkoutExerciseDetails {
  /** Unique per day, e.g. `bench-press-2026-11-23-0`. */
  id: string
  /** `true` once the exercise is done. Missing in some imported data, treated as `false`. */
  completed?: boolean
  /** Current set number, starting at 1. Missing in some imported data, treated as 1. */
  currentSet?: number
}

/** One calendar day of the program. */
export interface WorkoutDay {
  /** Local calendar date as `YYYY-MM-DD`. */
  date: string
  /** Short weekday label from the browser locale, e.g. `Mon`. */
  dayLabel: string
  /** Workout, rest, or `null` for a "no plan" day. */
  type: WorkoutDayType
  /** Exercises scheduled for this day. Empty for rest days. */
  exercises: WorkoutDayExercise[]
  /** Cached completion flag, kept in sync by the core (see `isWorkoutDayCompleted`). */
  completed: boolean
  /** `true` when the user marked the day as done by hand. */
  manualCompleted?: boolean
  /** `true` when the user marked the day as missed by hand. */
  manualMissed?: boolean
  /** Explicit override for "workout happened before the program started". Absent means derive from dates. */
  untrackedWorkout?: boolean
  /** Exercises kept aside while the day is manually marked, restored when the mark is cleared. */
  savedExercisesForWorkout?: WorkoutDayExercise[]
}

/** One Monday-to-Sunday week. `days` always holds seven entries in order. */
export interface WorkoutWeek {
  /** Monday of the week as `YYYY-MM-DD`. */
  weekStart: string
  /** The seven days, Monday first. */
  days: WorkoutDay[]
}

/** The stored `triviaWorkoutProgram` payload. Legacy writes exactly these two fields. */
export interface WorkoutProgram {
  /** Monday of the week the dashboard is showing. */
  currentWeekStart: string
  /** Known weeks, most recent first when the current week was prepended. */
  weeks: WorkoutWeek[]
}

/** A recurring weekly template for one weekday. */
export interface WorkoutTemplate {
  /** Workout or rest; `null` is accepted from imports. */
  type: WorkoutDayType
  /** Exercises of the template. Empty for rest days. */
  exercises: WorkoutTemplateExercise[]
}

/**
 * The `triviaWorkoutWeeklyTemplate` payload. Keys are weekday indexes `0`..`6` (Monday = 0),
 * which JSON stores as strings; numeric access works the same way.
 */
export type WorkoutWeeklyTemplates = Partial<Record<number, WorkoutTemplate>>

/**
 * The `triviaWorkoutExerciseOverrides` payload: edits to built-in catalog entries, keyed by catalog id.
 */
export type WorkoutExerciseOverrides = Partial<Record<string, Partial<WorkoutLibraryExercise>>>

/** A named snapshot of the whole program, stored in the `triviaWorkoutSavedPlans` array. */
export interface WorkoutSavedPlan {
  /** Unique id, `plan-<timestamp>`. */
  id: string
  /** User-chosen name. */
  name: string
  /** ISO timestamp of when the snapshot was taken. */
  savedAt: string
  /** The program's `currentWeekStart` at save time. */
  currentWeekStart: string
  /** Deep copy of the program's weeks. */
  weeks: WorkoutWeek[]
  /** Deep copy of the weekly templates at save time. */
  weeklyTemplates: WorkoutWeeklyTemplates
  /** Category list at save time. */
  categories: string[]
  /** Custom exercises at save time. */
  customExercises: WorkoutLibraryExercise[]
}

/** One body weight log entry from the `triviaBodyWeightEntries` array. */
export interface BodyWeightEntry {
  /** Local calendar date as `YYYY-MM-DD`. */
  date: string
  /** Body weight in kilograms. Always greater than zero after normalisation. */
  weight: number
}

/** Raw text of the BMI calculator inputs, stored under `triviaWorkoutBmiInputs`. */
export interface WorkoutBmiInputs {
  /** Height as typed. */
  height?: string
  /** Age as typed. */
  age?: string
}

/**
 * Metric baseline v2, stored under `triviaWorkoutMetricBaseline`. It archives completed work when the program
 * is reset or replaced, so the stats keep counting it. Payloads without `version: 2` count as zero.
 */
export interface WorkoutMetricBaseline {
  /** Format version. Only `2` is read. */
  version: 2
  /** Workout days archived so far. */
  workouts: number
  /** Sets archived so far. */
  sets: number
  /** Reps archived so far (reps times sets, per exercise). */
  reps: number
  /** Kilograms moved archived so far. */
  kg: number
  /** Completed exercises archived so far. */
  completedExercises: number
  /** Archived exercise keys, `<date>:<exerciseId>`. */
  completedExerciseKeys: string[]
  /** Archived workout day dates. */
  completedWorkoutKeys: string[]
}

/** The stored baseline as read from storage: possibly empty, legacy, or partial. */
export type StoredMetricBaseline = Partial<WorkoutMetricBaseline>

/**
 * Headline stats computed from the program and the baseline. Keys match the stat names used by achievement triggers.
 * A type alias (not an interface) so it can be passed as a `Record<string, number>`.
 */
export type WorkoutStatsSnapshot = {
  /** Completed workout days, including archived ones. */
  workouts: number
  /** Total sets. */
  sets: number
  /** Total reps (reps times sets). */
  reps: number
  /** Total kilograms moved. */
  kg: number
  /** Current streak of completed workout days. */
  streak: number
  /** Completed exercises, including archived ones. */
  exercises: number
  /** Trivia points, read from the trivia progress store. */
  points: number
}

/** The file written by "Export" and read by "Import". */
export interface WorkoutExportPayload {
  /** Always `bianka-workout-program`. */
  format: 'bianka-workout-program'
  /** Always `1`. */
  version: 1
  /** ISO timestamp of the export. */
  exportedAt: string
  /** The program's `currentWeekStart` at export time. */
  currentWeekStart: string
  /** Program start date at export time. */
  programStartDate?: string
  /** Weekly templates. Optional in imported files. */
  weeklyTemplates?: WorkoutWeeklyTemplates
  /** Categories. Optional in imported files. */
  categories?: string[]
  /** Custom exercises. Optional in imported files. */
  customExercises?: WorkoutLibraryExercise[]
  /** Catalog overrides. Optional in imported files. */
  exerciseOverrides?: WorkoutExerciseOverrides
  /** All weeks. */
  weeks: WorkoutWeek[]
}

/** Inputs the core needs to create weeks: the weekly templates and catalog overrides in effect. */
export interface WorkoutScheduleContext {
  /** Current weekly templates. */
  templates: WorkoutWeeklyTemplates
  /** Current catalog overrides. */
  overrides: WorkoutExerciseOverrides
}

/**
 * Returns `value` when it is an array, otherwise an empty array. Use for stored data that may be malformed.
 * @param value - Any value read from storage.
 * @returns The array, or `[]`.
 */
export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

/**
 * Whether a value is a plain object (not null and not an array).
 * @param value - Any value read from storage.
 * @returns `true` for a record-shaped object.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
