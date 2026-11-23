import { reactive, ref, type Ref } from 'vue'
import { createIndexedDbCollection } from '@/shared/persistence'
import type { Difficulty, PersonalPuzzle, PlayablePuzzle } from './types'
import { newPuzzleId, readFileAsDataUrl, stripExtension } from './util'

/** Largest picture accepted for upload, in bytes. */
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024

/** Saved puzzles, in the legacy database and store so existing records load unchanged. */
const library = createIndexedDbCollection<PersonalPuzzle>('biankaPicturePuzzles', 'personalPuzzles')

/** The "Create Your Puzzle" form. */
export interface PuzzleForm {
  /** Picture chosen in the file input. */
  file: File | null
  /** Name typed by the user. Empty means the file name is used. */
  name: string
  /** Difficulty chosen for the new puzzle. */
  level: Difficulty
}

/** A saved puzzle that is ready to start, with the difficulty to play it at. */
export interface SavedPuzzle {
  /** The puzzle to start. */
  puzzle: PlayablePuzzle
  /** Difficulty chosen in the form. */
  level: Difficulty
}

/** State and actions of the user's own puzzles. */
export interface PersonalPuzzlesApi {
  /** Saved puzzles, newest first. */
  puzzles: Ref<PersonalPuzzle[]>
  /** True when the library could not be read in this browser. */
  loadFailed: Ref<boolean>
  /** The upload form. */
  form: PuzzleForm
  /** Reads the library. Call when the screen opens. */
  load: () => Promise<void>
  /** Deletes a saved puzzle and refreshes the list. */
  remove: (id: string) => Promise<void>
  /** Validates the form, saves the picture, clears the form and returns the puzzle to play. `null` when nothing was saved. */
  save: () => Promise<SavedPuzzle | null>
}

/**
 * Converts a saved puzzle into the shape the game starts from.
 * @param puzzle - A saved personal puzzle.
 * @returns The playable puzzle, with the stored id and name as its title.
 */
export function personalPlayable(puzzle: PersonalPuzzle): PlayablePuzzle {
  return { id: puzzle.id, title: puzzle.name, src: puzzle.image, source: 'personal' }
}

/**
 * Builds the state for the user's own puzzles: the saved list, the upload form and save/delete.
 * @returns The list state and its actions.
 */
export function usePersonalPuzzles(): PersonalPuzzlesApi {
  const puzzles = ref<PersonalPuzzle[]>([])
  const loadFailed = ref(false)
  const form = reactive<PuzzleForm>({ file: null, name: '', level: 'easy' })

  /** Reads the library, newest first. Sets `loadFailed` instead of throwing. */
  async function load(): Promise<void> {
    try {
      puzzles.value = (await library.getAll()).sort((a, b) => b.createdAt - a.createdAt)
      loadFailed.value = false
    } catch {
      loadFailed.value = true
    }
  }

  async function remove(id: string): Promise<void> {
    await library.delete(id)
    await load()
  }

  async function save(): Promise<SavedPuzzle | null> {
    const file = form.file
    if (!file || !file.type.startsWith('image/')) {
      alert('Choose a picture file first.')
      return null
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      alert('Choose an image smaller than 15 MB.')
      return null
    }
    try {
      const record: PersonalPuzzle = {
        id: newPuzzleId(),
        name: form.name.trim() || stripExtension(file.name),
        image: await readFileAsDataUrl(file),
        createdAt: Date.now(),
      }
      await library.put(record)
      const level = form.level
      form.file = null
      form.name = ''
      await load()
      return { puzzle: personalPlayable(record), level }
    } catch {
      alert('The puzzle could not be saved. Try a smaller image or check browser storage availability.')
      return null
    }
  }

  return { puzzles, loadFailed, form, load, remove, save }
}
