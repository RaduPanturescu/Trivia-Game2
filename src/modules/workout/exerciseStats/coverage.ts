/**
 * Training coverage: which exercises count, how many sets land in each area, the radar geometry and the weekly plan list.
 * Ported from the legacy exercise stats screen.
 */
import type { WorkoutProgram, WorkoutWeek } from '../core/types'
import { exerciseAreas, EXERCISE_AREAS, exerciseKey, type ExerciseArea } from './areas'
import type { CompletedExerciseLog, ExerciseLog } from './types'

/** `plan` counts the week's planned sets, `all` counts every logged performance. */
export type CoverageMode = 'plan' | 'all'

/** An exercise as the coverage needs it: a name and an optional category. */
export interface ExerciseRef {
  /** Exercise name. */
  name: string
  /** Library category, used to look up the fallback areas. */
  category?: string
}

/** One counted exercise: a planned exercise or a logged performance. */
export interface CoverageEntry {
  /** Exercise name. */
  name: string
  /** Library category, or `''` when the exercise is not in the library. */
  category: string
  /** Sets counted for the coverage. */
  sets: number
  /** Local calendar date as `YYYY-MM-DD`. Planned exercises carry their day's date. */
  date: string
}

/** Inputs of {@link getCoverageEntries}. */
export interface CoverageSources {
  /** Plan or all-time. */
  mode: CoverageMode
  /** The week being shown, used in plan mode. */
  week: WorkoutWeek | undefined
  /** Every planned exercise in the program, used for categories in all-time mode. */
  planned: readonly ExerciseRef[]
  /** The exercise library, used for categories in all-time mode. */
  library: readonly ExerciseRef[]
  /** Manual performances. */
  logs: readonly ExerciseLog[]
  /** Performances derived from completed workout exercises. */
  completed: readonly CompletedExerciseLog[]
}

/** Totals of a set of coverage entries. */
export interface CoverageSummary {
  /** Sets per area. */
  counts: Record<ExerciseArea, number>
  /** Entries with no area at all. */
  unassigned: number
  /** Distinct training days among the entries. */
  days: number
}

/** A radar axis: the area name and where its spoke ends and its label sits. */
export interface RadarAxis {
  /** Area name shown as the label. */
  area: ExerciseArea
  /** Spoke end x. */
  x: number
  /** Spoke end y. */
  y: number
  /** Label x. */
  labelX: number
  /** Label y. */
  labelY: number
}

/** Geometry of one radar chart, ready for SVG. */
export interface RadarChart {
  /** Grid rings as SVG `points` strings. */
  rings: string[]
  /** One axis per area. */
  axes: RadarAxis[]
  /** The value polygon as an SVG `points` string. */
  value: string
}

/** One row of the weekly plan list. */
export interface PlanItem {
  /** Stable key within the week. */
  key: string
  /** Exercise name. */
  name: string
  /** Short weekday label, e.g. `Mon`. */
  dayLabel: string
  /** Local calendar date as `YYYY-MM-DD`. */
  date: string
  /** Planned sets. */
  sets: number
  /** Planned repetitions per set. */
  reps: number
  /** `true` when the set is done till failure. */
  repsTillFailure: boolean
  /** Assigned or guessed areas. */
  areas: ExerciseArea[]
}

/** Centre of every radar chart, in SVG units. */
export const RADAR_CENTER = 160

/** Radius of the outer ring, in SVG units. */
const RADAR_RADIUS = 102

/** Fractions of the radius drawn as grid rings. */
const RADAR_RINGS = [0.25, 0.5, 0.75, 1]

/** Labels sit this far out from the centre, as a fraction of the radius. */
const RADAR_LABEL_REACH = 1.28

/**
 * Finds the week the screen shows: the one whose start is the program's current week start.
 * @param program - The program.
 * @returns The week, or `undefined` when it does not exist yet.
 */
export function findCurrentWeek(program: WorkoutProgram): WorkoutWeek | undefined {
  return program.weeks.find((week) => week.weekStart === program.currentWeekStart)
}

/**
 * Lists the exercises that count toward coverage. Plan mode uses the week's workout days. All-time mode uses every
 * logged performance (manual first, then completed), with categories looked up by name.
 * @param sources - The week, the library, the program's exercises and the logs.
 * @returns The counted entries.
 */
