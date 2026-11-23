import { isoDate } from '@/shared/dates'
import { isValidWorkoutImport } from '../core/importExport'
import type { WorkoutExportPayload } from '../core/types'

/**
 * File name of a program export: `workout-program-<date>.json`.
 * @param now - The export time.
 * @returns The download name.
 */
export function workoutExportFileName(now: Date): string {
  return `workout-program-${isoDate(now)}.json`
}

/**
 * The text written to an export file: pretty-printed JSON.
 * @param payload - The export payload.
 * @returns The file contents.
 */
export function serializeWorkoutExport(payload: WorkoutExportPayload): string {
  return JSON.stringify(payload, null, 2)
}

/**
 * Parses and checks the text of an imported file. Throws with the legacy messages when the text is not JSON or is not an
 * export of this app.
 * @param text - The file contents.
 * @returns The payload, ready for `importProgram`.
 * @throws {SyntaxError} When the text is not JSON.
 * @throws {Error} When the JSON is not a workout program export.
 */
export function parseWorkoutImport(text: string): WorkoutExportPayload {
  const payload: unknown = JSON.parse(text)
  if (!isValidWorkoutImport(payload)) throw new Error('This file is not a valid workout program export.')
  return payload
}
