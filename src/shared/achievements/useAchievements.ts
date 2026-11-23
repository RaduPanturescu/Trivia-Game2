import { computed, type ComputedRef } from 'vue'
import { defineRepository, jsonCodec, STORAGE_KEYS } from '../persistence'
import { BUILT_IN_ACHIEVEMENTS } from './definitions'
import type { Achievement, StoredAchievementMap } from './types'

/** Unlock state and rendering data for every achievement, keyed by id. Stored under `triviaAchievements`. */
const useStoredAchievements = defineRepository({
  key: STORAGE_KEYS.triviaAchievements,
  codec: jsonCodec<StoredAchievementMap>(),
  defaults: () => ({}),
})

/** User-created workout achievement definitions. Stored under `triviaWorkoutCustomAchievements`. */
const useCustomAchievements = defineRepository({
  key: STORAGE_KEYS.triviaWorkoutCustomAchievements,
  codec: jsonCodec<Achievement[]>(),
  defaults: () => [],
})

/** Ids of achievements the user deleted; they stay hidden. Stored under `triviaDeletedAchievements`. */
const useDeletedAchievements = defineRepository({
  key: STORAGE_KEYS.triviaDeletedAchievements,
  codec: jsonCodec<string[]>(),
  defaults: () => [],
})

/** Public surface of the achievements store. */
export interface AchievementsApi {
  /** Resolves once the stored achievement data has loaded. Mutations made before this are discarded. */
  ready: Promise<void>
  /** Visible achievements: built-ins first, then custom ones, minus deleted ids. */
  list: ComputedRef<Achievement[]>
  /** Unlocks an achievement, persists, and notifies listeners. No-op when unknown or already unlocked. */
  unlock(id: string): void
  /** Locks an achievement again and persists. */
  relock(id: string): void
  /** Locks every visible achievement and persists. */
  relockAll(): void
  /** Unlocks every locked achievement whose trigger stat has reached its target. */
  evaluateTriggers(stats: Record<string, number>): void
  /** Registers a callback fired once per unlock. @returns A function that removes the callback. */
  onUnlocked(callback: (achievement: Achievement) => void): () => void
}

/** Legacy HTML icon for a built-in image, kept in storage so older builds can still read it. */
function legacyIcon(image: string): string {
  return `<img src="${image.slice(1)}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;display:block;">`
}

/** Builds the achievements store. Called once by {@link useAchievements}. */
function createAchievements(): AchievementsApi {
  const stored = useStoredAchievements()
  const custom = useCustomAchievements()
  const deleted = useDeletedAchievements()
  const listeners = new Set<(achievement: Achievement) => void>()

  const list = computed<Achievement[]>(() => {
    const flags: StoredAchievementMap = stored.state.value ?? {}
    const hidden = new Set(Array.isArray(deleted.state.value) ? deleted.state.value : [])
    const customDefinitions = (Array.isArray(custom.state.value) ? custom.state.value : []).filter(
      (achievement) => achievement?.id && achievement.customWorkoutAchievement,
    )
    const builtIns = BUILT_IN_ACHIEVEMENTS.map((definition) => ({
      ...definition,
      unlocked: flags[definition.id]?.unlocked === true,
    }))
    const customs = customDefinitions.map((achievement) => ({
      ...achievement,
      unlocked: flags[achievement.id] ? flags[achievement.id]?.unlocked === true : achievement.unlocked === true,
    }))
    return [...builtIns, ...customs].filter((achievement) => !hidden.has(achievement.id))
  })

  /** Writes the full visible list back in the legacy shape: the stored map and the custom definitions. */
  function persist(items: Achievement[]): void {
    stored.state.value = Object.fromEntries(items.map((achievement) => [achievement.id, withLegacyIcon(achievement)]))
    custom.state.value = items.filter((achievement) => achievement.customWorkoutAchievement)
  }

  /** Adds the legacy `icon` string to built-in entries; custom entries are stored unchanged. */
  function withLegacyIcon(achievement: Achievement): Achievement {
    const definition = BUILT_IN_ACHIEVEMENTS.find((item) => item.id === achievement.id)
    return definition?.image ? { ...achievement, icon: legacyIcon(definition.image) } : achievement
  }

  /** Applies a change to every visible achievement and persists the result. */
  function update(change: (achievement: Achievement) => Achievement): void {
    persist(list.value.map(change))
  }

  function unlock(id: string): void {
    const target = list.value.find((achievement) => achievement.id === id)
    if (!target || target.unlocked) return
    update((achievement) => (achievement.id === id ? { ...achievement, unlocked: true } : achievement))
    for (const listener of listeners) listener({ ...target, unlocked: true })
  }

  function relock(id: string): void {
    update((achievement) => (achievement.id === id ? { ...achievement, unlocked: false } : achievement))
  }

  function relockAll(): void {
    update((achievement) => ({ ...achievement, unlocked: false }))
  }

  function evaluateTriggers(stats: Record<string, number>): void {
    for (const achievement of list.value) {
      const trigger = achievement.trigger
      if (!trigger || achievement.unlocked || !Object.hasOwn(stats, trigger.stat)) continue
      if (Number(stats[trigger.stat]) >= Number(trigger.target)) unlock(achievement.id)
    }
  }

  function onUnlocked(callback: (achievement: Achievement) => void): () => void {
    listeners.add(callback)
    return () => listeners.delete(callback)
  }

  return {
    ready: Promise.all([stored.ready, custom.ready, deleted.ready]).then(() => undefined),
    list,
    unlock,
    relock,
    relockAll,
    evaluateTriggers,
    onUnlocked,
  }
}

let instance: AchievementsApi | undefined

/**
 * Returns the shared achievements store, creating it on first call.
 * @returns The achievements API (list, unlock/relock, triggers, listeners).
 */
export function useAchievements(): AchievementsApi {
  instance ??= createAchievements()
  return instance
}
