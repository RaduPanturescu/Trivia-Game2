import { beforeEach, describe, expect, it } from 'vitest'
import { useDevMode } from '@/shared/devMode'
import { emptyGrid, valueAt, writeAt } from './grid'
import { useSudoku, type SudokuGame } from './useSudoku'
import { useSudokuLeaderboard } from './leaderboard'
import { getSudokuConflicts } from './rules'
import type { Rng, SudokuCell } from './types'

/**
 * Seeded generator (mulberry32) so each test gets the same puzzle.
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

/**
 * Builds a seeded easy game and starts it.
 * @returns The started game.
 */
function startEasy(): SudokuGame {
  const game = useSudoku({ rng: seededRng(11) })
  game.start('easy')
  return game
}

/**
 * Reads the view model of one cell.
 * @param game - A started game.
 * @param row - Row index.
 * @param col - Column index.
 * @returns The cell.
 */
function cellAt(game: SudokuGame, row: number, col: number): SudokuCell {
  const cell = game.cells.value.find((candidate) => candidate.row === row && candidate.col === col)
  if (!cell) throw new Error(`no cell at ${row},${col}`)
  return cell
}

/**
 * Finds an empty cell and a digit that is wrong for it but clashes with nothing, so the entry counts as a plain mistake.
 * @param game - A started game.
 * @returns Where to type and what to type.
 */
function wrongEntry(game: SudokuGame): { row: number; col: number; text: string } {
  const grid = emptyGrid()
  for (const cell of game.cells.value) writeAt(grid, cell.row, cell.col, cell.value)
  for (const cell of game.cells.value) {
    if (cell.value !== 0) continue
    for (let digit = 1; digit <= 9; digit++) {
      if (digit !== valueAt(game.solution.value, cell.row, cell.col) && getSudokuConflicts(grid, cell.row, cell.col, digit).length === 0) {
        return { row: cell.row, col: cell.col, text: String(digit) }
      }
    }
  }
  throw new Error('no wrong entry available')
}

describe('useSudoku', () => {
  beforeEach(async () => {
    localStorage.clear()
    await useDevMode().ready
    useDevMode().isDev.value = false
  })

  it('rejects a custom clue count outside 17 to 80', () => {
    const game = useSudoku({ rng: seededRng(3) })
    expect(game.start('custom', 16)).toBe(false)
    expect(game.start('custom', 81)).toBe(false)
    expect(game.status.value).toBe('idle')
  })

  it('flags a clashing digit as a mistake and highlights the clash without writing it', () => {
    const game = startEasy()
    const given = game.cells.value.find((cell) => cell.given)
    if (!given) throw new Error('expected a given cell')
    const empty = game.cells.value.find((cell) => cell.row === given.row && !cell.given)
    if (!empty) throw new Error('expected an empty cell in the same row')

    game.enterValue(empty.row, empty.col, String(given.value))

    expect(game.mistakes.value).toBe(1)
    expect(cellAt(game, empty.row, empty.col).value).toBe(0)
    expect(cellAt(game, empty.row, empty.col).error).toBe(true)
    expect(cellAt(game, given.row, given.col).conflict).toBe(true)
  })

  it('ends the game on the third mistake when developer mode is off', () => {
    const game = startEasy()
    for (let i = 0; i < 3; i++) {
      const { row, col, text } = wrongEntry(game)
      game.enterValue(row, col, text)
    }
    expect(game.mistakes.value).toBe(3)
    expect(game.status.value).toBe('lost')
    expect(game.locked.value).toBe(true)
  })

  it('keeps the game going past three mistakes in developer mode', () => {
    useDevMode().isDev.value = true
    const game = startEasy()
    for (let i = 0; i < 3; i++) {
      const { row, col, text } = wrongEntry(game)
      game.enterValue(row, col, text)
    }
    expect(game.mistakes.value).toBe(3)
    expect(game.status.value).toBe('playing')
  })

  it('records a win on the leaderboard once every cell matches the solution', () => {
    const leaderboard = useSudokuLeaderboard()
    const before = leaderboard.entries.value.length
    const game = startEasy()

    for (const cell of game.cells.value) {
      if (!cell.given) game.enterValue(cell.row, cell.col, String(valueAt(game.solution.value, cell.row, cell.col)))
    }

    expect(game.status.value).toBe('won')
    expect(leaderboard.entries.value).toHaveLength(before + 1)
    expect(leaderboard.entries.value.some((entry) => entry.difficulty === 'easy' && entry.clues === game.clueCount.value)).toBe(true)
  })
})
