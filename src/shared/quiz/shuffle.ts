/**
 * Returns a new array with the same items in random order. Uses the legacy
 * Fisher-Yates loop from `legacy/app.js`. The input array is not modified.
 *
 * @param items - Items to shuffle.
 * @returns A shuffled copy of `items`.
 */
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items]
  let currentIndex = result.length
  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex--
    const current = result[currentIndex] as T
    result[currentIndex] = result[randomIndex] as T
    result[randomIndex] = current
  }
  return result
}
