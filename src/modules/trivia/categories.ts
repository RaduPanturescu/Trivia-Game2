import { CATEGORY_IDS, type CategoryId, DIFFICULTIES, type Difficulty } from '@/shared/progress'

/** Menu label and icon of each category, as in the legacy menu. */
export const CATEGORY_META: Record<CategoryId, { label: string; icon: string }> = {
  eu: { label: 'Europe', icon: '🌍' },
  hungary: { label: 'Hungary', icon: '🇭🇺' },
  romania: { label: 'Romania', icon: '🇷🇴' },
  trains: { label: 'Trains', icon: '🚂' },
  personal: { label: 'Personal Questions', icon: '👤' },
}

/** Button label of each difficulty, as in the legacy difficulty picker. */
export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  expert: 'ADHD HYPERFIXATION',
}

/** A playable round: a category, and a difficulty unless the category is personal. */
export interface Round {
  /** Category being played. */
  category: CategoryId
  /** Difficulty, or `null` for personal questions. */
  difficulty: Difficulty | null
}

/**
 * Whether a value is a known category id.
 * @param value - Route param or any other unknown value.
 * @returns `true` when `value` is one of the category ids.
 */
export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === 'string' && (CATEGORY_IDS as readonly string[]).includes(value)
}

/**
 * Whether a value is a known difficulty.
 * @param value - Query value or any other unknown value.
 * @returns `true` when `value` is one of the difficulties.
 */
export function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === 'string' && (DIFFICULTIES as readonly string[]).includes(value)
}

/**
 * Reads the params and query of a play route. Personal takes no `diff`; every other category needs a known one.
 * @param category - The `:category` route param.
 * @param diff - The `diff` query value.
 * @returns The round, or `null` when the values do not name a playable round.
 */
export function parseRound(category: unknown, diff: unknown): Round | null {
  if (!isCategoryId(category)) return null
  if (category === 'personal') return diff === undefined ? { category, difficulty: null } : null
  if (!isDifficulty(diff)) return null
  return { category, difficulty: diff }
}
