import { computed, type ComputedRef } from 'vue'
import { formatDisplayDate } from '@/shared/dates'
import { defineRepository, jsonCodec, STORAGE_KEYS } from '@/shared/persistence'

/** One letter in the mailbox. The built-in letter ships with the app and cannot be deleted. */
export interface MailLetter {
  /** Unique id, used as the list key and for deletion. */
  id: string
  /** Cover image as a URL or data URL. */
  coverImage: string
  /** Inside image as a URL or data URL. */
  insideImage: string
  /** Issue date as an ISO `YYYY-MM-DD` string. */
  date: string
  /** True for the letter that ships with the app. */
  builtIn?: boolean
}

/** Public surface of the mailbox store. */
export interface MailApi {
  /** Resolves once the stored letters have loaded. */
  ready: Promise<void>
  /** Built-in letter first, then the saved letters. Stored under `triviaMailLetters`. */
  letters: ComputedRef<MailLetter[]>
  /** Number shown on the welcome-screen mail badge (every letter counts; legacy has no read state). */
  badgeCount: ComputedRef<number>
  /** True while no user-added letter exists (one at a time; the built-in letter doesn't count). */
  canAddLetter: ComputedRef<boolean>
  /**
   * Reads both image files and appends a letter, keeping the current list (built-in letter included) as legacy did.
   * @param cover - Cover image file.
   * @param inside - Inside image file.
   * @param date - Issue date as ISO `YYYY-MM-DD`.
   */
  addLetter(cover: File, inside: File, date: string): Promise<void>
  /**
   * Deletes a letter by id. The built-in letter is never removed by the UI.
   * @param id - Id of the letter to delete.
   */
  removeLetter(id: string): void
}

/** The letter that ships with the app. Its id is fixed, so a saved copy is never duplicated. */
export const BUILT_IN_MAIL_LETTER: MailLetter = {
  id: 'site-letter-2026-08-17',
  coverImage: '/assets/1.png',
  insideImage: '/assets/2.png',
  date: '2026-08-17',
  builtIn: true,
}

/** Stored mail letters. Stored under `triviaMailLetters`. */
const useStoredLetters = defineRepository({
  key: STORAGE_KEYS.triviaMailLetters,
  codec: jsonCodec<MailLetter[]>(),
  defaults: () => [],
})

/**
 * Formats a letter's ISO issue date for display as `DD/MM/YYYY`, or `No date` when empty.
 * @param date - Issue date as ISO `YYYY-MM-DD`.
 * @returns The display date.
 */
export function formatMailDate(date: string): string {
  if (!date) return 'No date'
  return formatDisplayDate(date)
}

/**
 * Reads a file as a data URL.
 * @param file - The file to read.
 * @returns A promise resolving to the `data:` URL, rejecting with a readable error.
 */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Unable to read selected file.'))
    reader.readAsDataURL(file)
  })
}

/** Builds the mailbox store. Called once by {@link useMail}. */
function createMail(): MailApi {
  const stored = useStoredLetters()

  const letters = computed<MailLetter[]>(() => {
    const saved = Array.isArray(stored.state.value) ? stored.state.value : []
    return [BUILT_IN_MAIL_LETTER, ...saved.filter((letter) => letter.id !== BUILT_IN_MAIL_LETTER.id)]
  })

  const badgeCount = computed(() => letters.value.length)
  const canAddLetter = computed(() => !letters.value.some((letter) => !letter.builtIn))

  async function addLetter(cover: File, inside: File, date: string): Promise<void> {
    const coverImage = await readFileAsDataUrl(cover)
    const insideImage = await readFileAsDataUrl(inside)
    stored.state.value = [...letters.value, { id: Date.now().toString(36), coverImage, insideImage, date }]
  }

  function removeLetter(id: string): void {
    stored.state.value = letters.value.filter((letter) => letter.id !== id)
  }

  return { ready: stored.ready, letters, badgeCount, canAddLetter, addLetter, removeLetter }
}

let instance: MailApi | undefined

/**
 * Returns the shared mailbox store, creating it on first call.
 * @returns The mail API (letters, badge count, add and remove).
 */
export function useMail(): MailApi {
  instance ??= createMail()
  return instance
}
