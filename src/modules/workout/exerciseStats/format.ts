/**
 * Number formatting shared by the exercise stats cards. Matches the legacy `exerciseNumber` helper.
 */

/**
 * Formats a number for display with at most three decimals, in the user's locale.
 * @param value - Any number.
 * @returns The formatted text, for example `1,234.5`.
 */
export function formatStatNumber(value: number): string {
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 3 })
}
