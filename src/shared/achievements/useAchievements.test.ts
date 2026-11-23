import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/** Built-in ids in legacy order. */
const BUILT_IN_IDS = ['eu', 'hungary', 'romania', 'trains', 'personal', 'sudoCute', 'millionaire', 'minesweeper', 'mayaOverload', 'hackerAttempt']

/** Legacy icon string for the EU achievement. */
const EU_ICON = '<img src="assets/eu_flag.png" style="width:100%;height:100%;object-fit:cover;border-radius:10px;display:block;">'

/** Lets pending repository watchers and saves run. */
async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

/** Loads a fresh achievements store with the given raw storage values. */
async function setup(stored: Record<string, string> = {}) {
  localStorage.clear()
  for (const [key, value] of Object.entries(stored)) localStorage.setItem(key, value)
  vi.resetModules()
  const { useAchievements } = await import('./useAchievements')
  const achievements = useAchievements()
  await achievements.ready
  return achievements
}

describe('useAchievements', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('lists built-ins in legacy order and unlocks the ones marked in a legacy-shaped map', async () => {
    const achievements = await setup({
      triviaAchievements: JSON.stringify({
        eu: { id: 'eu', name: 'JPD to Bangladesh', desc: 'Complete the EU category.', unlocked: true, icon: EU_ICON },
        sudoCute: { id: 'sudoCute', name: 'You so sudoCUTE', desc: 'Win your first Sudoku game.', unlocked: true },
      }),
    })
    const list = achievements.list.value
    expect(list.map((a) => a.id)).toEqual(BUILT_IN_IDS)
    expect(list.filter((a) => a.unlocked).map((a) => a.id)).toEqual(['eu', 'sudoCute'])
  })

  it('fires the unlock listener once and writes the legacy icon string', async () => {
    const achievements = await setup()
    const listener = vi.fn()
    achievements.onUnlocked(listener)

    achievements.unlock('eu')
    achievements.unlock('eu')
    achievements.unlock('does-not-exist')
    await settle()

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener.mock.calls[0]?.[0]).toMatchObject({ id: 'eu', unlocked: true })
    const stored = JSON.parse(localStorage.getItem('triviaAchievements') ?? '{}')
    expect(stored.eu.icon).toBe(EU_ICON)
    expect(stored.eu.unlocked).toBe(true)
  })

  it('hides deleted achievements', async () => {
    const achievements = await setup({ triviaDeletedAchievements: JSON.stringify(['hungary']) })
    expect(achievements.list.value.map((a) => a.id)).not.toContain('hungary')
    expect(achievements.list.value).toHaveLength(BUILT_IN_IDS.length - 1)
  })

  it('unlocks a custom trigger achievement when its stat reaches the target', async () => {
    const custom = { id: 'c1', name: 'Custom', desc: 'Do it', unlocked: false, customWorkoutAchievement: true, trigger: { stat: 'streak', target: 3 } }
    const achievements = await setup({ triviaWorkoutCustomAchievements: JSON.stringify([custom]) })

    achievements.evaluateTriggers({ streak: 2 })
    expect(achievements.list.value.find((a) => a.id === 'c1')?.unlocked).toBe(false)

    achievements.evaluateTriggers({ streak: 3 })
    expect(achievements.list.value.find((a) => a.id === 'c1')?.unlocked).toBe(true)
    await settle()
    const saved = JSON.parse(localStorage.getItem('triviaWorkoutCustomAchievements') ?? '[]')
    expect(saved[0]).toMatchObject({ id: 'c1', unlocked: true })
  })

  it('relocks every achievement', async () => {
    const achievements = await setup({ triviaAchievements: JSON.stringify({ eu: { id: 'eu', name: '', desc: '', unlocked: true } }) })
    achievements.relockAll()
    expect(achievements.list.value.every((a) => !a.unlocked)).toBe(true)
  })
})
