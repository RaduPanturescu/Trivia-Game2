import type { LocationQuery } from 'vue-router'
import type { PresetDifficulty, SudokuDifficulty } from './types'

/** Smallest clue count that can still give a unique solution. */
export const MIN_CLUES = 17

/** Largest clue count the custom form accepts. */
export const MAX_CLUES = 80

/** Presets in carousel order. */
export const PRESET_DIFFICULTIES: PresetDifficulty[] = ['easy', 'medium', 'hard']

/** Card text and clue target of one preset difficulty, as in the legacy markup. */
export interface PresetInfo {
  /** Card title, e.g. `Easy`. */
  name: string
  /** Clue target used when the game starts. */
  clues: number
  /** Lines shown in the `?` popover. */
  info: string[]
}

/** Legacy presets, with their card wording. */
export const PRESETS: Record<PresetDifficulty, PresetInfo> = {
  easy: {
    name: 'Easy',
    clues: 40,
    info: ['9 × 9 board · up to 41 empty cells', 'Best for: Learning Sudoku rules and practicing basic patterns.'],
  },
  medium: {
    name: 'Medium',
    clues: 30,
    info: ['9 × 9 board · up to 51 empty cells', 'Best for: Practicing combinations and improving solving speed.'],
  },
  hard: {
    name: 'Hard',
    clues: 20,
    info: ['9 × 9 board · up to 61 empty cells', 'Best for: Experienced solvers who enjoy advanced deductions.'],
  },
}

/**
 * Checks whether a clue count is an integer inside the accepted 17 to 80 range.
 * @param value - The requested clue count, if any.
 * @returns `true` when the value can be used as a clue target.
 */
export function isValidClueCount(value: number | undefined): value is number {
  return Number.isInteger(value) && (value as number) >= MIN_CLUES && (value as number) <= MAX_CLUES
}

/**
 * Returns the clue target for a difficulty. Presets ignore `requested`; custom uses it.
 * @param difficulty - The chosen difficulty.
 * @param requested - The custom clue count, when the difficulty is `custom`.
 * @returns The clue target, or `undefined` when a custom game has no count.
 */
export function targetClues(difficulty: SudokuDifficulty, requested?: number): number | undefined {
  return difficulty === 'custom' ? requested : PRESETS[difficulty].clues
}

/**
 * Reads the `/sudoku/play` query. Returns `null` when the difficulty is unknown or a custom game lacks a valid clue count.
 * @param query - The route query, with `diff` and, for custom, `clues`.
 * @returns The parsed game settings, or `null` when the query is invalid.
 */
export function parseSudokuPlayQuery(query: LocationQuery): { difficulty: SudokuDifficulty; clues?: number } | null {
  const diff = query.diff
  if (typeof diff !== 'string') return null
  if (diff === 'custom') {
    const raw = query.clues
    const clues = typeof raw === 'string' ? Number(raw) : undefined
    return isValidClueCount(clues) ? { difficulty: 'custom', clues } : null
  }
  return PRESET_DIFFICULTIES.some((preset) => preset === diff) ? { difficulty: diff as PresetDifficulty } : null
}
