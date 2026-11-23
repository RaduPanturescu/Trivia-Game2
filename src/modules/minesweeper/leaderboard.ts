import { defineTimedLeaderboard, formatDuration } from '@/shared/games'
import { formatLeaderboardDate } from '@/shared/dates'
import { STORAGE_KEYS } from '@/shared/persistence'
import { difficultyLabel } from './sizes'
import type { MinesweeperLeaderboardEntry } from './types'

/**
 * Returns the shared Minesweeper leaderboard, backed by the legacy `minesweeperLeaderboard` and
 * `minesweeperPersonalBests` keys.
 */
export const useMinesweeperLeaderboard = defineTimedLeaderboard<MinesweeperLeaderboardEntry>({
  leaderboardKey: STORAGE_KEYS.minesweeperLeaderboard,
  bestsKey: STORAGE_KEYS.minesweeperPersonalBests,
})

/**
 * Personal-record line above the leaderboard, e.g. `PR: 1:23 (easy)`.
 * @param entries - Leaderboard entries, fastest first.
 * @returns The PR text, or `PR: -` when there are no entries.
 */
export function prLine(entries: MinesweeperLeaderboardEntry[]): string {
  const best = entries[0]
  return best ? `PR: ${formatDuration(best.time)} (${best.difficulty})` : 'PR: -'
}

/**
 * Turns leaderboard entries into display rows, fastest first.
 * @param entries - Leaderboard entries.
 * @returns One row per entry with its label, formatted time and date.
 */
export function leaderboardRows(entries: MinesweeperLeaderboardEntry[]): { label: string; time: string; date: string }[] {
  return entries.map((entry) => ({
    label: entry.difficulty === 'custom' ? `Custom (${entry.cols}×${entry.rows})` : difficultyLabel(entry.difficulty),
    time: formatDuration(entry.time),
    date: formatLeaderboardDate(entry.date),
  }))
}
