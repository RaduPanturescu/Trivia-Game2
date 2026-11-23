import { computed, onScopeDispose, ref, type ComputedRef, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { NAME_FALLBACK_MS } from './logic'
import { contestantName } from './session'
import { useMillionaireAudio } from './useMillionaireAudio'

/** Longest contestant name the form accepts, as in the legacy input. */
export const MAX_NAME_LENGTH = 20

/** Registration-screen state and actions returned by {@link useMillionaireRegistration}. */
export interface MillionaireRegistrationApi {
  /** Raw text of the name input. */
  name: Ref<string>
  /** Preview line under the form: `Contestant: name`, or `Welcome, name!` while starting. */
  preview: ComputedRef<string>
  /** Whether the Continue button is enabled. */
  canContinue: ComputedRef<boolean>
  /** True between a confirmed name and leaving for the game. */
  starting: Ref<boolean>
  /** Confirms the trimmed name and starts the game after the jingle, or after a fallback delay. */
  submit(): void
}

/**
 * Name-entry logic. Confirming stores the trimmed name, unlocks the audio inside the click, plays the
 * name-selected jingle and then replaces the route with the game. Timers are cleared on unmount.
 * @returns The form state and the submit action.
 */
export function useMillionaireRegistration(): MillionaireRegistrationApi {
  const router = useRouter()
  const audio = useMillionaireAudio()
  const name = ref('')
  const starting = ref(false)
  const trimmed = computed(() => name.value.trim())
  const canContinue = computed(() => trimmed.value.length > 0 && !starting.value)
  const preview = computed(() => {
    if (starting.value) return `Welcome, ${trimmed.value}!`
    return trimmed.value ? `Contestant: ${trimmed.value}` : ''
  })
  let fallback: ReturnType<typeof setTimeout> | undefined
  let disposed = false

  /** Leaves for the game once. Runs from the jingle's end or the fallback timer, whichever comes first. */
  function proceed(): void {
    if (disposed) return
    disposed = true
    clearTimeout(fallback)
    void router.replace({ name: 'millionaire-play' })
  }

  /** Confirms the name and starts the transition to the game. */
  function submit(): void {
    if (!canContinue.value) return
    contestantName.value = trimmed.value
    starting.value = true
    audio.unlockTracks()
    audio.stopNameLoop()
    audio.playNameSelected(proceed)
    fallback = setTimeout(proceed, NAME_FALLBACK_MS)
  }

  onScopeDispose(() => {
    disposed = true
    clearTimeout(fallback)
  })

  return { name, preview, canContinue, starting, submit }
}
