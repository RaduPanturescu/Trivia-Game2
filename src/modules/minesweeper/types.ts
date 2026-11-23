import type { LeaderboardEntry } from '@/shared/games'

/** Preset difficulty keys, as stored in the leaderboard and the `diff` route query. */
export type PresetDifficulty = 'easy' | 'medium' | 'hard'

/** Every difficulty the game accepts. `custom` uses the rows, columns and mines typed by the player. */
export type MinesweeperDifficulty = PresetDifficulty | 'custom'

/** Board dimensions and mine count. */
export interface MinesweeperSize {
  /** Number of rows. */
  rows: number
  /** Number of columns. */
  cols: number
  /** Number of mines (or otters). */
  mines: number
}

/** Everything a round needs to start. Built from the play route query. */
export interface MinesweeperConfig {
  /** Difficulty key. */
  difficulty: MinesweeperDifficulty
  /** Board size for this round. */
  size: MinesweeperSize
  /** Whether the hazard is otters instead of mines. */
  otterMode: boolean
}

/** One square of the board. `adjacent` counts the mines in the eight neighbouring squares. */
export interface Cell {
  /** Whether this square holds a mine. */
  mine: boolean
  /** Number of mines around this square. */
  adjacent: number
  /** Whether the square has been opened. */
  revealed: boolean
  /** Whether the player has flagged the square. */
  flagged: boolean
}

/** Round status. `playing` until the board is cleared or a mine is hit. */
export type MinesweeperStatus = 'playing' | 'won' | 'lost'

/** A row in `minesweeperLeaderboard`. Field names and order match the legacy app. */
export interface MinesweeperLeaderboardEntry extends LeaderboardEntry {
  /** Columns of the board the round was played on. */
  cols: number
  /** Rows of the board the round was played on. */
  rows: number
}
