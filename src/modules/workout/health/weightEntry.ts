import { displayDateError, parseDisplayDate } from '@/shared/dates'
import type { BodyWeightEntry } from '../core/types'

/** Lowest weight accepted, in kilograms. */
export const WEIGHT_MIN_KG = 1

/** Highest weight accepted, in kilograms. */
export const WEIGHT_MAX_KG = 500

/** Legacy alert text for a weight outside the accepted range. */
export const WEIGHT_RANGE_MESSAGE = `Enter a weight between ${WEIGHT_MIN_KG} and ${WEIGHT_MAX_KG} kg.`

/** Result of checking the weight entry form. */
export type WeightEntryResult =
  | { ok: true; entry: BodyWeightEntry }
  | { ok: false; field: 'weight' | 'date'; message: string }

/**
 * Parses the typed weight. Blank, non-numeric and out-of-range values are rejected.
 * @param text - The raw input text.
 * @returns The weight in kilograms, or `null` when it is not accepted.
 */
export function parseWeightText(text: string): number | null {
  if (text.trim() === '') return null
  const weight = Number(text)
  return Number.isFinite(weight) && weight >= WEIGHT_MIN_KG && weight <= WEIGHT_MAX_KG ? weight : null
}

/**
 * Checks the log-weight form. Without developer mode the date is always today. With developer mode the typed
 * `DD/MM/YYYY` date must be a real date that is not in the future.
 * @param input - The typed weight and date, whether the date is editable, and today as `YYYY-MM-DD`.
 * @returns The entry to save, or the field and message to show.
 */
export function validateWeightEntry(input: { weightText: string; dateText: string; editableDate: boolean; today: string }): WeightEntryResult {
  const weight = parseWeightText(input.weightText)
  if (weight === null) return { ok: false, field: 'weight', message: WEIGHT_RANGE_MESSAGE }
  if (!input.editableDate) return { ok: true, entry: { date: input.today, weight } }
  const message = displayDateError(input.dateText, { required: true, maxDate: input.today })
  const date = parseDisplayDate(input.dateText)
  if (message || !date) return { ok: false, field: 'date', message: message || 'Enter a valid date as DD/MM/YYYY.' }
  return { ok: true, entry: { date, weight } }
}
