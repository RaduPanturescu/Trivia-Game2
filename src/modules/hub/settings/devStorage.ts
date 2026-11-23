import { getStorageAdapter } from '@/shared/persistence'

/** One stored key with its raw string value, as listed by the dev storage editor. */
export interface StorageEntry {
  /** Storage key. */
  key: string
  /** Raw stored string. Empty when the key has no value. */
  value: string
}

/**
 * Reloads the page after a raw storage edit. Repositories keep their values in memory and write them
 * back on change, so an edit made underneath them only takes effect after a fresh load.
 */
function reloadAfterRawEdit(): void {
  window.location.reload()
}

/**
 * Lists every stored key with its raw value, in the adapter's order.
 * @returns The entries currently in storage.
 */
export async function listStorageEntries(): Promise<StorageEntry[]> {
  const adapter = getStorageAdapter()
  const keys = await adapter.keys()
  return Promise.all(keys.map(async (key) => ({ key, value: (await adapter.getItem(key)) ?? '' })))
}

/**
 * Writes a raw value and reloads the app so repositories pick it up.
 * @param key - Storage key to write.
 * @param value - Raw string value to store.
 */
export async function setRawValue(key: string, value: string): Promise<void> {
  await getStorageAdapter().setItem(key, value)
  reloadAfterRawEdit()
}

/**
 * Deletes a raw value and reloads the app so repositories drop it.
 * @param key - Storage key to delete.
 */
export async function removeRawValue(key: string): Promise<void> {
  await getStorageAdapter().removeItem(key)
  reloadAfterRawEdit()
}
