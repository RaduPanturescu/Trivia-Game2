import { computed, reactive, ref } from 'vue'
import { useAchievements } from '@/shared/achievements'
import { useGameTimer } from '@/shared/games'
import { createBoard, countFlags, isWon, remainingMines, revealAllMines, revealCell, toggleFlag, type Board } from './board'
import { useMinesweeperLeaderboard } from './leaderboard'
import type { MinesweeperConfig, MinesweeperStatus } from './types'

/**
 * Creates one Minesweeper round: board, timer, flag mode, win and loss handling, and the leaderboard.
 * The round starts immediately. Its timer stops when the calling component unmounts.
 * Refs are unwrapped through `reactive`, so templates read `game.status` directly.
 * @param config - The round to play (difficulty, size and otter mode).
 * @returns The game state and its actions.
 */
export function useMinesweeper(config: MinesweeperConfig) {
  const leaderboard = useMinesweeperLeaderboard()
  const achievements = useAchievements()
  const timer = useGameTimer()

  const board = ref<Board>([])
  const status = ref<MinesweeperStatus>('playing')
  const flagMode = ref(false)
  const flagsPlaced = computed(() => countFlags(board.value))
  const minesLeft = computed(() => remainingMines(board.value, config.size.mines))

  /** Deals a fresh board with the same settings. Flag mode is switched off, as in the legacy game. */
  function restart(): void {
    timer.reset()
    board.value = createBoard(config.size)
    status.value = 'playing'
    flagMode.value = false
    timer.start()
  }

  /** Ends the round. A win is recorded on the leaderboard and as a personal best (not for custom boards). */
  function finish(won: boolean): void {
    timer.stop()
    status.value = won ? 'won' : 'lost'
    if (!won) return
    const time = timer.seconds.value
    leaderboard.record({
      difficulty: config.difficulty,
      rows: config.size.rows,
      cols: config.size.cols,
      time,
      date: new Date().toISOString(),
    })
    leaderboard.recordBest(config.difficulty, time)
    achievements.unlock('minesweeper')
  }

  /**
   * Opens a square. Hitting a mine loses the round; opening the last safe square wins it.
   * @param row - Row index.
   * @param col - Column index.
   */
  function reveal(row: number, col: number): void {
    if (status.value !== 'playing') return
    const outcome = revealCell(board.value, row, col)
    if (outcome === 'mine') {
      revealAllMines(board.value)
      finish(false)
    } else if (outcome === 'safe' && isWon(board.value)) {
      finish(true)
    }
  }

  /**
   * Flags or unflags a square while the round is running.
   * @param row - Row index.
   * @param col - Column index.
   */
  function flag(row: number, col: number): void {
    if (status.value !== 'playing') return
    toggleFlag(board.value, row, col)
  }

  /**
   * A plain click: flags the square in flag mode, otherwise opens it.
   * @param row - Row index.
   * @param col - Column index.
   */
  function press(row: number, col: number): void {
    if (flagMode.value) flag(row, col)
    else reveal(row, col)
  }

  /** Switches flag mode on or off. */
  function toggleFlagMode(): void {
    flagMode.value = !flagMode.value
  }

  restart()

  return reactive({
    config,
    board,
    status,
    flagMode,
    flagsPlaced,
    minesLeft,
    timer,
    leaderboard,
    reveal,
    flag,
    press,
    toggleFlagMode,
    restart,
  })
}

/** The object returned by {@link useMinesweeper}. */
export type MinesweeperGame = ReturnType<typeof useMinesweeper>
