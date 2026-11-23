import { computed, watch, type ComputedRef, type Ref } from 'vue'
import { useAchievements } from './achievements'
import { defineRepository, getStorageAdapter, jsonCodec, numberCodec, STORAGE_KEYS } from './persistence'

/** Trivia categories that can be completed, in legacy order. */
export const CATEGORY_IDS = ['eu', 'hungary', 'romania', 'trains', 'personal'] as const

/** Identifier of a trivia category. */
export type CategoryId = (typeof CATEGORY_IDS)[number]

/** Difficulty levels of a trivia category, in legacy order. */
export const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'] as const

/** One difficulty level of a trivia category. */
export type Difficulty = (typeof DIFFICULTIES)[number]

/** Completion flag for every category and difficulty. The `'null'` key is the legacy flag for the personal category, which has no difficulty. */
export type CompletionMap = Record<CategoryId, Partial<Record<Difficulty | 'null', boolean>>>

/** Public surface of the trivia progress store. */
export interface ProgressApi {
  /** Resolves once stored progress has loaded and the points key is in sync. */
  ready: Promise<void>
  /** Completion flags per category and difficulty. Stored under `triviaDifficulties`. */
  difficulties: Ref<CompletionMap>
  /** Total points: completed difficulties plus one for the millionaire achievement. */
  points: ComputedRef<number>
  /** Marks one category and difficulty as completed. `null` is the personal category, stored under the legacy `'null'` key. */
  markCompleted(category: CategoryId, difficulty: Difficulty | null): void
  /** Clears trivia progress and achievements, and removes the question-of-the-day keys. */
  resetProfile(): Promise<void>
}

/** Stored completion flags. Stored under `triviaDifficulties`. */
const useDifficulties = defineRepository({
  key: STORAGE_KEYS.triviaDifficulties,
  codec: jsonCodec<CompletionMap>(),
  defaults: emptyCompletion,
})

/** Stored total points. Derived from difficulties, kept in storage for compatibility. */
const usePoints = defineRepository({
  key: STORAGE_KEYS.triviaPoints,
  codec: numberCodec,
  defaults: () => 0,
})

/** @returns Every category with all difficulties set to not completed. */
function emptyCompletion(): CompletionMap {
  return {
    eu: emptyCategory(),
    hungary: emptyCategory(),
    romania: emptyCategory(),
    trains: emptyCategory(),
    personal: emptyCategory(),
  }
}

/** @returns One category with every difficulty set to not completed. */
function emptyCategory(): Record<Difficulty, boolean> {
  return { easy: false, medium: false, hard: false, expert: false }
}

/**
 * Counts the completed flags across all categories (legacy recalculatePoints, without the millionaire bonus).
 * @param map - The completion flags to count.
 * @returns The number of `true` flags.
 */
function countCompleted(map: CompletionMap): number {
  let total = 0
  for (const category of Object.values(map)) {
    if (category && typeof category === 'object') total += Object.values(category).filter(Boolean).length
  }
  return total
}

/** Builds the progress store. Called once by {@link useProgress}. */
function createProgress(): ProgressApi {
  const difficulties = useDifficulties()
  const pointsStore = usePoints()
  const achievements = useAchievements()

  const points = computed(() => {
    const millionaire = achievements.list.value.some((achievement) => achievement.id === 'millionaire' && achievement.unlocked)
    return countCompleted(difficulties.state.value) + (millionaire ? 1 : 0)
  })

  const ready = Promise.all([difficulties.ready, pointsStore.ready, achievements.ready]).then(() => {
    pointsStore.state.value = points.value
    achievements.evaluateTriggers({ points: points.value })
    watch(points, (value) => {
      pointsStore.state.value = value
      achievements.evaluateTriggers({ points: value })
    })
  })

  function markCompleted(category: CategoryId, difficulty: Difficulty | null): void {
    difficulties.state.value[category][difficulty ?? 'null'] = true
  }

  async function resetProfile(): Promise<void> {
    difficulties.state.value = emptyCompletion()
    achievements.relockAll()
    pointsStore.state.value = points.value
    const adapter = getStorageAdapter()
    for (const key of [STORAGE_KEYS.qotdCompletedDate, STORAGE_KEYS.qotdRandomIndex, STORAGE_KEYS.qotdDate]) {
      await adapter.removeItem(key)
    }
  }

  return { ready, difficulties: difficulties.state, points, markCompleted, resetProfile }
}

let instance: ProgressApi | undefined

/**
 * Returns the shared trivia progress store, creating it on first call.
 * @returns The progress API (difficulties, points, completion and reset).
 */
export function useProgress(): ProgressApi {
  instance ??= createProgress()
  return instance
}
