import { reactive } from 'vue'
import type { LocationQuery } from 'vue-router'
import { formatDuration } from '@/shared/games'
import type { MinesweeperConfig, MinesweeperSize, PresetDifficulty } from './types'

/** Preset board sizes and card copy. Sizes from legacy/minesweeper.js, copy from the legacy size screen markup. */
export const PRESET_SIZES: Record<PresetDifficulty, MinesweeperSize & { label: string; bestFor: string }> = {
  easy: {
    rows: 9,
    cols: 9,
    mines: 10,
    label: 'Beginner',
    bestFor: 'Learning basic number patterns and single-square deductions.',
  },
  medium: {
    rows: 16,
    cols: 16,
    mines: 40,
    label: 'Intermediate',
    bestFor: 'Standard training, developing chording skills, and building speed.',
  },
  hard: {
    rows: 16,
    cols: 30,
    mines: 99,
    label: 'Expert',
    bestFor: 'Competitive play and complex multi-number boundary deductions (with occasional 50/50 guesses in standard mode).',
  },
}

/** Preset keys in carousel order. */
export const PRESET_DIFFICULTIES: PresetDifficulty[] = ['easy', 'medium', 'hard']

/** Smallest and largest allowed custom side length. */
const MIN_SIDE = 5
const MAX_SIDE = 30

/** Upper bound of the custom mines input before the dimensions are valid, as in the legacy markup. */
const DEFAULT_MINES_MAX = 80

/** Props of one preset difficulty card, as taken by `DifficultyCard`. */
export interface PresetCardProps {
  /** Card title, e.g. `Beginner`. */
  name: string
  /** Label/value lines, e.g. `Grid: 9 × 9`. */
  details: { label: string; value: string }[]
  /** Personal best already formatted, or `N/A`. */
  bestTime: string
  /** Lines shown in the info popover. */
  info: string[]
}

/** Size-screen choices kept for the session. The legacy form kept them until the page reloaded. */
export const sizeScreenChoices = reactive({
  otterMode: false,
  rows: '9',
  cols: '9',
  mines: '10',
})

/**
 * Tells whether a string is a preset difficulty key.
 * @param value - Any string, e.g. from the route query.
 * @returns True for `easy`, `medium` or `hard`.
 */
export function isPresetDifficulty(value: string): value is PresetDifficulty {
  return Object.hasOwn(PRESET_SIZES, value)
}

/**
 * Returns the board size of a preset.
 * @param difficulty - A preset difficulty key.
 * @returns The rows, columns and mines of that preset.
 */
export function presetSize(difficulty: PresetDifficulty): MinesweeperSize {
  const { rows, cols, mines } = PRESET_SIZES[difficulty]
  return { rows, cols, mines }
}

/**
 * Checks that a value is a whole side length within the custom limits.
 * @param value - The typed side length.
 * @returns True when the value is an integer from 5 to 30.
 */
function isValidSide(value: number): boolean {
  return Number.isInteger(value) && value >= MIN_SIDE && value <= MAX_SIDE
}

/**
 * Checks the custom rows and columns and returns the board when the whole setup is valid.
 * @param rows - Typed row count.
 * @param cols - Typed column count.
 * @param mines - Typed mine count.
 * @returns The size when rows, columns and mines are valid (at least one safe cell), otherwise `null`.
 */
export function customSize(rows: number, cols: number, mines: number): MinesweeperSize | null {
  if (!isValidSide(rows) || !isValidSide(cols)) return null
  const cells = rows * cols
  return Number.isInteger(mines) && mines >= 1 && mines < cells ? { rows, cols, mines } : null
}

/**
 * Message under the custom inputs, as the legacy validation wrote it.
 * @param rows - Typed row count.
 * @param cols - Typed column count.
 * @param mines - Typed mine count.
 * @param otterMode - Whether the hazard is otters.
 * @returns The message to show. Never empty.
 */
export function customValidation(rows: number, cols: number, mines: number, otterMode: boolean): string {
  const noun = otterMode ? 'otters' : 'mines'
  if (!isValidSide(rows) || !isValidSide(cols)) {
    return `Rows and columns must each be whole numbers from ${MIN_SIDE} to ${MAX_SIDE}.`
  }
  const cells = rows * cols
  if (!customSize(rows, cols, mines)) {
    return `${noun} must be between 1 and ${cells - 1}; leave at least one safe cell.`
  }
  return `${cells} cells · ${mines} ${noun} · at least one safe cell.`
}

/**
 * Upper bound for the custom mines input.
 * @param rows - Typed row count.
 * @param cols - Typed column count.
 * @returns One less than the number of cells when the dimensions are valid, otherwise 80.
 */
