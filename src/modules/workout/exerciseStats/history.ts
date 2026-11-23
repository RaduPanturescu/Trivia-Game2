/**
 * Training log history: grouping by exercise, best-load and best-rep summaries, and the row text. Ported from the legacy
 * exercise stats screen.
 */
import { formatDisplayDate } from '@/shared/dates'
import { exerciseKey } from './areas'
import { formatStatNumber } from './format'
import type { ExerciseLog, ExerciseLogType } from './types'

/** Fields of a new manual performance, before the id and timestamp are added. */
export interface ExerciseLogInput {
  /** Exercise name, trimmed. */
  name: string
  /** Weights or calisthenics. */
  type: ExerciseLogType
  /** Local calendar date as `YYYY-MM-DD`. */
  date: string
  /** Number of sets. */
  sets: number
  /** Repetitions per set. */
  reps: number
  /** Load in kilograms. */
  weight: number
  /** Notes, trimmed. */
  notes: string
}

/** Display text of one history row. */
export interface HistoryEntry {
  /** Log id, used to delete the row. */
  id: string
  /** Exercise name, used in the delete label. */
  name: string
  /** Local calendar date, used in the delete label. */
  date: string
  /** Main line of the row, for example `12 x 10 Reps - 23/11/2026`. */
  title: string
  /** Metadata line, joined with dots. Empty when there is none. */
  meta: string
}

/** Best-load figures of a group, already formatted. */
export interface HistoryLoadSummary {
  /** Load of the heaviest set, in kg. */
  weight: string
  /** Reps of the heaviest set. */
  reps: string
  /** Most reps in any loaded set. */
  bestReps: string
  /** Load of the set with the most reps, in kg. */
  bestRepsWeight: string
}

/** One exercise in a history section. */
export interface HistoryGroup {
  /** Exercise key, used as the list key and to keep the open state. */
  key: string
  /** Name of the most recent entry. */
  name: string
  /** Rows, newest first. */
  entries: HistoryEntry[]
  /** Most bodyweight reps, formatted. `null` when the group has no bodyweight entries. */
  bodyweightBest: string | null
  /** `true` when the group also has loaded entries. */
  hasWeighted: boolean
  /** Best-load figures. `null` when the group has no loaded entries. */
  load: HistoryLoadSummary | null
}

/**
 * Creates a unique id for a new record: the current time plus a random suffix.
 * @returns The id.
 */
export function createRecordId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/**
 * Builds a manual performance ready to store.
 * @param input - The typed fields.
 * @param id - Unique id.
 * @param created - Epoch milliseconds of when it is saved.
 * @returns The log.
 */
export function createExerciseLog(input: ExerciseLogInput, id: string, created: number): ExerciseLog {
  return { id, created, name: input.name, type: input.type, date: input.date, sets: input.sets, reps: input.reps, weight: input.weight, notes: input.notes }
}

/**
 * Groups the logs of one type by exercise. Logs are sorted newest first, groups follow that order.
 * @param logs - All manual logs.
 * @param type - `weights` or `calisthenics`.
 * @returns The groups.
 */
export function buildHistoryGroups(logs: readonly ExerciseLog[], type: ExerciseLogType): HistoryGroup[] {
  const sorted = logs
    .filter((log) => log.type === type)
    .sort((a, b) => b.date.localeCompare(a.date) || b.created - a.created)
  const groups = new Map<string, ExerciseLog[]>()
  for (const log of sorted) {
    const key = exerciseKey(log.name)
    groups.set(key, [...(groups.get(key) ?? []), log])
  }
  return [...groups].map(([key, entries]) => buildGroup(key, entries, type))
}

/**
 * Summarises the entries of one exercise.
 * @param key - Exercise key.
 * @param entries - The exercise's logs, newest first. Never empty.
 * @param type - The section type.
 * @returns The group.
 */
function buildGroup(key: string, entries: ExerciseLog[], type: ExerciseLogType): HistoryGroup {
  const weighted = entries.filter((log) => Number(log.weight) > 0)
  const bodyweight = entries.filter((log) => Number(log.weight) === 0)
  const heaviest = weighted.reduce<ExerciseLog | null>((best, log) => !best || Number(log.weight) > Number(best.weight)
    || (Number(log.weight) === Number(best.weight) && Number(log.reps) > Number(best.reps)) ? log : best, null)
  const mostReps = weighted.reduce<ExerciseLog | null>((best, log) => !best || Number(log.reps) > Number(best.reps) ? log : best, null)
  const bodyweightBest = bodyweight.reduce((best, log) => Math.max(best, Number(log.reps)), 0)
  return {
    key,
    name: entries[0]?.name ?? '',
    entries: entries.map((log) => buildHistoryEntry(log, type)),
    bodyweightBest: bodyweight.length ? formatStatNumber(bodyweightBest) : null,
    hasWeighted: weighted.length > 0,
    load: heaviest && mostReps
      ? {
          weight: formatStatNumber(heaviest.weight),
          reps: formatStatNumber(heaviest.reps),
          bestReps: formatStatNumber(mostReps.reps),
          bestRepsWeight: formatStatNumber(mostReps.weight),
        }
      : null,
  }
}

/**
 * Display text of one log row.
 * @param log - The log.
 * @param type - The section type. Volume is only shown for weights.
 * @returns The row.
 */
function buildHistoryEntry(log: ExerciseLog, type: ExerciseLogType): HistoryEntry {
  const unloaded = Number(log.weight) === 0
  const title = unloaded
    ? `${formatStatNumber(log.sets)} x ${formatStatNumber(log.reps)} Reps - ${formatDisplayDate(log.date)}`
    : `${formatDisplayDate(log.date)} · ${formatStatNumber(log.sets)} × ${formatStatNumber(log.reps)} @ ${formatStatNumber(log.weight)} kg`
  const metadata = [
    unloaded ? '' : `${Number(log.sets) * Number(log.reps)} total reps`,
    !unloaded && type === 'weights' ? `${formatStatNumber(log.sets * log.reps * log.weight)} kg volume` : '',
    log.rpe ? `RPE ${formatStatNumber(log.rpe)}` : '',
    log.rest !== '' && log.rest != null ? `${formatStatNumber(Number(log.rest))}s rest` : '',
    log.notes,
  ].filter(Boolean)
  return { id: log.id, name: log.name, date: log.date, title, meta: metadata.join(' · ') }
}
