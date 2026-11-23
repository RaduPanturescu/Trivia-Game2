import { asArray, isRecord, type BodyWeightEntry } from './types'
import { isIsoDateString } from './schedule'

/**
 * Reads the stored body weight log. Drops malformed entries and entries with a non-positive weight, and sorts by date.
 * @param raw - The parsed `triviaBodyWeightEntries` value.
 * @returns Clean entries, oldest first.
 */
export function normalizeBodyWeightEntries(raw: unknown): BodyWeightEntry[] {
  return asArray<unknown>(raw)
    .filter(isRecord)
    .filter((entry) => isIsoDateString(entry.date) && Number.isFinite(Number(entry.weight)) && Number(entry.weight) > 0)
    .map((entry) => ({ date: String(entry.date), weight: Number(entry.weight) }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Adds a weight for a date. An entry already logged for that date is replaced.
 * NOTE: the replace-on-same-date rule is not verified against the legacy save code (outside the ported line ranges).
 * @param raw - The parsed `triviaBodyWeightEntries` value.
 * @param entry - The new entry. Caller validates the weight.
 * @returns The full, normalised list to store.
 */
export function addBodyWeightEntry(raw: unknown, entry: BodyWeightEntry): BodyWeightEntry[] {
  const others = normalizeBodyWeightEntries(raw).filter((item) => item.date !== entry.date)
  return normalizeBodyWeightEntries([...others, entry])
}
