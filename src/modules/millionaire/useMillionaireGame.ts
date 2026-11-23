import { computed, onScopeDispose, reactive, ref, type ComputedRef, type Ref } from 'vue'
import { useAchievements } from '@/shared/achievements'
import { useDevMode } from '@/shared/devMode'
import type { QuizQuestion } from '@/shared/quiz'
import { MILLIONAIRE_QUESTIONS } from './data'
import {
  audienceVoteTints,
  formatTime,
  pickFiftyFiftyRemovals,
  QUESTION_SECONDS,
  SUSPENSE_MS,
  TIME_UP_REVEAL_MS,
  type AudienceTint,
} from './logic'
import { useMillionaireAudio } from './useMillionaireAudio'

/** Lifeline identifiers. Each can be used once per run. */
export type LifelineId = 'callFriend' | 'fiftyFifty' | 'audienceVote' | 'askHost'

/**
 * Where the run stands. `question` accepts a pick and lifelines. `suspense` waits for the reveal after a pick.
 * `revealed` shows the result of a pick. `timeUp` and `timeUpRevealed` cover running out of time. `finished` ends the run.
 */
export type MillionairePhase = 'question' | 'suspense' | 'revealed' | 'timeUp' | 'timeUpRevealed' | 'finished'

/** One answer button as the view renders it. */
export interface MillionaireOptionView {
  /** Answer text. */
  text: string
  /** Whether the button is disabled. */
  disabled: boolean
  /** Whether a 50:50 removed this option. Removed options are dimmed. */
  eliminated: boolean
  /** Result state: `pending` while suspense runs, `correct` or `wrong` after a reveal. */
  state: 'pending' | 'correct' | 'wrong' | undefined
  /** Audience-vote tint, if an audience vote ran. */
  tint: AudienceTint | undefined
  /** Developer outline on the correct option. */
  devHint: boolean
}

/** Millionaire run state and actions returned by {@link useMillionaireGame}. */
export interface MillionaireGame {
  /** Total questions in a full run. */
  total: number
  /** 1-based number of the current question. */
  questionNumber: ComputedRef<number>
  /** 0-based index of the current question. */
  questionIndex: Ref<number>
  /** The current question. */
  question: ComputedRef<QuizQuestion>
  /** Answer buttons for the current question. */
  options: ComputedRef<MillionaireOptionView[]>
  /** Current phase. */
  phase: Ref<MillionairePhase>
  /** Correct answers so far. */
  score: Ref<number>
  /** Status line under the options. */
  status: Ref<string>
  /** Remaining time as `mm:ss`. */
  timeLabel: ComputedRef<string>
  /** Whether each lifeline has been used. */
  lifelines: Record<LifelineId, boolean>
  /** Whether a lifeline can be used now. */
  canUseLifeline: ComputedRef<boolean>
  /** Whether the Skip Suspense button applies: developer mode, while a suspense runs. */
  canSkipSuspense: ComputedRef<boolean>
  /** Whether the Next button is visible. */
  nextVisible: ComputedRef<boolean>
  /** Label of the Next button. */
  nextLabel: ComputedRef<string>
  /** Whether the run has ended. */
  finished: ComputedRef<boolean>
  /** Ending message, as in the legacy result screen. */
  resultMessage: ComputedRef<string>
  /** Picks an answer. Ignored unless the question is open. */
  pick(index: number): void
  /** Uses a lifeline once. Ignored when unavailable or already used. */
  useLifeline(id: LifelineId): void
  /** Ends the suspense now, as the developer Skip Suspense button does. */
  skipSuspense(): void
  /** Advances to the next question, or ends the run after a wrong answer, a timeout or the last question. */
  next(): void
}

/** Status line shown at the start of every question. */
const START_STATUS = '3 minutes. Use a lifeline to stop the timer.'
/** Status line after the timer runs out. */
const TIME_UP_STATUS = 'Time is up! The answer will be revealed.'
/** Status line while an answer is pending. */
const SUSPENSE_STATUS = 'Suspense... Revealing answer in 5 seconds'
/** Status line after a correct answer. */
const CORRECT_STATUS = 'Correct! You keep your winnings.'
/** Status line after a wrong answer. */
const WRONG_STATUS = 'Wrong answer. Game over.'
/** Interval between timer ticks in milliseconds. */
const TICK_MS = 1000

/** Layout flag the legacy app put on `#app` while the game is on screen. */
const LAYOUT_CLASS = 'millionaire-active'

