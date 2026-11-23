import { isBodyweightExercise } from '../core/catalog'
import type { WorkoutExerciseDetails } from '../core/types'
import type { ExerciseDraft, ExerciseDraftNumberField, ExerciseEditorMode } from './types'

/** Limits of one number input, as in the legacy form attributes. */
export interface NumberBounds {
  /** Smallest allowed value. */
  min: number
  /** Largest allowed value. */
  max: number
  /** Step: values must be `min` plus a whole number of steps. */
  step: number
}

/** Limits of every number input of the editor form. */
export const EDITOR_BOUNDS: Readonly<Record<ExerciseDraftNumberField, NumberBounds>> = {
  sets: { min: 1, max: 12, step: 1 },
  reps: { min: 1, max: 30, step: 1 },
  weight: { min: 0, max: 200, step: 1 },
  duration: { min: 15, max: 300, step: 15 },
  rest: { min: 15, max: 180, step: 15 },
}

/** Description saved when the user leaves the description empty. */
export const DEFAULT_EXERCISE_DESCRIPTION = 'Custom exercise added to your weekly plan.'

/** Heading, description and save button text for each editor mode. */
export const EDITOR_COPY: Readonly<Record<ExerciseEditorMode, { title: string; description: string; saveLabel: string }>> = {
  new: {
    title: 'Create New Exercise',
    description: 'Create an exercise for your reusable exercise list.',
    saveLabel: 'Add Exercise To List',
  },
  library: {
    title: 'Edit Exercise in List',
    description: 'Update this reusable exercise without changing any scheduled day.',
    saveLabel: 'Save Exercise Changes',
  },
  day: {
    title: 'Edit Today’s Exercise',
    description: 'These changes apply to the selected day only.',
    saveLabel: 'Save Exercise Changes',
  },
}

/**
 * A blank editor form, as after the legacy editor was cleared: timers at 45 and 60 seconds.
 * @returns A new draft.
 */
export function createEmptyDraft(): ExerciseDraft {
  return {
    name: '',
    category: '',
    description: '',
    sets: '',
    reps: '',
    weight: '',
    duration: '45',
    rest: '60',
    repsTillFailure: false,
    bodyWeight: false,
    previousReps: undefined,
    previousWeight: undefined,
  }
}

/**
 * Snaps a timer value to the nearest step inside its bounds. An empty or non-numeric value counts as the minimum.
 * @param value - The text in the timer input.
 * @param bounds - The input's limits.
 * @returns The snapped value as text, as the legacy slider sync wrote it.
 */
export function snapToStep(value: string, bounds: NumberBounds): string {
  const raw = Number(value || bounds.min)
  const base = Number.isFinite(raw) ? raw : bounds.min
  const stepped = bounds.min + Math.round((base - bounds.min) / bounds.step) * bounds.step
  return String(Math.max(bounds.min, Math.min(bounds.max, stepped)))
}

/**
 * Builds the form for an existing exercise, as the legacy populate step did.
 * @param exercise - A library exercise or a day exercise.
 * @returns A draft with the exercise's values; till failure and body weight switched on when the exercise has them.
 */
export function draftFromExercise(exercise: WorkoutExerciseDetails): ExerciseDraft {
  const draft: ExerciseDraft = {
    ...createEmptyDraft(),
    name: exercise.name,
    category: exercise.category || 'chest',
    description: exercise.description || '',
    sets: String(exercise.sets || 3),
    reps: String(exercise.reps ?? 10),
    weight: String(exercise.weight ?? 0),
    duration: snapToStep(String(exercise.duration || 45), EDITOR_BOUNDS.duration),
    rest: snapToStep(String(exercise.rest || 60), EDITOR_BOUNDS.rest),
  }
  setDraftOption(draft, 'reps', !!exercise.repsTillFailure)
  setDraftOption(draft, 'weight', isBodyweightExercise(exercise))
  return draft
}

/**
 * Switches "'Till Failure" (reps) or "Body Weight" (weight) on or off. Switching on empties the number input and keeps
 * the typed value. Switching off restores it, or the fallback when it is below the minimum.
 * @param draft - The form. Updated in place.
 * @param field - `reps` for till failure, `weight` for body weight.
 * @param active - The new state.
 */
