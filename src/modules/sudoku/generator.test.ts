import { describe, expect, it } from 'vitest'
import { emptyGrid, valueAt, writeAt } from './grid'
import { countSudokuSolutions, generateSudokuPuzzle, generateSudokuSolution, isValidSudokuMove } from './generator'
import type { Grid, Rng } from './types'

/**
 * Seeded generator (mulberry32) so the same seed always gives the same puzzle.
 * @param seed - Any integer.
 * @returns A random source returning values in [0, 1).
 */
function seededRng(seed: number): Rng {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const DIGITS = '1,2,3,4,5,6,7,8,9'

/**
 * Whether a list of nine values is exactly 1 to 9.
 * @param values - The values to check.
 * @returns `true` for a permutation of 1 to 9.
 */
function isDigitSet(values: number[]): boolean {
  return [...values].sort((a, b) => a - b).join(',') === DIGITS
}

/**
 * Whether a grid is a complete, valid Sudoku: every row, column and box holds 1 to 9 once.
 * @param grid - The grid to check.
 * @returns `true` when the grid is solved.
 */
function isCompleteSolution(grid: Grid): boolean {
  const rows = grid.every((row) => isDigitSet(row))
  const cols = Array.from({ length: 9 }, (_, c) => isDigitSet(grid.map((_row, r) => valueAt(grid, r, c)))).every(Boolean)
  const boxes = Array.from({ length: 9 }, (_, box) => {
    const top = Math.floor(box / 3) * 3
    const left = (box % 3) * 3
    return isDigitSet(Array.from({ length: 9 }, (_, i) => valueAt(grid, top + Math.floor(i / 3), left + (i % 3))))
  }).every(Boolean)
  return rows && cols && boxes
}

describe('generateSudokuSolution', () => {
  it('produces a complete grid where every row, column and box holds 1 to 9 once', () => {
    for (const seed of [1, 2, 3]) {
      expect(isCompleteSolution(generateSudokuSolution(seededRng(seed)))).toBe(true)
    }
  })
})

describe('isValidSudokuMove', () => {
  it('rejects a value already in the same row, column or box', () => {
    const grid = emptyGrid()
    writeAt(grid, 0, 0, 5)
    expect(isValidSudokuMove(grid, 0, 8, 5)).toBe(false) // same row
    expect(isValidSudokuMove(grid, 8, 0, 5)).toBe(false) // same column
    expect(isValidSudokuMove(grid, 2, 2, 5)).toBe(false) // same box
    expect(isValidSudokuMove(grid, 4, 4, 5)).toBe(true)
  })
})

describe('generateSudokuPuzzle', () => {
  it.each([40, 30])('keeps exactly %i clues and only clues that match the solution', (clues) => {
    const solution = generateSudokuSolution(seededRng(7))
    const puzzle = generateSudokuPuzzle(solution, clues, seededRng(7))
    const filled = puzzle.flat().filter((value) => value !== 0)
    expect(filled).toHaveLength(clues)
    puzzle.forEach((row, r) =>
      row.forEach((value, c) => {
        if (value !== 0) expect(value).toBe(valueAt(solution, r, c))
      }),
    )
  })

  it('leaves a puzzle with exactly one solution', () => {
    const solution = generateSudokuSolution(seededRng(7))
    const puzzle = generateSudokuPuzzle(solution, 40, seededRng(7))
    expect(countSudokuSolutions(puzzle, 2)).toBe(1)
  })
})

describe('countSudokuSolutions', () => {
  it('stops at the limit on an empty grid', () => {
    expect(countSudokuSolutions(emptyGrid(), 2)).toBe(2)
  })
})
