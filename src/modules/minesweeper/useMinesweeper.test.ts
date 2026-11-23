import { describe, expect, it } from 'vitest'
import { cellAt, cellView, countFlags, createBoard, isWon, remainingMines, revealCell, toggleFlag, type Board } from './board'
import { buildPlayQuery, customMinesMax, customSize, customValidation, parsePlayQuery, presetSize } from './sizes'
import type { MinesweeperSize } from './types'

/** Builds a board with mines at exact positions, by feeding the placement the random values it needs. */
function boardWithMines(size: MinesweeperSize, mines: [number, number][]): Board {
  const values = mines.flatMap(([row, col]) => [(row + 0.5) / size.rows, (col + 0.5) / size.cols])
  let next = 0
  return createBoard(size, () => values[next++] ?? 0)
}

/** Whether the square at a position is open. */
function isOpen(board: Board, row: number, col: number): boolean {
  return board[row]?.[col]?.revealed === true
}

describe('createBoard', () => {
  it('places exactly the requested mines and counts neighbours', () => {
    const board = boardWithMines({ rows: 3, cols: 3, mines: 1 }, [[1, 1]])
    expect(board.flat().filter((cell) => cell.mine)).toHaveLength(1)
    expect(board[0]?.[0]?.adjacent).toBe(1)
    expect(board[1]?.[1]?.mine).toBe(true)
  })
})

describe('flood fill', () => {
  it('opens the neighbours of zero squares and stops at numbered squares', () => {
    // One mine in the last column: the first four columns are safe and only column 3 touches it.
    const board = boardWithMines({ rows: 1, cols: 5, mines: 1 }, [[0, 4]])
    expect(revealCell(board, 0, 0)).toBe('safe')
    expect([0, 1, 2, 3].every((col) => isOpen(board, 0, col))).toBe(true)
    expect(isOpen(board, 0, 4)).toBe(false)
    expect(board[0]?.[3]?.adjacent).toBe(1)
  })

  it('opens the whole zero region and the numbers that border it', () => {
    // Mines down the last column. Clicking the far corner opens columns 0 to 3 and nothing else.
    const board = boardWithMines({ rows: 3, cols: 5, mines: 3 }, [
      [0, 4],
      [1, 4],
      [2, 4],
    ])
    revealCell(board, 2, 0)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) expect(isOpen(board, row, col)).toBe(true)
      expect(isOpen(board, row, 4)).toBe(false)
    }
  })

  it('does not flood from a numbered square', () => {
    const board = boardWithMines({ rows: 1, cols: 5, mines: 1 }, [[0, 4]])
    revealCell(board, 0, 3)
    expect(isOpen(board, 0, 3)).toBe(true)
    expect(isOpen(board, 0, 2)).toBe(false)
  })

  it('reports a mine hit without flooding', () => {
    const board = boardWithMines({ rows: 1, cols: 5, mines: 1 }, [[0, 4]])
    expect(revealCell(board, 0, 4)).toBe('mine')
    expect(isOpen(board, 0, 0)).toBe(false)
  })
})

describe('win detection', () => {
  it('is won only once every safe square is open', () => {
    const board = boardWithMines({ rows: 1, cols: 5, mines: 1 }, [[0, 4]])
    expect(isWon(board)).toBe(false)
    revealCell(board, 0, 0)
    expect(isWon(board)).toBe(true)
  })

  it('is not won after a mine is hit', () => {
    const board = boardWithMines({ rows: 1, cols: 5, mines: 1 }, [[0, 4]])
    revealCell(board, 0, 4)
    expect(isWon(board)).toBe(false)
  })
})

describe('flags and the mine counter', () => {
  it('toggles a flag on an unopened square and counts it down', () => {
    const board = boardWithMines({ rows: 2, cols: 2, mines: 1 }, [[1, 1]])
    expect(remainingMines(board, 1)).toBe(1)
    expect(toggleFlag(board, 0, 0)).toBe(true)
    expect(countFlags(board)).toBe(1)
    expect(remainingMines(board, 1)).toBe(0)
    expect(toggleFlag(board, 0, 0)).toBe(true)
    expect(remainingMines(board, 1)).toBe(1)
  })

  it('does not flag an opened square', () => {
    const board = boardWithMines({ rows: 2, cols: 2, mines: 1 }, [[1, 1]])
    revealCell(board, 0, 0)
    expect(toggleFlag(board, 0, 0)).toBe(false)
    expect(countFlags(board)).toBe(0)
  })

  it('never shows a negative mine count', () => {
    const board = boardWithMines({ rows: 2, cols: 2, mines: 1 }, [[1, 1]])
    toggleFlag(board, 0, 0)
    toggleFlag(board, 0, 1)
    expect(remainingMines(board, 1)).toBe(0)
  })

  it('draws a flag and the count, and hides mines unless developer mode is on', () => {
    const board = boardWithMines({ rows: 2, cols: 2, mines: 1 }, [[1, 1]])
    toggleFlag(board, 0, 0)
    const flagged = cellAt(board, 0, 0)
    const mine = cellAt(board, 1, 1)
    if (!flagged || !mine) throw new Error('test board is missing squares')
    expect(cellView(flagged, '💣', false)).toEqual({ classes: ['flagged'], label: '🚩', cheat: false })
    expect(cellView(mine, '💣', false).label).toBe('')
    expect(cellView(mine, '🦦', true)).toEqual({ classes: [], label: '🦦', cheat: true })
  })
})

describe('custom validation', () => {
  it('accepts sides from 5 to 30 with at least one safe square', () => {
    expect(customSize(5, 5, 1)).toEqual({ rows: 5, cols: 5, mines: 1 })
    expect(customSize(5, 5, 24)).toEqual({ rows: 5, cols: 5, mines: 24 })
    expect(customSize(30, 30, 899)).toEqual({ rows: 30, cols: 30, mines: 899 })
  })

  it('rejects out-of-range, fractional or overfull settings', () => {
    expect(customSize(4, 5, 1)).toBeNull()
    expect(customSize(31, 5, 1)).toBeNull()
    expect(customSize(5.5, 5, 1)).toBeNull()
    expect(customSize(5, 5, 0)).toBeNull()
    expect(customSize(5, 5, 25)).toBeNull()
    expect(customSize(5, 5, 2.5)).toBeNull()
  })

  it('explains the problem in the legacy wording', () => {
    expect(customValidation(9, 9, 10, false)).toBe('81 cells · 10 mines · at least one safe cell.')
    expect(customValidation(9, 9, 81, true)).toBe('otters must be between 1 and 80; leave at least one safe cell.')
    expect(customValidation(4, 9, 10, false)).toBe('Rows and columns must each be whole numbers from 5 to 30.')
    expect(customMinesMax(9, 9)).toBe(80)
    expect(customMinesMax(4, 9)).toBe(80)
  })
})

describe('play query', () => {
  it('round-trips a preset and a custom round', () => {
    const preset = { difficulty: 'hard' as const, size: presetSize('hard'), otterMode: true }
    expect(parsePlayQuery(buildPlayQuery(preset))).toEqual(preset)
    const custom = { difficulty: 'custom' as const, size: { rows: 6, cols: 7, mines: 5 }, otterMode: false }
    expect(parsePlayQuery(buildPlayQuery(custom))).toEqual(custom)
  })

  it('rejects missing, unknown and invalid custom values', () => {
    expect(parsePlayQuery({})).toBeNull()
    expect(parsePlayQuery({ diff: 'extreme' })).toBeNull()
    expect(parsePlayQuery({ diff: 'custom', rows: '4', cols: '6', mines: '3' })).toBeNull()
  })
})
