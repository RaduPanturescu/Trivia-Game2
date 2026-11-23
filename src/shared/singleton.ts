import { effectScope } from 'vue'

/**
 * Wraps a factory so it runs once and every later call returns the same instance.
 *
 * The factory runs inside a detached effect scope. Watchers and computeds it creates therefore belong to the singleton,
 * not to whichever component happened to call first. Without this, Vue stops them when that component unmounts.
 * @param factory - Builds the shared instance. Runs once, on the first call of the returned function.
 * @returns A function that returns the shared instance, creating it on first call.
 */
export function defineSingleton<T>(factory: () => T): () => T {
  let created = false
  let instance: T | undefined
  return () => {
    if (!created) {
      // A fresh scope is always active, so `run` returns the factory result, never `undefined`.
      instance = effectScope(true).run(factory) as T
      created = true
    }
    return instance as T
  }
}
