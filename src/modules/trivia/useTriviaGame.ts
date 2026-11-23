import { computed, ref, type ComputedRef, type Ref } from 'vue'
import { useAchievements } from '@/shared/achievements'
import { shuffle, type QuizQuestion } from '@/shared/quiz'
import { useProgress, type CategoryId, type Difficulty } from '@/shared/progress'
import { seasonTwoTriviaData } from './data/season2'
import { triviaData } from './data/season1'
import { useTriviaSeason } from './season'
import type { SeasonBank, TriviaSeason } from './types'

/** Questions in a difficulty round. Personal rounds use the whole fixed list. */
export const ROUND_LENGTH = 10

/** Correct answers needed to complete a category difficulty. */
export const PASS_SCORE = 7

/**
 * Whether a round score completes the category difficulty.
 * @param score - Correct answers in the round.
 * @returns `true` when the score reaches {@link PASS_SCORE}.
 */
export function isPassing(score: number): boolean {
  return score >= PASS_SCORE
}

/**
 * Builds the questions for one round, as legacy `startGame` did. Personal always uses the fixed season 1 list.
 * Other categories get a fresh shuffle of the chosen season's bank, cut to {@link ROUND_LENGTH}.
 * @param category - Category to play.
 * @param difficulty - Difficulty, or `null` for personal.
 * @param season - Season whose bank is used for difficulty rounds.
 * @returns The questions in play order.
 */
export function buildRound(category: CategoryId, difficulty: Difficulty | null, season: TriviaSeason): QuizQuestion[] {
  if (category === 'personal') return [...triviaData.personal]
  if (difficulty === null) return []
  const bank: SeasonBank = season === '2' ? seasonTwoTriviaData : triviaData
  return shuffle(bank[category][difficulty]).slice(0, ROUND_LENGTH)
}

/** State and actions of one category round. */
export interface TriviaGameApi {
  /** Question on screen, or `null` before the round loads. */
  current: ComputedRef<QuizQuestion | null>
  /** 1-based number of the question on screen. */
  questionNumber: ComputedRef<number>
  /** Questions in the round. */
  total: ComputedRef<number>
  /** Whether the question on screen is the last one. */
  isLast: ComputedRef<boolean>
  /** Correct answers so far. */
  score: Ref<number>
  /** Index of the option the player picked, or `null` before an answer. */
  selected: Ref<number | null>
  /** Whether the round is over and the result screen shows. */
  finished: Ref<boolean>
  /** Whether the final score passes. Meaningful once `finished` is set. */
  passed: ComputedRef<boolean>
  /** Loads the progress and season stores, then deals a fresh round. */
  start(): Promise<void>
  /** Records the player's answer. Ignored after the first pick of a question. */
  choose(option: number): void
  /** Moves to the next question, or ends the round after the last one. */
  next(): void
}

/**
 * Runs one category round: question order, scoring, and the result. On a pass the difficulty is
 * marked completed and the category achievement unlocks, but only the first time (legacy `endGame`).
 * Personal rounds store completion under the legacy `'null'` key.
 * @param category - Category being played.
 * @param difficulty - Difficulty, or `null` for personal.
 * @returns The round state and actions.
 */
export function useTriviaGame(category: CategoryId, difficulty: Difficulty | null): TriviaGameApi {
  const progress = useProgress()
  const season = useTriviaSeason()
  const achievements = useAchievements()

  const questions = ref<QuizQuestion[]>([])
  const index = ref(0)
  const score = ref(0)
  const selected = ref<number | null>(null)
  const finished = ref(false)

  const current = computed(() => questions.value[index.value] ?? null)
  const total = computed(() => questions.value.length)
  const questionNumber = computed(() => index.value + 1)
  const isLast = computed(() => index.value === total.value - 1)
  const passed = computed(() => isPassing(score.value))

  async function start(): Promise<void> {
    await Promise.all([progress.ready, season.ready])
    questions.value = buildRound(category, difficulty, season.state.value)
    index.value = 0
    score.value = 0
    selected.value = null
    finished.value = false
  }

  function choose(option: number): void {
    const question = current.value
    if (!question || selected.value !== null) return
    selected.value = option
    if (option === question.answer) score.value++
  }

  function next(): void {
    if (selected.value === null) return
    if (!isLast.value) {
      index.value++
      selected.value = null
      return
    }
    finish()
  }

  function finish(): void {
    if (passed.value && progress.difficulties.value[category][difficulty ?? 'null'] !== true) {
      progress.markCompleted(category, difficulty)
      achievements.unlock(category)
    }
    finished.value = true
  }

  return { current, questionNumber, total, isLast, score, selected, finished, passed, start, choose, next }
}
