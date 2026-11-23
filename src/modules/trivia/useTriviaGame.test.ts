import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CategoryId, Difficulty } from '@/shared/progress'
import { triviaData } from './data/season1'
import { seasonTwoTriviaData } from './data/season2'

/** Lets pending repository watchers and saves run. */
async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

/** Loads a fresh trivia game module graph with the given raw storage values. */
async function setup(stored: Record<string, string> = {}) {
  localStorage.clear()
  for (const [key, value] of Object.entries(stored)) localStorage.setItem(key, value)
  vi.resetModules()
  return {
    game: await import('./useTriviaGame'),
    season: await import('./season'),
    progress: await import('@/shared/progress'),
  }
}

describe('pass threshold', () => {
  it('passes at 7 correct answers and fails at 6', async () => {
    const { game } = await setup()
    expect(game.PASS_SCORE).toBe(7)
    expect(game.isPassing(6)).toBe(false)
    expect(game.isPassing(7)).toBe(true)
  })
})

describe('buildRound', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('deals 10 questions from the chosen season bank', async () => {
    const { game } = await setup()
    const round = game.buildRound('eu', 'easy', '2')
    expect(round).toHaveLength(10)
    const bank = seasonTwoTriviaData.eu.easy.map((question) => question.q)
    for (const question of round) expect(bank).toContain(question.q)
  })

  it('uses the season 1 bank for season 1', async () => {
    const { game } = await setup()
    const round = game.buildRound('trains', 'hard', '1')
    const bank = triviaData.trains.hard.map((question) => question.q)
    expect(round).toHaveLength(10)
    for (const question of round) expect(bank).toContain(question.q)
  })

  it('keeps the personal questions in fixed order', async () => {
    const { game } = await setup()
    expect(game.buildRound('personal', null, '2')).toEqual(triviaData.personal)
  })
})

describe('useTriviaGame completion', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  /** Answers every question of the round with the given number of correct picks, then finishes it. */
  async function playRound(game: typeof import('./useTriviaGame'), category: CategoryId, difficulty: Difficulty | null, correct: number) {
    const round = game.useTriviaGame(category, difficulty)
    await round.start()
    for (let i = 0; i < round.total.value; i++) {
      const question = round.current.value
      if (!question) throw new Error('round has no question')
      round.choose(i < correct ? question.answer : (question.answer + 1) % question.options.length)
      round.next()
    }
    return round
  }

  it('marks a passed difficulty completed and unlocks the category achievement', async () => {
    const { game, progress } = await setup()
    const round = await playRound(game, 'romania', 'medium', 7)
    expect(round.finished.value).toBe(true)
    expect(round.passed.value).toBe(true)
    await settle()
    const map = JSON.parse(localStorage.getItem('triviaDifficulties') ?? '{}')
    expect(map.romania.medium).toBe(true)
    expect(localStorage.getItem('triviaPoints')).toBe('1')
    const achievements = JSON.parse(localStorage.getItem('triviaAchievements') ?? '{}')
    expect(achievements.romania.unlocked).toBe(true)
    expect(progress.useProgress().points.value).toBe(1)
  })

  it('does not complete a failed round', async () => {
    const { game } = await setup()
    const round = await playRound(game, 'romania', 'medium', 6)
    expect(round.passed.value).toBe(false)
    await settle()
    expect(localStorage.getItem('triviaDifficulties')).toBeNull()
  })

  it('writes the legacy null key when personal questions are passed', async () => {
    const { game } = await setup()
    const round = await playRound(game, 'personal', null, 10)
    expect(round.passed.value).toBe(true)
    await settle()
    const map = JSON.parse(localStorage.getItem('triviaDifficulties') ?? '{}')
    expect(map.personal.null).toBe(true)
    expect(localStorage.getItem('triviaPoints')).toBe('1')
  })
})

describe('season persistence', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('reads only "2" as season 2 and anything else as season 1', async () => {
    const { season } = await setup()
    expect(season.seasonCodec.decode('2')).toBe('2')
    expect(season.seasonCodec.decode('1')).toBe('1')
    expect(season.seasonCodec.decode('garbage')).toBe('1')
    expect(season.seasonCodec.encode('2')).toBe('2')
  })

  it('stores the chosen season as the raw "1" or "2" under triviaSeason', async () => {
    const { season } = await setup()
    const repo = season.useTriviaSeason()
    await repo.ready
    repo.state.value = '2'
    await settle()
    expect(localStorage.getItem('triviaSeason')).toBe('2')
  })

  it('loads a stored season 2 into the repository', async () => {
    const { season } = await setup({ triviaSeason: '2' })
    const repo = season.useTriviaSeason()
    await repo.ready
    expect(repo.state.value).toBe('2')
  })
})
