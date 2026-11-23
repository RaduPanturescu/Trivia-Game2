import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/** Lets pending repository watchers and saves run. */
async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

/** Loads a fresh welcome-stats store with the given raw storage values. */
async function setup(stored: Record<string, string> = {}) {
  localStorage.clear()
  for (const [key, value] of Object.entries(stored)) localStorage.setItem(key, value)
  vi.resetModules()
  const { useWelcomeStats } = await import('./welcomeStats')
  const stats = useWelcomeStats()
  await stats.ready
  return stats
}

describe('useWelcomeStats', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 23, 15, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('counts calendar days to the default target when nothing is saved', async () => {
    const stats = await setup()
    expect(stats.daysLeft.value).toBe(4)
  })

  it('applies the default target once by clearing an old saved date', async () => {
    const stats = await setup({ daysLeftTargetDate: '2026-12-01' })
    expect(stats.daysLeft.value).toBe(4)
    await settle()
    expect(localStorage.getItem('daysLeftTargetDate')).toBeNull()
    expect(localStorage.getItem('daysLeftDefault20261127Applied')).toBe('true')
  })

  it('keeps a saved date once the migration flag is set, and falls back on invalid values', async () => {
    const saved = await setup({ daysLeftDefault20261127Applied: 'true', daysLeftTargetDate: '2026-12-01' })
    expect(saved.daysLeft.value).toBe(8)

    const invalid = await setup({ daysLeftDefault20261127Applied: 'true', daysLeftTargetDate: 'not a date' })
    expect(invalid.daysLeft.value).toBe(4)
  })

  it('updates the target date', async () => {
    const stats = await setup({ daysLeftDefault20261127Applied: 'true' })
    await stats.setTargetDate('2026-11-25')
    expect(stats.daysLeft.value).toBe(2)
    await settle()
    expect(localStorage.getItem('daysLeftTargetDate')).toBe('2026-11-25')
  })

  it('counts Maya clicks and unlocks Maya Overload at exactly 100', async () => {
    const stats = await setup({ mayaClickCount: '99' })
    expect(stats.clickMaya()).toBe(100)
    await settle()
    const achievements = JSON.parse(localStorage.getItem('triviaAchievements') ?? '{}')
    expect(achievements.mayaOverload.unlocked).toBe(true)
    expect(localStorage.getItem('mayaClickCount')).toBe('100')
  })

  it('treats a non-numeric stored click count as zero', async () => {
    const stats = await setup({ mayaClickCount: 'abc' })
    expect(stats.mayaClicks.value).toBe(0)
    expect(stats.clickMaya()).toBe(1)
  })
})