export function setDraftOption(draft: ExerciseDraft, field: 'reps' | 'weight', active: boolean): void {
  const flag = field === 'reps' ? 'repsTillFailure' : 'bodyWeight'
  const previousKey = field === 'reps' ? 'previousReps' : 'previousWeight'
  if (active) {
    if (!draft[flag]) draft[previousKey] = draft[field]
    draft[field] = ''
  } else {
    const previous = draft[previousKey]
    if (previous !== undefined) {
      const min = EDITOR_BOUNDS[field].min
      draft[field] = Number(previous) >= min ? previous : (field === 'reps' ? '10' : String(min))
    }
    draft[previousKey] = undefined
  }
  draft[flag] = active
}

/**
 * Whether a number input is locked by its option: reps while till failure is on, weight while body weight is on.
 * @param draft - The form.
 * @param field - The number input.
 * @returns `true` when the input is disabled.
 */
export function isDraftFieldLocked(draft: ExerciseDraft, field: ExerciseDraftNumberField): boolean {
  if (field === 'reps') return draft.repsTillFailure
  if (field === 'weight') return draft.bodyWeight
  return false
}

/**
 * Moves a number input one step up or down within its bounds, as the legacy steppers did. Locked inputs are unchanged.
 * @param draft - The form. Updated in place.
 * @param field - The number input.
 * @param direction - `1` for up, `-1` for down.
 */
export function stepDraftNumber(draft: ExerciseDraft, field: ExerciseDraftNumberField, direction: 1 | -1): void {
  if (isDraftFieldLocked(draft, field)) return
  const bounds = EDITOR_BOUNDS[field]
  const current = Number(draft[field] || bounds.min)
  draft[field] = String(Math.max(bounds.min, Math.min(bounds.max, current + bounds.step * direction)))
}

/**
 * Whether a number input holds a usable value: a finite number within bounds and on a step.
 * @param value - The text in the input.
 * @param bounds - The input's limits.
 * @returns `true` when the value is valid.
 */
export function isValidNumberInput(value: string, bounds: NumberBounds): boolean {
  const text = value.trim()
  if (!text) return false
  const number = Number(text)
  if (!Number.isFinite(number) || number < bounds.min || number > bounds.max) return false
  return Number.isInteger((number - bounds.min) / bounds.step)
}

/**
 * Checks the form before saving. Name, category, sets, timers and rest are always required; reps only when the
 * exercise is not done till failure. Weight is not checked, as in the legacy form.
 * @param draft - The form.
 * @returns `true` when the form can be saved.
 */
export function isDraftValid(draft: ExerciseDraft): boolean {
  if (!draft.name.trim() || !draft.category) return false
  if (!isValidNumberInput(draft.sets, EDITOR_BOUNDS.sets)) return false
  if (!draft.repsTillFailure && !isValidNumberInput(draft.reps, EDITOR_BOUNDS.reps)) return false
  return isValidNumberInput(draft.duration, EDITOR_BOUNDS.duration) && isValidNumberInput(draft.rest, EDITOR_BOUNDS.rest)
}

/**
 * The exercise fields a saved form produces. Till failure stores reps as `0`; body weight stores weight as `0`.
 * @param draft - A form that passed {@link isDraftValid}.
 * @returns The exercise details to store.
 */
export function draftToExerciseDetails(draft: ExerciseDraft): WorkoutExerciseDetails {
  return {
    name: draft.name.trim(),
    category: draft.category,
    sets: Number(draft.sets),
    reps: draft.repsTillFailure ? 0 : Number(draft.reps),
    repsTillFailure: draft.repsTillFailure,
    weight: draft.bodyWeight ? 0 : Number(draft.weight || 0),
    bodyWeight: draft.bodyWeight,
    duration: Number(draft.duration),
    rest: Number(draft.rest),
    description: draft.description.trim() || DEFAULT_EXERCISE_DESCRIPTION,
  }
}
