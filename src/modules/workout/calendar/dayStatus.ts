import { isoDate } from '@/shared/dates'
import { cloneWorkoutExercises } from '../core/catalog'
import { createDefaultWorkoutWeek, getMonday } from '../core/schedule'
import type { WorkoutProgram, WorkoutScheduleContext } from '../core/types'

/** The three choices in the day-status dialog. */
export type CalendarStatusChoice = 'missed' | 'completed' | 'rest'

/**
 * Sets the status of one day, as legacy `applyWorkoutCalendarStatus` did. A missing week is appended, and its days
 * before today are cleared. Switching to rest keeps the exercises aside; switching back restores them. Mutates the
 * program in place, so the store saves the change.
 * @param program - The live program. Mutated.
 * @param ctx - Weekly templates and catalog overrides, used to build a missing week and to restore a rest day.
 * @param date - The day to change, `YYYY-MM-DD`.
 * @param choice - The status to apply.
 * @param now - The current time, used to clear past days of a new week.
 * @returns `false` when the date is not in the week it belongs to (nothing changed), otherwise `true`.
 */
export function applyCalendarDayStatus(
  program: WorkoutProgram,
  ctx: WorkoutScheduleContext,
  date: string,
  choice: CalendarStatusChoice,
  now: Date = new Date(),
): boolean {
  const weekStart = getMonday(date)
  const weekKey = isoDate(weekStart)
  let week = program.weeks.find((item) => item.weekStart === weekKey)
  if (!week) {
    week = createDefaultWorkoutWeek(weekStart, ctx)
    const today = isoDate(now)
    for (const day of week.days) {
      if (day.date < today) {
        day.type = null
        day.exercises = []
        day.completed = false
      }
    }
    program.weeks.push(week)
  }

  const dayIndex = week.days.findIndex((item) => item.date === date)
  if (dayIndex < 0) return false
  const day = week.days[dayIndex]
  if (!day) return false

  delete day.untrackedWorkout
  if (choice === 'rest') {
    if (day.type === 'workout') day.savedExercisesForWorkout = day.exercises.map((exercise) => ({ ...exercise }))
    day.type = 'rest'
    day.exercises = []
    day.completed = false
    day.manualCompleted = false
    day.manualMissed = false
    return true
  }

  if (day.type === 'rest') {
    const templateExercises = ctx.templates[dayIndex]?.exercises ?? []
    const restored = day.savedExercisesForWorkout?.length ? day.savedExercisesForWorkout : templateExercises
    day.exercises = cloneWorkoutExercises(restored, date)
  }
  day.type = 'workout'
  if (choice === 'completed') {
    for (const exercise of day.exercises) {
      exercise.completed = true
      exercise.currentSet = Number(exercise.sets || 1)
    }
    day.manualCompleted = true
    day.manualMissed = false
    day.completed = true
  } else {
    day.manualCompleted = false
    day.manualMissed = true
    day.completed = false
  }
  delete day.savedExercisesForWorkout
  return true
}
