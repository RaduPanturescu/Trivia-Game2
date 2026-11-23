import { describe, expect, it } from 'vitest'
import { emptyGrid, writeAt } from './grid'
import { getSudokuConflicts } from './rules'

describe('getSudokuConflicts', () => {
  const board = emptyGrid()
  writeAt(board, 0, 0, 4) // row 0, box 0
  writeAt(board, 5, 3, 4) // column 3 and box 3 relative to (4, 3)
  writeAt(board, 4, 8, 9) // unrelated

  it('lists filled cells in the same row, column or box that hold the value', () => {
    const conflicts = getSudokuConflicts(board, 0, 5, 4)
    expect(conflicts).toContainEqual({ row: 0, col: 0 })
  })

  it('finds a clash in the same column and box', () => {
    const conflicts = getSudokuConflicts(board, 4, 3, 4)
    expect(conflicts).toContainEqual({ row: 5, col: 3 })
  })

  it('returns nothing when the value is free, and never lists the target cell', () => {
    expect(getSudokuConflicts(board, 4, 4, 1)).toEqual([])
    expect(getSudokuConflicts(board, 0, 0, 4)).not.toContainEqual({ row: 0, col: 0 })
  })
})
