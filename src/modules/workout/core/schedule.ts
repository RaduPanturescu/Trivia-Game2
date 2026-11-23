import { isoDate, parseLocalDate } from '@/shared/dates'
import { cloneWorkoutExercises, getWorkoutExerciseCatalog } from './catalog'
import { asArray, isRecord, type WorkoutDay, type WorkoutDayExercise, type WorkoutDayType, type WorkoutProgram, type WorkoutScheduleContext, type WorkoutTemplate, type WorkoutWeek } from './types'

/** Catalog indexes of the two exercises each day of the default week starts with. `null` is a rest day. */
const DEFAULT_WEEK_LAYOUT: readonly (readonly [number, number] | null)[] = [
  [0, 7],
  [6, 9],
  null,
  [2, 3],
  [8, 12],
  [10, 11],
  null,
]

/**
 * Whether a value is a plain `YYYY-MM-DD` date string.
 * @param value - Any value read from storage.
 * @returns `true` for a date-shaped string (the calendar validity is not checked).
 */
export function isIsoDateString(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

/**
 * Returns the Monday (local midnight) of the week containing a date.
 * @param value - A Date, a timestamp, or an ISO date string. Not modified.
 * @returns A new Date for that Monday. Sundays belong to the week that started six days earlier.
 */
export function getMonday(value: string | number | Date): Date {
  const date = parseLocalDate(value)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + diff)
  return date
}

/**
 * Index of a date's weekday in the program, Monday = 0 and Sunday = 6.
 * @param value - A Date or an ISO date string.
 * @returns `0`..`6`.
 */
export function getWorkoutDayIndex(value: string | number | Date): number {
  return (parseLocalDate(value).getDay() + 6) % 7
}

/**
 * Builds one day. The label uses the browser locale, as legacy did.
 * @param date - The day.
 * @param type - Day type. Defaults to `'rest'`. Pass `null` for a "no plan" day.
 * @param exercises - Day exercises. Defaults to none.
 * @returns A new, not-yet-completed day.
 */
export function createWorkoutDay(date: Date, type: WorkoutDayType = 'rest', exercises: WorkoutDayExercise[] = []): WorkoutDay {
  return {
    date: isoDate(date),
    dayLabel: date.toLocaleDateString(undefined, { weekday: 'short' }),
    type,
    exercises,
    completed: false,
  }
}

/**
 * Builds the seven-day week that starts on `weekStart`. Each day uses its weekly template when one is saved,
 * otherwise the built-in layout.
 * @param weekStart - Monday of the week.
 * @param ctx - Weekly templates and catalog overrides in effect.
 * @returns A new week with exactly seven days.
 */
export function createDefaultWorkoutWeek(weekStart: Date, ctx: WorkoutScheduleContext): WorkoutWeek {
  const catalog = getWorkoutExerciseCatalog(ctx.overrides)
  const days: WorkoutDay[] = []
  for (let index = 0; index < 7; index++) {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + index)
    const dateKey = isoDate(date)
    const layout = DEFAULT_WEEK_LAYOUT[index]
    const fallback: WorkoutTemplate = layout
      ? { type: 'workout', exercises: layout.map((catalogIndex) => catalog[catalogIndex]).filter((exercise) => exercise !== undefined) }
      : { type: 'rest', exercises: [] }
    const config = ctx.templates[index] ?? fallback
    const exercises = config.type === 'workout' ? cloneWorkoutExercises(config.exercises, dateKey) : []
    days.push(createWorkoutDay(date, config.type, exercises))
  }
  return { weekStart: isoDate(weekStart), days }
}

/**
 * Sets every day before `todayKey` to "no plan", as legacy does for weeks created after the fact.
 * @param week - The week to change in place.
 * @param todayKey - Today as `YYYY-MM-DD`.
 */
function clearPastDays(week: WorkoutWeek, todayKey: string): void {
  for (const day of week.days) {
    if (day.date < todayKey) {
      day.type = null
      day.exercises = []
      day.completed = false
    }
  }
}

/**
 * Loads the stored program the way legacy `ensureWorkoutState` did. A missing or empty program gets a default
 * current week. A current week that is not in the list is prepended.
 * @param stored - The parsed `triviaWorkoutProgram` value (may be malformed).
 * @param ctx - Weekly templates and catalog overrides, used when a week is created.
 * @param now - The current time.
 * @returns The program to keep in state.
 */
