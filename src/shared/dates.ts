/** Matches a plain calendar date stored as `YYYY-MM-DD`. */
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

/** Matches a display date typed as `DD/MM/YYYY`. */
const DISPLAY_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/

/**
 * Formats a date for display as `DD/MM/YYYY`. ISO `YYYY-MM-DD` strings are reformatted without timezone shifts.
 * @param value - An ISO date string, a timestamp, or a Date.
 * @returns The formatted date, the raw value when it is unparseable, or `''` when empty.
 */
export function formatDisplayDate(value: string | number | Date | null | undefined): string {
  if (!value) return ''
  const iso = typeof value === 'string' ? ISO_DATE_PATTERN.exec(value) : null
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).padStart(4, '0')}`
}

/**
 * Parses a typed `DD/MM/YYYY` date into an ISO `YYYY-MM-DD` string, rejecting impossible dates.
 * @param value - The user-entered text.
 * @returns The ISO date, or `''` when the text is not a valid calendar date.
 */
export function parseDisplayDate(value: string): string {
  const match = DISPLAY_DATE_PATTERN.exec(String(value).trim())
  if (!match) return ''
  const [, day, month, year] = match
  const date = new Date(0)
  date.setFullYear(Number(year), Number(month) - 1, Number(day))
  date.setHours(0, 0, 0, 0)
  if (Number(year) < 1 || date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) return ''
  return `${year}-${month}-${day}`
}

/**
 * Formats a leaderboard timestamp as `DD/MM/YYYY` followed by the local time.
 * @param value - A timestamp, ISO string or Date.
 * @returns The formatted date and time, or the raw value when unparseable.
 */
export function formatLeaderboardDate(value: string | number | Date): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value || '')
  return `${formatDisplayDate(date)} ${date.toLocaleTimeString()}`
}

/**
 * Validates a typed display date and returns the message to show, or `''` when it is acceptable.
 * @param value - The user-entered `DD/MM/YYYY` text.
 * @param options - `required` rejects empty input; `maxDate` is the latest allowed ISO date.
 * @returns An error message, or `''` when valid.
 */
export function displayDateError(value: string, options: { required?: boolean; maxDate?: string } = {}): string {
  if (!value && !options.required) return ''
  const date = parseDisplayDate(value)
  if (!date) return 'Enter a valid date as DD/MM/YYYY.'
  if (options.maxDate && date > options.maxDate) return `Date must be on or before ${formatDisplayDate(options.maxDate)}.`
  return ''
}

/**
 * Parses a date, reading `YYYY-MM-DD` strings as local midnight to avoid UTC day shifts.
 * @param value - An ISO date string or any value accepted by the Date constructor.
 * @returns The parsed Date (invalid Dates are returned as-is for the caller to check).
 */
export function parseLocalDate(value: string | number | Date): Date {
  if (typeof value === 'string') {
    const match = ISO_DATE_PATTERN.exec(value)
    if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  }
  return new Date(value)
}

/**
 * Returns the local calendar date of a value as an ISO `YYYY-MM-DD` string.
 * @param value - An ISO date string, timestamp or Date.
 * @returns The local date as `YYYY-MM-DD`.
 */
export function isoDate(value: string | number | Date): string {
  const date = parseLocalDate(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
