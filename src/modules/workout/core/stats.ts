import { isoDate, parseLocalDate } from '@/shared/dates'
import { asArray, type StoredMetricBaseline, type WorkoutDayExercise, type WorkoutMetricBaseline, type WorkoutProgram, type WorkoutScheduleContext, type WorkoutStatsSnapshot, type WorkoutWeeklyTemplates } from './types'
import { getWorkoutDayIndex, isUntrackedWorkoutDay, isWorkoutDayCompleted } from './schedule'

/**
 * Kilograms moved by one exercise: load times reps times sets. Bodyweight and till-failure exercises move none.
 * @param exercise - The exercise.
 * @returns Kilograms, never negative.
 */
export function getExerciseKgMoved(exercise: Pick<WorkoutDayExercise, 'bodyWeight' | 'repsTillFailure' | 'weight' | 'reps' | 'sets'>): number {
  if (exercise.bodyWeight || exercise.repsTillFailure) return 0
  return Math.max(0, Number(exercise.weight || 0)) * Math.max(0, Number(exercise.reps || 0)) * Math.max(0, Number(exercise.sets || 0))
}

/** An empty baseline, used when nothing valid is stored. */
const EMPTY_BASELINE: WorkoutMetricBaseline = {
  version: 2,
  workouts: 0,
  sets: 0,
  reps: 0,
  kg: 0,
  completedExercises: 0,
  completedExerciseKeys: [],
  completedWorkoutKeys: [],
}

/**
 * Reads the stored baseline. Anything other than version 2 counts as empty.
 * @param stored - The parsed `triviaWorkoutMetricBaseline` value, or `null`.
 * @returns A complete baseline.
 */
export function getWorkoutMetricBaseline(stored: StoredMetricBaseline | null | undefined): WorkoutMetricBaseline {
  if (!stored || stored.version !== 2) return { ...EMPTY_BASELINE, completedExerciseKeys: [], completedWorkoutKeys: [] }
  return {
    version: 2,
    workouts: Number(stored.workouts || 0),
    sets: Number(stored.sets || 0),
    reps: Number(stored.reps || 0),
    kg: Number(stored.kg || 0),
    completedExercises: Number(stored.completedExercises ?? stored.completedExerciseKeys?.length ?? 0),
    completedExerciseKeys: asArray<string>(stored.completedExerciseKeys),
    completedWorkoutKeys: asArray<string>(stored.completedWorkoutKeys),
  }
}

/**
 * Archives the completed work in the live program on top of the existing baseline. Work already archived is not counted
 * again. Call this before the program is replaced or reset.
 * @param stored - The stored baseline.
 * @param program - The live program.
 * @returns The new baseline to store.
 */
export function snapshotWorkoutMetricBaseline(stored: StoredMetricBaseline | null | undefined, program: WorkoutProgram): WorkoutMetricBaseline {
  const previous = getWorkoutMetricBaseline(stored)
  const days = program.weeks.flatMap((week) => week.days ?? [])
  const previousExerciseKeys = new Set(previous.completedExerciseKeys)
  const previousWorkoutKeys = new Set(previous.completedWorkoutKeys)
  const completedEntries = days.flatMap((day) => day.exercises
    .filter((exercise) => exercise.completed)
    .map((exercise) => ({ exercise, key: `${day.date}:${exercise.id}` })))
    .filter((entry) => !previousExerciseKeys.has(entry.key))
  const completedWorkoutDays = days.filter((day) => isWorkoutDayCompleted(day) && !previousWorkoutKeys.has(day.date))
  return {
    version: 2,
    workouts: previous.workouts + completedWorkoutDays.length,
    sets: previous.sets + completedEntries.reduce((sum, entry) => sum + Number(entry.exercise.sets || 0), 0),
    reps: previous.reps + completedEntries.reduce((sum, entry) => sum + Number(entry.exercise.reps || 0) * Number(entry.exercise.sets || 0), 0),
    kg: previous.kg + completedEntries.reduce((sum, entry) => sum + getExerciseKgMoved(entry.exercise), 0),
    completedExercises: previous.completedExercises + completedEntries.length,
    completedExerciseKeys: [...previousExerciseKeys, ...completedEntries.map((entry) => entry.key)],
    completedWorkoutKeys: [...previousWorkoutKeys, ...completedWorkoutDays.map((day) => day.date)],
  }
}

/**
 * Date of the first completed workout, counting archived work too.
 * @param program - The live program.
 * @param stored - The stored baseline.
 * @returns The earliest `YYYY-MM-DD`, or `null` when there is none.
 */
