import { computed, onScopeDispose, ref, watch, type ComputedRef } from 'vue'
import { useDevMode } from '@/shared/devMode'
import { defineRepository, stringCodec, STORAGE_KEYS, type Codec } from '@/shared/persistence'
import { shuffle } from '@/shared/quiz'
import { QOTD_QUESTIONS } from './questions'
import { defineSingleton } from '@/shared/singleton'

/** A question as shown on screen. The options are already shuffled and `answer` points at the correct one. */
export interface ShownQuestion {
  /** Category label, shown as `Category: …`. */
  category: string
  /** Question text. */
  text: string
  /** Answer texts in display order. */
  options: string[]
  /** Index into `options` of the correct answer. */
  answer: number
}

/** Outcome of an answer: whether it was right, and the label for the finish button. */
export interface QotdAnswerResult {
  /** Whether the picked option was the correct one. */
  correct: boolean
  /** Text of the finish button, as in legacy (developer and normal variants). */
  finishLabel: string
}

/** `locked` after today's answer (outside developer mode), `available` otherwise. */
export type QotdStatus = 'available' | 'locked'

/** Public surface of the Question of the Day store. */
export interface QotdApi {
  /** Resolves once the stored QotD values and developer mode have loaded. */
  ready: Promise<void>
  /** Whether the welcome button is locked. */
  status: ComputedRef<QotdStatus>
  /** Welcome button timer text: the time until local midnight while locked, `Available Now!` otherwise. */
  countdown: ComputedRef<string>
  /**
   * Registers a visible welcome button. The countdown only ticks while at least one subscriber is registered.
   * @returns Function that removes this subscriber.
   */
  subscribe(): () => void
  /**
   * Picks today's question (or a new one on a new day), shuffles its options and returns it.
   * @param forceNew - Developer only: pick a different random question even if today's is stored.
   * @returns The question to show.
   */
  currentQuestion(forceNew?: boolean): ShownQuestion
  /**
   * Records an answer. Outside developer mode this locks the question for the rest of the day.
   * @param question - The question that was shown.
   * @param picked - Index of the option the player clicked.
   * @returns Whether the answer was correct and the finish button label.
   */
  answer(question: ShownQuestion, picked: number): QotdAnswerResult
  /**
   * Developer only: clears today's completion and shows a new random question. Does nothing outside developer mode.
   * @returns The new question, or `undefined` outside developer mode.
   */
  devReset(): ShownQuestion | undefined
}

/** Label of the welcome button timer when the question is available. */
const AVAILABLE_LABEL = 'Available Now!'

/**
 * Formats the time left until local midnight as the legacy welcome timer does.
 * @param now - The current time.
 * @returns Text such as `Next question in: 9h 0m 0s`.
 */
export function formatCountdown(now: Date): string {
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const diff = tomorrow.getTime() - now.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  return `Next question in: ${hours}h ${minutes}m ${seconds}s`
}

/** Stored `new Date().toDateString()` of the day the question was chosen. */
const useQotdDate = defineRepository({ key: STORAGE_KEYS.qotdDate, codec: stringCodec, defaults: () => '' })

/** Stored `new Date().toDateString()` of the day the question was answered. */
const useQotdCompleted = defineRepository({ key: STORAGE_KEYS.qotdCompletedDate, codec: stringCodec, defaults: () => '' })

/** Codec for the decimal index. `parseInt` (not `numberCodec`) so a bad stored value becomes NaN and is re-picked, as in legacy. */
const indexCodec: Codec<number> = {
  decode: (raw) => Number.parseInt(raw, 10),
  encode: (value) => String(value),
}

/** Stored index into the question list. */
const useQotdIndex = defineRepository({ key: STORAGE_KEYS.qotdRandomIndex, codec: indexCodec, defaults: () => Number.NaN })

