import { afterEach, describe, expect, it, vi } from 'vitest'
import { isoDate } from '@/shared/dates'
import { fetchDailyPool, normalizeDailyImage, pictureForDate, resolveDailySequence } from './daily'
import type { DailyImage } from './types'

const pool: DailyImage[] = [
  { src: './puzzles-of-the-day/a.jpg', title: 'a' },
  { src: './puzzles-of-the-day/b.png', title: 'b' },
  { src: './puzzles-of-the-day/c.webp', title: 'c' },
  { src: './puzzles-of-the-day/d.jpg', title: 'd' },
]

/** Reverses instead of shuffling, so the rotation is predictable in tests. */
const reverse = (ids: string[]) => [...ids].reverse()

/** Local date `offset` days after 1 January 2026. */
function dayAt(offset: number): string {
  return isoDate(new Date(2026, 0, 1 + offset))
}

describe('normalizeDailyImage', () => {
  it('resolves a bare file name inside the image folder and drops its extension for the title', () => {
    expect(normalizeDailyImage('lake.jpg')).toEqual({ src: './puzzles-of-the-day/lake.jpg', title: 'lake' })
  })

  it('keeps only the last extension when stripping the title', () => {
    expect(normalizeDailyImage('71tCfzvt7WL._AC_SX466_.jpg')).toEqual({
      src: './puzzles-of-the-day/71tCfzvt7WL._AC_SX466_.jpg',
      title: '71tCfzvt7WL._AC_SX466_',
    })
  })

  it('uses the given title for object entries', () => {
    expect(normalizeDailyImage({ src: 'mountains.webp', title: 'Mountain View' })).toEqual({
      src: './puzzles-of-the-day/mountains.webp',
      title: 'Mountain View',
    })
  })

  it('falls back to the file name when an object has no title', () => {
    expect(normalizeDailyImage({ src: 'maya.png', title: '' })).toEqual({ src: './puzzles-of-the-day/maya.png', title: 'maya' })
  })

  it('keeps paths that are already relative to the root, absolute, remote or data URLs', () => {
    expect(normalizeDailyImage({ src: './x/y.jpg', title: 'y' })?.src).toBe('./x/y.jpg')
    expect(normalizeDailyImage({ src: '/pics/z.jpg', title: 'z' })?.src).toBe('/pics/z.jpg')
    expect(normalizeDailyImage({ src: 'https://example.com/w.jpg', title: 'w' })?.src).toBe('https://example.com/w.jpg')
    expect(normalizeDailyImage({ src: 'data:image/png;base64,AAA', title: 'd' })?.src).toBe('data:image/png;base64,AAA')
  })

  it('rejects entries without a usable src', () => {
    expect(normalizeDailyImage(null)).toBeNull()
    expect(normalizeDailyImage(42)).toBeNull()
    expect(normalizeDailyImage({ title: 'no src' })).toBeNull()
    expect(normalizeDailyImage({ src: 7 })).toBeNull()
  })
})

describe('fetchDailyPool', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reads the puzzles array of the manifest and skips invalid entries', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({ puzzles: ['lake.jpg', 42, { src: 'mountains.webp', title: 'Mountain View' }] }) })),
    )
    expect(await fetchDailyPool()).toEqual([
      { src: './puzzles-of-the-day/lake.jpg', title: 'lake' },
      { src: './puzzles-of-the-day/mountains.webp', title: 'Mountain View' },
    ])
  })

  it('accepts a bare array manifest', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ['maya.png'] })))
    expect(await fetchDailyPool()).toEqual([{ src: './puzzles-of-the-day/maya.png', title: 'maya' }])
  })

  it('rejects when the manifest cannot be fetched', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({}) })))
    await expect(fetchDailyPool()).rejects.toThrow('No puzzle list found.')
  })
})

describe('resolveDailySequence', () => {
  it('serves every picture once before any picture repeats', () => {
    let stored: unknown = null
    const served: string[] = []
    for (let day = 0; day < pool.length; day += 1) {
      const today = dayAt(day)
      const sequence = resolveDailySequence(pool, stored, today, reverse)
      served.push(pictureForDate(pool, sequence, today)?.src ?? 'missing')
      stored = sequence
    }
    expect([...served].sort()).toEqual(pool.map((item) => item.src).sort())
  })

  it('starts a new rotation on the day after the last picture', () => {
    const first = resolveDailySequence(pool, null, dayAt(0), reverse)
    const next = resolveDailySequence(pool, first, dayAt(pool.length), reverse)
    expect(next).not.toBe(first)
    expect(next.startDate).toBe(dayAt(pool.length))
    expect(pictureForDate(pool, next, dayAt(pool.length))?.src).toBe(next.ids[0])
  })

  it('keeps the same rotation and picture for the whole day', () => {
    const first = resolveDailySequence(pool, null, dayAt(0), reverse)
    const again = resolveDailySequence(pool, first, dayAt(0), reverse)
    expect(again).toBe(first)
    expect(pictureForDate(pool, again, dayAt(0))).toEqual(pictureForDate(pool, first, dayAt(0)))
  })

  it('starts a new rotation when the pool changes', () => {
    const stored = resolveDailySequence(pool, null, dayAt(0), reverse)
    const grown = [...pool, { src: './puzzles-of-the-day/e.jpg', title: 'e' }]
    const sequence = resolveDailySequence(grown, stored, dayAt(1), reverse)
    expect(sequence.startDate).toBe(dayAt(1))
    expect(sequence.ids).toHaveLength(grown.length)
  })

  it('ignores malformed stored values', () => {
    for (const bad of ['garbage', 42, { ids: 'nope', startDate: dayAt(0) }, { ids: pool.map((p) => p.src), startDate: 'soon' }]) {
      const sequence = resolveDailySequence(pool, bad, dayAt(0), reverse)
      expect(sequence.startDate).toBe(dayAt(0))
      expect(sequence.ids).toHaveLength(pool.length)
    }
  })
})
