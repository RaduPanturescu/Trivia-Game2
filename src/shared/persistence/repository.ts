import { effectScope, ref, watch, type Ref } from 'vue'
import { getStorageAdapter } from './adapter'
import type { Codec, StorageAdapter } from './types'

/** Definition of one persisted value. */
export interface RepositoryOptions<T> {
  /** Storage key, byte-identical to the legacy key. */
  key: string
  /** Converts the value to and from its raw stored string. */
  codec: Codec<T>
  /** Factory for the initial value, used until (and unless) stored data loads. */
  defaults: () => T
}

/** A loaded, auto-saving value shared across the app. */
export interface Repository<T> {
  /** Reactive value. Mutations are written back to storage after load completes. */
  state: Ref<T>
  /** Resolves once stored data has been loaded (or skipped). Writes start only after this. */
  ready: Promise<void>
}

/**
 * Defines a persisted value. The returned composable creates one shared {@link Repository} on first call
 * and returns the same instance afterwards.
 * @param options - Storage key, codec and defaults for the value.
 * @returns A function returning the shared repository.
 */
export function defineRepository<T>(options: RepositoryOptions<T>): () => Repository<T> {
  let instance: Repository<T> | undefined
  return () => {
    instance ??= createRepository(options)
    return instance
  }
}

/** Builds a repository: loads the stored value, then saves every later change. */
function createRepository<T>({ key, codec, defaults }: RepositoryOptions<T>): Repository<T> {
  const adapter: StorageAdapter = getStorageAdapter()
  const state = ref(defaults()) as Ref<T>

  const save = async (value: T): Promise<void> => {
    try {
      await adapter.setItem(key, codec.encode(value))
    } catch (error) {
      console.warn(`[persistence] could not save "${key}"`, error)
    }
  }

  const ready = (async () => {
    const raw = await adapter.getItem(key)
    if (raw !== null) {
      try {
        state.value = codec.decode(raw)
      } catch (error) {
        console.warn(`[persistence] could not decode "${key}", using defaults`, error)
      }
    }
    // Watcher starts only after load, so loading never writes and defaults never overwrite stored data.
    effectScope(true).run(() => {
      watch(state, (value) => void save(value), { deep: true })
    })
  })()

  return { state, ready }
}
