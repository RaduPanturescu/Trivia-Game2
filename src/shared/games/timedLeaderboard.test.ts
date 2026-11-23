import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { STORAGE_KEYS } from '../persistence'
import { defineTimedLeaderboard, type LeaderboardEntry } from './timedLeaderboard'

const LEADERBOARD = STORAGE_KEYS.minesweeperLeaderboard
const BESTS = STORAGE_KEYS.minesweeperPersonalBests
const DATE = '2026-11-01T10:00:00.000Z'

/** Lets repository watchers flush their saves to localStorage. */
async function settle(): Promise<void> {
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
}

/** Creates a fresh leaderboard over the legacy minesweeper keys, after seeding storage. */
async function setup(seed: Record<string, string> = {}) {
  for (const [key, value] of Object.entries(seed)) localStorage.setItem(key, value)
  const board = defineTimedLeaderboard<LeaderboardEntry>({ leaderboardKey: LEADERBOARD, bestsKey: BESTS })()
  await board.ready
  return board
}

describe('defineTimedLeaderboard', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('loads the legacy entry list and bests from storage', async () => {
    const board = await setup({
      [LEADERBOARD]: `[{"difficulty":"easy","rows":9,"cols":9,"time":42,"date":"${DATE}"}]`,
      [BESTS]: '{"easy":42,"medium":130}',
    })
    expect(board.entries.value).toHaveLength(1)
    expect(board.entries.value[0]?.time).toBe(42)
    expect(board.bests.value).toEqual({ easy: 42, medium: 130 })
  })

  it('treats a non-array or non-object stored value as empty', async () => {
    const board = await setup({ [LEADERBOARD]: '{"oops":1}', [BESTS]: '[1,2]' })
    expect(board.entries.value).toEqual([])
    expect(board.bests.value).toEqual({})
  })

  it('returns the same instance on every call', () => {
    const useBoard = defineTimedLeaderboard<LeaderboardEntry>({ leaderboardKey: LEADERBOARD, bestsKey: BESTS })
    expect(useBoard()).toBe(useBoard())
  })

  it('keeps entries sorted by time and at most 20 of them', async () => {
    const board = await setup()
    for (let time = 30; time >= 10; time--) {
      board.record({ difficulty: 'easy', time, date: DATE })
    }
    expect(board.entries.value).toHaveLength(20)
    expect(board.entries.value[0]?.time).toBe(10)
    expect(board.entries.value.at(-1)?.time).toBe(29)
    await settle()
    expect(JSON.parse(localStorage.getItem(LEADERBOARD) ?? '[]')).toHaveLength(20)
  })

  it('clear empties the list but keeps personal bests', async () => {
    const board = await setup({ [LEADERBOARD]: `[{"difficulty":"easy","time":5,"date":"${DATE}"}]`, [BESTS]: '{"easy":5}' })
    board.clear()
    expect(board.entries.value).toEqual([])
    expect(board.bests.value).toEqual({ easy: 5 })
  })

  it('recordBest keeps the lower time and writes it under the legacy key', async () => {
    const board = await setup({ [BESTS]: '{"easy":50}' })
    board.recordBest('easy', 60)
    expect(board.bests.value.easy).toBe(50)
    board.recordBest('easy', 45)
    expect(board.bests.value.easy).toBe(45)
    await settle()
    expect(JSON.parse(localStorage.getItem(BESTS) ?? '{}')).toEqual({ easy: 45 })
  })

  it('recordBest stores a first time and ignores custom difficulties', async () => {
    const board = await setup()
    board.recordBest('hard', 300)
    board.recordBest('custom', 1)
    expect(board.bests.value).toEqual({ hard: 300 })
  })

  it('bestFor prefers the personal best', async () => {
    const board = await setup({
      [LEADERBOARD]: `[{"difficulty":"easy","time":20,"date":"${DATE}"}]`,
      [BESTS]: '{"easy":42}',
    })
    expect(board.bestFor('easy')).toBe(42)
  })

  it('bestFor falls back to the fastest matching entry, then null', async () => {
    const board = await setup({
      [LEADERBOARD]: JSON.stringify([
        { difficulty: 'easy', time: 80, date: DATE },
        { difficulty: 'medium', time: 10, date: DATE },
        { difficulty: 'easy', time: 35, date: DATE },
      ]),
    })
    expect(board.bestFor('easy')).toBe(35)
    expect(board.bestFor('hard')).toBeNull()
  })
})
