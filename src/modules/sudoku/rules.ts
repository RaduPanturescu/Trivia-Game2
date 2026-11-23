import { valueAt } from './grid'
import type { CellPosition, Grid } from './types'

/**
 * Lists the filled cells that clash with placing `value` at (row, col): same row, same column or same box.
 * The target cell itself is never listed. Port of the legacy `getSudokuConflicts`.
 * @param board - The current grid.
 * @param row - Row of the target cell.
 * @param col - Column of the target cell.
 * @param value - Value being placed.
 * @returns Every clashing cell. Empty when the value is allowed.
 */
export function getSudokuConflicts(board: Grid, row: number, col: number, value: number): CellPosition[] {
  const conflicts: CellPosition[] = []

  for (let c = 0; c < 9; c++) {
    if (c !== col && valueAt(board, row, c) === value) conflicts.push({ row, col: c })
  }

  for (let r = 0; r < 9; r++) {
    if (r !== row && valueAt(board, r, col) === value) conflicts.push({ row: r, col })
  }

  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (!(r === row && c === col) && valueAt(board, r, c) === value) conflicts.push({ row: r, col: c })
    }
  }

  return conflicts
}
