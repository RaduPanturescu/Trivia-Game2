import type { Ref } from 'vue'
import { defineRepository, jsonCodec, STORAGE_KEYS, type Codec } from '../persistence'
import { defineSingleton } from '../singleton'

/** Fields every timed leaderboard entry shares (minesweeper and sudoku). */
export interface LeaderboardEntry {
  /** Difficulty key, e.g. `easy` or `custom`. */
  difficulty: string
  /** Solve time in seconds. */
  time: number
  /** ISO timestamp of when the round was recorded. */
  date: string
}

/** Public surface of a timed leaderboard returned by {@link defineTimedLeaderboard}. */
export interface TimedLeaderboard<E extends LeaderboardEntry> {
  /** Entries sorted by time ascending, at most 20. */
  entries: Ref<E[]>
  /** Personal best time in seconds per difficulty. */
  bests: Ref<Record<string, number>>
  /** Resolves once both stored values have loaded. */
  ready: Promise<void>
  /** Adds an entry, keeps the list sorted by time and trims it to 20 entries. */
  record: (entry: E) => void
  /** Removes every leaderboard entry. Personal bests are kept. */
  clear: () => void
  /** Stores `time` as the personal best for `difficulty` if it beats the current one. `custom` is ignored. */
  recordBest: (difficulty: string, time: number) => void
  /** Returns the personal best for `difficulty`, falling back to the fastest matching entry, or `null` if none. */
  bestFor: (difficulty: string) => number | null
}

/** Any key defined in {@link STORAGE_KEYS}. */
type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

/** Options for {@link defineTimedLeaderboard}. */
export interface TimedLeaderboardOptions {
  /** Storage key of the entry list (a JSON array). */
  leaderboardKey: StorageKey
  /** Storage key of the personal bests (a JSON object keyed by difficulty). */
  bestsKey: StorageKey
}

/** Maximum number of entries kept per leaderboard. */
const MAX_ENTRIES = 20

/**
 * Defines a timed leaderboard bound to two legacy storage keys. The returned composable creates one
 * shared instance on first call.
 * @param options - The leaderboard and personal-best storage keys.
 * @returns A function returning the shared {@link TimedLeaderboard}.
 */
export function defineTimedLeaderboard<E extends LeaderboardEntry>(options: TimedLeaderboardOptions): () => TimedLeaderboard<E> {
  return defineSingleton(() => createTimedLeaderboard<E>(options))
}

/** Builds a leaderboard over its two repositories. */
function createTimedLeaderboard<E extends LeaderboardEntry>({ leaderboardKey, bestsKey }: TimedLeaderboardOptions): TimedLeaderboard<E> {
  const entriesRepo = defineRepository<E[]>({ key: leaderboardKey, codec: entriesCodec<E>(), defaults: () => [] })()
  const bestsRepo = defineRepository<Record<string, number>>({ key: bestsKey, codec: bestsCodec, defaults: () => ({}) })()
  const entries = entriesRepo.state
  const bests = bestsRepo.state

  function record(entry: E): void {
    entries.value = [...entries.value, entry].sort((a, b) => a.time - b.time).slice(0, MAX_ENTRIES)
  }

  function clear(): void {
    entries.value = []
  }

  function recordBest(difficulty: string, time: number): void {
    if (difficulty === 'custom') return
    const previous = Number(bests.value[difficulty])
    if (!Number.isFinite(previous) || time < previous) {
      bests.value = { ...bests.value, [difficulty]: time }
    }
  }

  function bestFor(difficulty: string): number | null {
    const personal = Number(bests.value[difficulty])
    if (Number.isFinite(personal)) return personal
    let fastest = Infinity
    for (const entry of entries.value) {
      const time = Number(entry.time)
      if (entry.difficulty === difficulty && Number.isFinite(time)) fastest = Math.min(fastest, time)
    }
    return Number.isFinite(fastest) ? fastest : null
  }

  return {
    entries,
    bests,
    ready: Promise.all([entriesRepo.ready, bestsRepo.ready]).then(() => undefined),
    record,
    clear,
    recordBest,
    bestFor,
  }
}

/** JSON codec for the entry list. Any stored value that is not an array loads as an empty list, as in legacy. */
function entriesCodec<E>(): Codec<E[]> {
  const json = jsonCodec<unknown>()
  return {
    decode: (raw) => {
      const value = json.decode(raw)
      return Array.isArray(value) ? (value as E[]) : []
    },
    encode: (value) => json.encode(value),
  }
}

/** JSON codec for the personal bests. Anything that is not a plain object loads as `{}`, as in legacy. */
const bestsCodec: Codec<Record<string, number>> = {
  decode: (raw) => {
    const value: unknown = JSON.parse(raw)
    return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, number>) : {}
  },
  encode: (value) => JSON.stringify(value),
}
