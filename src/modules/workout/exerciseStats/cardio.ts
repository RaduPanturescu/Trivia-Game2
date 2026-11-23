/**
 * Cardio run helpers: duration parsing and formatting, pace, speed and the run summary. Ported from the legacy screen.
 */
import { formatDisplayDate } from '@/shared/dates'
import { formatStatNumber } from './format'
import type { CardioRun } from './types'

/** Totals and the fastest run of a list of runs. */
export interface CardioSummary {
  /** Total distance in kilometres. */
  totalKm: number
  /** Total duration in seconds. */
  totalSeconds: number
  /** The run with the lowest seconds per kilometre, or `null` when no run has a distance. */
  bestPaceRun: CardioRun | null
}

/** Display text of one run row. */
export interface CardioRunView {
  /** Distance, duration, pace and speed on one line. */
  title: string
  /** Date, run type and the optional metrics, joined with dots. */
  meta: string
}

/**
 * Parses a run time typed as `MM:SS` or `HH:MM:SS`. Minutes and seconds must be below 60 after the first field.
 * @param value - The typed text.
 * @returns Seconds, or `0` when the text is not a valid run time.
 */
export function cardioDurationSeconds(value: string): number {
  const parts = String(value || '').trim().split(':').map((part) => Number(part))
  if (parts.length < 2 || parts.length > 3 || parts.some((part) => !Number.isFinite(part) || part < 0)) return 0
  if (parts.some((part, index) => index > 0 && part >= 60)) return 0
  const [first = 0, second = 0, third = 0] = parts
  return parts.length === 3 ? first * 3600 + second * 60 + third : first * 60 + second
}

/**
 * Formats seconds as `M:SS`, or `H:MM:SS` from one hour.
 * @param seconds - Any number of seconds. Negative and non-numeric values count as `0`.
 * @returns The formatted duration.
 */
export function cardioFormatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(Number(seconds) || 0))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const remainder = total % 60
  return hours
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    : `${minutes}:${String(remainder).padStart(2, '0')}`
}

/**
 * Pace per kilometre.
 * @param seconds - Run duration in seconds.
 * @param km - Distance in kilometres.
 * @returns For example `5:30 /km`, or `—` when either value is missing.
 */
export function cardioFormatPace(seconds: number, km: number): string {
  if (!km || !seconds) return '—'
  return `${cardioFormatDuration(seconds / km)} /km`
}

/**
 * Speed as kilometres per ten minutes.
 * @param distance - Distance in kilometres.
 * @param seconds - Run duration in seconds.
 * @returns For example `2.4 km / 10 min`, or `—` when either value is missing.
 */
export function cardioKmPerTenMinutes(distance: number, seconds: number): string {
  if (!distance || !seconds) return '—'
  return `${formatStatNumber(distance / (seconds / 600))} km / 10 min`
}

/**
 * Sorts runs newest first, then by when they were saved.
 * @param runs - The runs.
 * @returns A new sorted array.
 */
export function sortCardioRuns(runs: readonly CardioRun[]): CardioRun[] {
  return [...runs].sort((a, b) => b.date.localeCompare(a.date) || b.created - a.created)
}

/**
 * Totals the runs and finds the fastest one.
 * @param runs - The runs.
 * @returns The summary.
 */
export function summarizeCardioRuns(runs: readonly CardioRun[]): CardioSummary {
  let bestPace = Infinity
  let bestPaceRun: CardioRun | null = null
  for (const run of runs) {
    const pace = run.distance ? run.duration / run.distance : Infinity
    if (pace < bestPace) {
      bestPace = pace
      bestPaceRun = run
    }
  }
  return {
    totalKm: runs.reduce((sum, run) => sum + Number(run.distance || 0), 0),
    totalSeconds: runs.reduce((sum, run) => sum + Number(run.duration || 0), 0),
    bestPaceRun,
  }
}

/**
 * Display text of one run.
 * @param run - The run.
 * @returns The title and the meta line.
 */
export function describeCardioRun(run: CardioRun): CardioRunView {
  const metadata = [
    formatDisplayDate(run.date),
    `${run.type || 'easy'} run`,
    run.elevation ? `${formatStatNumber(run.elevation)} m elevation` : '',
    run.heartRate ? `${formatStatNumber(run.heartRate)} bpm avg` : '',
    run.cadence ? `${formatStatNumber(run.cadence)} spm` : '',
    run.rpe ? `RPE ${formatStatNumber(run.rpe)}` : '',
  ].filter(Boolean)
  return {
    title: `${formatStatNumber(run.distance)} km · ${cardioFormatDuration(run.duration)} · ${cardioFormatPace(run.duration, run.distance)} · ${cardioKmPerTenMinutes(run.distance, run.duration)}`,
    meta: metadata.join(' · '),
  }
}
