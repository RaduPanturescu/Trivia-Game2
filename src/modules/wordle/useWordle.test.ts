import { describe, expect, it } from 'vitest'
import { STORAGE_KEYS, setStorageAdapter, type StorageAdapter } from '@/shared/persistence'
import {
  boardRows,
  dailyStateCodec,
  evaluateGuess,
  formatCountdown,
  getDailyAnswer,
  keyStatesFor,
  normaliseWords,
  useWordleStore,
  utcDateString,
  WORDLE_ANSWERS,
} from './useWordle'

/** Lets pending repository saves run. */
async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

/** In-memory storage adapter that exposes its map for assertions. */
function createMemoryAdapter(initial: Record<string, string>): StorageAdapter & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial))
  return {
    data,
    async getItem(key) {
      return data.get(key) ?? null
    },
    async setItem(key, value) {
      data.set(key, value)
    },
    async removeItem(key) {
      data.delete(key)
    },
    async keys() {
      return [...data.keys()]
    },
  }
}

/**
 * Independent copy of the legacy FNV-1a daily pick, used to check {@link getDailyAnswer} against the legacy app.
 * @param date - UTC date string.
 * @param words - Legacy answer list.
 * @returns The word the legacy app would show.
 */
function legacyDailyAnswer(date: string, words: readonly string[]): string {
  let hash = 2166136261
  for (const character of date) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return words[(hash >>> 0) % words.length] ?? ''
}

/** Legacy-shaped stored daily state, written by the old app. */
const LEGACY_STATE =
  '{"date":"2026-11-23","guesses":[{"word":"babes","result":["present","present","correct","correct","absent"]}],"result":"playing"}'

describe('evaluateGuess', () => {
  it('marks repeated letters present only as often as they appear in the answer', () => {
    expect(evaluateGuess('babes', 'abbey')).toEqual(['present', 'present', 'correct', 'correct', 'absent'])
  })

  it('does not mark extra copies of a letter that is already correct', () => {
    expect(evaluateGuess('bbbbb', 'abbey')).toEqual(['absent', 'correct', 'correct', 'absent', 'absent'])
  })

  it('uses the remaining letter count for a non-correct duplicate', () => {
    expect(evaluateGuess('paper', 'apple')).toEqual(['present', 'present', 'correct', 'present', 'absent'])
  })

  it('returns all correct for the answer itself', () => {
    expect(evaluateGuess('ensue', 'ensue')).toEqual(['correct', 'correct', 'correct', 'correct', 'correct'])
  })
})

describe('getDailyAnswer', () => {
  it('matches the legacy FNV-1a pick for fixed dates', () => {
    expect(getDailyAnswer('2026-11-23')).toBe('ensue')
    expect(getDailyAnswer('2026-11-24')).toBe('unity')
    expect(getDailyAnswer('2000-01-01')).toBe('scope')
  })

  it('is stable for a date and equals the legacy algorithm on the full list', () => {
    for (const date of ['2026-01-01', '2026-06-15', '2027-12-31']) {
      expect(getDailyAnswer(date)).toBe(getDailyAnswer(date))
      expect(getDailyAnswer(date)).toBe(legacyDailyAnswer(date, WORDLE_ANSWERS))
    }
  })

  it('keeps the legacy answer list length', () => {
    expect(WORDLE_ANSWERS).toHaveLength(2315)
    expect(WORDLE_ANSWERS[0]).toBe('aback')
    expect(WORDLE_ANSWERS.at(-1)).toBe('zonal')
  })
})

describe('normaliseWords', () => {
  it('trims, lower-cases, drops non five-letter words and keeps the first duplicate', () => {
    expect(normaliseWords([' Crane ', 'crane', 'toolong', 'ab1de', 'BIRDS', 'birds'])).toEqual(['crane', 'birds'])
  })
})

describe('keyStatesFor', () => {
  it('keeps the strongest colour for each key', () => {
    const states = keyStatesFor([
      { word: 'babes', result: ['present', 'present', 'correct', 'correct', 'absent'] },
      { word: 'abbey', result: ['correct', 'absent', 'present', 'absent', 'present'] },
    ])
    expect(states.A).toBe('correct')
    expect(states.B).toBe('correct')
    expect(states.E).toBe('correct')
    expect(states.S).toBe('absent')
    expect(states.Y).toBe('present')
  })
})

describe('boardRows', () => {
  it('fills the open row with typed letters and leaves the rest empty', () => {
    const rows = boardRows({ date: '2026-11-23', guesses: [], result: 'playing' }, 'ab')
    expect(rows[0]?.map((tile) => tile.letter)).toEqual(['A', 'B', '', '', ''])
    expect(rows[0]?.[0]?.filled).toBe(true)
    expect(rows[0]?.[2]?.filled).toBe(false)
    expect(rows[1]?.every((tile) => tile.letter === '')).toBe(true)
  })
})

describe('dates and countdown', () => {
  it('formats the UTC date', () => {
    expect(utcDateString(new Date('2026-11-23T23:30:00-05:00'))).toBe('2026-11-24')
  })

  it('counts down to the next UTC midnight', () => {
    expect(formatCountdown(new Date('2026-11-23T23:59:30Z'))).toBe('Next word in 00:00:30 UTC')
    expect(formatCountdown(new Date('2026-11-23T12:00:00Z'))).toBe('Next word in 12:00:00 UTC')
  })
})

describe('daily state persistence', () => {
  it('codec round-trips the legacy JSON byte-for-byte', () => {
    expect(dailyStateCodec.encode(dailyStateCodec.decode(LEGACY_STATE))).toBe(LEGACY_STATE)
  })

  it('loads a legacy-shaped state under the legacy key and saves changes back in the same shape', async () => {
    const adapter = createMemoryAdapter({ [STORAGE_KEYS.biankaDailyWordleState]: LEGACY_STATE })
    setStorageAdapter(adapter)
    const store = useWordleStore()
    await store.ready
    expect(store.state.value.guesses).toHaveLength(1)
    expect(store.state.value.result).toBe('playing')

    store.state.value.guesses.push({ word: 'ensue', result: ['correct', 'correct', 'correct', 'correct', 'correct'] })
    store.state.value.result = 'won'
    await settle()
    expect(adapter.data.get('biankaDailyWordleState')).toBe(
      '{"date":"2026-11-23","guesses":[{"word":"babes","result":["present","present","correct","correct","absent"]},{"word":"ensue","result":["correct","correct","correct","correct","correct"]}],"result":"won"}',
    )
  })
})
