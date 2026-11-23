import { computed, type ComputedRef } from 'vue'
import { defineRepository, jsonCodec, STORAGE_KEYS } from '../persistence'
import { BUILT_IN_ACHIEVEMENTS, WORKOUT_MILESTONE_ACHIEVEMENTS } from './definitions'
import type { Achievement, StoredAchievementMap } from './types'
import { defineSingleton } from '../singleton'

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
  /** Visible achievements: built-ins, then custom ones, then workout milestones, minus deleted ids. */
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
  /**
   * Adds or replaces an achievement by id and persists it. A new id is appended; an existing one keeps its place.
   * The `customWorkoutAchievement` flag is kept from the existing entry, or set for new ones (legacy save rule).
   * @param achievement - The full achievement to store.
   */
  saveCustom(achievement: Achievement): void
  /**
   * Deletes an achievement and remembers its id so it stays hidden. Persists the remaining list.
   * @param id - The achievement id to delete.
   */
  remove(id: string): void
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
    const milestones = WORKOUT_MILESTONE_ACHIEVEMENTS.map((definition) => ({
      ...definition,
      unlocked: flags[definition.id]?.unlocked === true,
    }))
    return [...builtIns, ...customs, ...milestones].filter((achievement) => !hidden.has(achievement.id))
  })

  /**
   * Writes the visible list back in the legacy shape: the stored map and the custom definitions.
   * Stored entries that are neither visible nor deleted (unknown ids) are kept, so nothing is dropped silently.
   */
  function persist(items: Achievement[]): void {
    const hidden = new Set(Array.isArray(deleted.state.value) ? deleted.state.value : [])
    const known = new Set(items.map((achievement) => achievement.id))
    const unknown = Object.entries(stored.state.value ?? {}).filter(([id]) => !known.has(id) && !hidden.has(id))
    stored.state.value = {
      ...Object.fromEntries(items.map((achievement) => [achievement.id, withLegacyIcon(achievement)])),
      ...Object.fromEntries(unknown),
    }
    custom.state.value = items.filter((achievement) => achievement.customWorkoutAchievement)
  }

  /**
   * Adds the legacy `icon` string: the image tag for built-ins, the emoji for workout milestones.
   * Custom entries are stored unchanged.
   */
  function withLegacyIcon(achievement: Achievement): Achievement {
    const definition = BUILT_IN_ACHIEVEMENTS.find((item) => item.id === achievement.id)
    if (definition?.image) return { ...achievement, icon: legacyIcon(definition.image) }
    const milestone = WORKOUT_MILESTONE_ACHIEVEMENTS.find((item) => item.id === achievement.id)
    return milestone?.emoji ? { ...achievement, icon: milestone.emoji } : achievement
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

  function saveCustom(achievement: Achievement): void {
    const current = list.value
    const existing = current.find((item) => item.id === achievement.id)
    const next: Achievement = { ...achievement, customWorkoutAchievement: existing ? existing.customWorkoutAchievement : true }
    persist(existing ? current.map((item) => (item.id === next.id ? next : item)) : [...current, next])
  }

  function remove(id: string): void {
    const remaining = list.value.filter((achievement) => achievement.id !== id)
    const hidden = Array.isArray(deleted.state.value) ? deleted.state.value : []
    deleted.state.value = [...new Set([...hidden, id])]
    persist(remaining)
  }

  return {
    ready: Promise.all([stored.ready, custom.ready, deleted.ready]).then(() => undefined),
    list,
    unlock,
    relock,
    relockAll,
    evaluateTriggers,
    onUnlocked,
    saveCustom,
    remove,
  }
}

/**
 * Returns the shared achievements store, creating it on first call.
 * @returns The achievements API (list, unlock/relock, triggers, listeners).
 */
export const useAchievements: () => AchievementsApi = defineSingleton(createAchievements)
