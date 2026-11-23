import { onScopeDispose } from 'vue'
import { useDevMode } from '@/shared/devMode'
import { TITLE_FALLBACK_MS } from './logic'
import { useMillionaireAudio } from './useMillionaireAudio'

/** Title-screen controls returned by {@link useMillionaireTitle}. */
export interface MillionaireTitleApi {
  /** Whether the skip button is shown. Developer mode only, as in the legacy app. */
  canSkip: boolean
  /** Ends the intro now and moves on to the name screen. */
  skip(): void
}

/**
 * Plays the title intro and moves on to the name screen when it ends, when skip is pressed, or after a fallback
 * delay. The intro hands over to the name-selection loop. Timers are cleared when the component unmounts.
 * @param onDone - Called once when the title screen is finished.
 * @returns The skip state and action.
 */
export function useMillionaireTitle(onDone: () => void): MillionaireTitleApi {
  const audio = useMillionaireAudio()
  let finished = false

  /** Moves on once: stops the intro, starts the name loop and notifies the view. */
  function finish(): void {
    if (finished) return
    finished = true
    clearTimeout(fallback)
    audio.stopIntro()
    audio.playNameLoop()
    onDone()
  }

  audio.playIntro(finish)
  const fallback = setTimeout(() => finish(), TITLE_FALLBACK_MS)
  onScopeDispose(() => {
    finished = true
    clearTimeout(fallback)
  })

  return { canSkip: useDevMode().isDev.value, skip: finish }
}
