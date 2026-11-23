/**
 * Public surface of the persistence layer. Game modules import from here only.
 * To switch to a remote backend, change the adapter that is passed to {@link setStorageAdapter} at startup.
 */
export { getStorageAdapter, setStorageAdapter } from './adapter'
export { createLocalStorageAdapter } from './local'
export { createIndexedDbCollection, type CollectionStore } from './collection'
export { stringCodec, booleanCodec, numberCodec, jsonCodec } from './codecs'
export { STORAGE_KEYS } from './keys'
export { defineRepository } from './repository'
export type { Repository, RepositoryOptions } from './repository'
export type { AuthProvider, Codec, StorageAdapter, User } from './types'
