import { computed, reactive, ref, type ComputedRef, type Ref } from 'vue'
import { useAchievements } from '@/shared/achievements'
import { useGameTimer, type GameTimer } from '@/shared/games'
import { useDevMode } from '@/shared/devMode'
import { defineRepository, STORAGE_KEYS } from '@/shared/persistence'
import { generateSudokuPuzzle, generateSudokuSolution } from './generator'
import { valueAt, writeAt } from './grid'
import { isValidClueCount, PRESETS, targetClues } from './difficulties'
import { useSudokuLeaderboard } from './leaderboard'
import { getSudokuConflicts } from './rules'
import type { CellPosition, Grid, Rng, SudokuCell, SudokuDifficulty, SudokuStatus, SudokuTheme } from './types'

/** Board edge length. */
const SIZE = 9
/** Cell count of the board. */
const CELL_COUNT = 81
/** Strikes that end the game when developer mode is off. */
const MAX_MISTAKES = 3
/** How long a wrong cell shows its error state, in ms. */
const ERROR_MS = 500
/** How long a clashing cell stays highlighted, in ms. */
const CONFLICT_MS = 1000
/** How long a completed row, column or box flashes, in ms. */
const FLASH_MS = 1000
/** How long a developer-revealed cell stays marked, in ms. */
const DEV_MS = 1500

/** Stored colour theme. Stored under `sudokuTheme` as `light` or `dark`; any other value loads as `dark`. */
const useSudokuThemeStore = defineRepository<SudokuTheme>({
  key: STORAGE_KEYS.sudokuTheme,
  codec: {
    decode: (raw) => (raw === 'light' ? 'light' : 'dark'),
    encode: (value) => value,
  },
  defaults: () => 'dark',
})

/**
 * Returns the stored Sudoku colour theme and a toggle for it.
 * @returns The theme ref (`light` or `dark`) and a function that flips it.
 */
export function useSudokuTheme(): { theme: Ref<SudokuTheme>; toggleTheme: () => void } {
  const theme = useSudokuThemeStore().state
  return {
    theme,
    toggleTheme: () => {
      theme.value = theme.value === 'light' ? 'dark' : 'light'
    },
  }
}

/** Options for {@link useSudoku}. */
export interface SudokuOptions {
  /** Random source for puzzle generation. Defaults to `Math.random`. Tests pass a seeded one. */
  rng?: Rng
}

/** One game of Sudoku and everything the screens need to render and drive it. */
export interface SudokuGame {
  /** Solved grid of the current puzzle. Exposed for tests and dev tools; the UI never reads it. */
  solution: Ref<Grid>
  /** View model of all 81 cells, row-major. */
  cells: ComputedRef<SudokuCell[]>
  /** Lifecycle of the current game. */
  status: Ref<SudokuStatus>
  /** Whether input is blocked (no game running, or the game is over). */
  locked: ComputedRef<boolean>
  /** Wrong entries so far in this game. */
  mistakes: Ref<number>
  /** Difficulty of the current game. */
  difficulty: Ref<SudokuDifficulty>
  /** Clues the current puzzle actually has. May exceed the target when uniqueness needs more. */
  clueCount: Ref<number>
  /** Heading shown above the board. */
  title: ComputedRef<string>
  /** Elapsed whole seconds of the current game. */
  seconds: Ref<number>
  /**
   * Generates a new puzzle and starts the timer.
   * @param difficulty - Preset or `custom`.
   * @param requested - Clue count for a custom game.
   * @returns `false` when the clue count is invalid, `true` once the game has started.
   */
  start: (difficulty: SudokuDifficulty, requested?: number) => boolean
  /** Starts a new puzzle with the same difficulty. Custom games reuse the clue count the last puzzle ended with, as in legacy. */
  newGame: () => void
  /**
   * Selects a cell and highlights its row, column and box.
   * @param row - Row index.
   * @param col - Column index.
   */
  focusCell: (row: number, col: number) => void
  /**
   * Handles new text in a cell. Empty text clears it; a digit is checked against the rules and the solution.
   * @param row - Row index.
   * @param col - Column index.
   * @param text - The input's new text.
   */
  enterValue: (row: number, col: number, text: string) => void
  /**
   * Clears a cell without counting a mistake (Backspace or Delete).
   * @param row - Row index.
   * @param col - Column index.
   */
  clearCell: (row: number, col: number) => void
  /**
   * Fills an empty cell with its answer. Works only in developer mode (Shift+click).
   * @param row - Row index.
   * @param col - Column index.
   */
  revealCell: (row: number, col: number) => void
}

/**
 * Creates one Sudoku game: puzzle generation, input, conflict and completion feedback, mistakes, win handling and the timer.
 * Call it once per screen. Leaderboard and achievements are shared app-wide.
 * @param options - Optional random source for tests.
 * @returns The game state and actions.
 */
