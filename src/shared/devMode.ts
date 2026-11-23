import { ref, type Ref } from 'vue'
import { useAchievements } from './achievements'
import { booleanCodec, defineRepository, STORAGE_KEYS } from './persistence'

// shortcut: client-side toy gate, not security; move server-side when auth lands.
const DEV_PASSWORD = 'raduissexy'

/** Consecutive wrong passwords before the hacker achievement unlocks. */
export const MAX_FAILED_ATTEMPTS = 5

/** Result of a password attempt: `ok` activates dev mode, `wrong` is a normal miss, `hacker` is the fifth miss. */
export type DevUnlockResult = 'ok' | 'wrong' | 'hacker'

/** Public surface of the developer-mode gate. */
export interface DevModeApi {
  /** Resolves once the stored dev-mode flag has loaded. */
  ready: Promise<void>
  /** Whether developer mode is on. Stored under `devMode` as `'true'` / `'false'`. */
  isDev: Ref<boolean>
  /** Consecutive failed attempts since the last success or lockout. */
  failStreak: Ref<number>
  /** Checks a password. Turns dev mode on when correct. */
  tryUnlock(password: string): DevUnlockResult
  /** Turns developer mode off. */
  deactivate(): void
}

/** Stored dev-mode flag. */
const useDevModeStore = defineRepository({
  key: STORAGE_KEYS.devMode,
  codec: booleanCodec,
  defaults: () => false,
})

/** Builds the dev-mode gate. Called once by {@link useDevMode}. */
function createDevMode(): DevModeApi {
  const store = useDevModeStore()
  const achievements = useAchievements()
  const failStreak = ref(0)

  function tryUnlock(password: string): DevUnlockResult {
    if (password === DEV_PASSWORD) {
      failStreak.value = 0
      store.state.value = true
      return 'ok'
    }
    failStreak.value++
    if (failStreak.value >= MAX_FAILED_ATTEMPTS) {
      failStreak.value = 0
      achievements.unlock('hackerAttempt')
      return 'hacker'
    }
    return 'wrong'
  }

  function deactivate(): void {
    store.state.value = false
  }

  return { ready: store.ready, isDev: store.state, failStreak, tryUnlock, deactivate }
}

let instance: DevModeApi | undefined

/**
 * Returns the shared developer-mode gate, creating it on first call.
 * @returns The dev-mode API (isDev flag, password attempts, deactivate).
 */
export function useDevMode(): DevModeApi {
  instance ??= createDevMode()
  return instance
}