/** Builds the QotD store. Called once by {@link useQotd}. */
function createQotd(): QotdApi {
  const dateStore = useQotdDate()
  const completedStore = useQotdCompleted()
  const indexStore = useQotdIndex()
  const devMode = useDevMode()

  // `now` drives the lock check and the countdown. It is refreshed on every change that depends on the day.
  const now = ref(new Date())
  const subscribers = ref(0)
  const locked = computed(() => !devMode.isDev.value && completedStore.state.value === now.value.toDateString())
  const status = computed<QotdStatus>(() => (locked.value ? 'locked' : 'available'))
  const countdown = computed(() => (locked.value ? formatCountdown(now.value) : AVAILABLE_LABEL))

  const ready = Promise.all([dateStore.ready, completedStore.ready, indexStore.ready, devMode.ready]).then(refreshNow)

  let timer: ReturnType<typeof setInterval> | undefined

  /** Sets `now` to the current time. */
  function refreshNow(): void {
    now.value = new Date()
  }

  // The factory runs in a detached scope (see defineSingleton), so this timer outlives the component that first asked for it.
  watch(
    () => locked.value && subscribers.value > 0,
    (active) => {
      clearInterval(timer)
      timer = undefined
      if (active) {
        refreshNow()
        timer = setInterval(refreshNow, 1000)
      }
    },
  )

  function subscribe(): () => void {
    subscribers.value++
    refreshNow()
    let active = true
    return () => {
      if (!active) return
      active = false
      subscribers.value--
    }
  }

  function currentQuestion(forceNew = false): ShownQuestion {
    const force = forceNew && devMode.isDev.value
    const today = new Date().toDateString()
    const total = QOTD_QUESTIONS.length
    let index = indexStore.state.value
    if (force || dateStore.state.value !== today || !Number.isInteger(index) || index < 0 || index >= total) {
      const previous = index
      index = Math.floor(Math.random() * total)
      if (force && total > 1 && index === previous) index = (index + 1) % total
      indexStore.state.value = index
      dateStore.state.value = today
    }
    const question = QOTD_QUESTIONS[index]
    if (!question) throw new Error(`QotD index out of range: ${index}`)
    const shuffled = shuffle(question.options.map((option, original) => ({ option, original })))
    return {
      category: question.category,
      text: question.q,
      options: shuffled.map((entry) => entry.option),
      answer: shuffled.findIndex((entry) => entry.original === question.answer),
    }
  }

  function answer(question: ShownQuestion, picked: number): QotdAnswerResult {
    const correct = picked === question.answer
    const isDev = devMode.isDev.value
    if (!isDev) {
      completedStore.state.value = new Date().toDateString()
      refreshNow()
    }
    const finishLabel = isDev
      ? correct ? 'Correct! Play again anytime' : 'Close! Play again anytime'
      : correct ? 'Correct! Come back tomorrow' : 'Close! Come back tomorrow'
    return { correct, finishLabel }
  }

  function devReset(): ShownQuestion | undefined {
    if (!devMode.isDev.value) return undefined
    // Stored as an empty string rather than removed: both read as "not completed today".
    completedStore.state.value = ''
    refreshNow()
    return currentQuestion(true)
  }

  return { ready, status, countdown, subscribe, currentQuestion, answer, devReset }
}

/**
 * Returns the shared Question of the Day store, creating it on first call.
 * @returns The QotD API (status, countdown, current question, answers and developer reset).
 */
export const useQotd: () => QotdApi = defineSingleton(createQotd)

/**
 * Lock status and countdown for the welcome button. Starts the countdown while the calling component is mounted.
 * @returns The lock status, the timer text and a promise that resolves once stored values have loaded.
 */
export function useQotdStatus(): { status: ComputedRef<QotdStatus>; countdown: ComputedRef<string>; ready: Promise<void> } {
  const qotd = useQotd()
  onScopeDispose(qotd.subscribe())
  return { status: qotd.status, countdown: qotd.countdown, ready: qotd.ready }
}
