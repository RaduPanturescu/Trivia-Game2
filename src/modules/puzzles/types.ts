/** Difficulty level of a puzzle. The order matches the legacy select lists. */
export type Difficulty = 'easy' | 'medium' | 'hard'

/** Grid size and display label of one difficulty, as in the legacy `DIFFICULTIES` table. */
export interface DifficultyConfig {
  /** Rows in the grid. */
  rows: number
  /** Columns in the grid. */
  columns: number
  /** Name shown in the UI. */
  label: string
}

/** Every difficulty level, in display order. */
export const DIFFICULTY_LEVELS: readonly Difficulty[] = ['easy', 'medium', 'hard']

/** Grid sizes per difficulty. Each level is a square grid. */
export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: { rows: 3, columns: 3, label: 'Easy' },
  medium: { rows: 5, columns: 5, label: 'Medium' },
  hard: { rows: 7, columns: 7, label: 'Hard' },
}

/**
 * Checks whether a raw select value is a known difficulty.
 * @param value - Raw value from a form control.
 * @returns True when `value` is `easy`, `medium` or `hard`.
 */
export function isDifficulty(value: string): value is Difficulty {
  return (DIFFICULTY_LEVELS as readonly string[]).includes(value)
}

/**
 * Formats a difficulty option the way the legacy selects show it, e.g. `Medium · 25 pieces`.
 * @param level - The difficulty to describe.
 * @returns The option label.
 */
export function difficultyOption(level: Difficulty): string {
  const { label, rows, columns } = DIFFICULTIES[level]
  return `${label} · ${rows * columns} pieces`
}

/**
 * A user-made puzzle, stored in IndexedDB (`personalPuzzles`) with exactly the legacy field names.
 */
export interface PersonalPuzzle {
  /** Generated id, used as the IndexedDB key. */
  id: string
  /** Name shown in the list. */
  name: string
  /** Picture as a base64 data URL. */
  image: string
  /** Creation time in milliseconds since the epoch. */
  createdAt: number
}

/** One picture in the daily pool. */
export interface DailyImage {
  /** URL of the picture. */
  src: string
  /** Title shown in the daily panel. */
  title: string
}

/** Where a puzzle comes from: the user's own uploads or the daily pool. */
export type PuzzleSource = 'personal' | 'daily'

/** A picture that can be started as a game. Personal puzzles carry their stored `id`; daily pictures do not. */
export interface PlayablePuzzle {
  /** IndexedDB id of a personal puzzle. */
  id?: string
  /** Title shown above the board. */
  title: string
  /** URL or data URL of the picture. */
  src: string
  /** Origin of the puzzle. Completing a daily puzzle marks today as done. */
  source: PuzzleSource
}
