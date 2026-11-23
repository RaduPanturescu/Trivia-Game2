import type { StorageAdapter } from './types'

/**
 * Wraps a Web Storage object (default `window.localStorage`) as an async {@link StorageAdapter}.
 * @param storage - The Storage instance to wrap.
 * @returns An adapter reading and writing raw strings in `storage`.
 */
export function createLocalStorageAdapter(storage: Storage = window.localStorage): StorageAdapter {
  return {
    async getItem(key) {
      return storage.getItem(key)
    },
    async setItem(key, value) {
      storage.setItem(key, value)
    },
    async removeItem(key) {
      storage.removeItem(key)
    },
    async keys() {
      const keys: string[] = []
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i)
        if (key !== null) keys.push(key)
      }
      return keys
    },
  }
}
