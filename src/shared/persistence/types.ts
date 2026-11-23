import type { Ref } from 'vue'

/** Async key/value store for raw string values. Local today; a network backend later. */
export interface StorageAdapter {
  /** Returns the raw stored string, or `null` when the key is missing. */
  getItem(key: string): Promise<string | null>
  /** Stores a raw string under `key`. */
  setItem(key: string, value: string): Promise<void>
  /** Deletes `key` if present. */
  removeItem(key: string): Promise<void>
  /** Lists every stored key. */
  keys(): Promise<string[]>
}

/** Converts between a typed value and the raw string stored in an adapter. */
export interface Codec<T> {
  /** Parses a raw stored string into a value. Throws when the raw value is invalid. */
  decode(raw: string): T
  /** Serialises a value into the exact raw string format used by the legacy app. */
  encode(value: T): string
}

/** Signed-in user profile. */
export interface User {
  id: string
  name: string
  email?: string
  avatarUrl?: string
}

/** Sign-in provider contract (implemented later for Google sign-in). */
export interface AuthProvider {
  /** Current user, or `null` when signed out. */
  user: Readonly<Ref<User | null>>
  /** Starts the sign-in flow. */
  signIn(): Promise<void>
  /** Signs the current user out. */
  signOut(): Promise<void>
}