export function ensureProgram(stored: unknown, ctx: WorkoutScheduleContext, now: Date = new Date()): WorkoutProgram {
  const baseWeek = getMonday(now)
  const currentStart = isoDate(baseWeek)
  const record = isRecord(stored) ? stored : {}
  const storedWeeks = asArray<WorkoutWeek>(record.weeks)
  const program: WorkoutProgram = storedWeeks.length > 0
    ? {
        currentWeekStart: typeof record.currentWeekStart === 'string' && record.currentWeekStart ? record.currentWeekStart : currentStart,
        weeks: storedWeeks,
      }
    : { currentWeekStart: currentStart, weeks: [createDefaultWorkoutWeek(baseWeek, ctx)] }
  if (!program.weeks.some((week) => week.weekStart === currentStart)) {
    program.weeks.unshift(createDefaultWorkoutWeek(baseWeek, ctx))
  }
  program.currentWeekStart ||= currentStart
  return program
}

/**
 * Returns the week the dashboard is showing. Creates it (and prepends it) when missing.
 * @param program - The program. Mutated when a week is created.
 * @param ctx - Weekly templates and catalog overrides.
 * @param now - The current time, used to clear past days of a new week.
 * @returns The week, from the program's list.
 */
export function getWorkoutWeekForCurrentView(program: WorkoutProgram, ctx: WorkoutScheduleContext, now: Date = new Date()): WorkoutWeek {
  const existing = program.weeks.find((week) => week.weekStart === program.currentWeekStart)
  if (existing) return existing
  const week = createDefaultWorkoutWeek(parseLocalDate(program.currentWeekStart), ctx)
  clearPastDays(week, isoDate(now))
  program.weeks.unshift(week)
  return week
}

/**
 * Finds a day by its date. Looks in the week the date belongs to first, then in every week.
 * @param program - The program.
 * @param dateString - `YYYY-MM-DD`.
 * @returns The day, or `null` when no week has it.
 */
export function getWorkoutDayForDate(program: WorkoutProgram, dateString: string): WorkoutDay | null {
  const expectedWeekStart = isoDate(getMonday(dateString))
  const canonical = program.weeks.find((week) => week.weekStart === expectedWeekStart)?.days.find((day) => day.date === dateString)
  if (canonical) return canonical
  return program.weeks.flatMap((week) => week.days ?? []).find((day) => day.date === dateString) ?? null
}

/**
 * Returns today's day. Creates the current week when it is missing.
 * @param program - The program. Mutated when a week is created.
 * @param ctx - Weekly templates and catalog overrides.
 * @param now - The current time.
 * @returns Today's day, or `null` when the week does not contain it.
 */
export function getTodayWorkoutDay(program: WorkoutProgram, ctx: WorkoutScheduleContext, now: Date = new Date()): WorkoutDay | null {
  const dateKey = isoDate(now)
  const weekStart = isoDate(getMonday(now))
  let week = program.weeks.find((item) => item.weekStart === weekStart)
  if (!week) {
    week = createDefaultWorkoutWeek(parseLocalDate(weekStart), ctx)
    clearPastDays(week, dateKey)
    program.weeks.unshift(week)
  }
  return week.days.find((day) => day.date === dateKey) ?? null
}

/** Today's status line on the workout menu. */
export interface WorkoutMenuDayStatus {
  /** Today's day type, or `null` when there is no day for today. */
  type: WorkoutDayType
  /** Text shown on the menu: `Rest Day`, `Workout Day` or `No plan`. */
  label: string
}

/**
 * Status line for the workout menu.
 * @param program - The program. Mutated when today's week has to be created.
 * @param ctx - Weekly templates and catalog overrides.
 * @param now - The current time.
 * @returns The day type and its label.
 */
export function getWorkoutMenuDayStatus(program: WorkoutProgram, ctx: WorkoutScheduleContext, now: Date = new Date()): WorkoutMenuDayStatus {
  const type = getTodayWorkoutDay(program, ctx, now)?.type ?? null
  const label = type === 'rest' ? 'Rest Day' : type === 'workout' ? 'Workout Day' : 'No plan'
  return { type, label }
}