export function customMinesMax(rows: number, cols: number): number {
  return isValidSide(rows) && isValidSide(cols) ? rows * cols - 1 : DEFAULT_MINES_MAX
}

/**
 * Hazard noun shown in titles and labels: `Mines` or `Otters`.
 * @param otterMode - Whether the hazard is otters.
 * @returns The capitalised noun.
 */
export function hazardWord(otterMode: boolean): string {
  return otterMode ? 'Otters' : 'Mines'
}

/**
 * Emoji drawn for a hazard on the board and in the mine counter.
 * @param otterMode - Whether the hazard is otters.
 * @returns `🦦` or `💣`.
 */
export function hazardEmoji(otterMode: boolean): string {
  return otterMode ? '🦦' : '💣'
}

/**
 * Game title for the mode: `Ottersweeper` or `Minesweeper`.
 * @param otterMode - Whether the hazard is otters.
 * @returns The mode name.
 */
export function modeTitle(otterMode: boolean): string {
  return otterMode ? 'Ottersweeper' : 'Minesweeper'
}

/**
 * First info line of a card: cell count and hazard density.
 * @param size - The board size.
 * @param otterMode - Whether the hazard is otters.
 * @returns For example `81 cells · 12.3% mine density`.
 */
export function densityLine(size: MinesweeperSize, otterMode: boolean): string {
  const cells = size.rows * size.cols
  const percent = ((size.mines / cells) * 100).toFixed(1)
  return `${cells} cells · ${percent}% ${otterMode ? 'otter' : 'mine'} density`
}

/**
 * Props for a preset card on the size carousel.
 * @param difficulty - A preset difficulty key.
 * @param otterMode - Whether the hazard is otters.
 * @param bestTime - Personal best in seconds, or `null` when none.
 * @returns The props for `DifficultyCard`.
 */
export function presetCard(difficulty: PresetDifficulty, otterMode: boolean, bestTime: number | null): PresetCardProps {
  const preset = PRESET_SIZES[difficulty]
  return {
    name: preset.label,
    details: [
      { label: 'Grid', value: `${preset.cols} × ${preset.rows}` },
      { label: hazardWord(otterMode), value: String(preset.mines) },
    ],
    bestTime: bestTime === null ? 'N/A' : formatDuration(bestTime),
    info: [densityLine(presetSize(difficulty), otterMode), `Best for: ${preset.bestFor}`],
  }
}

/**
 * Builds the play-route query for a round.
 * @param config - The round to start.
 * @returns Query values: `diff`, the custom `rows`, `cols` and `mines`, and `otter=1` in otter mode.
 */
export function buildPlayQuery(config: MinesweeperConfig): Record<string, string> {
  const base: Record<string, string> =
    config.difficulty === 'custom'
      ? {
          diff: 'custom',
          rows: String(config.size.rows),
          cols: String(config.size.cols),
          mines: String(config.size.mines),
        }
      : { diff: config.difficulty }
  return config.otterMode ? { ...base, otter: '1' } : base
}

/**
 * Reads the first value of a query key.
 * @param query - The route query.
 * @param key - The parameter name.
 * @returns The string value, or `null` when absent.
 */
function queryParam(query: LocationQuery, key: string): string | null {
  const value = query[key]
  return (Array.isArray(value) ? value[0] : value) ?? null
}

/**
 * Parses the play-route query. Invalid or missing values return `null` so the game screen can redirect.
 * @param query - The route query of `/minesweeper/play`.
 * @returns The round to start, or `null` when the query does not describe a valid board.
 */
export function parsePlayQuery(query: LocationQuery): MinesweeperConfig | null {
  const diff = queryParam(query, 'diff')
  const otterMode = queryParam(query, 'otter') === '1'
  if (diff === 'custom') {
    const size = customSize(
      Number(queryParam(query, 'rows') ?? ''),
      Number(queryParam(query, 'cols') ?? ''),
      Number(queryParam(query, 'mines') ?? ''),
    )
    return size ? { difficulty: 'custom', size, otterMode } : null
  }
  if (diff !== null && isPresetDifficulty(diff)) {
    return { difficulty: diff, size: presetSize(diff), otterMode }
  }
  return null
}

/**
 * Label for a difficulty key in the leaderboard: the preset label, or the key itself.
 * @param difficulty - Difficulty key stored with a leaderboard entry.
 * @returns For example `Beginner`, or the raw key for unknown values.
 */
export function difficultyLabel(difficulty: string): string {
  return isPresetDifficulty(difficulty) ? PRESET_SIZES[difficulty].label : difficulty
}
