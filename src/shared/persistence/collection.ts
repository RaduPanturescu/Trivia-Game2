/** Async CRUD over one collection of records keyed by `id`. Game code uses this shape, so a remote backend can replace IndexedDB later. */
export interface CollectionStore<T extends { id: string }> {
  /** Returns every stored record, in the store's key order. */
  getAll(): Promise<T[]>
  /** Inserts a record, or replaces the record with the same `id`. */
  put(item: T): Promise<void>
  /** Deletes the record with this `id`. A missing id is not an error. */
  delete(id: string): Promise<void>
}

/**
 * Creates a {@link CollectionStore} backed by IndexedDB. The database is opened, and its object store created,
 * on first use. Pass the legacy names and version so records saved by the legacy app load unchanged.
 * @param dbName - IndexedDB database name, e.g. `biankaPicturePuzzles`.
 * @param storeName - Object store name, e.g. `personalPuzzles`. Records use `id` as their key path.
 * @param version - Database version passed to `indexedDB.open`.
 * @returns A store whose operations reject when IndexedDB is unavailable or a request fails.
 */
export function createIndexedDbCollection<T extends { id: string }>(
  dbName: string,
  storeName: string,
  version = 1,
): CollectionStore<T> {
  let dbPromise: Promise<IDBDatabase> | undefined

  /** Opens the database once per store. Rejects when IndexedDB is missing. */
  function openDatabase(): Promise<IDBDatabase> {
    if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB is unavailable.'))
    dbPromise ??= new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, version)
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(storeName)) {
          request.result.createObjectStore(storeName, { keyPath: 'id' })
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    return dbPromise
  }

  /** Runs one request in its own transaction and resolves with the request's result. */
  async function run<R>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<R>): Promise<R> {
    const db = await openDatabase()
    return new Promise<R>((resolve, reject) => {
      const request = action(db.transaction(storeName, mode).objectStore(storeName))
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  return {
    async getAll() {
      return (await run<T[]>('readonly', (store) => store.getAll())) ?? []
    },
    async put(item) {
      await run('readwrite', (store) => store.put(item))
    },
    async delete(id) {
      await run('readwrite', (store) => store.delete(id))
    },
  }
}