export function getFirstWorkoutDate(program: WorkoutProgram, stored: StoredMetricBaseline | null | undefined): string | null {
  const baseline = getWorkoutMetricBaseline(stored)
  const archivedExerciseDates = baseline.completedExerciseKeys
    .map((key) => key.match(/^(\d{4}-\d{2}-\d{2}):/)?.[1])
    .filter((date): date is string => !!date)
  const currentWorkoutDates = program.weeks.flatMap((week) => (week.days ?? [])
    .filter((day) => day.type === 'workout' && isWorkoutDayCompleted(day))
    .map((day) => day.date))
  const dates = [...baseline.completedWorkoutKeys, ...archivedExerciseDates, ...currentWorkoutDates]
    .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort()
  return dates[0] ?? null
}

/**
 * Current streak of completed workout days. Rest days keep the streak alive. A missed workout day resets it.
 * Days before the program start that were never tracked do not reset it.
 * @param program - The live program.
 * @param templates - Weekly templates, used for days that are not in the program.
 * @param programStartDate - The resolved program start, `YYYY-MM-DD`.
 * @param now - The current time.
 * @returns The streak length.
 */
export function calculateWorkoutStreak(
  program: WorkoutProgram,
  templates: WorkoutWeeklyTemplates,
  programStartDate: string,
  now: Date = new Date(),
): number {
  const today = isoDate(now)
  const byDate = new Map(program.weeks.flatMap((week) => week.days ?? []).map((day) => [day.date, day] as const))
  let streak = 0
  for (const date = parseLocalDate(programStartDate); isoDate(date) <= today; date.setDate(date.getDate() + 1)) {
    const dateKey = isoDate(date)
    const day = byDate.get(dateKey)
    const scheduledType = day ? day.type : templates[getWorkoutDayIndex(dateKey)]?.type
    if (scheduledType === 'rest') {
      // Rest days keep a streak alive but never start or extend one.
    } else if (scheduledType === 'workout') {
      if (isWorkoutDayCompleted(day ?? { type: 'workout', exercises: [] })) {
        streak += 1
      } else if ((dateKey < today || day?.manualMissed) && !isUntrackedWorkoutDay(day, programStartDate)) {
        streak = 0
      }
    } else {
      streak = 0
    }
  }
  return streak
}

/** Inputs for {@link getWorkoutStatsSnapshot}. */
export interface WorkoutStatsInput {
  /** The live program. */
  program: WorkoutProgram
  /** Weekly templates and catalog overrides. */
  ctx: WorkoutScheduleContext
  /** Resolved program start, `YYYY-MM-DD`. */
  programStartDate: string
  /** The stored baseline. */
  baseline: StoredMetricBaseline | null | undefined
  /** Trivia points. */
  points: number
}

/**
 * Headline stats: the baseline plus everything still in the live program. This is the object achievement triggers read.
 * @param input - The live state and the points.
 * @param now - The current time, for the streak.
 * @returns A new snapshot.
 */
export function getWorkoutStatsSnapshot(input: WorkoutStatsInput, now: Date = new Date()): WorkoutStatsSnapshot {
  const baseline = getWorkoutMetricBaseline(input.baseline)
  const days = input.program.weeks.flatMap((week) => week.days ?? [])
  const archivedExerciseKeys = new Set(baseline.completedExerciseKeys)
  const archivedWorkoutKeys = new Set(baseline.completedWorkoutKeys)
  const completed = days.flatMap((day) => day.exercises
    .filter((exercise) => exercise.completed && !archivedExerciseKeys.has(`${day.date}:${exercise.id}`)))
  return {
    workouts: baseline.workouts + days.filter((day) => isWorkoutDayCompleted(day) && !archivedWorkoutKeys.has(day.date)).length,
    sets: baseline.sets + completed.reduce((sum, exercise) => sum + Number(exercise.sets || 0), 0),
    reps: baseline.reps + completed.reduce((sum, exercise) => sum + Number(exercise.reps || 0) * Number(exercise.sets || 0), 0),
    kg: baseline.kg + completed.reduce((sum, exercise) => sum + getExerciseKgMoved(exercise), 0),
    streak: calculateWorkoutStreak(input.program, input.ctx.templates, input.programStartDate, now),
    exercises: baseline.completedExercises + completed.length,
    points: input.points,
  }
}

/**
 * Formats a kilogram total for display: `12.5k` above 10 000 kg, whole numbers as-is, otherwise one decimal.
 * @param totalKg - Kilograms.
 * @returns The display string.
 */
export function formatKilogramStat(totalKg: number): string {
  return totalKg > 10000
    ? `${(totalKg / 1000).toFixed(1).replace(/\.0$/, '')}k`
    : (Number.isInteger(totalKg) ? String(totalKg) : totalKg.toFixed(1))
}
