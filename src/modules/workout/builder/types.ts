/**
 * Types of the program builder: library filters, the editor form and the editor's target.
 */

/** Which library exercises are listed: all, bodyweight only, or weighted only. */
export type ExerciseTypeFilter = 'all' | 'bodyweight' | 'weighted'

/**
 * What the editor changes: a new library exercise, a library exercise, or one exercise of the selected day.
 */
export type ExerciseEditorMode = 'new' | 'library' | 'day'

/** Number inputs and text inputs of the editor form that the builder writes to. */
export type ExerciseDraftTextField = 'name' | 'category' | 'description'

/** Number inputs of the editor form. */
export type ExerciseDraftNumberField = 'sets' | 'reps' | 'weight' | 'duration' | 'rest'

/**
 * The editor form. Number inputs keep the text the user typed, so validation sees what the legacy form saw.
 * While "'Till Failure" or "Body Weight" is on, its number input is empty; the typed value is kept in
 * `previousReps` / `previousWeight` and put back when the option is switched off.
 */
export interface ExerciseDraft {
  /** Exercise name. */
  name: string
  /** Category key. Empty until one is chosen. */
  category: string
  /** Optional instruction text. */
  description: string
  /** Sets, as typed. */
  sets: string
  /** Reps, as typed. Empty while `repsTillFailure` is on. */
  reps: string
  /** Load in kg, as typed. Empty while `bodyWeight` is on. */
  weight: string
  /** Set timer in seconds, as typed. */
  duration: string
  /** Rest timer in seconds, as typed. */
  rest: string
  /** `true` when the exercise is done till failure. */
  repsTillFailure: boolean
  /** `true` for bodyweight exercises. */
  bodyWeight: boolean
  /** Reps typed before "'Till Failure" was switched on. Restored when it is switched off. */
  previousReps: string | undefined
  /** Weight typed before "Body Weight" was switched on. Restored when it is switched off. */
  previousWeight: string | undefined
}