/**
 * Rough length of a workout: sets times duration, plus rest between sets, rounded up to five minutes.
 * @param exercises - Exercises with `sets`, `duration` and `rest` in seconds. Missing values use defaults.
 * @returns Minutes, a multiple of five.
 */
export function estimateWorkoutMinutes(exercises: readonly { sets: number; duration: number; rest: number }[]): number {
  const seconds = exercises.reduce((total, exercise) => {
    const sets = Math.max(1, Number(exercise.sets) || 1)
    const duration = Math.max(0, Number(exercise.duration) || 45)
    const rest = Math.max(0, Number(exercise.rest) || 60)
    return total + sets * duration + (sets - 1) * rest
  }, 0)
  return Math.ceil(seconds / 300) * 5
}

/** The fields completion checks read. A day object can be passed without the rest. */
export type WorkoutDayProgressInput = Pick<WorkoutDay, 'type' | 'exercises'> & Partial<Pick<WorkoutDay, 'manualCompleted' | 'manualMissed'>>

/**
 * Number of exercises marked completed on a day.
 * @param day - The day, or `undefined`.
 * @returns The count, `0` when there is no day.
 */
export function getCompletedExerciseCount(day: Pick<WorkoutDay, 'exercises'> | undefined): number {
  return (day?.exercises ?? []).filter((exercise) => exercise.completed).length
}

/**
 * Exercises needed to count a day as completed: half of them, rounded up. Zero when the day has no exercises.
 * @param day - The day, or `undefined`.
 * @returns The threshold.
 */
export function getWorkoutCompletionThreshold(day: Pick<WorkoutDay, 'exercises'> | undefined): number {
  const count = day?.exercises?.length ?? 0
  return count ? Math.ceil(count / 2) : 0
}

/**
 * Whether a workout day counts as completed. A manual mark wins; otherwise half the exercises must be done.
 * @param day - The day. Rest days, missing days and manually missed days are never completed.
 * @returns `true` when completed.
 */
export function isWorkoutDayCompleted(day: WorkoutDayProgressInput | null | undefined): boolean {
  if (!day || day.type !== 'workout') return false
  if (day.manualMissed) return false
  if (day.manualCompleted) return true
  const threshold = getWorkoutCompletionThreshold(day)
  return threshold > 0 && getCompletedExerciseCount(day) >= threshold
}

/**
 * Whether anything has been recorded on a day: a manual mark, completion, or any progress on an exercise.
 * @param day - The day.
 * @returns `true` when the day has progress that a move or template change must not destroy.
 */
export function hasWorkoutDayProgress(day: WorkoutDay): boolean {
  return !!(day.manualCompleted || day.manualMissed || day.completed
    || day.exercises.some((exercise) => exercise.completed || Number(exercise.currentSet || 1) > 1))
}

/**
 * Whether a workout day was done before tracking started, so it does not count as missed.
 * @param day - The day.
 * @param programStartDate - The program start as `YYYY-MM-DD`, or `null`/`''` when unknown.
 * @returns `true` for an untracked workout day.
 */
export function isUntrackedWorkoutDay(day: WorkoutDay | null | undefined, programStartDate: string | null): boolean {
  if (!day || day.type !== 'workout' || day.manualMissed || day.manualCompleted || isWorkoutDayCompleted(day)) return false
  if (typeof day.untrackedWorkout === 'boolean') return day.untrackedWorkout
  const beforeProgram = !!programStartDate && day.date < programStartDate
    && !day.exercises.some((exercise) => exercise.completed || Number(exercise.currentSet || 1) > 1)
  return beforeProgram
}

/**
 * The program start date: the stored value when it is a valid date, otherwise the earliest scheduled day up to today.
 * @param stored - The stored `triviaWorkoutProgramStartDate` value, possibly `''`.
 * @param program - The program, used when nothing valid is stored.
 * @param now - The current time.
 * @returns `YYYY-MM-DD`. The caller stores it when it differs from `stored`.
 */
export function getWorkoutProgramStartDate(stored: string | null, program: WorkoutProgram, now: Date = new Date()): string {
  if (isIsoDateString(stored)) return stored
  const today = isoDate(now)
  const firstScheduled = program.weeks
    .flatMap((week) => week.days ?? [])
    .filter((day) => day.type === 'workout' || day.type === 'rest')
    .map((day) => day.date)
    .filter((date) => date <= today)
    .sort()[0]
  return firstScheduled ?? today
}
