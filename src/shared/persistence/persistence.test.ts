import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import {
  booleanCodec,
  createLocalStorageAdapter,
  defineRepository,
  jsonCodec,
  numberCodec,
  setStorageAdapter,
  stringCodec,
  STORAGE_KEYS,
  type StorageAdapter,
} from './index'

type Difficulties = Record<string, Record<string, boolean>>

const LEGACY_SNAPSHOT: Record<string, string> = {
  [STORAGE_KEYS.triviaPoints]: '120',
  [STORAGE_KEYS.triviaMusicPref]: 'false',
  [STORAGE_KEYS.triviaMusicVolume]: '0.45',
  [STORAGE_KEYS.triviaDifficulties]: JSON.stringify({ eu: { easy: true, medium: false } }),
  [STORAGE_KEYS.daysLeftTargetDate]: '2026-11-27',
  unrelatedKey: 'leave me alone',
}

/** Builds an in-memory StorageAdapter for swap-in tests. */
function createMemoryAdapter(initial: Record<string, string> = {}): StorageAdapter & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial))
  return {
    data,
    async getItem(key) {
      return data.get(key) ?? null
    },
    async setItem(key, value) {
      data.set(key, value)
    },
    async removeItem(key) {
      data.delete(key)
    },
    async keys() {
      return [...data.keys()]
    },
  }
}

/** Snapshot of every key/value currently in localStorage. */
function snapshotLocalStorage(): Record<string, string> {
  const out: Record<string, string> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key !== null) out[key] = localStorage.getItem(key) ?? ''
  }
  return out
}

/** Flushes pending promises and watcher callbacks. */
async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
}