/**
 * Sets or clears the layout class on `#app`.
 * @param on - Whether the game layout is active.
 */
function setGameLayout(on: boolean): void {
  document.getElementById('app')?.classList.toggle(LAYOUT_CLASS, on)
}

/**
 * Returns the question at a 0-based index, clamped to the last question so the index can be one past the end.
 * @param index - 0-based question index.
 * @returns The question.
 */
function questionAt(index: number): QuizQuestion {
  const question = MILLIONAIRE_QUESTIONS[Math.min(index, MILLIONAIRE_QUESTIONS.length - 1)]
  if (!question) throw new Error('Millionaire question list is empty')
  return question
}

/**
 * Creates the Millionaire run. Starts the first question immediately. Timers are cleared when the calling
 * component unmounts. Call once per game view, during setup.
 * @returns The run state and actions.
 */
export function useMillionaireGame(): MillionaireGame {
  const audio = useMillionaireAudio()
  const achievements = useAchievements()
  const devMode = useDevMode()
  const total = MILLIONAIRE_QUESTIONS.length

  const questionIndex = ref(0)
  const phase = ref<MillionairePhase>('question')
  const score = ref(0)
  const selected = ref<number | null>(null)
  const eliminated = ref<number[]>([])
  const votes = ref<Partial<Record<number, AudienceTint>>>({})
  const timeLeft = ref(QUESTION_SECONDS)
  const status = ref(START_STATUS)
  const lifelines = reactive<Record<LifelineId, boolean>>({
    callFriend: false,
    fiftyFifty: false,
    audienceVote: false,
    askHost: false,
  })
  const suspenseActive = ref(false)
  let suspenseAction: (() => void) | undefined
  let suspenseHandle: ReturnType<typeof setTimeout> | undefined
  let tickHandle: ReturnType<typeof setInterval> | undefined
  let timeUpHandle: ReturnType<typeof setTimeout> | undefined

  const questionNumber = computed(() => questionIndex.value + 1)
  const question = computed(() => questionAt(questionIndex.value))
  const timeLabel = computed(() => formatTime(timeLeft.value))
  const finished = computed(() => phase.value === 'finished')
  const isLastQuestion = computed(() => questionIndex.value === total - 1)
  const canUseLifeline = computed(() => phase.value === 'question' && !suspenseActive.value)
  const canSkipSuspense = computed(() => devMode.isDev.value && suspenseActive.value)
  const nextVisible = computed(() => phase.value === 'revealed' || phase.value === 'timeUpRevealed')
  const wrongPick = computed(() => selected.value !== null && selected.value !== question.value.answer)
  const nextLabel = computed(() => (wrongPick.value || isLastQuestion.value ? 'Finish Game' : 'Next Question'))
  const resultMessage = computed(() => `You answered ${score.value} out of ${total} questions correctly.`)

  /** Option buttons. Disabled once the question is closed, and for options a 50:50 removed. */
  const options = computed<MillionaireOptionView[]>(() => {
    const { options: texts, answer } = question.value
    const closed = phase.value !== 'question' && phase.value !== 'suspense'
    return texts.map((text, index) => {
      const removed = eliminated.value.includes(index)
      const isPick = selected.value === index
      const revealed = phase.value === 'revealed' || phase.value === 'timeUpRevealed'
      let state: MillionaireOptionView['state']
      if (phase.value === 'suspense' && isPick) state = 'pending'
      else if (revealed && index === answer) state = 'correct'
      else if (revealed && isPick) state = 'wrong'
      return {
        text,
        disabled: closed || removed,
        eliminated: removed,
        state,
        tint: votes.value[index],
        devHint: devMode.isDev.value && index === answer,
      }
    })
  })

  /** Stops the per-second timer. */
  function stopTimer(): void {
    clearInterval(tickHandle)
    tickHandle = undefined
  }

  /** Cancels a pending suspense and forgets its action. */
  function clearSuspense(): void {
    clearTimeout(suspenseHandle)
    suspenseHandle = undefined
    suspenseAction = undefined
    suspenseActive.value = false
  }

  /** Cancels the delayed reveal after time runs out. */
  function clearTimeUp(): void {
    clearTimeout(timeUpHandle)
    timeUpHandle = undefined
  }

  /** Stops every timer the run owns. */
  function clearAllTimers(): void {
    stopTimer()
    clearSuspense()
    clearTimeUp()
  }

  /** One timer step: counts down, or ends the question when time has run out. */
  function tick(): void {
    if (timeLeft.value > 0) {
      timeLeft.value -= 1
      return
    }
    stopTimer()
    status.value = TIME_UP_STATUS
    phase.value = 'timeUp'
    timeUpHandle = setTimeout(() => {
      timeUpHandle = undefined
      phase.value = 'timeUpRevealed'
    }, TIME_UP_REVEAL_MS)
  }

  /** Starts a fresh 3:00 countdown for the current question. */
  function startTimer(): void {
    stopTimer()
    timeLeft.value = QUESTION_SECONDS
    tick()
    tickHandle = setInterval(tick, TICK_MS)
  }

  /**
   * Runs an action after the suspense delay. The skip button runs it early.
   * @param action - What happens when the suspense ends.
   */
  function scheduleSuspense(action: () => void): void {
    clearSuspense()
    suspenseAction = action
    suspenseActive.value = true
    suspenseHandle = setTimeout(runSuspense, SUSPENSE_MS)
  }

  /** Runs the pending suspense action now and clears the suspense. */
  function runSuspense(): void {
    clearTimeout(suspenseHandle)
    suspenseHandle = undefined
    const action = suspenseAction
    suspenseAction = undefined
    suspenseActive.value = false
    action?.()
  }

  /**
   * Reveals the picked answer after the suspense.
   * @param index - The picked option.
   */
  function reveal(index: number): void {
    audio.stopAnswerPending()
    if (index === question.value.answer) {
      audio.playAnswerCorrect()
      score.value += 1
      status.value = CORRECT_STATUS
    } else {
      audio.playAnswerWrong()
      status.value = WRONG_STATUS
    }
    phase.value = 'revealed'
  }

  /** Clears the state for the current question and starts its timer. */
  function loadQuestion(): void {
    selected.value = null
    eliminated.value = []
    votes.value = {}
    phase.value = 'question'
    status.value = START_STATUS
    clearSuspense()
    clearTimeUp()
    audio.playBackgroundFor(questionIndex.value)
    startTimer()
  }

  /** Ends the run: stops timers and sounds, leaves the game layout and unlocks the achievement after a full run. */
  function finish(): void {
    if (phase.value === 'finished') return
    clearAllTimers()
    phase.value = 'finished'
    audio.stopAll()
    setGameLayout(false)
    if (questionIndex.value === total) achievements.unlock('millionaire')
  }

  function pick(index: number): void {
    if (phase.value !== 'question') return
    stopTimer()
    selected.value = index
    phase.value = 'suspense'
    status.value = SUSPENSE_STATUS
    audio.pauseBackground()
    audio.playAnswerPending()
    scheduleSuspense(() => reveal(index))
  }

  function useLifeline(id: LifelineId): void {
    if (!canUseLifeline.value || lifelines[id]) return
    lifelines[id] = true
    stopTimer()
    const { answer, options: texts } = question.value
    if (id === 'fiftyFifty') {
      eliminated.value = pickFiftyFiftyRemovals(texts.length, answer, eliminated.value)
      status.value = '50:50 used. Two wrong answers removed.'
    } else if (id === 'callFriend') {
      status.value = 'Call a Friend used. The timer stopped for this question.'
    } else if (id === 'audienceVote') {
      status.value = 'Suspense... Waiting for audience votes (5 seconds)'
      scheduleSuspense(() => {
        votes.value = audienceVoteTints(texts.length, answer, eliminated.value)
        status.value = 'The audience has voted!'
      })
    } else {
      status.value = 'Ask the Host used. The timer is stopped.'
    }
  }

  function skipSuspense(): void {
    if (suspenseActive.value) runSuspense()
  }

  function next(): void {
    if (!nextVisible.value) return
    if (phase.value === 'timeUpRevealed' || wrongPick.value) {
      finish()
      return
    }
    questionIndex.value += 1
    if (questionIndex.value < total) loadQuestion()
    else finish()
  }

  audio.stopNameLoop()
  setGameLayout(true)
  loadQuestion()
  onScopeDispose(() => {
    clearAllTimers()
    setGameLayout(false)
  })

  return {
    total,
    questionNumber,
    questionIndex,
    question,
    options,
    phase,
    score,
    status,
    timeLabel,
    lifelines,
    canUseLifeline,
    canSkipSuspense,
    nextVisible,
    nextLabel,
    finished,
    resultMessage,
    pick,
    useLifeline,
    skipSuspense,
    next,
  }
}
