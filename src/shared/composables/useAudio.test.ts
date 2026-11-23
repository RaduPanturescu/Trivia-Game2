import { beforeEach, describe, expect, it, vi } from 'vitest'
import { STORAGE_KEYS } from '../persistence'

/**
 * Loads a fresh copy of the settings and audio modules with the given stored preferences,
 * waits for the repositories to load, and returns the audio controller.
 */
async function setup(stored: Record<string, string> = {}) {
  localStorage.clear()
  for (const [key, value] of Object.entries(stored)) localStorage.setItem(key, value)
  vi.resetModules()
  const settings = await import('../settings')
  const { useAudio, SFX } = await import('./useAudio')
  const audio = useAudio()
  await Promise.all([
    settings.useMusicEnabled().ready,
    settings.useMusicVolume().ready,
    settings.useSoundEnabled().ready,
    settings.useSfxVolume().ready,
  ])
  return { audio, SFX }
}

describe('useAudio', () => {
  let plays: { src: string; volume: number }[]
  let pauses: string[]

  beforeEach(() => {
    plays = []
    pauses = []
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (this: HTMLMediaElement) {
      plays.push({ src: this.src, volume: this.volume })
      return Promise.resolve()
    })
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (this: HTMLMediaElement) {
      pauses.push(this.src)
    })
  })

  it('does not play music when music is disabled', async () => {
    const { audio } = await setup({ [STORAGE_KEYS.triviaMusicPref]: 'false' })
    audio.playMusic()
    expect(plays).toHaveLength(0)
  })

  it('blocks playMusic while suppressed and resumes when suppression ends', async () => {
    const { audio } = await setup()
    audio.suppressMusic(true)
    audio.playMusic()
    expect(plays).toHaveLength(0)
    audio.suppressMusic(false)
    expect(plays).toHaveLength(1)
  })

  it('pauses the main track when switching to the workout track', async () => {
    const { audio } = await setup()
    audio.setMusicTrack('workout')
    expect(pauses.some((src) => src.endsWith('/bg-music.mp3'))).toBe(true)
    expect(plays.at(-1)?.src).toContain('/assets/WorkoutMusic.wav')
  })

  it('does not play sound effects when sound is disabled', async () => {
    const { audio, SFX } = await setup({ [STORAGE_KEYS.triviaSoundPref]: 'false' })
    audio.playSfx(SFX.pop)
    expect(plays).toHaveLength(0)
  })

  it('plays sound effects at the stored sfx volume', async () => {
    const { audio, SFX } = await setup({ [STORAGE_KEYS.triviaSfxVolume]: '0.6' })
    audio.playSfx(SFX.pop)
    expect(plays).toEqual([{ src: expect.stringContaining('pop_sound.wav'), volume: 0.6 }])
  })
})
