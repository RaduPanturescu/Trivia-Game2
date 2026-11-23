import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, type EffectScope } from 'vue'
import { MILLIONAIRE_QUESTIONS } from './data'
import { QUESTION_SECONDS, SUSPENSE_MS, TIME_UP_REVEAL_MS } from './logic'
import { useMillionaireGame, type MillionaireGame } from './useMillionaireGame'

const mocks = vi.hoisted(() => ({
  unlock: vi.fn(),
  isDev: { value: false },
  audio: {
    stopNameLoop: vi.fn(),
    playBackgroundFor: vi.fn(),
    pauseBackground: vi.fn(),
    playAnswerPending: vi.fn(),
    stopAnswerPending: vi.fn(),
    playAnswerCorrect: vi.fn(),
    playAnswerWrong: vi.fn(),
    stopAll: vi.fn(),
  },
}))

vi.mock('@/shared/achievements', () => ({ useAchievements: () => ({ unlock: mocks.unlock }) }))
vi.mock('@/shared/devMode', () => ({ useDevMode: () => ({ isDev: mocks.isDev }) }))
vi.mock('./useMillionaireAudio', () => ({ useMillionaireAudio: () => mocks.audio }))

let scope: EffectScope

/**
 * Starts a fresh run inside its own effect scope.
 * @returns The run state and actions.
 */
function start(): MillionaireGame {
  scope = effectScope()
  const created = scope.run(() => useMillionaireGame())
  if (!created) throw new Error('scope did not run')
  return created
}

/**
 * Answers the current question correctly and moves on, using the fake clock.
 * @param run - The running game.
 */
function answerCorrectly(run: MillionaireGame): void {
  run.pick(run.question.value.answer)
  vi.advanceTimersByTime(SUSPENSE_MS)
  run.next()
}

let game: MillionaireGame

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  mocks.isDev.value = false
  game = start()
})

afterEach(() => {
  scope.stop()
  vi.useRealTimers()
})

describe('useMillionaireGame', () => {
  it('starts on question 1 with the 3-minute timer counting down', () => {
    expect(game.questionNumber.value).toBe(1)
    expect(game.phase.value).toBe('question')
    expect(game.timeLabel.value).toBe('02:59')
    expect(mocks.audio.playBackgroundFor).toHaveBeenCalledWith(0)
    vi.advanceTimersByTime(1000)
    expect(game.timeLabel.value).toBe('02:58')
  })

  it('reveals a pick after the suspense and moves on to the next question', () => {
    game.pick(game.question.value.answer)
    expect(game.phase.value).toBe('suspense')
    expect(mocks.audio.playAnswerPending).toHaveBeenCalled()
    vi.advanceTimersByTime(SUSPENSE_MS)
    expect(game.phase.value).toBe('revealed')
    expect(game.score.value).toBe(1)
    expect(mocks.audio.playAnswerCorrect).toHaveBeenCalled()
    game.next()
    expect(game.questionNumber.value).toBe(2)
    expect(game.phase.value).toBe('question')
  })

  it('unlocks the millionaire achievement after answering all 15 questions correctly', () => {
    for (let index = 0; index < MILLIONAIRE_QUESTIONS.length; index++) answerCorrectly(game)
    expect(game.finished.value).toBe(true)
    expect(game.score.value).toBe(15)
    expect(game.resultMessage.value).toBe('You answered 15 out of 15 questions correctly.')
    expect(mocks.unlock).toHaveBeenCalledTimes(1)
    expect(mocks.unlock).toHaveBeenCalledWith('millionaire')
    expect(mocks.audio.stopAll).toHaveBeenCalled()
  })

  it('ends the run on a wrong answer without unlocking the achievement', () => {
    const wrong = (game.question.value.answer + 1) % game.question.value.options.length
    game.pick(wrong)
    vi.advanceTimersByTime(SUSPENSE_MS)
    expect(mocks.audio.playAnswerWrong).toHaveBeenCalled()
    expect(game.nextLabel.value).toBe('Finish Game')
    game.next()
    expect(game.finished.value).toBe(true)
    expect(game.resultMessage.value).toBe('You answered 0 out of 15 questions correctly.')
    expect(mocks.unlock).not.toHaveBeenCalled()
  })

  it('ends the run when the timer runs out, after the correct answer is shown', () => {
    vi.advanceTimersByTime(QUESTION_SECONDS * 1000)
    expect(game.phase.value).toBe('timeUp')
    expect(game.status.value).toBe('Time is up! The answer will be revealed.')
    vi.advanceTimersByTime(TIME_UP_REVEAL_MS)
    expect(game.phase.value).toBe('timeUpRevealed')
    expect(game.nextVisible.value).toBe(true)
    game.next()
    expect(game.finished.value).toBe(true)
    expect(mocks.unlock).not.toHaveBeenCalled()
  })

  it('removes exactly two wrong options with 50:50, and uses it only once', () => {
    const answer = game.question.value.answer
    game.useLifeline('fiftyFifty')
    const removed = game.options.value.filter((option) => option.eliminated)
    expect(removed).toHaveLength(2)
    expect(game.options.value[answer]?.eliminated).toBe(false)
    expect(game.options.value.filter((option) => option.disabled)).toHaveLength(2)
    expect(game.lifelines.fiftyFifty).toBe(true)
    game.useLifeline('fiftyFifty')
    expect(game.options.value.filter((option) => option.eliminated)).toHaveLength(2)
  })

  it('stops the timer for lifelines that stop it', () => {
    game.useLifeline('callFriend')
    const before = game.timeLabel.value
    vi.advanceTimersByTime(5000)
    expect(game.timeLabel.value).toBe(before)
    expect(game.status.value).toBe('Call a Friend used. The timer stopped for this question.')
  })

  it('does not allow lifelines or a second pick while an answer is pending', () => {
    game.pick(0)
    game.useLifeline('askHost')
    expect(game.lifelines.askHost).toBe(false)
    game.pick(1)
    expect(game.options.value[1]?.state).toBeUndefined()
  })

  it('shows the audience vote after its suspense and tints the correct option', () => {
    game.useLifeline('audienceVote')
    vi.advanceTimersByTime(SUSPENSE_MS)
    expect(game.status.value).toBe('The audience has voted!')
    expect(game.options.value[game.question.value.answer]?.tint).toBe('audience-vote-correct')
  })

  it('offers Skip Suspense to developers and runs the reveal immediately', () => {
    mocks.isDev.value = true
    game.pick(game.question.value.answer)
    expect(game.canSkipSuspense.value).toBe(true)
    game.skipSuspense()
    expect(game.phase.value).toBe('revealed')
    expect(game.score.value).toBe(1)
  })

  it('marks the correct option in developer mode', () => {
    mocks.isDev.value = true
    const answer = game.question.value.answer
    expect(game.options.value[answer]?.devHint).toBe(true)
    expect(game.options.value.filter((option) => option.devHint)).toHaveLength(1)
  })

  it('clears timers when the scope is disposed', () => {
    game.pick(0)
    scope.stop()
    vi.advanceTimersByTime(SUSPENSE_MS * 2)
    expect(game.phase.value).toBe('suspense')
    expect(mocks.unlock).not.toHaveBeenCalled()
  })
})
