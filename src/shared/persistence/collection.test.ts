import { afterEach, describe, expect, it, vi } from 'vitest'
import { createIndexedDbCollection } from './collection'

interface Note {
  id: string
  title: string
}

/** Callback-style request, resolved on a microtask like the real API. */
function request<R>(compute: () => R) {
  const req = { result: undefined as R | undefined, error: null, onsuccess: null as (() => void) | null, onerror: null as (() => void) | null }
  queueMicrotask(() => {
    req.result = compute()
    req.onsuccess?.()
  })
  return req
}

/**
 * Minimal IndexedDB stand-in covering open, upgrade, getAll, put and delete.
 * jsdom has no IndexedDB and no fake library is installed, so this is the test double.
 */
function createFakeIndexedDb() {
  const databases = new Map<string, Map<string, Map<string, unknown>>>()

  function storesOf(dbName: string): Map<string, Map<string, unknown>> {
    let stores = databases.get(dbName)
    if (!stores) {
      stores = new Map()
      databases.set(dbName, stores)
    }
    return stores
  }

  function recordsOf(dbName: string, storeName: string): Map<string, unknown> {
    const stores = storesOf(dbName)
    let records = stores.get(storeName)
    if (!records) {
      records = new Map()
      stores.set(storeName, records)
    }
    return records
  }

  const factory = {
    open(dbName: string) {
      const db = {
        objectStoreNames: { contains: (name: string) => storesOf(dbName).has(name) },
        createObjectStore: (name: string) => recordsOf(dbName, name),
        transaction: (name: string) => ({
          objectStore: () => {
            const records = recordsOf(dbName, name)
            return {
              getAll: () => request(() => [...records.values()]),
              put: (value: { id: string }) =>
                request(() => {
                  records.set(value.id, value)
                  return value.id
                }),
              delete: (id: string) =>
                request(() => {
                  records.delete(id)
                  return undefined
                }),
            }
          },
        }),
      }
      const req = { result: db, error: null, onsuccess: null as (() => void) | null, onerror: null as (() => void) | null, onupgradeneeded: null as (() => void) | null }
      queueMicrotask(() => {
        req.onupgradeneeded?.()
        req.onsuccess?.()
      })
      return req
    },
  }

  return { factory, storesOf }
}

describe('createIndexedDbCollection', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rejects when IndexedDB is unavailable', async () => {
    vi.stubGlobal('indexedDB', undefined)
    await expect(createIndexedDbCollection<Note>('db', 'notes').getAll()).rejects.toThrow('IndexedDB is unavailable.')
  })

  it('creates the legacy store and keeps records across collection instances', async () => {
    const fake = createFakeIndexedDb()
    vi.stubGlobal('indexedDB', fake.factory)

    const first = createIndexedDbCollection<Note>('biankaPicturePuzzles', 'personalPuzzles')
    await first.put({ id: 'a', title: 'First' })
    await first.put({ id: 'b', title: 'Second' })
    await first.put({ id: 'a', title: 'First, renamed' })
    await first.delete('b')
    await first.delete('missing')

    const second = createIndexedDbCollection<Note>('biankaPicturePuzzles', 'personalPuzzles')
    expect(await second.getAll()).toEqual([{ id: 'a', title: 'First, renamed' }])
    expect([...fake.storesOf('biankaPicturePuzzles').keys()]).toEqual(['personalPuzzles'])
  })
})