export function useSudoku(options: SudokuOptions = {}): SudokuGame {
  const rng: Rng = options.rng ?? Math.random
  const achievements = useAchievements()
  const leaderboard = useSudokuLeaderboard()
  const { isDev } = useDevMode()
  const timer: GameTimer = useGameTimer()

  const solution = ref<Grid>([])
  const board = ref<Grid>([])
  const original = ref<Grid>([])
  const selected = ref<CellPosition | null>(null)
  const status = ref<SudokuStatus>('idle')
  const mistakes = ref(0)
  const difficulty = ref<SudokuDifficulty>('medium')
  const clueCount = ref(0)

  const errorCells = reactive(new Set<number>())
  const conflictCells = reactive(new Set<number>())
  const flashCells = reactive(new Set<number>())
  const devCells = reactive(new Set<number>())
  const completedRows = new Set<number>()
  const completedCols = new Set<number>()
  const completedBoxes = new Set<number>()

  const locked = computed(() => status.value !== 'playing')

  const title = computed(() => {
    const current = difficulty.value
    if (current === 'custom') return `Sudoku · ${clueCount.value} clues`
    return clueCount.value === PRESETS[current].clues ? 'Sudoku' : `Sudoku · ${clueCount.value} clues (unique)`
  })

  const cells = computed<SudokuCell[]>(() => {
    const sel = selected.value
    return Array.from({ length: CELL_COUNT }, (_, index) => {
      const row = Math.floor(index / SIZE)
      const col = index % SIZE
      return {
        index,
        row,
        col,
        value: board.value[row]?.[col] ?? 0,
        given: (original.value[row]?.[col] ?? 0) !== 0,
        selected: sel !== null && sel.row === row && sel.col === col,
        related: sel !== null && isRelated(sel, row, col),
        error: errorCells.has(index),
        conflict: conflictCells.has(index),
        flash: flashCells.has(index),
        devFilled: devCells.has(index),
        boxBottom: row % 3 === 2 && row !== 8,
        boxRight: col % 3 === 2 && col !== 8,
      }
    })
  })

  /** Generates a puzzle and starts the timer. Returns `false` for an invalid clue count. */
  function start(next: SudokuDifficulty, requested?: number): boolean {
    const target = targetClues(next, requested)
    if (!isValidClueCount(target)) return false

    const answer = generateSudokuSolution(rng)
    const puzzle = generateSudokuPuzzle(answer, target, rng)

    timer.reset()
    errorCells.clear()
    conflictCells.clear()
    flashCells.clear()
    devCells.clear()
    completedRows.clear()
    completedCols.clear()
    completedBoxes.clear()

    solution.value = answer
    original.value = puzzle.map((row) => [...row])
    board.value = puzzle.map((row) => [...row])
    clueCount.value = puzzle.flat().filter((value) => value !== 0).length
    difficulty.value = next
    selected.value = null
    mistakes.value = 0
    status.value = 'playing'
    timer.start()
    return true
  }

  /** Restarts with the same difficulty. Custom games keep the clue count the previous puzzle ended with. */
  function newGame(): void {
    const current = difficulty.value
    start(current, current === 'custom' ? clueCount.value : undefined)
  }

  /** Selects a cell. */
  function focusCell(row: number, col: number): void {
    selected.value = { row, col }
  }

  /** Applies new text typed into a cell, then re-checks completion and the win. */
  function enterValue(row: number, col: number, text: string): void {
    if (status.value !== 'playing') return
    if (text === '') {
      setCell(row, col, 0)
    } else if (/^[1-9]$/.test(text)) {
      placeDigit(row, col, Number(text))
    }
    checkCompletion(row, col)
    checkWin()
  }

  /** Clears a cell. Backspace and Delete never count as mistakes. */
  function clearCell(row: number, col: number): void {
    if (status.value !== 'playing') return
    setCell(row, col, 0)
  }

  /** Developer reveal: fills an empty cell with its answer when developer mode is on. */
  function revealCell(row: number, col: number): void {
    if (status.value !== 'playing' || !isDev.value) return
    if (valueAt(original.value, row, col) === 0) {
      setCell(row, col, valueAt(solution.value, row, col))
      pulse(devCells, [toIndex(row, col)], DEV_MS)
    }
    checkCompletion(row, col)
    checkWin()
  }

  /** Checks a digit against the clashes and the solution. Wrong digits are cleared and count as mistakes. */
  function placeDigit(row: number, col: number, digit: number): void {
    const index = toIndex(row, col)
    const conflicts = getSudokuConflicts(board.value, row, col, digit)
    if (conflicts.length > 0) {
      recordMistake(index)
      pulse(conflictCells, [index, ...conflicts.map((cell) => toIndex(cell.row, cell.col))], CONFLICT_MS)
      setCell(row, col, 0)
      checkLoss()
    } else if (digit === valueAt(solution.value, row, col)) {
      errorCells.delete(index)
      setCell(row, col, digit)
    } else {
      recordMistake(index)
      setCell(row, col, 0)
      checkLoss()
    }
  }

  /** Counts a strike and shows the cell's error state briefly. */
  function recordMistake(index: number): void {
    mistakes.value += 1
    pulse(errorCells, [index], ERROR_MS)
  }

  /** Ends the game on the third strike unless developer mode is on. */
  function checkLoss(): void {
    if (mistakes.value >= MAX_MISTAKES && !isDev.value) finish('lost')
  }

  /** Stops the timer and sets the outcome. */
  function finish(outcome: 'won' | 'lost'): void {
    timer.stop()
    status.value = outcome
  }

  /** Flashes any row, column or box that the cell just completed. Each group flashes once per game. */
  function checkCompletion(row: number, col: number): void {
    if (status.value !== 'playing') return
    completeGroup(completedRows, row, rowMembers(row))
    completeGroup(completedCols, col, colMembers(col))
    completeGroup(completedBoxes, Math.floor(row / 3) * 3 + Math.floor(col / 3), boxMembers(row, col))
  }

  /** Flashes `members` when all of them are solved and the group has not flashed yet. */
  function completeGroup(done: Set<number>, id: number, members: CellPosition[]): void {
    if (done.has(id) || !members.every((cell) => isSolved(cell.row, cell.col))) return
    done.add(id)
    pulse(flashCells, members.map((cell) => toIndex(cell.row, cell.col)), FLASH_MS)
  }

  /** Ends the game as a win when every cell matches the solution: records the time, best and achievement. */
  function checkWin(): void {
    if (status.value !== 'playing' || !matchesSolution()) return
    finish('won')
    const time = timer.seconds.value
    leaderboard.record({ difficulty: difficulty.value, clues: clueCount.value, time, date: new Date().toISOString() })
    leaderboard.recordBest(difficulty.value, time)
    achievements.unlock('sudoCute')
  }

  /** Writes a cell value. */
  function setCell(row: number, col: number, value: number): void {
    writeAt(board.value, row, col, value)
  }

  /** Whether a cell holds its correct, non-empty value. */
  function isSolved(row: number, col: number): boolean {
    const value = valueAt(board.value, row, col)
    return value !== 0 && value === valueAt(solution.value, row, col)
  }

  /** Whether every cell matches the solution. */
  function matchesSolution(): boolean {
    return board.value.every((line, row) => line.every((value, col) => value === valueAt(solution.value, row, col)))
  }

  return {
    solution,
    cells,
    status,
    locked,
    mistakes,
    difficulty,
    clueCount,
    title,
    seconds: timer.seconds,
    start,
    newGame,
    focusCell,
    enterValue,
    clearCell,
    revealCell,
  }
}

