import { formatDisplayDate, isoDate, parseLocalDate } from '@/shared/dates'
import { getWorkoutDayForDate, getWorkoutDayIndex, isUntrackedWorkoutDay } from '../core/schedule'
import type { WorkoutDayType, WorkoutProgram, WorkoutTemplate, WorkoutWeeklyTemplates } from '../core/types'

/** Status of one calendar day. Drives the emoji and the cell styling. */
export type CalendarDayStatus = 'missed' | 'rest' | 'done' | 'untracked' | 'workout' | 'none'

/** Inputs for {@link buildCalendarMonth}. */
export interface CalendarMonthInput {
  /** The live program. Days are looked up by date; templates fill in days that do not exist yet. */
  program: WorkoutProgram
  /** Weekly templates keyed by weekday index, used for future days without a stored day. */
  templates: WorkoutWeeklyTemplates
  /** Today as `YYYY-MM-DD`. Days before it count as past. */
  today: string
  /** The date of the day the dashboard has selected, marked as active. `null` for none. */
  activeDate: string | null
  /** Resolved program start as `YYYY-MM-DD`, or `null` when unknown. */
  programStartDate: string | null
}

/** A day cell of the month grid. */
export interface CalendarDayCell {
  /** Stable key for rendering. */
  key: string
  /** Kind tag, so templates can tell day cells from leading blanks. */
  kind: 'day'
  /** Day of the month, `1`..`31`. */
  day: number
  /** The day as `YYYY-MM-DD`. */
  date: string
  /** Status of the day. */
  status: CalendarDayStatus
  /** Emoji shown under the number for the status. */
  emoji: string
  /** Accessible label: date, status and the edit hint. */
  label: string
  /** No stored day and no template, or a day with type `null`. */
  nullDay: boolean
  /** Completed workout. */
  done: boolean
  /** Scheduled workout (any workout day, including completed ones). */
  workoutDay: boolean
  /** Rest day. */
  restDay: boolean
  /** Missed workout. */
  missed: boolean
  /** The dashboard's selected day. */
  active: boolean
}

/** A leading blank cell before the first of the month. */
export interface CalendarBlankCell {
  /** Stable key for rendering. */
  key: string
  /** Kind tag. */
  kind: 'blank'
}

/** One weekday header. */
export interface CalendarWeekday {
  /** One-letter label shown in the header. */
  initial: string
  /** Full name, used as the accessible label. */
  name: string
}

/** A month ready to render. */
export interface CalendarMonth {
  /** Locale month and year, e.g. `November 2026`. */
  label: string
  /** Seven weekday headers, Monday first. */
  weekdays: readonly CalendarWeekday[]
  /** Leading blanks followed by one cell per day of the month. */
  cells: readonly (CalendarBlankCell | CalendarDayCell)[]
}

/** Weekday headers, Monday first, as legacy `renderWorkoutCalendar`. */
const WEEKDAYS: readonly CalendarWeekday[] = [
  { initial: 'M', name: 'Monday' },
  { initial: 'T', name: 'Tuesday' },
  { initial: 'W', name: 'Wednesday' },
  { initial: 'T', name: 'Thursday' },
  { initial: 'F', name: 'Friday' },
  { initial: 'S', name: 'Saturday' },
  { initial: 'S', name: 'Sunday' },
]

/** Emoji per status, as legacy. */
const STATUS_EMOJI: Record<CalendarDayStatus, string> = {
  missed: '✕',
  rest: '💤',
  done: '✓',
  untracked: '—',
  workout: '💪',
  none: '·',
}

/** Screen reader text per status, as legacy. */
const STATUS_TEXT: Record<CalendarDayStatus, string> = {
  missed: 'Missed workout',
  rest: 'Rest day',
  done: 'Completed workout',
  untracked: 'Workout day, no recorded status',
  workout: 'Scheduled workout',
  none: 'No workout status',
}

/**
 * Returns the first day of the month that contains a date, as a Date at local midnight.
 * @param value - A `YYYY-MM-DD` string, a timestamp or a Date.
 * @returns The first of that month.
 */
export function monthStartOf(value: string | number | Date): Date {
  const date = parseLocalDate(value)
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

/**
 * Moves a month start by whole months.
 * @param month - Any date in the month to move from.
 * @param delta - Months to add; negative goes back.
 * @returns The first day of the target month.
 */
export function shiftMonth(month: Date, delta: number): Date {
  return new Date(month.getFullYear(), month.getMonth() + delta, 1)
}

/**
 * Status of a calendar day, as legacy `renderWorkoutCalendar` decided it. A day with no stored entry uses its
 * weekly template when the day is today or later; the template is only a hint and is not saved.
 * @param date - The day as `YYYY-MM-DD`.
 * @param input - Program, templates, today and the program start.
 * @returns The status and the flags the cell styling needs.
 */
function describeDay(date: string, input: CalendarMonthInput): Pick<CalendarDayCell, 'status' | 'emoji' | 'nullDay' | 'done' | 'workoutDay' | 'restDay' | 'missed'> & { text: string } {
  const stored = getWorkoutDayForDate(input.program, date)
  const template: WorkoutTemplate | undefined = !stored && date >= input.today
    ? input.templates[getWorkoutDayIndex(date)]
    : undefined
  const type: WorkoutDayType | undefined = stored ? stored.type : template?.type
  const exists = stored !== null || template !== undefined
  const isPast = date < input.today
  const isRest = type === 'rest'
  const isWorkout = type === 'workout'
  const completed = stored?.completed ?? false
  const untracked = isUntrackedWorkoutDay(stored, input.programStartDate)
  const missed = isWorkout && (isPast || stored?.manualMissed === true) && !completed && !untracked
  const done = isWorkout && completed
  const status: CalendarDayStatus = missed ? 'missed'
    : isRest ? 'rest'
      : done ? 'done'
        : untracked ? 'untracked'
          : isWorkout ? 'workout'
            : 'none'
  return {
    status,
    emoji: STATUS_EMOJI[status],
    text: STATUS_TEXT[status],
    nullDay: !exists || type === null,
    done,
    workoutDay: isWorkout,
    restDay: isRest,
    missed,
  }
}

/**
 * Builds the month grid: the weekday headers, blanks before the first day, then one cell per day.
 * Pure: reads the program and templates, changes nothing.
 * @param month - Any date in the month to show.
 * @param input - Program, templates, today, selected day and program start.
 * @returns The month ready to render.
 */
export function buildCalendarMonth(month: Date, input: CalendarMonthInput): CalendarMonth {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  // Monday-first offset: Sunday (0) is the last column.
  const leading = first.getDay() === 0 ? 6 : first.getDay() - 1
  const cells: (CalendarBlankCell | CalendarDayCell)[] = []

  for (let index = 0; index < leading; index++) {
    cells.push({ kind: 'blank', key: `blank-${index}` })
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const date = isoDate(new Date(first.getFullYear(), first.getMonth(), day))
    const { text, ...described } = describeDay(date, input)
    cells.push({
      kind: 'day',
      key: date,
      day,
      date,
      active: date === input.activeDate,
      label: `${formatDisplayDate(date)}. ${text}. Click to edit status.`,
      ...described,
    })
  }

  return {
    label: first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    weekdays: WEEKDAYS,
    cells,
  }
}
