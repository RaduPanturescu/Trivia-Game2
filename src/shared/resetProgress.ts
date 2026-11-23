import type { Achievement } from './achievements'
import { isoDate } from './dates'
import { getStorageAdapter, STORAGE_KEYS } from './persistence'

/** Weekly workout template with every day set to rest. */
function restWeekTemplate(): string {
  return JSON.stringify(Object.fromEntries(Array.from({ length: 7 }, (_, day) => [day, { type: 'rest', exercises: [] }])))
}

/**
 * Serialises the custom workout achievements with every one locked again.
 * @param raw - The stored `triviaWorkoutCustomAchievements` value, or `null`.
 * @returns The locked definitions as JSON, or `null` when there is nothing valid to keep.
 */
function lockedCustomDefinitions(raw: string | null): string | null {
  if (!raw) return null
  try {
    const definitions: unknown = JSON.parse(raw)
    if (!Array.isArray(definitions)) return null
    return JSON.stringify((definitions as Achievement[]).map((achievement) => ({ ...achievement, unlocked: false })))
  } catch {
    return null
  }
}

/**
 * Erases all app data except locked custom workout achievements, writes a rest-week template
 * and today as the program start, then reloads the page.
 */
export async function resetAllProgress(): Promise<void> {
  const adapter = getStorageAdapter()
  const customKey = STORAGE_KEYS.triviaWorkoutCustomAchievements
  const customDefinitions = lockedCustomDefinitions(await adapter.getItem(customKey))

  for (const key of await adapter.keys()) {
    if (key !== customKey) await adapter.removeItem(key)
  }
  if (customDefinitions !== null) await adapter.setItem(customKey, customDefinitions)
  else await adapter.removeItem(customKey)

  await adapter.setItem(STORAGE_KEYS.triviaWorkoutWeeklyTemplate, restWeekTemplate())
  await adapter.setItem(STORAGE_KEYS.triviaWorkoutProgramStartDate, isoDate(new Date()))
  window.location.reload()
}
