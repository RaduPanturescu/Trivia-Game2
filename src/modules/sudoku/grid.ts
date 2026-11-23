import type { Grid } from './types'

/**
 * Creates an empty 9 x 9 grid.
 * @returns A grid filled with `0`.
 */
export function emptyGrid(): Grid {
  return Array.from({ length: 9 }, () => Array<number>(9).fill(0))
}

/**
 * Reads one cell. Positions outside the board read as `0`.
 * @param grid - The grid to read.
 * @param row - Row index.
 * @param col - Column index.
 * @returns The cell value, `0` when empty.
 */
export function valueAt(grid: Grid, row: number, col: number): number {
  return grid[row]?.[col] ?? 0
}

/**
 * Writes one cell in place. Positions outside the board are ignored.
 * @param grid - The grid to change.
 * @param row - Row index.
 * @param col - Column index.
 * @param value - The value to store.
 */
export function writeAt(grid: Grid, row: number, col: number, value: number): void {
  const line = grid[row]
  if (line) line[col] = value
}
