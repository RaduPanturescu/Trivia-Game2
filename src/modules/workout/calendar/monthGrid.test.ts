import { describe, expect, it } from 'vitest'
import { buildCalendarMonth, monthStartOf, shiftMonth, type CalendarDayCell } from './monthGrid'
import type { WorkoutDay, WorkoutProgram, WorkoutWeeklyTemplates } from '../core/types'

/** A day with no exercises, for building a program by hand. */
function day(date: string, type: WorkoutDay['type'], extra: Partial<WorkoutDay> = {}): WorkoutDay {
  return { date, dayLabel: 'x', type, exercises: [], completed: false, ...extra }
}

/** Builds the grid for November 2026 with the given stored days. */
function november(days: WorkoutDay[] = [], templates: WorkoutWeeklyTemplates = {}, extra: { today?: string; activeDate?: string | null; programStartDate?: string | null } = {}) {
  const program: WorkoutProgram = { currentWeekStart: '2026-11-23', weeks: [{ weekStart: '2026-11-23', days }] }
  return buildCalendarMonth(new Date(2026, 10, 1), {
    program,
    templates,
    today: extra.today ?? '2026-11-25',
    activeDate: extra.activeDate ?? null,
    programStartDate: extra.programStartDate ?? null,
  })
}

/** The day cells of a month, in order. */
function dayCells(cells: ReturnType<typeof november>['cells']): CalendarDayCell[] {
  return cells.filter((cell): cell is CalendarDayCell => cell.kind === 'day')
}

/** The day cell for a day number. */
function cellFor(cells: ReturnType<typeof november>['cells'], dayNumber: number): CalendarDayCell {
  const cell = dayCells(cells).find((item) => item.day === dayNumber)
  if (!cell) throw new Error(`no cell for day ${dayNumber}`)
  return cell
}

describe('buildCalendarMonth', () => {
  it('starts on the weekday of the first day, Monday first', () => {
    // 1 November 2026 is a Sunday, so six blanks come before it.
    const month = november()
    const blanks = month.cells.filter((cell) => cell.kind === 'blank')
    expect(blanks).toHaveLength(6)
    expect(month.cells[0]?.kind).toBe('blank')
    expect(month.cells[6]).toMatchObject({ kind: 'day', day: 1, date: '2026-11-01' })
    expect(month.weekdays.map((weekday) => weekday.initial)).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S'])
  })

  it('has no leading blanks when the month starts on a Monday', () => {
    // 1 June 2026 is a Monday.
    const month = buildCalendarMonth(new Date(2026, 5, 1), { program: { currentWeekStart: '', weeks: [] }, templates: {}, today: '2026-06-01', activeDate: null, programStartDate: null })
    expect(month.cells[0]).toMatchObject({ kind: 'day', day: 1 })
    expect(dayCells(month.cells)).toHaveLength(30)
  })

  it('marks the active day and nothing else', () => {
    const month = november([], {}, { activeDate: '2026-11-12' })
    const active = dayCells(month.cells).filter((cell) => cell.active)
    expect(active.map((cell) => cell.date)).toEqual(['2026-11-12'])
  })

  it('shows future days from the weekly template when no day is stored', () => {
    // Templates: Monday (0) workout, Tuesday (1) rest. Days from today on use them.
    const templates: WorkoutWeeklyTemplates = { 0: { type: 'workout', exercises: [] }, 1: { type: 'rest', exercises: [] } }
    const month = november([], templates, { today: '2026-11-25' })
    // 30 November is a Monday, so it takes the Monday template. 26 November is a Thursday with no template.
    expect(cellFor(month.cells, 30)).toMatchObject({ status: 'workout', workoutDay: true, emoji: '💪' })
    expect(cellFor(month.cells, 26)).toMatchObject({ status: 'none', emoji: '·' })
    expect(cellFor(month.cells, 25)).toMatchObject({ status: 'none' })
  })

  it('marks a past scheduled workout without a completion as missed', () => {
    const days = [day('2026-11-23', 'workout')]
    const month = november(days, {}, { today: '2026-11-25' })
    expect(cellFor(month.cells, 23)).toMatchObject({ status: 'missed', missed: true, emoji: '✕' })
  })

  it('marks a completed workout as done', () => {
    const days = [day('2026-11-23', 'workout', { completed: true, manualCompleted: true })]
    const month = november(days, {}, { today: '2026-11-25' })
    expect(cellFor(month.cells, 23)).toMatchObject({ status: 'done', done: true, missed: false, emoji: '✓', workoutDay: true })
  })

  it('marks a manually missed future workout as missed', () => {
    const days = [day('2026-11-27', 'workout', { manualMissed: true })]
    const month = november(days, {}, { today: '2026-11-25' })
    expect(cellFor(month.cells, 27)).toMatchObject({ status: 'missed', missed: true })
  })

  it('shows rest days with the rest emoji and flags', () => {
    const days = [day('2026-11-24', 'rest')]
    const month = november(days, {}, { today: '2026-11-25' })
    expect(cellFor(month.cells, 24)).toMatchObject({ status: 'rest', restDay: true, emoji: '💤' })
  })

  it('shows a workout from before the program start as untracked', () => {
    const days = [day('2026-11-20', 'workout')]
    const month = november(days, {}, { today: '2026-11-25', programStartDate: '2026-11-23' })
    expect(cellFor(month.cells, 20)).toMatchObject({ status: 'untracked', missed: false, emoji: '—' })
  })

  it('treats a stored null day as a null day with no status', () => {
    const days = [day('2026-11-02', null)]
    const month = november(days, {}, { today: '2026-11-25' })
    expect(cellFor(month.cells, 2)).toMatchObject({ status: 'none', nullDay: true })
  })

  it('gives a day with no data the null-day flag', () => {
    const month = november([], {}, { today: '2026-11-25' })
    expect(cellFor(month.cells, 3)).toMatchObject({ nullDay: true, status: 'none' })
  })

  it('writes an accessible label with the edit hint', () => {
    const days = [day('2026-11-23', 'rest')]
    const month = november(days, {}, { today: '2026-11-25' })
    expect(cellFor(month.cells, 23).label).toBe('23/11/2026. Rest day. Click to edit status.')
  })

  it('labels the month in the locale format', () => {
    expect(november().label).toBe(new Date(2026, 10, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }))
  })
})

describe('month navigation helpers', () => {
  it('finds the first of the month of a date', () => {
    expect(monthStartOf('2026-11-23')).toEqual(new Date(2026, 10, 1))
  })

  it('moves by whole months across year boundaries', () => {
    expect(shiftMonth(new Date(2026, 0, 1), -1)).toEqual(new Date(2025, 11, 1))
    expect(shiftMonth(new Date(2026, 11, 1), 1)).toEqual(new Date(2027, 0, 1))
  })
})
