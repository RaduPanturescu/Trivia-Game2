/**
 * Repository for the `triviaExerciseStatsV1` payload. Every change is a read-modify-write of the stored value, so the
 * store's `resetStats` (which removes the key) and the completed-log sync never leave stale data behind. Changes are
 * queued, so two writes never interleave.
 */
import { ref, type Ref } from 'vue'
import { getStorageAdapter, STORAGE_KEYS } from '@/shared/persistence'
import { asArray, isRecord } from '../core/types'
import type { CompletedExerciseLog, ExerciseLog, ExerciseStatsData, CardioRun, OneRepMaxTracker, OneRepMaxTest } from './types'

/** Legacy storage key, byte-identical. */
const STATS_KEY = STORAGE_KEYS.triviaExerciseStatsV1

/**
 * Empty payload, used when nothing is stored or the stored value cannot be read.
 * @returns A fresh payload.
 */
export function emptyExerciseStats(): ExerciseStatsData {
  return { logs: [], maxes: [], runs: [], completed: [], areas: {} }
}

/**
 * Repairs a parsed payload the way the legacy screen read it: each list must be an array, the areas an object.
 * Non-object entries inside the lists are dropped. Unknown top-level fields are discarded on the next save.
 * @param raw - The parsed JSON.
 * @returns A payload with every field present.
 */
export function normalizeExerciseStats(raw: unknown): ExerciseStatsData {
  if (!isRecord(raw)) return emptyExerciseStats()
  return {
    logs: asArray<ExerciseLog>(raw.logs).filter((item) => isRecord(item)),
    maxes: asArray<OneRepMaxTracker>(raw.maxes)
      .filter((item) => isRecord(item))
      .map((item) => ({ ...item, tests: asArray<OneRepMaxTest>(item.tests).filter((test) => isRecord(test)) })),
    runs: asArray<CardioRun>(raw.runs).filter((item) => isRecord(item)),
    completed: asArray<CompletedExerciseLog>(raw.completed).filter((item) => isRecord(item)),
    areas: isRecord(raw.areas) && !Array.isArray(raw.areas) ? (raw.areas as Record<string, string[]>) : {},
  }
}

/**
 * Reads the stored payload. Missing, unreadable or malformed values read as empty.
 * @returns The payload.
 */
async function readExerciseStats(): Promise<ExerciseStatsData> {
  try {
    const raw = await getStorageAdapter().getItem(STATS_KEY)
    return raw === null ? emptyExerciseStats() : normalizeExerciseStats(JSON.parse(raw))
  } catch {
    return emptyExerciseStats()
  }
}

/**
 * Writes the payload.
 * @param data - The payload.
 * @returns `false` when the storage rejected the write.
 */
async function writeExerciseStats(data: ExerciseStatsData): Promise<boolean> {
  try {
    await getStorageAdapter().setItem(STATS_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

/** The loaded payload shared by the screen's cards. Refreshed by every update and by {@link loadExerciseStats}. */
const state: Ref<ExerciseStatsData> = ref(emptyExerciseStats())

/** Tail of the write queue. Each job starts after the previous one settles. */
let queue: Promise<unknown> = Promise.resolve()

/**
 * Runs a job after every queued job.
 * @param job - The job.
 * @returns The job's result.
 */
function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const run = queue.then(job)
  queue = run.catch(() => undefined)
  return run
}

/**
 * Loads the stored payload into the shared state.
 * @returns Resolves once the state holds the stored values.
 */
export function loadExerciseStats(): Promise<void> {
  return enqueue(async () => {
    state.value = await readExerciseStats()
  })
}

/**
 * Applies a change to the stored payload and saves it. The change sees the latest stored value.
 * @param mutator - Changes the payload in place.
 * @returns `true` when the change was saved. On `false` the shared state keeps its previous value.
 */
export function updateExerciseStats(mutator: (data: ExerciseStatsData) => void): Promise<boolean> {
  return enqueue(async () => {
    const data = await readExerciseStats()
    mutator(data)
    const saved = await writeExerciseStats(data)
    if (saved) state.value = data
    return saved
  })
}

/**
 * The shared stats state and its operations, for the screen's cards.
 * @returns The state (read it, do not assign it), the loader and the updater.
 */
export function useExerciseStats(): { state: Readonly<Ref<ExerciseStatsData>>; load: typeof loadExerciseStats; update: typeof updateExerciseStats } {
  return { state, load: loadExerciseStats, update: updateExerciseStats }
}
