import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/** Lets pending repository watchers and saves run. */
async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

/** Loads a fresh dev-mode gate with the given raw storage values. */
async function setup(stored: Record<string, string> = {}) {
  localStorage.clear()
  for (const [key, value] of Object.entries(stored)) localStorage.setItem(key, value)
  vi.resetModules()
  const { useDevMode } = await import('./devMode')
  const devMode = useDevMode()
  await devMode.ready
  return devMode
}

describe('useDevMode', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('turns dev mode on with the correct password and resets the streak', async () => {
    const devMode = await setup()
    expect(devMode.tryUnlock('nope')).toBe('wrong')
    expect(devMode.failStreak.value).toBe(1)
    expect(devMode.tryUnlock('raduissexy')).toBe('ok')
    expect(devMode.failStreak.value).toBe(0)
    expect(devMode.isDev.value).toBe(true)
    await settle()
    expect(localStorage.getItem('devMode')).toBe('true')
  })

  it('unlocks the hacker achievement on the fifth wrong password in a row', async () => {
    const devMode = await setup()
    const results = [1, 2, 3, 4].map(() => devMode.tryUnlock('wrong'))
    expect(results).toEqual(['wrong', 'wrong', 'wrong', 'wrong'])
    expect(devMode.failStreak.value).toBe(4)
    expect(devMode.tryUnlock('wrong')).toBe('hacker')
    expect(devMode.failStreak.value).toBe(0)
    await settle()
    expect(JSON.parse(localStorage.getItem('triviaAchievements') ?? '{}').hackerAttempt.unlocked).toBe(true)
  })

  it('loads a stored dev-mode flag and deactivates it', async () => {
    const devMode = await setup({ devMode: 'true' })
    expect(devMode.isDev.value).toBe(true)
    devMode.deactivate()
    expect(devMode.isDev.value).toBe(false)
  })
})
