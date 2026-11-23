/**
 * Formats a whole number of seconds as `m:ss`, as the legacy minesweeper and sudoku timers do.
 * @param seconds - Elapsed time in seconds.
 * @returns The time as minutes, a colon and two-digit seconds, e.g. `1:05`.
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
