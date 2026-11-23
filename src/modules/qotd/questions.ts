import type { QuizQuestion } from '@/shared/quiz'
import { season1 } from './data/season1'
import { season2 } from './data/season2'

/**
 * Question of the day list in legacy order: season one followed by season two.
 * The stored `qotdRandomIndex` indexes this list, so its order must never change.
 */
export const QOTD_QUESTIONS: readonly ({ category: string } & QuizQuestion)[] = [...season1, ...season2]
