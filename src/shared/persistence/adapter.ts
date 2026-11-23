import { createLocalStorageAdapter } from './local'
import type { StorageAdapter } from './types'

let activeAdapter: StorageAdapter | undefined

/**
 * Returns the active storage adapter, creating the local one on first use.
 * @returns The adapter every repository reads from and writes to.
 */
export function getStorageAdapter(): StorageAdapter {
  activeAdapter ??= createLocalStorageAdapter()
  return activeAdapter
}

/**
 * Replaces the active storage adapter. Repositories created after this call use the new adapter.
 * @param adapter - The adapter to use (e.g. a remote backend or an in-memory fake in tests).
 */
export function setStorageAdapter(adapter: StorageAdapter): void {
  activeAdapter = adapter
}
