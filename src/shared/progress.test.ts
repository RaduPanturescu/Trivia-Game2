import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/** Lets pending repository watchers and saves run. */
async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

/** Loads a fresh progress store with the given raw storage values. */
async function setup(stored: Record<string, string> = {}) {
  localStorage.clear()
  for (const [key, value] of Object.entries(stored)) localStorage.setItem(key, value)
  vi.resetModules()
  const { useProgress } = await import('./progress')
  const progress = useProgress()
  await progress.ready
  return progress
}

describe('useProgress', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('counts completed difficulties as points', async () => {
    const progress = await setup({
      triviaDifficulties: JSON.stringify({
        eu: { easy: true, medium: true, hard: false, expert: false },
        hungary: { easy: true, medium: false, hard: false, expert: false },
      }),
    })
    expect(progress.points.value).toBe(3)
    await settle()
    expect(localStorage.getItem('triviaPoints')).toBe('3')
  })

  it('adds one point when the millionaire achievement is unlocked', async () => {
    const progress = await setup({
      triviaDifficulties: JSON.stringify({ eu: { easy: true, medium: false, hard: false, expert: false } }),
      triviaAchievements: JSON.stringify({ millionaire: { id: 'millionaire', name: '', desc: '', unlocked: true } }),
    })
    expect(progress.points.value).toBe(2)
  })

  it('marks a difficulty completed and updates stored points', async () => {
    const progress = await setup()
    expect(progress.points.value).toBe(0)
    progress.markCompleted('trains', 'expert')
    expect(progress.points.value).toBe(1)
    await settle()
    expect(localStorage.getItem('triviaPoints')).toBe('1')
  })

  it('stores a personal completion (no difficulty) under the legacy null key', async () => {
    const progress = await setup()
    progress.markCompleted('personal', null)
    expect(progress.points.value).toBe(1)
    await settle()
    expect(JSON.parse(localStorage.getItem('triviaDifficulties') ?? '{}').personal.null).toBe(true)
  })

  it('resets difficulties, achievements and question-of-the-day keys', async () => {
    const progress = await setup({
      triviaDifficulties: JSON.stringify({ eu: { easy: true, medium: true, hard: true, expert: true } }),
      triviaAchievements: JSON.stringify({ eu: { id: 'eu', name: '', desc: '', unlocked: true } }),
      qotdCompletedDate: '2026-11-01',
      qotdRandomIndex: '4',
      qotdDate: '2026-11-01',
    })
    await progress.resetProfile()
    await settle()

    expect(progress.points.value).toBe(0)
    expect(localStorage.getItem('triviaPoints')).toBe('0')
    expect(localStorage.getItem('qotdCompletedDate')).toBeNull()
    expect(localStorage.getItem('qotdRandomIndex')).toBeNull()
    expect(localStorage.getItem('qotdDate')).toBeNull()
    expect(JSON.parse(localStorage.getItem('triviaAchievements') ?? '{}').eu.unlocked).toBe(false)
  })
})
