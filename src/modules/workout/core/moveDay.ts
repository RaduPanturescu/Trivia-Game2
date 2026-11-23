import { isoDate } from '@/shared/dates'
import { applyWorkoutTemplateToDay, createWorkoutDayTemplate } from './templates'
import { getWorkoutWeekForCurrentView, hasWorkoutDayProgress, isUntrackedWorkoutDay } from './schedule'
import type { WorkoutDay, WorkoutScheduleContext, WorkoutProgram } from './types'

/**
 * Outcome of {@link moveWorkoutDay}.
 * - `moved`: the workout moved. `selectedIndex` is the day to select.
 * - `ignored`: nothing to do (no workout on the source, same day, or an unknown index). Show nothing.
 * - `blocked`: a recorded, missed or active day is involved. Show "choose an unrecorded day".
 * - `needs-confirm`: the target already has a workout. Ask the user, then call again with `confirmed: true`.
 */
export type WorkoutDayMoveResult =
  | { status: 'moved'; sourceLabel: string; targetLabel: string; selectedIndex: number }
  | { status: 'ignored' | 'blocked' }
  | { status: 'needs-confirm'; targetLabel: string }

/** Options for {@link moveWorkoutDay}. */
export interface WorkoutDayMoveOptions {
  /** Program start as `YYYY-MM-DD`, or `null` when unknown. */
  programStartDate: string | null
  /** Date of the workout currently in progress, which must not move. */
  activeDayDate: string | null
  /** `true` once the user accepted replacing an existing workout. */
  confirmed?: boolean
  /** The current time. */
  now?: Date
}

/**
 * Whether a day may take part in a move: it is today or later, or it is a past day with no progress that was untracked,
 * a "no plan" day, or before the program start.
 * @param day - The day.
 * @param programStartDate - The program start as `YYYY-MM-DD`, or `null`.
 * @param now - The current time.
 * @returns `true` when the day can be moved to or from.
 */
export function canMoveWorkoutDayDate(day: WorkoutDay, programStartDate: string | null, now: Date = new Date()): boolean {
  if (day.date >= isoDate(now)) return true
  if (hasWorkoutDayProgress(day)) return false
  return isUntrackedWorkoutDay(day, programStartDate) || day.type === null || (!!programStartDate && day.date < programStartDate)
}

/**
 * Moves the workout from one weekday of the current week to another. The source becomes a rest day and the target
 * becomes the workout. Both weekday templates change, and future weeks follow for days without progress.
 * @param program - The program. Updated in place.
 * @param ctx - Weekly templates (updated in place) and catalog overrides.
 * @param fromIndex - Source weekday index (Monday = 0).
 * @param toIndex - Target weekday index.
 * @param options - Start date, active day, confirmation and time.
 * @returns What happened. See {@link WorkoutDayMoveResult}.
 */
export function moveWorkoutDay(
  program: WorkoutProgram,
  ctx: WorkoutScheduleContext,
  fromIndex: number,
  toIndex: number,
  options: WorkoutDayMoveOptions,
): WorkoutDayMoveResult {
  const now = options.now ?? new Date()
  const week = getWorkoutWeekForCurrentView(program, ctx, now)
  const source = week.days[fromIndex]
  const target = week.days[toIndex]
  if (!source || !target || fromIndex === toIndex || source.type !== 'workout') return { status: 'ignored' }

  const involvesActive = options.activeDayDate !== null && [source.date, target.date].includes(options.activeDayDate)
  if (!canMoveWorkoutDayDate(source, options.programStartDate, now) || !canMoveWorkoutDayDate(target, options.programStartDate, now)
    || hasWorkoutDayProgress(source) || hasWorkoutDayProgress(target) || involvesActive) {
    return { status: 'blocked' }
  }
  if (target.type === 'workout' && !options.confirmed) return { status: 'needs-confirm', targetLabel: target.dayLabel }

  const todayKey = isoDate(now)
  const movedTemplate = createWorkoutDayTemplate(source)
  applyWorkoutTemplateToDay(target, movedTemplate)
  if (target.date < todayKey) target.untrackedWorkout = true
  applyWorkoutTemplateToDay(source, { type: 'rest', exercises: [] })

  ctx.templates[fromIndex] = { type: 'rest', exercises: [] }
  ctx.templates[toIndex] = movedTemplate
  for (const otherWeek of program.weeks) {
    if (otherWeek.weekStart <= week.weekStart) continue
    for (const index of [fromIndex, toIndex]) {
      const day = otherWeek.days[index]
      const template = ctx.templates[index]
      if (day && template && day.date >= todayKey && !hasWorkoutDayProgress(day) && day.date !== options.activeDayDate) {
        applyWorkoutTemplateToDay(day, template)
      }
    }
  }
  return { status: 'moved', sourceLabel: source.dayLabel, targetLabel: target.dayLabel, selectedIndex: toIndex }
}
