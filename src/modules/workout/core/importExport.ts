import { isoDate, parseLocalDate } from '@/shared/dates'
import { getMonday, getTodayWorkoutDay, isIsoDateString } from './schedule'
import { createWorkoutDayTemplate } from './templates'
import { isRecord, type WorkoutDay, type WorkoutExerciseOverrides, type WorkoutExportPayload, type WorkoutLibraryExercise, type WorkoutProgram, type WorkoutWeeklyTemplates } from './types'

/** Format marker written into every export and required on import. */
const EXPORT_FORMAT = 'bianka-workout-program'

/** Inputs for {@link buildWorkoutExport}. */
export interface WorkoutExportInput {
  /** The live program. */
  program: WorkoutProgram
  /** Weekly templates. */
  templates: WorkoutWeeklyTemplates
  /** Category list. */
  categories: string[]
  /** Custom library. */
  customExercises: WorkoutLibraryExercise[]
  /** Catalog overrides. */
  overrides: WorkoutExerciseOverrides
  /** Resolved program start, `YYYY-MM-DD`. */
  programStartDate: string
}

/**
 * Builds the JSON payload for "Export". The caller turns it into a file.
 * @param input - The live state.
 * @param now - The export time.
 * @returns A payload that {@link isValidWorkoutImport} accepts.
 */
export function buildWorkoutExport(input: WorkoutExportInput, now: Date = new Date()): WorkoutExportPayload {
  return {
    format: EXPORT_FORMAT,
    version: 1,
    exportedAt: now.toISOString(),
    currentWeekStart: input.program.currentWeekStart,
    programStartDate: input.programStartDate,
    weeklyTemplates: input.templates,
    categories: input.categories,
    customExercises: input.customExercises,
    exerciseOverrides: input.overrides,
    weeks: input.program.weeks,
  }
}

/**
 * Checks that a parsed file is a workout export, with the shapes the import relies on. Type checks only; the data is
 * not repaired.
 * @param payload - The parsed JSON.
 * @returns `true` when the payload can be imported.
 */
export function isValidWorkoutImport(payload: unknown): payload is WorkoutExportPayload {
  const isDate = (value: unknown): value is string => isIsoDateString(value) && isoDate(parseLocalDate(value)) === value
  const validExercises = (list: unknown): boolean => Array.isArray(list) && list.every((exercise) => isRecord(exercise) && typeof exercise.name === 'string')
  const validTemplate = (template: unknown): boolean => isRecord(template)
    && (template.type === 'rest' || template.type === 'workout' || template.type === null)
    && validExercises(template.exercises)
  const validWeek = (week: unknown): boolean => isRecord(week) && isDate(week.weekStart) && Array.isArray(week.days)
    && week.days.length === 7
    && week.days.every((day) => isRecord(day) && isDate(day.date)
      && (day.type === 'rest' || day.type === 'workout' || day.type === null)
      && validExercises(day.exercises))

  if (!isRecord(payload) || payload.format !== EXPORT_FORMAT) return false
  if (payload.programStartDate !== undefined && !isDate(payload.programStartDate)) return false
  if (payload.weeklyTemplates !== undefined && !(isRecord(payload.weeklyTemplates) && Object.values(payload.weeklyTemplates).every(validTemplate))) return false
  if (payload.categories !== undefined && !(Array.isArray(payload.categories) && payload.categories.every((category) => typeof category === 'string'))) return false
  if (payload.customExercises !== undefined && !validExercises(payload.customExercises)) return false
  if (payload.exerciseOverrides !== undefined && !isRecord(payload.exerciseOverrides)) return false
  return Array.isArray(payload.weeks) && payload.weeks.length > 0 && payload.weeks.every(validWeek)
}

/** The state an import replaces. The caller stores each part and then saves the imported file as a plan. */
export interface WorkoutImportState {
  /** The imported weeks, with the current week selected. */
  program: WorkoutProgram
  /** Weekly templates, filled in for any weekday the file did not provide. */
  templates: WorkoutWeeklyTemplates
  /** Categories from the file, or the current list when the file has none. */
  categories: string[]
  /** Custom library from the file. */
  customExercises: WorkoutLibraryExercise[]
  /** Catalog overrides from the file, or the current ones when the file has none. */
  overrides: WorkoutExerciseOverrides
  /** Program start from the file, or `''` when the file has none (the caller then infers it). */
  programStartDate: string
}

/**
 * Applies a validated export: replaces the schedule and library with the file's contents. Missing weekday templates
 * come from the latest imported week that has that day.
 * @param payload - A payload accepted by {@link isValidWorkoutImport}.
 * @param current - Categories and overrides in effect now, kept when the file does not carry them.
 * @param now - The current time. The current week is selected and today's day is created if missing.
 * @returns The new state to store.
 */
export function applyWorkoutImport(
  payload: WorkoutExportPayload,
  current: { categories: string[]; overrides: WorkoutExerciseOverrides },
  now: Date = new Date(),
): WorkoutImportState {
  const templates: WorkoutWeeklyTemplates = { ...(payload.weeklyTemplates ?? {}) }
  const latestWeeks = [...payload.weeks].sort((a, b) => b.weekStart.localeCompare(a.weekStart))
  for (let index = 0; index < 7; index++) {
    if (templates[index]) continue
    const day: WorkoutDay | undefined = latestWeeks.map((week) => week.days[index]).find((item): item is WorkoutDay => !!item && item.type !== null)
    templates[index] = day ? createWorkoutDayTemplate(day) : { type: 'rest', exercises: [] }
  }

  const overrides = payload.exerciseOverrides ?? current.overrides
  const program: WorkoutProgram = { currentWeekStart: isoDate(getMonday(now)), weeks: payload.weeks }
  getTodayWorkoutDay(program, { templates, overrides }, now)

  return {
    program,
    templates,
    categories: payload.categories ?? current.categories,
    customExercises: payload.customExercises ?? [],
    overrides,
    programStartDate: payload.programStartDate ?? '',
  }
}
