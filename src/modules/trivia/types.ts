import type { CategoryId, Difficulty } from '@/shared/progress'
import type { QuizQuestion } from '@/shared/quiz'

/** Questions of one category, grouped by difficulty. */
export type DifficultyBank = Record<Difficulty, QuizQuestion[]>

/** Difficulty-graded questions for every category except personal. */
export type SeasonBank = Record<Exclude<CategoryId, 'personal'>, DifficultyBank>

/** Season 1 bank. Adds the personal category: one fixed list, with no difficulty. */
export type SeasonOneBank = SeasonBank & { personal: QuizQuestion[] }

/** Selected trivia season. Stored under `triviaSeason` as `'1'` or `'2'`. */
export type TriviaSeason = '1' | '2'