export function getCoverageEntries(sources: CoverageSources): CoverageEntry[] {
  if (sources.mode === 'plan') {
    return (sources.week?.days ?? []).flatMap((day) => day.type === 'workout'
      ? day.exercises.map((exercise) => ({ name: exercise.name, category: exercise.category, sets: exercise.sets, date: day.date }))
      : [])
  }
  const reference = new Map([...sources.planned, ...sources.library].map((item) => [exerciseKey(item.name), item] as const))
  const categoryOf = (name: string): string => reference.get(exerciseKey(name))?.category ?? ''
  const manual = sources.logs.map((log) => ({ name: log.name, category: categoryOf(log.name), sets: log.sets, date: log.date }))
  const completed = sources.completed.map((log) => ({ name: log.name, category: categoryOf(log.name), sets: log.sets, date: log.date }))
  return [...manual, ...completed]
}

/**
 * Sums the sets per area and counts unassigned entries and training days.
 * @param entries - The counted entries.
 * @param saved - The `areas` map from the stats payload.
 * @returns The totals.
 */
export function summarizeCoverage(entries: readonly CoverageEntry[], saved: Record<string, unknown>): CoverageSummary {
  const counts = Object.fromEntries(EXERCISE_AREAS.map((area) => [area, 0])) as Record<ExerciseArea, number>
  let unassigned = 0
  for (const entry of entries) {
    const areas = exerciseAreas(entry, saved)
    if (!areas.length) unassigned++
    for (const area of areas) counts[area] += Math.max(0, Number(entry.sets) || 0)
  }
  const days = new Set(entries.map((entry) => entry.date).filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))).size
  return { counts, unassigned, days }
}

/**
 * Position of a radar point. Axis 0 points up and the axes run clockwise.
 * @param index - Axis index.
 * @param count - Number of axes.
 * @param fraction - Distance from the centre as a fraction of the radius.
 * @returns The `[x, y]` point.
 */
function radarPoint(index: number, count: number, fraction: number): [number, number] {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count
  return [
    RADAR_CENTER + Math.cos(angle) * RADAR_RADIUS * fraction,
    RADAR_CENTER + Math.sin(angle) * RADAR_RADIUS * fraction,
  ]
}

/**
 * Builds the radar geometry for a set of areas. The value polygon is scaled to the highest area in the set.
 * @param areas - The areas on the chart, in axis order.
 * @param counts - Value per area.
 * @returns Rings, axes and the value polygon.
 */
export function buildRadarChart(areas: readonly ExerciseArea[], counts: Readonly<Record<string, number>>): RadarChart {
  const count = areas.length
  const maximum = Math.max(0, ...areas.map((area) => counts[area] ?? 0))
  const ring = (fraction: number): string => areas.map((_, index) => radarPoint(index, count, fraction).join(',')).join(' ')
  const axes = areas.map((area, index): RadarAxis => {
    const [x, y] = radarPoint(index, count, 1)
    const [labelX, labelY] = radarPoint(index, count, RADAR_LABEL_REACH)
    return { area, x, y, labelX, labelY }
  })
  const value = areas.map((area, index) => radarPoint(index, count, maximum ? (counts[area] ?? 0) / maximum : 0).join(',')).join(' ')
  return { rings: RADAR_RINGS.map(ring), axes, value }
}

/**
 * Lists the planned exercises of a week's workout days, in day order.
 * @param week - The week, or `undefined`.
 * @param saved - The `areas` map from the stats payload.
 * @returns One item per planned exercise. Empty when the week has none.
 */
export function buildWeeklyPlan(week: WorkoutWeek | undefined, saved: Record<string, unknown>): PlanItem[] {
  return (week?.days ?? []).flatMap((day) => day.type === 'workout'
    ? day.exercises.map((exercise, index): PlanItem => ({
      key: `${day.date}:${index}`,
      name: exercise.name,
      dayLabel: day.dayLabel,
      date: day.date,
      sets: exercise.sets,
      reps: exercise.reps,
      repsTillFailure: Boolean(exercise.repsTillFailure),
      areas: exerciseAreas(exercise, saved),
    }))
    : [])
}

/**
 * Sorted, de-duplicated exercise names from the library and the program, for the name suggestions.
 * @param library - Library exercises.
 * @param planned - Planned exercises.
 * @returns The names in locale order.
 */
export function exerciseNameOptions(library: readonly ExerciseRef[], planned: readonly ExerciseRef[]): string[] {
  const names = new Set([...library, ...planned].map((item) => item.name).filter(Boolean))
  return [...names].sort((a, b) => a.localeCompare(b))
}

/**
 * Names that contain the query, ignoring case and surrounding spaces. An empty query matches every name.
 * @param names - Candidate names.
 * @param query - Text typed by the user.
 * @returns The matching names, in the same order.
 */
export function filterExerciseNames(names: readonly string[], query: string): string[] {
  const needle = exerciseKey(query)
  return names.filter((name) => exerciseKey(name).includes(needle))
}
