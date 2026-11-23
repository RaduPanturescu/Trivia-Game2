import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/** Built-in ids in legacy order. */
const BUILT_IN_IDS = ['eu', 'hungary', 'romania', 'trains', 'personal', 'sudoCute', 'millionaire', 'minesweeper', 'mayaOverload', 'hackerAttempt']

/** Workout milestone ids in legacy order, listed after built-ins and custom ones. */
const MILESTONE_IDS = ['firstWorkout', 'workout3', 'workout5', 'workout10', 'workout15', 'workout30']

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
    expect(list.map((a) => a.id)).toEqual([...BUILT_IN_IDS, ...MILESTONE_IDS])
    expect(list.filter((a) => a.unlocked).map((a) => a.id)).toEqual(['eu', 'sudoCute'])
  })

  it('keeps unlocked workout milestones and their emoji icon through an unrelated unlock', async () => {
    const achievements = await setup({
      triviaAchievements: JSON.stringify({
        firstWorkout: { id: 'firstWorkout', name: 'First Lift', desc: 'Complete your first workout day.', icon: '🏆', unlocked: true },
      }),
    })
    expect(achievements.list.value.find((a) => a.id === 'firstWorkout')?.unlocked).toBe(true)

    achievements.unlock('eu')
    await settle()

    const stored = JSON.parse(localStorage.getItem('triviaAchievements') ?? '{}')
    expect(stored.firstWorkout).toMatchObject({ unlocked: true, icon: '🏆' })
    expect(stored.eu.unlocked).toBe(true)
    expect(achievements.list.value.find((a) => a.id === 'firstWorkout')?.unlocked).toBe(true)
  })

  it('keeps stored entries with unknown ids when persisting', async () => {
    const achievements = await setup({
      triviaAchievements: JSON.stringify({ futureThing: { id: 'futureThing', name: 'Later', desc: 'x', unlocked: true } }),
    })
    achievements.unlock('eu')
    await settle()

    const stored = JSON.parse(localStorage.getItem('triviaAchievements') ?? '{}')
    expect(stored.futureThing).toMatchObject({ id: 'futureThing', unlocked: true })
  })

  it('keeps a deleted workout milestone hidden and out of storage', async () => {
    const achievements = await setup({ triviaDeletedAchievements: JSON.stringify(['workout3']) })
    expect(achievements.list.value.map((a) => a.id)).not.toContain('workout3')
    expect(achievements.list.value).toHaveLength(BUILT_IN_IDS.length + MILESTONE_IDS.length - 1)

    achievements.unlock('eu')
    await settle()
    const stored = JSON.parse(localStorage.getItem('triviaAchievements') ?? '{}')
    expect(stored).not.toHaveProperty('workout3')
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
    expect(achievements.list.value).toHaveLength(BUILT_IN_IDS.length + MILESTONE_IDS.length - 1)
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

  it('saveCustom appends a new workout achievement and persists it under the legacy custom key', async () => {
    const achievements = await setup()
    achievements.saveCustom({ id: 'customWorkout-1', name: 'Hundred', desc: 'Lift 100 kg.', unlocked: false, emoji: '🏋️' })
    await settle()

    const ids = achievements.list.value.map((a) => a.id)
    expect(ids.slice(BUILT_IN_IDS.length)).toEqual(['customWorkout-1', ...MILESTONE_IDS])
    const custom = JSON.parse(localStorage.getItem('triviaWorkoutCustomAchievements') ?? '[]')
    expect(custom).toEqual([expect.objectContaining({ id: 'customWorkout-1', customWorkoutAchievement: true })])
  })

  it('saveCustom replaces an existing entry in place and keeps its custom flag', async () => {
    const achievements = await setup({
      triviaWorkoutCustomAchievements: JSON.stringify([{ id: 'customWorkout-1', name: 'Old', desc: 'x', unlocked: false, emoji: '🏋️', customWorkoutAchievement: true }]),
    })
    const before = achievements.list.value.findIndex((a) => a.id === 'customWorkout-1')
    achievements.saveCustom({ id: 'customWorkout-1', name: 'New', desc: 'y', unlocked: false, emoji: '💪' })
    await settle()

    expect(achievements.list.value.findIndex((a) => a.id === 'customWorkout-1')).toBe(before)
    expect(achievements.list.value.find((a) => a.id === 'customWorkout-1')?.name).toBe('New')
    expect(achievements.list.value.find((a) => a.id === 'customWorkout-1')?.customWorkoutAchievement).toBe(true)
  })

  it('remove hides the achievement, records its id as deleted and drops it from storage', async () => {
    const achievements = await setup({
      triviaWorkoutCustomAchievements: JSON.stringify([{ id: 'customWorkout-2', name: 'Gone', desc: 'x', unlocked: true, emoji: '🔥', customWorkoutAchievement: true }]),
    })
    achievements.remove('customWorkout-2')
    await settle()

    expect(achievements.list.value.map((a) => a.id)).not.toContain('customWorkout-2')
    expect(JSON.parse(localStorage.getItem('triviaDeletedAchievements') ?? '[]')).toContain('customWorkout-2')
    expect(JSON.parse(localStorage.getItem('triviaWorkoutCustomAchievements') ?? '[]')).toEqual([])
  })
})