/**
 * Converts a board position to its row-major index.
 * @param row - Row index.
 * @param col - Column index.
 * @returns `row * 9 + col`.
 */
function toIndex(row: number, col: number): number {
  return row * SIZE + col
}

/**
 * Whether a cell shares a row, column or 3 x 3 box with the selected cell. The selected cell counts too.
 * @param sel - The selected cell.
 * @param row - Row of the cell being tested.
 * @param col - Column of the cell being tested.
 * @returns `true` when the cell is related.
 */
function isRelated(sel: CellPosition, row: number, col: number): boolean {
  if (row === sel.row || col === sel.col) return true
  return Math.floor(row / 3) === Math.floor(sel.row / 3) && Math.floor(col / 3) === Math.floor(sel.col / 3)
}

/**
 * Lists the nine cells of a row.
 * @param row - Row index.
 * @returns The cells in that row.
 */
function rowMembers(row: number): CellPosition[] {
  return Array.from({ length: SIZE }, (_, col) => ({ row, col }))
}

/**
 * Lists the nine cells of a column.
 * @param col - Column index.
 * @returns The cells in that column.
 */
function colMembers(col: number): CellPosition[] {
  return Array.from({ length: SIZE }, (_, row) => ({ row, col }))
}

/**
 * Lists the nine cells of the 3 x 3 box containing a cell.
 * @param row - Row index of any cell in the box.
 * @param col - Column index of any cell in the box.
 * @returns The cells in that box.
 */
function boxMembers(row: number, col: number): CellPosition[] {
  const top = Math.floor(row / 3) * 3
  const left = Math.floor(col / 3) * 3
  return Array.from({ length: 9 }, (_, i) => ({ row: top + Math.floor(i / 3), col: left + (i % 3) }))
}

/**
 * Adds indices to a set and removes them again after `ms`, the way the legacy class toggles worked.
 * @param target - The set driving the highlight.
 * @param indices - Cell indices to highlight.
 * @param ms - Highlight duration in milliseconds.
 */
function pulse(target: Set<number>, indices: number[], ms: number): void {
  for (const index of indices) {
    target.add(index)
    setTimeout(() => target.delete(index), ms)
  }
}
