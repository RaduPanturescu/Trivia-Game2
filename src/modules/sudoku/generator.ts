import { emptyGrid, valueAt, writeAt } from './grid'
import type { Grid, Rng } from './types'

/**
 * Creates a complete, valid 9 x 9 solution. Port of the legacy `generateSudokuSolution`.
 * @param rng - Random source. Defaults to `Math.random`; pass a seeded one in tests.
 * @returns A filled grid where every row, column and box holds 1 to 9 once.
 */
export function generateSudokuSolution(rng: Rng = Math.random): Grid {
  const board = emptyGrid()
  fillSudoku(board, rng)
  return board.map((row) => [...row])
}

/**
 * Fills the empty cells of a grid by randomized backtracking. Port of the legacy `fillSudoku`.
 * @param board - Grid to fill in place.
 * @param rng - Random source used to shuffle candidates.
 * @returns `true` when the grid was filled, `false` when the current branch is a dead end.
 */
export function fillSudoku(board: Grid, rng: Rng): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (valueAt(board, row, col) === 0) {
        const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng)
        for (const num of numbers) {
          if (isValidSudokuMove(board, row, col, num)) {
            writeAt(board, row, col, num)
            if (fillSudoku(board, rng)) return true
            writeAt(board, row, col, 0)
          }
        }
        return false
      }
    }
  }
  return true
}

/**
 * Checks that a value does not already appear in the same row, column or 3 x 3 box. Port of the legacy `isValidSudokuMove`.
 * @param board - The grid to check against.
 * @param row - Row of the target cell.
 * @param col - Column of the target cell.
 * @param num - Value to place.
 * @returns `true` when the value can go in that cell.
 */
export function isValidSudokuMove(board: Grid, row: number, col: number, num: number): boolean {
  for (let c = 0; c < 9; c++) {
    if (valueAt(board, row, c) === num) return false
  }
  for (let r = 0; r < 9; r++) {
    if (valueAt(board, r, col) === num) return false
  }
  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (valueAt(board, r, c) === num) return false
    }
  }
  return true
}

/**
 * Removes clues from a solved grid in random order, keeping a puzzle only while it still has exactly one solution.
 * Stops at `clueCount` clues, or earlier if no further clue can be removed. Port of the legacy `generateSudokuPuzzle`.
 * @param solution - A complete valid grid.
 * @param clueCount - Target number of clues to keep.
 * @param rng - Random source used to order the removals.
 * @returns A new grid with `0` for removed cells.
 */
export function generateSudokuPuzzle(solution: Grid, clueCount: number, rng: Rng = Math.random): Grid {
  const puzzle = solution.map((row) => [...row])
  const positions = shuffle(
    Array.from({ length: 81 }, (_, index) => index),
    rng,
  )
  let remainingClues = 81

  for (const position of positions) {
    if (remainingClues <= clueCount) break
    const row = Math.floor(position / 9)
    const col = position % 9
    const originalValue = valueAt(puzzle, row, col)
    writeAt(puzzle, row, col, 0)
    if (countSudokuSolutions(puzzle, 2) === 1) {
      remainingClues -= 1
    } else {
      writeAt(puzzle, row, col, originalValue)
    }
  }

  return puzzle
}

/**
 * Counts solutions of a puzzle, stopping once `limit` is reached. Uses the most constrained empty cell at each step.
 * Port of the legacy `countSudokuSolutions`.
 * @param board - The puzzle to solve. It is not modified.
 * @param limit - Stop counting at this many solutions.
 * @returns The number of solutions found, at most `limit`.
 */
export function countSudokuSolutions(board: Grid, limit = 2): number {
  const workingBoard = board.map((row) => [...row])

  function search(): number {
    let bestRow = -1
    let bestCol = -1
    let bestCandidates: number[] | null = null

    for (let row = 0; row < 9; row += 1) {
      for (let col = 0; col < 9; col += 1) {
        if (valueAt(workingBoard, row, col) !== 0) continue
        const candidates: number[] = []
        for (let value = 1; value <= 9; value += 1) {
          if (isValidSudokuMove(workingBoard, row, col, value)) candidates.push(value)
        }
        if (candidates.length === 0) return 0
        if (!bestCandidates || candidates.length < bestCandidates.length) {
          bestRow = row
          bestCol = col
          bestCandidates = candidates
          if (candidates.length === 1) break
        }
      }
      if (bestCandidates?.length === 1) break
    }

    if (!bestCandidates) return 1
    let solutionCount = 0
    for (const value of bestCandidates) {
      writeAt(workingBoard, bestRow, bestCol, value)
      solutionCount += search()
      writeAt(workingBoard, bestRow, bestCol, 0)
      if (solutionCount >= limit) return limit
    }
    return solutionCount
  }

  return search()
}

/**
 * Shuffles an array in place with the Fisher-Yates algorithm. Port of the legacy `shuffle`.
 * @param array - Array to shuffle. It is mutated.
 * @param rng - Random source.
 * @returns The same array, shuffled.
 */
function shuffle<T>(array: T[], rng: Rng): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const current = array[i] as T
    array[i] = array[j] as T
    array[j] = current
  }
  return array
}
