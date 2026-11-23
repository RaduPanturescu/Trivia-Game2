import type { Cell, MinesweeperSize } from './types'

/** The board as rows of squares. Indexed `board[row][col]`. */
export type Board = Cell[][]

/** Result of opening a square: nothing happened, a mine was hit, or the square was safe. */
export type RevealOutcome = 'ignored' | 'mine' | 'safe'

/** What one square looks like on screen. */
export interface CellView {
  /** Extra CSS classes, e.g. `revealed`, `num-2`, `flagged`. */
  classes: string[]
  /** Text inside the square: a count, a hazard, a flag or nothing. */
  label: string
  /** True when the label is a hazard shown in developer mode. It is drawn faint. */
  cheat: boolean
}

/**
 * Builds a board with the mines placed and every square's neighbour count filled in.
 * @param size - Rows, columns and mines.
 * @param random - Source of randomness in `[0, 1)`. Defaults to `Math.random`; tests pass a fixed sequence.
 * @returns A new board with nothing revealed or flagged.
 */
export function createBoard(size: MinesweeperSize, random: () => number = Math.random): Board {
  const board: Board = Array.from({ length: size.rows }, () =>
    Array.from({ length: size.cols }, (): Cell => ({ mine: false, adjacent: 0, revealed: false, flagged: false })),
  )
  let placed = 0
  while (placed < size.mines) {
    const row = Math.floor(random() * size.rows)
    const col = Math.floor(random() * size.cols)
    const cell = cellAt(board, row, col)
    if (cell && !cell.mine) {
      cell.mine = true
      placed++
    }
  }
  for (let row = 0; row < size.rows; row++) {
    for (let col = 0; col < size.cols; col++) {
      const cell = cellAt(board, row, col)
      if (cell) cell.adjacent = neighbours(board, row, col).filter(([r, c]) => cellAt(board, r, c)?.mine).length
    }
  }
  return board
}

/**
 * Returns the square at a position, or `undefined` when it is off the board.
 * @param board - The board.
 * @param row - Row index.
 * @param col - Column index.
 * @returns The square, or `undefined`.
 */
export function cellAt(board: Board, row: number, col: number): Cell | undefined {
  return board[row]?.[col]
}

/**
 * Lists the on-board positions around a square (the square itself is excluded).
 * @param board - The board, used for its bounds.
 * @param row - Row index of the centre square.
 * @param col - Column index of the centre square.
 * @returns Up to eight `[row, col]` pairs.
 */
function neighbours(board: Board, row: number, col: number): [number, number][] {
  const result: [number, number][] = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const r = row + dr
      const c = col + dc
      if (cellAt(board, r, c)) result.push([r, c])
    }
  }
  return result
}

/**
 * Opens a square. A mine is marked revealed and reported; a zero square opens its neighbours,
 * and any zero among them keeps opening outwards (flood fill).
 * @param board - The board. Mutated in place.
 * @param row - Row index of the square to open.
 * @param col - Column index of the square to open.
 * @returns `mine` when a mine was hit, `safe` when the square opened, `ignored` when it was already open or flagged.
 */
export function revealCell(board: Board, row: number, col: number): RevealOutcome {
  const cell = cellAt(board, row, col)
  if (!cell || cell.revealed || cell.flagged) return 'ignored'
  cell.revealed = true
  if (cell.mine) return 'mine'
  if (cell.adjacent === 0) floodFill(board, row, col)
  return 'safe'
}

/**
 * Opens every square around a zero square and keeps going through the zeros it reaches.
 * @param board - The board. Mutated in place.
 * @param row - Row index of the zero square.
 * @param col - Column index of the zero square.
 */
function floodFill(board: Board, row: number, col: number): void {
  const pending: [number, number][] = [[row, col]]
  let next = pending.pop()
  while (next) {
    for (const [r, c] of neighbours(board, next[0], next[1])) {
      const cell = cellAt(board, r, c)
      if (!cell || cell.revealed) continue
      cell.revealed = true
      if (cell.adjacent === 0) pending.push([r, c])
    }
    next = pending.pop()
  }
}

/**
 * Reveals every mine, used when the round is lost.
 * @param board - The board. Mutated in place.
 */
export function revealAllMines(board: Board): void {
  for (const row of board) {
    for (const cell of row) {
      if (cell.mine) cell.revealed = true
    }
  }
}

/**
 * Flags or unflags an unopened square.
 * @param board - The board. Mutated in place.
 * @param row - Row index.
 * @param col - Column index.
 * @returns True when the flag changed, false for an opened or missing square.
 */
export function toggleFlag(board: Board, row: number, col: number): boolean {
  const cell = cellAt(board, row, col)
  if (!cell || cell.revealed) return false
  cell.flagged = !cell.flagged
  return true
}

/**
 * Counts the flags on the board.
 * @param board - The board.
 * @returns The number of flagged squares.
 */
export function countFlags(board: Board): number {
  return board.flat().filter((cell) => cell.flagged).length
}

/**
 * The mine counter: mines minus flags, never below zero.
 * @param board - The board.
 * @param mines - Total mines on the board.
 * @returns The number to show in the counter.
 */
export function remainingMines(board: Board, mines: number): number {
  return Math.max(0, mines - countFlags(board))
}

/**
 * Tells whether every safe square is open.
 * @param board - The board.
 * @returns True when the round is won.
 */
export function isWon(board: Board): boolean {
  const safe = board.flat().filter((cell) => !cell.mine)
  return safe.every((cell) => cell.revealed)
}

/**
 * Decides what a square shows, from its state.
 * @param cell - The square.
 * @param hazardIcon - Emoji for a mine or otter.
 * @param showHazards - Developer mode: draw unopened mines faintly.
 * @returns The classes, label and cheat flag for the square.
 */
export function cellView(cell: Cell, hazardIcon: string, showHazards: boolean): CellView {
  if (cell.revealed) {
    if (cell.mine) return { classes: ['revealed', 'mine'], label: hazardIcon, cheat: false }
    if (cell.adjacent > 0) return { classes: ['revealed', `num-${cell.adjacent}`], label: String(cell.adjacent), cheat: false }
    return { classes: ['revealed'], label: '', cheat: false }
  }
  if (cell.flagged) return { classes: ['flagged'], label: '🚩', cheat: false }
  if (showHazards && cell.mine) return { classes: [], label: hazardIcon, cheat: true }
  return { classes: [], label: '', cheat: false }
}
