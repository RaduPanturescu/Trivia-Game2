/** Achievements per page of the panel, as legacy. */
export const ACHIEVEMENTS_PER_PAGE = 6

/**
 * Number of pages for a list length. There is always at least one page, even when the list is empty.
 * @param total - Number of items.
 * @returns The page count, `1` or more.
 */
export function pageCountFor(total: number): number {
  return Math.max(1, Math.ceil(total / ACHIEVEMENTS_PER_PAGE))
}

/**
 * Keeps a page index inside the valid range.
 * @param page - The requested zero-based page.
 * @param pageCount - Number of pages.
 * @returns A page index from `0` to `pageCount - 1`.
 */
export function clampPage(page: number, pageCount: number): number {
  return Math.max(0, Math.min(page, pageCount - 1))
}

/**
 * The items of one page.
 * @param items - The whole list.
 * @param page - Zero-based page index, already clamped.
 * @returns The page's items, at most {@link ACHIEVEMENTS_PER_PAGE}.
 */
export function pageSlice<T>(items: readonly T[], page: number): T[] {
  return items.slice(page * ACHIEVEMENTS_PER_PAGE, (page + 1) * ACHIEVEMENTS_PER_PAGE)
}
