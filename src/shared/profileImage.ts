import type { Ref } from 'vue'
import { defineRepository, stringCodec, STORAGE_KEYS } from './persistence'
import { defineSingleton } from './singleton'

/** Avatar shown when the user has not uploaded a photo: a purple circle with a person emoji (legacy SVG). */
export const DEFAULT_AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect rx="32" width="100%" height="100%" fill="%236c5ce7"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="32" fill="white">👤</text></svg>',
  )

/** Public surface of the player profile picture. */
export interface ProfileImageApi {
  /** Resolves once the stored picture has loaded. */
  ready: Promise<void>
  /** Uploaded picture as a data URL, or `''` when none is set. Stored under `playerProfileImage`. */
  image: Ref<string>
  /** Reads an image file and stores it as the profile picture. */
  setFromFile(file: File): Promise<void>
  /** Clears the stored picture. */
  remove(): void
}

/** Stored profile picture data URL. */
const useProfileImageStore = defineRepository({
  key: STORAGE_KEYS.playerProfileImage,
  codec: stringCodec,
  defaults: () => '',
})

/**
 * Reads a file as a data URL.
 * @param file - The file to read.
 * @returns A promise resolving to the `data:` URL.
 */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/** Builds the profile-picture store. Called once by {@link useProfileImage}. */
function createProfileImage(): ProfileImageApi {
  const store = useProfileImageStore()

  async function setFromFile(file: File): Promise<void> {
    store.state.value = await readAsDataUrl(file)
  }

  function remove(): void {
    store.state.value = ''
  }

  return { ready: store.ready, image: store.state, setFromFile, remove }
}

/**
 * Returns the shared profile-picture store, creating it on first call.
 * @returns The profile image API (image, upload, remove).
 */
export const useProfileImage: () => ProfileImageApi = defineSingleton(createProfileImage)
