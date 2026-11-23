import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/** Lets pending repository watchers and saves run. */
async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('useProfileImage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  afterEach(() => vi.restoreAllMocks())

  it('stores an uploaded file as a data URL and removes it', async () => {
    const { useProfileImage } = await import('./profileImage')
    const profile = useProfileImage()
    await profile.ready

    await profile.setFromFile(new File(['hi'], 'me.png', { type: 'image/png' }))
    expect(profile.image.value).toMatch(/^data:image\/png;base64,/)
    await settle()
    expect(localStorage.getItem('playerProfileImage')).toBe(profile.image.value)

    profile.remove()
    await settle()
    expect(localStorage.getItem('playerProfileImage')).toBe('')
  })

  it('loads a stored picture', async () => {
    localStorage.setItem('playerProfileImage', 'data:image/png;base64,AAAA')
    const { useProfileImage } = await import('./profileImage')
    const profile = useProfileImage()
    await profile.ready
    expect(profile.image.value).toBe('data:image/png;base64,AAAA')
  })
})