describe('persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    setStorageAdapter(createLocalStorageAdapter())
  })

  afterEach(() => {
    vi.restoreAllMocks()
    setStorageAdapter(createLocalStorageAdapter())
  })

  describe('legacy snapshot', () => {
    beforeEach(() => {
      for (const [key, value] of Object.entries(LEGACY_SNAPSHOT)) localStorage.setItem(key, value)
    })

    it('decodes legacy raw values into typed state', async () => {
      const points = defineRepository({ key: STORAGE_KEYS.triviaPoints, codec: numberCodec, defaults: () => 0 })()
      const music = defineRepository({ key: STORAGE_KEYS.triviaMusicPref, codec: booleanCodec, defaults: () => true })()
      const volume = defineRepository({ key: STORAGE_KEYS.triviaMusicVolume, codec: numberCodec, defaults: () => 1 })()
      const difficulties = defineRepository<Difficulties>({
        key: STORAGE_KEYS.triviaDifficulties,
        codec: jsonCodec<Difficulties>(),
        defaults: () => ({}),
      })()
      const targetDate = defineRepository({
        key: STORAGE_KEYS.daysLeftTargetDate,
        codec: stringCodec,
        defaults: () => 'none',
      })()

      await Promise.all([points.ready, music.ready, volume.ready, difficulties.ready, targetDate.ready])

      expect(points.state.value).toBe(120)
      expect(music.state.value).toBe(false)
      expect(volume.state.value).toBe(0.45)
      expect(difficulties.state.value).toEqual({ eu: { easy: true, medium: false } })
      expect(targetDate.state.value).toBe('2026-11-27')
    })

    it('does not write anything during load', async () => {
      const setItem = vi.spyOn(Storage.prototype, 'setItem')
      const before = snapshotLocalStorage()

      const points = defineRepository({ key: STORAGE_KEYS.triviaPoints, codec: numberCodec, defaults: () => 0 })()
      await points.ready
      await settle()

      expect(setItem).not.toHaveBeenCalled()
      expect(snapshotLocalStorage()).toEqual(before)
    })

    it('writes back in the exact legacy format and leaves unrelated keys alone', async () => {
      const points = defineRepository({ key: STORAGE_KEYS.triviaPoints, codec: numberCodec, defaults: () => 0 })()
      const music = defineRepository({ key: STORAGE_KEYS.triviaMusicPref, codec: booleanCodec, defaults: () => false })()
      const volume = defineRepository({ key: STORAGE_KEYS.triviaMusicVolume, codec: numberCodec, defaults: () => 0.45 })()
      const difficulties = defineRepository<Difficulties>({
        key: STORAGE_KEYS.triviaDifficulties,
        codec: jsonCodec<Difficulties>(),
        defaults: () => ({}),
      })()
      await Promise.all([points.ready, music.ready, volume.ready, difficulties.ready])

      music.state.value = true
      volume.state.value = 0.6
      points.state.value = 150
      difficulties.state.value = { eu: { easy: true, medium: true } }
      await settle()

      expect(localStorage.getItem(STORAGE_KEYS.triviaMusicPref)).toBe('true')
      expect(localStorage.getItem(STORAGE_KEYS.triviaMusicVolume)).toBe('0.6')
      expect(localStorage.getItem(STORAGE_KEYS.triviaPoints)).toBe('150')
      expect(localStorage.getItem(STORAGE_KEYS.triviaDifficulties)).toBe(
        JSON.stringify({ eu: { easy: true, medium: true } }),
      )
      expect(localStorage.getItem('unrelatedKey')).toBe('leave me alone')
      expect(localStorage.getItem(STORAGE_KEYS.daysLeftTargetDate)).toBe('2026-11-27')
    })

    it('falls back to defaults on corrupted JSON without overwriting until state changes', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      localStorage.setItem(STORAGE_KEYS.triviaAchievements, '{broken')
      const achievements = defineRepository({
        key: STORAGE_KEYS.triviaAchievements,
        codec: jsonCodec<Record<string, boolean>>(),
        defaults: () => ({}),
      })()

      await expect(achievements.ready).resolves.toBeUndefined()
      await settle()

      expect(achievements.state.value).toEqual({})
      expect(warn).toHaveBeenCalledTimes(1)
      expect(localStorage.getItem(STORAGE_KEYS.triviaAchievements)).toBe('{broken')

      achievements.state.value = { first: true }
      await settle()

      expect(localStorage.getItem(STORAGE_KEYS.triviaAchievements)).toBe('{"first":true}')
    })

    it('keeps defaults when the key is missing and does not write', async () => {
      const setItem = vi.spyOn(Storage.prototype, 'setItem')
      const sfx = defineRepository({ key: STORAGE_KEYS.triviaSfxVolume, codec: numberCodec, defaults: () => 0.8 })()
      await sfx.ready
      await settle()

      expect(sfx.state.value).toBe(0.8)
      expect(setItem).not.toHaveBeenCalled()
    })
  })

  describe('repository instances', () => {
    it('returns the same shared instance on every call', () => {
      const useCounter = defineRepository({ key: 'testCounter', codec: numberCodec, defaults: () => 0 })
      expect(useCounter()).toBe(useCounter())
      expect(useCounter().state).toBe(useCounter().state)
    })

    it('uses the adapter that is active when the repository is first created', async () => {
      const fake = createMemoryAdapter({ [STORAGE_KEYS.triviaSeason]: '2' })
      setStorageAdapter(fake)

      const season = defineRepository({ key: STORAGE_KEYS.triviaSeason, codec: stringCodec, defaults: () => '1' })()
      await season.ready
      expect(season.state.value).toBe('2')

      season.state.value = '1'
      await settle()

      expect(fake.data.get(STORAGE_KEYS.triviaSeason)).toBe('1')
      expect(localStorage.getItem(STORAGE_KEYS.triviaSeason)).toBeNull()
    })
  })

  describe('codecs', () => {
    it('numberCodec throws on non-numeric input', () => {
      expect(() => numberCodec.decode('abc')).toThrow()
      expect(numberCodec.decode('0.45')).toBe(0.45)
    })

    it('booleanCodec only treats the exact string "true" as true', () => {
      expect(booleanCodec.decode('true')).toBe(true)
      expect(booleanCodec.decode('TRUE')).toBe(false)
      expect(booleanCodec.encode(false)).toBe('false')
    })
  })
})
