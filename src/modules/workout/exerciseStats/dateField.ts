/**
 * Validation of the typed `DD/MM/YYYY` date fields on the stats forms.
 */
import { displayDateError, parseDisplayDate } from '@/shared/dates'

/**
 * Sets the browser validity of a required date field from its typed text, so native form validation reports it.
 * @param target - The input element (or the event target). Non-inputs are ignored.
 * @param text - The typed text.
 * @returns The ISO date (`YYYY-MM-DD`), or `''` when the text is not a valid date.
 */
export function validateDateField(target: EventTarget | null, text: string): string {
  const message = displayDateError(text, { required: true })
  if (target instanceof HTMLInputElement) target.setCustomValidity(message)
  return message ? '' : parseDisplayDate(text)
}
