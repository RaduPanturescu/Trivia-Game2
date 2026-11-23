import { describe, expect, it } from 'vitest'
import { QOTD_QUESTIONS } from './questions'

// Stored `qotdRandomIndex` values point into this list, so its order and length must never change.
// Values below were taken from the legacy data files when they were migrated.
const SEASON_ONE_LENGTH = 17

describe('QOTD_QUESTIONS', () => {
  it('keeps the migrated length and order', () => {
    expect(QOTD_QUESTIONS).toHaveLength(147)
    expect(QOTD_QUESTIONS[0]?.q).toBe('What is a group of resting otters called?')
    expect(QOTD_QUESTIONS.at(-1)).toEqual({
      category: 'Nature',
      q: 'What do broadcast-spawning marine animals release into the water?',
      options: ['Young in a pouch', 'Eggs and sperm', 'Buds that clone the parent', 'Eggs laid on dry land'],
      answer: 1,
    })
  })

  it('keeps the season two answer rule', () => {
    const first = QOTD_QUESTIONS[SEASON_ONE_LENGTH]
    expect(first?.category).toBe('Otters')
    expect(first?.options[0]).toBe('It anchors it with kelp')
    expect(first?.answer).toBe(0)
    // categoryIndex 0, questionIndex 1: answer = (0 * 2 + 1) % 4 = 1
    const second = QOTD_QUESTIONS[SEASON_ONE_LENGTH + 1]
    expect(second?.answer).toBe(1)
    expect(second?.options[1]).toBe('To trap insulating air in it')
  })
})
