import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/** Lets pending repository watchers and saves run. */
async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

/** Loads a fresh mail store with the given raw storage values. */
async function setup(stored: Record<string, string> = {}) {
  localStorage.clear()
  for (const [key, value] of Object.entries(stored)) localStorage.setItem(key, value)
  vi.resetModules()
  const { useMail } = await import('./useMail')
  const mail = useMail()
  await mail.ready
  return mail
}

describe('useMail', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('starts with only the built-in letter and a badge count of one', async () => {
    const mail = await setup()
    expect(mail.letters.value.map((letter) => letter.id)).toEqual(['site-letter-2026-08-17'])
    expect(mail.badgeCount.value).toBe(1)
  })

  it('counts saved letters in the badge and drops a stored copy of the built-in letter', async () => {
    const mail = await setup({
      triviaMailLetters: JSON.stringify([
        { id: 'site-letter-2026-08-17', coverImage: 'x', insideImage: 'y', date: '2026-08-17', builtIn: true },
        { id: 'a1', coverImage: 'c', insideImage: 'i', date: '2026-01-02' },
      ]),
    })
    expect(mail.letters.value.map((letter) => letter.id)).toEqual(['site-letter-2026-08-17', 'a1'])
    expect(mail.badgeCount.value).toBe(2)
  })

  it('treats unparseable stored data as an empty mailbox', async () => {
    const mail = await setup({ triviaMailLetters: '{not json' })
    expect(mail.badgeCount.value).toBe(1)
  })

  it('adds a letter from two image files and saves it under triviaMailLetters', async () => {
    const mail = await setup()
    const cover = new File(['cover'], 'cover.png', { type: 'image/png' })
    const inside = new File(['inside'], 'inside.png', { type: 'image/png' })

    await mail.addLetter(cover, inside, '2026-11-23')

    expect(mail.badgeCount.value).toBe(2)
    const added = mail.letters.value[1]
    expect(added?.date).toBe('2026-11-23')
    expect(added?.coverImage).toMatch(/^data:image\/png;base64,/)
    expect(added?.insideImage).toMatch(/^data:image\/png;base64,/)
    await settle()
    const saved = JSON.parse(localStorage.getItem('triviaMailLetters') ?? '[]') as Array<{ date: string }>
    expect(saved.map((letter) => letter.date)).toEqual(['2026-08-17', '2026-11-23'])
  })

  it('allows adding one letter: the built-in letter does not count, a user letter does', async () => {
    const mail = await setup()
    expect(mail.canAddLetter.value).toBe(true)
    await mail.addLetter(new File(['c'], 'c.png', { type: 'image/png' }), new File(['i'], 'i.png', { type: 'image/png' }), '2026-11-23')
    expect(mail.canAddLetter.value).toBe(false)
  })

  it('deletes a saved letter and updates the badge count', async () => {
    const mail = await setup({
      triviaMailLetters: JSON.stringify([{ id: 'a1', coverImage: 'c', insideImage: 'i', date: '2026-01-02' }]),
    })
    expect(mail.badgeCount.value).toBe(2)

    mail.removeLetter('a1')

    expect(mail.badgeCount.value).toBe(1)
    await settle()
    const saved = JSON.parse(localStorage.getItem('triviaMailLetters') ?? '[]') as Array<{ id: string }>
    expect(saved.map((letter) => letter.id)).toEqual(['site-letter-2026-08-17'])
  })
})
