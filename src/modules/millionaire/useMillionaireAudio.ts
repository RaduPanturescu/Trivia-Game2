import { onScopeDispose } from 'vue'
import { useAudio } from '@/shared/composables/useAudio'
import { backgroundLevelForQuestion, millionaireAudio, stopAllMillionaireAudio } from './audio'

/** Background volume used when the shared setting is 0 or not a number, as in the legacy app. */
const FALLBACK_MUSIC_VOLUME = 0.3

/** Number of Millionaire screens mounted right now. Shared music stays silenced while it is above zero. */
let flowDepth = 0

/** True after the unlock click primed track 1 while it is still silent. Legacy `millionaireBg1UnlockedAndPlaying`. */
let primedFirstTrack = false

/** Sound controls for the Millionaire screens. Sound settings come from the shared audio controller. */
export interface MillionaireAudioApi {
  /** Plays the title intro once and calls `onEnded` when it finishes. */
  playIntro(onEnded: () => void): void
  /** Stops the title intro. */
  stopIntro(): void
  /** Loops the name-selection track. */
  playNameLoop(): void
  /** Stops and rewinds the name-selection track. */
  stopNameLoop(): void
  /** Plays the name-selected jingle once and calls `onEnded` when it finishes. */
  playNameSelected(onEnded: () => void): void
  /** Plays and pauses every track inside a user gesture so that later playback is allowed. Legacy autoplay unlock. */
  unlockTracks(): void
  /** Starts the background track for a 0-based question index and pauses the others. Does nothing when music is off. */
  playBackgroundFor(index: number): void
  /** Pauses the background tracks, for example while an answer is pending. */
  pauseBackground(): void
  /** Starts the answer-pending sound, if sound effects are on. */
  playAnswerPending(): void
  /** Stops the answer-pending sound. */
  stopAnswerPending(): void
  /** Plays the correct-answer sound, if sound effects are on. */
  playAnswerCorrect(): void
  /** Plays the wrong-answer sound, if sound effects are on. */
  playAnswerWrong(): void
  /** Stops every Millionaire track and sound. */
  stopAll(): void
}

/**
 * Clamps a volume to 0-1, the range media elements accept.
 * @param volume - Requested volume.
 * @returns A volume between 0 and 1.
 */
function clampVolume(volume: number): number {
  return Math.min(1, Math.max(0, volume))
}

/**
 * Starts playback and ignores blocked autoplay, as the legacy app does.
 * @param element - The element to start.
 */
function startPlayback(element: HTMLAudioElement): void {
  element.play().catch(() => {
    // Blocked playback is ignored. The next user gesture retries where the legacy app did.
  })
}

/**
 * Pauses and rewinds an element.
 * @param element - The element to stop.
 */
function rewind(element: HTMLAudioElement): void {
  element.pause()
  element.currentTime = 0
}

/**
 * Current sound-effect volume from the shared settings.
 * @returns A volume between 0 and 1.
 */
function sfxVolume(): number {
  return clampVolume(useAudio().sfxVolume.value)
}

/**
 * Current background volume from the shared settings. A value of 0 uses the legacy fallback.
 * @returns A volume between 0 and 1.
 */
function musicVolume(): number {
  const volume = useAudio().musicVolume.value
  return volume ? clampVolume(volume) : FALLBACK_MUSIC_VOLUME
}

/** The controller. One instance, because the elements are shared. */
const api: MillionaireAudioApi = {
  playIntro(onEnded) {
    const intro = millionaireAudio().intro
    intro.currentTime = 0
    intro.addEventListener('ended', onEnded, { once: true })
    startPlayback(intro)
  },

  stopIntro() {
    rewind(millionaireAudio().intro)
  },

  playNameLoop() {
    const loop = millionaireAudio().nameLoop
    loop.currentTime = 0
    loop.play().catch(() => {
      // Retry on the next click when the browser blocked autoplay, as the legacy app does.
      document.addEventListener('click', () => startPlayback(loop), { once: true })
    })
  },

  stopNameLoop() {
    rewind(millionaireAudio().nameLoop)
  },

  playNameSelected(onEnded) {
    const selected = millionaireAudio().nameSelected
    selected.volume = clampVolume(sfxVolume() * 2)
    selected.currentTime = 0
    selected.addEventListener('ended', onEnded, { once: true })
    startPlayback(selected)
  },

  unlockTracks() {
    const { background, answerPending, answerCorrect, answerWrong } = millionaireAudio()
    const tracks = [background[1], background[2], background[3], background[4], answerPending, answerCorrect, answerWrong]
    for (const track of tracks) {
      track.volume = 0
      startPlayback(track)
      if (track === background[1]) {
        primedFirstTrack = true
      } else {
        rewind(track)
      }
    }
  },

  playBackgroundFor(index) {
    if (!useAudio().musicEnabled.value) return
    const { background } = millionaireAudio()
    const level = backgroundLevelForQuestion(index)
    const active = background[level]
    for (const other of Object.values(background)) {
      if (other !== active && !other.paused) rewind(other)
    }
    active.volume = musicVolume()
    if (active === background[1] && primedFirstTrack) {
      // Already playing silently since the unlock click, so only the volume changes.
      primedFirstTrack = false
    } else if (active.paused) {
      startPlayback(active)
    }
  },

  pauseBackground() {
    for (const track of Object.values(millionaireAudio().background)) {
      if (!track.paused) track.pause()
    }
  },

  playAnswerPending() {
    if (!useAudio().soundEnabled.value) return
    const pending = millionaireAudio().answerPending
    pending.volume = sfxVolume()
    pending.currentTime = 0
    startPlayback(pending)
  },

  stopAnswerPending() {
    rewind(millionaireAudio().answerPending)
  },

  playAnswerCorrect() {
    playSound(millionaireAudio().answerCorrect)
  },

  playAnswerWrong() {
    playSound(millionaireAudio().answerWrong)
  },

  stopAll() {
    stopAllMillionaireAudio()
    primedFirstTrack = false
  },
}

/**
 * Plays an answer sound from the start, if sound effects are on.
 * @param sound - The element to play.
 */
function playSound(sound: HTMLAudioElement): void {
  if (!useAudio().soundEnabled.value) return
  sound.volume = sfxVolume()
  sound.currentTime = 0
  startPlayback(sound)
}

/**
 * Returns the Millionaire audio controls. Call it wherever a sound is played.
 * @returns The shared {@link MillionaireAudioApi}.
 */
export function useMillionaireAudio(): MillionaireAudioApi {
  return api
}

/**
 * Marks a Millionaire screen as mounted for the lifetime of the calling component. Shared background music is
 * silenced while any Millionaire screen is mounted. When the last one unmounts, the Millionaire sounds stop and
 * music resumes if it is enabled. Call once per Millionaire view, during setup.
 */
export function useMillionaireFlow(): void {
  flowDepth++
  if (flowDepth === 1) useAudio().suppressMusic(true)
  onScopeDispose(() => {
    flowDepth = Math.max(0, flowDepth - 1)
    if (flowDepth > 0) return
    api.stopAll()
    useAudio().suppressMusic(false)
  })
}
