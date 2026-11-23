import type { LeaderboardEntry } from '@/shared/games'

/** A 9 x 9 Sudoku grid: outer array is rows, inner is columns. `0` marks an empty cell. */
export type Grid = number[][]

/** Difficulty presets with a fixed clue target. */
export type PresetDifficulty = 'easy' | 'medium' | 'hard'

/** Every difficulty a game can start with. `custom` takes a user-chosen clue count. */
export type SudokuDifficulty = PresetDifficulty | 'custom'

/** Colour theme of the Sudoku screens. Stored under `sudokuTheme`. */
export type SudokuTheme = 'light' | 'dark'

/** Lifecycle of one game. `idle` means no puzzle has been generated yet. */
export type SudokuStatus = 'idle' | 'playing' | 'won' | 'lost'

/** Zero-based board position. */
export interface CellPosition {
  /** Row index, 0 at the top. */
  row: number
  /** Column index, 0 at the left. */
  col: number
}

/** Random number source returning values in [0, 1). Injected so tests can seed generation. */
export type Rng = () => number

/** One Sudoku leaderboard row: the shared timed fields plus the clue count the puzzle ended with. */
export interface SudokuLeaderboardEntry extends LeaderboardEntry {
  /** Number of givens in the puzzle that was played. */
  clues: number
}

/** View model of one board cell, derived from the game state for rendering. */
export interface SudokuCell {
  /** Row-major index, `row * 9 + col`. */
  index: number
  /** Row index. */
  row: number
  /** Column index. */
  col: number
  /** Current value, `0` when empty. */
  value: number
  /** Whether the cell is a clue from the generated puzzle. */
  given: boolean
  /** Whether the cell has keyboard or pointer focus. */
  selected: boolean
  /** Whether the cell shares a row, column or box with the selected cell. */
  related: boolean
  /** Whether the cell just received a wrong entry. */
  error: boolean
  /** Whether the cell is highlighted as part of a clash. */
  conflict: boolean
  /** Whether the cell is flashing because its row, column or box was completed. */
  flash: boolean
  /** Whether the cell was filled by the developer reveal. */
  devFilled: boolean
  /** Whether a thicker border sits under this cell (bottom edge of a box, not the grid edge). */
  boxBottom: boolean
  /** Whether a thicker border sits right of this cell (right edge of a box, not the grid edge). */
  boxRight: boolean
}
