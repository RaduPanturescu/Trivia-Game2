import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QOTD_QUESTIONS } from './questions'

const TODAY = new Date(2026, 10, 23, 15, 0, 0)
const YESTERDAY = new Date(2026, 10, 22, 12, 0, 0)

/** Lets pending repository saves run. Uses the real timers, so call it after `useRealTimers` or with `setTimeout` not faked. */
async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * Returns the question at `index` of the QotD list, failing the test if it is missing.
 * @param index - Position in `QOTD_QUESTIONS`.
 * @returns The question at that position.
 */
function questionAt(index: number) {
  const question = QOTD_QUESTIONS[index]
  if (!question) throw new Error(`no QotD question at ${index}`)
  return question
}

/**
 * Loads a fresh QotD store with the given raw storage values.
 * @param stored - Raw localStorage values to seed before loading.
 * @returns The loaded QotD API.
 */
async function setup(stored: Record<string, string> = {}) {
  localStorage.clear()
  for (const [key, value] of Object.entries(stored)) localStorage.setItem(key, value)
  vi.resetModules()
  const { useQotd } = await import('./useQotd')
  const qotd = useQotd()
  await qotd.ready
  return qotd
}

describe('useQotd', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(TODAY)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('selection', () => {
    it('keeps the stored index for today', async () => {
      const qotd = await setup({ qotdDate: TODAY.toDateString(), qotdRandomIndex: '5' })
      const question = qotd.currentQuestion()
      expect(question.category).toBe(questionAt(5).category)
      expect(question.text).toBe(questionAt(5).q)
      await settle()
      expect(localStorage.getItem('qotdRandomIndex')).toBe('5')
      expect(localStorage.getItem('qotdDate')).toBe(TODAY.toDateString())
    })

    it('shuffles the options and remaps the answer to the correct text', async () => {
      const qotd = await setup({ qotdDate: TODAY.toDateString(), qotdRandomIndex: '0' })
      const source = questionAt(0)
      const question = qotd.currentQuestion()
      expect([...question.options].sort()).toEqual([...source.options].sort())
      expect(question.options[question.answer]).toBe(source.options[source.answer])
    })

    it('picks a new index on a new day and stores it with today', async () => {
      vi.spyOn(Math, 'random').mockReturnValue((7 + 0.5) / QOTD_QUESTIONS.length)
      const qotd = await setup({ qotdDate: YESTERDAY.toDateString(), qotdRandomIndex: '5' })
      expect(qotd.currentQuestion().text).toBe(questionAt(7).q)
      await settle()
      expect(localStorage.getItem('qotdRandomIndex')).toBe('7')
      expect(localStorage.getItem('qotdDate')).toBe(TODAY.toDateString())
    })

    it('picks a new index when the stored index is not a valid integer', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0)
      const qotd = await setup({ qotdDate: TODAY.toDateString(), qotdRandomIndex: 'abc' })
      expect(qotd.currentQuestion().text).toBe(questionAt(0).q)
      await settle()
      expect(localStorage.getItem('qotdRandomIndex')).toBe('0')
    })

    it('never repeats the stored question on a developer forced pick', async () => {
      vi.spyOn(Math, 'random').mockReturnValue((7 + 0.5) / QOTD_QUESTIONS.length)
      const qotd = await setup({ devMode: 'true', qotdDate: TODAY.toDateString(), qotdRandomIndex: '7' })
      expect(qotd.devReset()?.text).toBe(questionAt(8).q)
      await settle()
      expect(localStorage.getItem('qotdRandomIndex')).toBe('8')
    })
  })

  describe('lock', () => {
    it('locks outside developer mode once today is completed', async () => {
      const qotd = await setup({ qotdCompletedDate: TODAY.toDateString() })
      expect(qotd.status.value).toBe('locked')
      expect(qotd.countdown.value).toBe('Next question in: 9h 0m 0s')
    })

    it('stays available in developer mode even when completed today', async () => {
      const qotd = await setup({ devMode: 'true', qotdCompletedDate: TODAY.toDateString() })
      expect(qotd.status.value).toBe('available')
      expect(qotd.countdown.value).toBe('Available Now!')
    })

    it('is available when the completion was yesterday', async () => {
      const qotd = await setup({ qotdCompletedDate: YESTERDAY.toDateString() })
      expect(qotd.status.value).toBe('available')
      expect(qotd.countdown.value).toBe('Available Now!')
    })

    it('locks after an answer outside developer mode', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0)
      const qotd = await setup({})
      const question = qotd.currentQuestion()
      const wrong = question.answer === 0 ? 1 : 0
      expect(qotd.answer(question, wrong)).toEqual({ correct: false, finishLabel: 'Close! Come back tomorrow' })
      expect(qotd.status.value).toBe('locked')
      await settle()
      expect(localStorage.getItem('qotdCompletedDate')).toBe(TODAY.toDateString())
    })

    it('uses the developer finish labels and does not lock in developer mode', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0)
      const qotd = await setup({ devMode: 'true' })
      const question = qotd.currentQuestion()
      expect(qotd.answer(question, question.answer)).toEqual({ correct: true, finishLabel: 'Correct! Play again anytime' })
      expect(qotd.status.value).toBe('available')
      await settle()
      expect(localStorage.getItem('qotdCompletedDate')).toBeNull()
    })

    it('devReset does nothing outside developer mode', async () => {
      const qotd = await setup({ qotdCompletedDate: TODAY.toDateString() })
      expect(qotd.devReset()).toBeUndefined()
      expect(qotd.status.value).toBe('locked')
    })
  })

  describe('countdown', () => {
    beforeEach(() => {
      vi.useRealTimers()
      vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
      vi.setSystemTime(new Date(2026, 10, 23, 23, 59, 58))
    })

    it('ticks every second while subscribed and locked, then unlocks at local midnight', async () => {
      const qotd = await setup({ qotdCompletedDate: new Date(2026, 10, 23).toDateString() })
      const release = qotd.subscribe()
      await nextTick()
      expect(qotd.countdown.value).toBe('Next question in: 0h 0m 2s')
      vi.advanceTimersByTime(1000)
      expect(qotd.countdown.value).toBe('Next question in: 0h 0m 1s')
      vi.advanceTimersByTime(1000)
      expect(qotd.status.value).toBe('available')
      expect(qotd.countdown.value).toBe('Available Now!')
      release()
    })

    it('does not tick without a subscriber', async () => {
      const qotd = await setup({ qotdCompletedDate: new Date(2026, 10, 23).toDateString() })
      vi.advanceTimersByTime(1000)
      expect(qotd.countdown.value).toBe('Next question in: 0h 0m 2s')
    })
  })
})

describe('formatCountdown', () => {
  it('formats the time left until local midnight', async () => {
    const { formatCountdown } = await import('./useQotd')
    expect(formatCountdown(new Date(2026, 10, 23, 15, 0, 0))).toBe('Next question in: 9h 0m 0s')
    expect(formatCountdown(new Date(2026, 10, 23, 23, 59, 30))).toBe('Next question in: 0h 0m 30s')
    expect(formatCountdown(new Date(2026, 10, 23, 23, 59, 59, 500))).toBe('Next question in: 0h 0m 0s')
  })
})
