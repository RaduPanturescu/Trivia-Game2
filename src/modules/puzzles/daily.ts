import { defineRepository, jsonCodec, stringCodec, STORAGE_KEYS } from '@/shared/persistence'
import { isoDate } from '@/shared/dates'
import { shuffle, stripExtension } from './util'
import type { DailyImage } from './types'

/** Manifest listing the daily pictures. Relative, as in the legacy app. */
const MANIFEST_URL = './puzzles-of-the-day/puzzles.json'

/** Folder prefix for bare file names in the manifest. */
const IMAGE_DIR = './puzzles-of-the-day/'

/** Stored rotation: the shuffled picture sources, and the date the cycle started. */
export interface DailySequence {
  /** Picture `src` values in the order they are served, one per day. */
  ids: string[]
  /** Local date (`YYYY-MM-DD`) on which `ids[0]` is served. */
  startDate: string
}

/** Repository for `puzzleDailySequence`. Holds the raw stored value, validated when it is used. */
const dailySequenceRepo = defineRepository<DailySequence | null>({
  key: STORAGE_KEYS.puzzleDailySequence,
  codec: jsonCodec<DailySequence | null>(),
  defaults: () => null,
})

/** Repository for `puzzleDailyCompletedDate`, the local date on which the daily puzzle was finished. */
const dailyCompletionRepo = defineRepository<string>({
  key: STORAGE_KEYS.puzzleDailyCompletedDate,
  codec: stringCodec,
  defaults: () => '',
})

/**
 * Returns the shared repository for the daily sequence.
 * @returns The repository for `puzzleDailySequence`.
 */
export function useDailySequence() {
  return dailySequenceRepo()
}

/**
 * Returns the shared repository for the completion date.
 * @returns The repository for `puzzleDailyCompletedDate`.
 */
export function useDailyCompletion() {
  return dailyCompletionRepo()
}

/**
 * Records that today's daily puzzle is finished. Waits for stored data to load first, so the stored value is not overwritten.
 */
export async function markDailyCompleted(): Promise<void> {
  const repo = dailyCompletionRepo()
  await repo.ready
  repo.state.value = isoDate(new Date())
}

/**
 * Normalises one manifest entry into a daily picture. Bare file names resolve inside the image folder;
 * paths starting with `./`, `/`, `http(s):` or `data:` are kept as given.
 * @param entry - A file name string, or an object with `src` and an optional `title`.
 * @returns The picture, or `null` when the entry has no usable `src`.
 */
export function normalizeDailyImage(entry: unknown): DailyImage | null {
  if (typeof entry === 'string') return { src: `${IMAGE_DIR}${entry}`, title: stripExtension(entry) }
  if (!isRecord(entry) || typeof entry.src !== 'string') return null
  const src = /^(\.\/|\/|https?:|data:)/.test(entry.src) ? entry.src : `${IMAGE_DIR}${entry.src}`
  const title = typeof entry.title === 'string' && entry.title ? entry.title : stripExtension(entry.src)
  return { src, title }
}

/**
 * Downloads the manifest and returns the usable daily pictures. Accepts a bare array or an object with a `puzzles` array.
 * @returns The normalised pictures, which may be empty.
 * @throws When the manifest cannot be fetched.
 */
export async function fetchDailyPool(): Promise<DailyImage[]> {
  const response = await fetch(MANIFEST_URL, { cache: 'no-store' })
  if (!response.ok) throw new Error('No puzzle list found.')
  const manifest: unknown = await response.json()
  const entries = Array.isArray(manifest) ? manifest : isRecord(manifest) ? manifest.puzzles : undefined
  const list: unknown[] = Array.isArray(entries) ? entries : []
  return list.map(normalizeDailyImage).filter((item): item is DailyImage => item !== null)
}

/**
 * Works out the rotation for `today`. The stored rotation is kept while it still matches the pool and today falls inside it;
 * otherwise a new shuffled rotation starts today. Pictures never repeat until every picture has been served once.
 * @param pool - The daily pictures.
 * @param stored - The raw stored value. Anything that is not a valid sequence is ignored.
 * @param today - Local date as `YYYY-MM-DD`.
 * @param shuffleIds - Shuffles the picture sources for a new rotation. Defaults to a random shuffle.
 * @returns The rotation to use. It is the same object as `stored` when nothing changed.
 */
export function resolveDailySequence(
  pool: readonly DailyImage[],
  stored: unknown,
  today: string,
  shuffleIds: (ids: string[]) => string[] = (ids) => shuffle(ids),
): DailySequence {
  const ids = pool.map((item) => item.src)
  const fresh = (): DailySequence => ({ ids: shuffleIds([...ids]), startDate: today })
  if (!isDailySequence(stored) || !sameMembers(stored.ids, ids)) return fresh()
  const offset = dateOrdinal(today) - dateOrdinal(stored.startDate)
  return offset >= 0 && offset < stored.ids.length ? stored : fresh()
}

/**
 * Returns the picture served on `today` from a rotation.
 * @param pool - The daily pictures.
 * @param sequence - The rotation from {@link resolveDailySequence}.
 * @param today - Local date as `YYYY-MM-DD`.
 * @returns The picture, or `null` when it is not in the pool.
 */
export function pictureForDate(pool: readonly DailyImage[], sequence: DailySequence, today: string): DailyImage | null {
  const src = sequence.ids[dateOrdinal(today) - dateOrdinal(sequence.startDate)]
  return pool.find((item) => item.src === src) ?? null
}

/**
 * Counts whole days from the Unix epoch to a local calendar date, computed in UTC so daylight saving never shifts it.
 * @param value - Date as `YYYY-MM-DD`.
 * @returns The day number.
 */
function dateOrdinal(value: string): number {
  const [year = NaN, month = NaN, day = NaN] = value.split('-').map(Number)
  return Date.UTC(year, month - 1, day) / 86400000
}

/**
 * Checks whether two lists hold the same values, ignoring order.
 * @param stored - The stored list.
 * @param current - The list from the pool.
 * @returns True when both lists have the same length and every value of `current` is in `stored`.
 */
function sameMembers(stored: readonly string[], current: readonly string[]): boolean {
  return stored.length === current.length && current.every((id) => stored.includes(id))
}

/**
 * Checks the shape of a raw stored rotation.
 * @param value - Parsed JSON from storage.
 * @returns True when `value` has a string array `ids` and an ISO `startDate`.
 */
function isDailySequence(value: unknown): value is DailySequence {
  return (
    isRecord(value) &&
    Array.isArray(value.ids) &&
    value.ids.every((id) => typeof id === 'string') &&
    typeof value.startDate === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.startDate)
  )
}

/**
 * Narrows an unknown value to a plain object.
 * @param value - Any value.
 * @returns True when `value` is a non-null object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
