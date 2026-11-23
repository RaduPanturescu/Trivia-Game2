import { defineTimedLeaderboard } from '@/shared/games'
import { STORAGE_KEYS } from '@/shared/persistence'
import type { SudokuLeaderboardEntry } from './types'

/**
 * Returns the shared Sudoku leaderboard and personal bests. Stored under `sudokuLeaderboard` and `sudokuPersonalBests`.
 * @returns The shared timed leaderboard.
 */
export const useSudokuLeaderboard = defineTimedLeaderboard<SudokuLeaderboardEntry>({
  leaderboardKey: STORAGE_KEYS.sudokuLeaderboard,
  bestsKey: STORAGE_KEYS.sudokuPersonalBests,
})
