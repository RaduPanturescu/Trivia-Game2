import { describe, expect, it } from 'vitest'
import legacyQuestions from '../../../legacy/questions.js?raw'
import legacySeasonTwoSource from '../../../legacy/qotd-season2.js?raw'
import { QOTD_QUESTIONS } from './questions'

/**
 * Evaluates a JavaScript expression taken from a legacy file, so the test compares against the untouched legacy data.
 * @param expression - Expression text to evaluate.
 * @returns The evaluated value.
 */
function evaluate(expression: string): unknown {
  return new Function(`return ${expression}`)()
}

/** Legacy `qotdData` (season one): the array literal after `const qotdData = `. */
const seasonOneSource = legacyQuestions.slice(legacyQuestions.indexOf('const qotdData = ') + 'const qotdData = '.length)
const seasonOneEnd = seasonOneSource.search(/\r?\n\];/)
const legacySeasonOne = evaluate(seasonOneSource.slice(0, seasonOneEnd + 3)) as { category: string; q: string; options: string[]; answer: number }[]

/** Legacy `qotdSeasonTwoData` (season two): the expression after `const qotdSeasonTwoData = `, including its `flatMap` builder. */
const legacySeasonTwo = evaluate(legacySeasonTwoSource.slice(legacySeasonTwoSource.indexOf('const qotdSeasonTwoData = ') + 'const qotdSeasonTwoData = '.length)) as {
  category: string
  q: string
  options: string[]
  answer: number
}[]

describe('QotD question list', () => {
  it('matches the legacy lists in legacy order (season one then season two)', () => {
    expect(QOTD_QUESTIONS).toHaveLength(legacySeasonOne.length + legacySeasonTwo.length)
    expect(QOTD_QUESTIONS).toEqual([...legacySeasonOne, ...legacySeasonTwo])
  })

  it('spot-checks the first season one question', () => {
    expect(QOTD_QUESTIONS[0]).toEqual({
      category: 'Otters',
      q: 'What is a group of resting otters called?',
      options: ['A raft', 'A flock', 'A herd', 'A school'],
      answer: 0,
    })
  })

  it('spot-checks the first season two question and its legacy answer rule', () => {
    const first = QOTD_QUESTIONS[legacySeasonOne.length]
    expect(first?.category).toBe('Otters')
    expect(first?.options[0]).toBe('It anchors it with kelp')
    expect(first?.answer).toBe(0)
    // categoryIndex 0, questionIndex 1: answer = (0 * 2 + 1) % 4 = 1
    const second = QOTD_QUESTIONS[legacySeasonOne.length + 1]
    expect(second?.answer).toBe(1)
    expect(second?.options[1]).toBe('To trap insulating air in it')
  })
})
