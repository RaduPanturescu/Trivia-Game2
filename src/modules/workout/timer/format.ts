/**
 * Text formatting for the workout timers, ported from the legacy `formatCountdownTime`, `formatStopwatchTime` and
 * `formatCountdownStopwatchTime` helpers.
 */

/**
 * Formats whole seconds as `MM:SS` for the rest countdown on Workout Now. Fractions are floored.
 * @param totalSeconds - Seconds left.
 * @returns The formatted time.
 */
export function formatCountdownTime(totalSeconds: number): string {
  const seconds = Math.max(0, Number(totalSeconds) || 0)
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}

/**
 * Formats elapsed milliseconds as `MM:SS.mmm` for the stopwatch.
 * @param totalMilliseconds - Elapsed time in milliseconds.
 * @returns The formatted time.
 */
export function formatStopwatchTime(totalMilliseconds: number): string {
  const milliseconds = Math.max(0, Math.floor(totalMilliseconds))
  const minutes = Math.floor(milliseconds / 60000)
  const seconds = Math.floor(milliseconds / 1000) % 60
  const remainder = milliseconds % 1000
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(remainder).padStart(3, '0')}`
}

/**
 * Formats the countdown on the timer face as `MM:SS`. Partial seconds round up, so the face never shows 00:00 early.
 * @param totalSeconds - Seconds left, possibly fractional.
 * @returns The formatted time.
 */
export function formatCountdownStopwatchTime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.ceil(totalSeconds))
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}
