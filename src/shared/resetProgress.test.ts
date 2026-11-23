import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('resetAllProgress', () => {
  let reload: ReturnType<typeof vi.fn>

  beforeEach(() => {
    localStorage.clear()
    reload = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload })
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 23, 9, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('keeps locked custom workout achievements and resets everything else', async () => {
    localStorage.setItem('triviaPoints', '5')
    localStorage.setItem('devMode', 'true')
    localStorage.setItem('mayaClickCount', '3')
    localStorage.setItem(
      'triviaWorkoutCustomAchievements',
      JSON.stringify([{ id: 'c1', name: 'Custom', desc: '', unlocked: true, customWorkoutAchievement: true }]),
    )
    const { resetAllProgress } = await import('./resetProgress')

    await resetAllProgress()

    expect(localStorage.getItem('triviaPoints')).toBeNull()
    expect(localStorage.getItem('devMode')).toBeNull()
    expect(localStorage.getItem('mayaClickCount')).toBeNull()
    expect(JSON.parse(localStorage.getItem('triviaWorkoutCustomAchievements') ?? '[]')).toEqual([
      { id: 'c1', name: 'Custom', desc: '', unlocked: false, customWorkoutAchievement: true },
    ])
    expect(JSON.parse(localStorage.getItem('triviaWorkoutWeeklyTemplate') ?? '{}')[6]).toEqual({ type: 'rest', exercises: [] })
    expect(localStorage.getItem('triviaWorkoutProgramStartDate')).toBe('2026-11-23')
    expect(reload).toHaveBeenCalledTimes(1)
  })
})
