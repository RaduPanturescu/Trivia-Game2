/**
 * One-rep max trackers: the best tested and estimated lifts, and recording or removing manual tests. Ported from the
 * legacy exercise stats screen.
 */
import { formatDisplayDate } from '@/shared/dates'
import { exerciseKey } from './areas'
import { formatStatNumber } from './format'
import type { ExerciseLog, OneRepMaxTest, OneRepMaxTracker } from './types'

/** Display figures of one tracker. */
export interface OneRepMaxView {
  /** Tracker id, used to delete the tracker and its tests. */
  id: string
  /** Lift name. */
  name: string
  /** The heaviest tested lift, or `null` when none is recorded. */
  tested: { weight: string; date: string } | null
  /** The best Epley-style estimate from logged sets of 2 to 10 reps, or `null` when there is none. */
  estimate: { value: string; weight: string; reps: string } | null
  /** Manually recorded tests in stored order. */
  manualTests: { index: number; weight: string; date: string }[]
}

/**
 * Builds the display figures of every tracker. A test counts from a manual 1RM entry or from a logged single rep of a
 * loaded weights exercise. The estimate uses `weight × (1 + reps / 30)` over logged weights sets of 2 to 10 reps.
 * @param maxes - The trackers.
 * @param logs - All manual logs.
 * @returns One view per tracker, in stored order.
 */
export function buildOneRepMaxViews(maxes: readonly OneRepMaxTracker[], logs: readonly ExerciseLog[]): OneRepMaxView[] {
  return maxes.map((item) => {
    const key = exerciseKey(item.name)
    const performances = logs.filter((log) => log.type === 'weights' && exerciseKey(log.name) === key)
    const singles: OneRepMaxTest[] = performances
      .filter((log) => Number(log.reps) === 1 && Number(log.weight) > 0)
      .map((log) => ({ weight: log.weight, date: log.date }))
    const tests = [...item.tests, ...singles]
    const best = tests.reduce<OneRepMaxTest | null>((max, test) => Number(test.weight) > Number(max?.weight || 0) ? test : max, null)
    const estimates = performances
      .filter((log) => Number(log.reps) >= 2 && Number(log.reps) <= 10 && Number(log.weight) > 0)
      .map((log) => ({ value: Number(log.weight) * (1 + Number(log.reps) / 30), log }))
    const estimate = estimates.reduce<{ value: number; log: ExerciseLog } | null>((max, candidate) => candidate.value > (max?.value || 0) ? candidate : max, null)
    return {
      id: item.id,
      name: item.name,
      tested: best ? { weight: formatStatNumber(best.weight), date: formatDisplayDate(best.date) } : null,
      estimate: estimate
        ? { value: formatStatNumber(estimate.value), weight: formatStatNumber(estimate.log.weight), reps: formatStatNumber(estimate.log.reps) }
        : null,
      manualTests: item.tests.map((test, index) => ({ index, weight: formatStatNumber(test.weight), date: formatDisplayDate(test.date) })),
    }
  })
}

/**
 * Records a manual 1RM test. Creates the tracker for the lift when it does not exist. A blank weight only creates the tracker.
 * @param maxes - The trackers, changed in place.
 * @param input - Lift name (trimmed), id for a new tracker, typed weight and a valid ISO date.
 */
export function recordOneRepMax(maxes: OneRepMaxTracker[], input: { id: string; name: string; weight: string; date: string }): void {
  const key = exerciseKey(input.name)
  let item = maxes.find((entry) => exerciseKey(entry.name) === key)
  if (!item) {
    item = { id: input.id, name: input.name, tests: [] }
    maxes.push(item)
  }
  if (input.weight) item.tests.push({ weight: Number(input.weight), date: input.date })
}

/**
 * Removes one manual test from a tracker.
 * @param maxes - The trackers, changed in place.
 * @param trackerId - Id of the tracker.
 * @param index - Position of the test in the tracker's list.
 */
export function removeOneRepMaxTest(maxes: OneRepMaxTracker[], trackerId: string, index: number): void {
  const tracker = maxes.find((item) => item.id === trackerId)
  if (tracker) tracker.tests.splice(index, 1)
}
