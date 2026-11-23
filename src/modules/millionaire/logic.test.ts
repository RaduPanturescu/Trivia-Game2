import { describe, expect, it } from 'vitest'
import { MILLIONAIRE_SRC, backgroundLevelForQuestion } from './audio'
import { MILLIONAIRE_QUESTIONS, PRIZE_LEVELS } from './data'
import { audienceVoteTints, formatTime, pickFiftyFiftyRemovals } from './logic'

describe('formatTime', () => {
  it('shows the 3-minute start as mm:ss, as the legacy timer does', () => {
    expect(formatTime(180)).toBe('03:00')
    expect(formatTime(179)).toBe('02:59')
    expect(formatTime(65)).toBe('01:05')
    expect(formatTime(5)).toBe('00:05')
    expect(formatTime(0)).toBe('00:00')
  })
})

describe('pickFiftyFiftyRemovals', () => {
  it('removes exactly two wrong options and never the correct one', () => {
    for (let run = 0; run < 50; run++) {
      const removed = pickFiftyFiftyRemovals(4, 2, [])
      expect(removed).toHaveLength(2)
      expect(new Set(removed).size).toBe(2)
      expect(removed).not.toContain(2)
      expect(removed.every((index) => index >= 0 && index < 4)).toBe(true)
    }
  })

  it('does not pick options that are already unavailable', () => {
    const removed = pickFiftyFiftyRemovals(4, 0, [1])
    expect([...removed].sort()).toEqual([2, 3])
  })
})

describe('audienceVoteTints', () => {
  it('tints the correct option green and each wrong option with a different wrong tint', () => {
    const tints = audienceVoteTints(4, 1, [])
    expect(tints[1]).toBe('audience-vote-correct')
    const wrong = [0, 2, 3].map((index) => tints[index])
    expect(new Set(wrong)).toEqual(new Set(['audience-vote-high', 'audience-vote-med', 'audience-vote-low']))
  })

  it('does not vote on removed options', () => {
    const tints = audienceVoteTints(4, 0, [1, 2])
    expect(tints[1]).toBeUndefined()
    expect(tints[2]).toBeUndefined()
    expect(tints[0]).toBe('audience-vote-correct')
    expect(tints[3]).toMatch(/^audience-vote-(high|med|low)$/)
  })
})

describe('background tracks', () => {
  it('maps questions to the legacy prize bands: Q1-Q5, Q6-Q10, Q11-Q14 and Q15', () => {
    const levels = Array.from({ length: 15 }, (_, index) => backgroundLevelForQuestion(index))
    expect(levels).toEqual([1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4])
  })

  it('uses the legacy asset files', () => {
    expect(MILLIONAIRE_SRC.background[1]).toBe('/assets/questions_100-1000.mp3')
    expect(MILLIONAIRE_SRC.background[4]).toBe('/assets/questions_1000000.mp3')
  })
})

describe('question data', () => {
  it('has 15 questions with valid answer indexes and a 15-step prize ladder', () => {
    expect(MILLIONAIRE_QUESTIONS).toHaveLength(15)
    for (const question of MILLIONAIRE_QUESTIONS) {
      expect(question.answer).toBeGreaterThanOrEqual(0)
      expect(question.answer).toBeLessThan(question.options.length)
    }
    expect(PRIZE_LEVELS).toHaveLength(15)
    expect(PRIZE_LEVELS[14]).toBe('$1,000,000')
  })
})
