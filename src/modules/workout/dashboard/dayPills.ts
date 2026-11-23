/**
 * The day pills of the dashboard's day strip: the label, the status text and the state classes of one day.
 * Ports the pill loop of the legacy `renderWorkoutDays`.
 */
import { isUntrackedWorkoutDay, isWorkoutDayCompleted } from '../core/schedule'
import type { WorkoutDay } from '../core/types'

/** Everything the day strip shows for one day. */
export interface DayPill {
  /** Index of the day in its week, Monday = 0. */
  index: number
  /** Short weekday label, e.g. `Mon`. */
  letter: string
  /** Day of the month. */
  number: number
  /** Text under the number: `Rest`, `—`, `✕` when missed, or `done/total` exercises. */
  status: string
  /** `true` when the pill is the selected day. */
  selected: boolean
  /** `true` when the day is a workout that can be dragged to another day. */
  draggable: boolean
  /** State classes, as the legacy stylesheet names them. */
  classes: string[]
}

/**
 * Builds the pill of one day.
 * @param day - The day.
 * @param index - Its index in the viewed week.
 * @param selectedIndex - Index of the selected day.
 * @param today - Today as `YYYY-MM-DD`.
 * @param programStartDate - The program start as `YYYY-MM-DD`, or `null` when unknown.
 * @returns The pill.
 */
export function buildDayPill(day: WorkoutDay, index: number, selectedIndex: number, today: string, programStartDate: string | null): DayPill {
  const completed = day.type === 'workout' ? isWorkoutDayCompleted(day) : day.completed
  const untracked = isUntrackedWorkoutDay(day, programStartDate)
  const missed = day.type === 'workout' && (day.date < today || day.manualMissed === true) && !completed && !untracked
  const done = day.exercises.filter((exercise) => exercise.completed).length

  let status: string
  if (day.type === 'rest') status = 'Rest'
  else if (day.type === null || untracked) status = '—'
  else if (missed) status = '✕'
  else status = `${done}/${day.exercises.length}`

  const classes = ['workout-day-pill']
  if (index === selectedIndex) classes.push('active')
  if (completed) classes.push('completed')
  if (day.type === 'workout') classes.push('workout-day')
  if (day.type === 'rest') classes.push('rest-day')
  if (day.type === null) classes.push('null-day')
  if (missed) classes.push('missed-day')

  return {
    index,
    letter: day.dayLabel,
    number: Number(day.date.slice(8, 10)),
    status,
    selected: index === selectedIndex,
    draggable: day.type === 'workout',
    classes,
  }
}
