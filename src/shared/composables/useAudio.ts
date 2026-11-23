import { watch, type Ref } from 'vue'
import { useMusicEnabled, useMusicVolume, useSfxVolume, useSoundEnabled } from '../settings'

/** Background music track: `main` for the trivia screens, `workout` for the workout screens. */
export type MusicTrack = 'main' | 'workout'

/** Known sound-effect files. */
export const SFX = {
  /** Short pop played on button clicks. */
  pop: '/assets/pop_sound.wav',
} as const

/** Public surface of the shared audio controller returned by {@link useAudio}. */
export interface AudioApi {
  /** Whether background music is enabled (persisted). */
  musicEnabled: Ref<boolean>
  /** Background music volume from 0 to 1 (persisted). */
  musicVolume: Ref<number>
  /** Whether sound effects are enabled (persisted). */
  soundEnabled: Ref<boolean>
  /** Sound effects volume from 0 to 1 (persisted). */
  sfxVolume: Ref<number>
  /** Selects the background track, pauses the other one, and starts playback if music is enabled. */
  setMusicTrack: (track: MusicTrack) => void
  /** Silences background music while `on` is true. Turning it off resumes music if enabled. */
  suppressMusic: (on: boolean) => void
  /** Starts the active track if music is enabled, not suppressed, and not already playing. */
  playMusic: () => void
  /** Plays the sound at `src` from the start at the sound-effects volume, if sound is enabled. */
  playSfx: (src: string) => void
}

const MUSIC_SRC: Record<MusicTrack, string> = {
  main: '/bg-music.mp3',
  // shortcut: WorkoutMusic.wav is missing from the repo upstream (legacy references it too), so this track cannot play yet.
  workout: '/assets/WorkoutMusic.wav',
}

let api: AudioApi | undefined

/**
 * Returns the app-wide audio controller. The first call creates the audio elements, wires the settings
 * to playback and registers the click retry. Later calls return the same object.
 * @returns The shared {@link AudioApi}.
 */
export function useAudio(): AudioApi {
  api ??= createAudio()
  return api
}

/** Builds the shared controller. Runs once, on the first {@link useAudio} call. */
function createAudio(): AudioApi {
  const musicEnabled = useMusicEnabled().state
  const musicVolume = useMusicVolume().state
  const soundEnabled = useSoundEnabled().state
  const sfxVolume = useSfxVolume().state

  const tracks: Record<MusicTrack, HTMLAudioElement> = {
    main: createTrack(MUSIC_SRC.main, 'auto'),
    workout: createTrack(MUSIC_SRC.workout, 'none'),
  }
  const sfxCache = new Map<string, HTMLAudioElement>()
  let activeTrack: MusicTrack = 'main'
  let suppressed = false

  function playMusic(): void {
    if (!musicEnabled.value || suppressed) return
    const track = tracks[activeTrack]
    if (!track.paused) return
    track.volume = clampVolume(musicVolume.value)
    track.play().catch((error: unknown) => {
      // Autoplay blocks and interrupted loads are expected; the next click retries playback.
      if (error instanceof Error && (error.name === 'NotAllowedError' || error.name === 'AbortError')) return
      console.warn('Unable to play music:', error)
    })
  }

  function pauseAll(): void {
    tracks.main.pause()
    tracks.workout.pause()
  }

  function setMusicTrack(track: MusicTrack): void {
    tracks[track === 'main' ? 'workout' : 'main'].pause()
    activeTrack = track
    playMusic()
  }

  function suppressMusic(on: boolean): void {
    suppressed = on
    if (on) pauseAll()
    else playMusic()
  }

  function playSfx(src: string): void {
    if (!soundEnabled.value) return
    let sfx = sfxCache.get(src)
    if (!sfx) {
      sfx = new Audio(src)
      sfxCache.set(src, sfx)
    }
    sfx.volume = clampVolume(sfxVolume.value)
    sfx.currentTime = 0
    sfx.play().catch(() => {
      // Blocked sound effects are ignored, as in the legacy app.
    })
  }

  watch(musicEnabled, (enabled) => {
    if (enabled) playMusic()
    else pauseAll()
  })
  watch(musicVolume, (volume) => {
    for (const track of Object.values(tracks)) track.volume = clampVolume(volume)
  })

  // Retry on user interaction if the browser blocked or interrupted playback.
  document.body.addEventListener('click', playMusic)

  return { musicEnabled, musicVolume, soundEnabled, sfxVolume, setMusicTrack, suppressMusic, playMusic, playSfx }
}

/**
 * Creates a looping background track element.
 * @param src - URL of the audio file.
 * @param preload - Preload hint for the browser.
 * @returns The configured audio element.
 */
function createTrack(src: string, preload: 'auto' | 'none'): HTMLAudioElement {
  const track = new Audio(src)
  track.loop = true
  track.preload = preload
  return track
}

/**
 * Clamps a volume to the 0-1 range that media elements accept. Non-finite values fall back to 0.3, as in the legacy app.
 * @param volume - Requested volume.
 * @returns A volume between 0 and 1.
 */
function clampVolume(volume: number): number {
  return Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 0.3
}
