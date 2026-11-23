/**
 * Returns a shuffled copy of `items` using a Fisher-Yates pass, as the legacy app does.
 * @param items - Values to shuffle. The input array is not changed.
 * @param random - Source of numbers in [0, 1). Defaults to `Math.random`.
 * @returns A new array with the same values in random order.
 */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    const picked = result[j] as T
    result[j] = result[i] as T
    result[i] = picked
  }
  return result
}

/**
 * Removes the last extension from a file name, as the legacy app does for titles.
 * @param name - A file name or path-like string.
 * @returns The name without its final `.ext`.
 */
export function stripExtension(name: string): string {
  return name.replace(/\.[^.]+$/, '')
}

/**
 * Creates an id for a new personal puzzle, using the legacy format.
 * @returns An id such as `puzzle-lx2k3a-q8f2z`.
 */
export function newPuzzleId(): string {
  return `puzzle-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

/**
 * Reads a file as a base64 data URL.
 * @param file - The file to read.
 * @returns A promise for the `data:` URL.
 */
export function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('The file did not produce a data URL.'))
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
