import { computed, ref, shallowRef, type ComputedRef } from 'vue'
import { isoDate } from '@/shared/dates'
import { fetchDailyPool, pictureForDate, resolveDailySequence, useDailyCompletion, useDailySequence } from './daily'
import type { DailyImage, PlayablePuzzle } from './types'

/** Where the daily panel is in its load cycle. */
type DailyStatus = 'loading' | 'unavailable' | 'empty' | 'ready'

/** State and actions of the Puzzle of the Day panel. */
export interface DailyPuzzleApi {
  /** Status line under the panel heading. */
  message: ComputedRef<string>
  /** Label of the play button. */
  buttonLabel: ComputedRef<string>
  /** True when today's picture can be played. */
  canPlay: ComputedRef<boolean>
  /** Today's picture as a playable puzzle, or `null` when it cannot be played. */
  playable: ComputedRef<PlayablePuzzle | null>
  /** Loads the manifest and works out today's picture. Call when the screen opens. */
  load: () => Promise<void>
}

/**
 * Builds the Puzzle of the Day state: loads the picture pool, applies the no-repeat rotation and
 * reports whether today's puzzle is already completed.
 * @returns The panel state and its actions.
 */
export function useDailyPuzzle(): DailyPuzzleApi {
  const status = ref<DailyStatus>('loading')
  const todayImage = shallowRef<DailyImage | null>(null)
  const dateKey = ref<string | null>(null)
  const completed = useDailyCompletion().state
  const done = computed(() => dateKey.value !== null && completed.value === dateKey.value)

  const message = computed(() => {
    if (status.value === 'loading') return "Loading today's picture…"
    if (status.value === 'unavailable') return 'Add image filenames to puzzles-of-the-day/puzzles.json to start the daily rotation.'
    if (status.value === 'empty') return 'Add pictures to the puzzles-of-the-day folder and list them in puzzles.json.'
    const picture = todayImage.value?.title ?? 'Picture unavailable'
    const note = done.value
      ? 'Completed today — come back tomorrow.'
      : 'No repeats until the entire picture pool has been used.'
    return `${picture} · ${note}`
  })

  const buttonLabel = computed(() => {
    if (status.value === 'loading') return "Play Today's Puzzle"
    if (status.value !== 'ready') return 'No Daily Picture Yet'
    return done.value ? 'Completed Today ✓' : 'Play Today’s Puzzle'
  })

  const canPlay = computed(() => status.value === 'ready' && todayImage.value !== null && !done.value)

  const playable = computed<PlayablePuzzle | null>(() =>
    canPlay.value && todayImage.value
      ? { title: todayImage.value.title, src: todayImage.value.src, source: 'daily' }
      : null,
  )

  /** Loads the pool and computes today's picture. Failure to fetch and an empty pool are reported differently. */
  async function load(): Promise<void> {
    status.value = 'loading'
    let pool: DailyImage[]
    try {
      pool = await fetchDailyPool()
    } catch {
      todayImage.value = null
      status.value = 'unavailable'
      return
    }
    if (pool.length === 0) {
      todayImage.value = null
      status.value = 'empty'
      return
    }
    const today = isoDate(new Date())
    const sequence = useDailySequence()
    await sequence.ready
    const rotation = resolveDailySequence(pool, sequence.state.value, today)
    sequence.state.value = rotation
    dateKey.value = today
    todayImage.value = pictureForDate(pool, rotation, today)
    status.value = 'ready'
  }

  return { message, buttonLabel, canPlay, playable, load }
}
