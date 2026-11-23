import { shuffle } from '@/shared/quiz'

/** Seconds the contestant has for each question. The legacy timer restarts at 3:00 on every question. */
export const QUESTION_SECONDS = 180

/** Delay between a pick (or an audience vote) and the reveal. */
export const SUSPENSE_MS = 5000

/** Delay between the timer running out and the correct answer being shown. */
export const TIME_UP_REVEAL_MS = 1000

/** Moves the title screen on if the intro track never ends. */
export const TITLE_FALLBACK_MS = 15000

/** Starts the game if the name-selected jingle never ends. */
export const NAME_FALLBACK_MS = 15000

/** Option tint shown after an audience vote. The correct option is green, the wrong ones step down from gold to red. */
export type AudienceTint = 'audience-vote-correct' | 'audience-vote-high' | 'audience-vote-med' | 'audience-vote-low'

const WRONG_TINTS: readonly AudienceTint[] = ['audience-vote-high', 'audience-vote-med', 'audience-vote-low']

/**
 * Formats seconds as `mm:ss`, as the legacy Millionaire timer does.
 * @param seconds - Whole seconds to show.
 * @returns The time as two-digit minutes and seconds.
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
  const secs = (seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${secs}`
}

/**
 * Picks the two wrong options that the 50:50 lifeline removes. Never removes the correct answer.
 * @param optionCount - Number of options on the question.
 * @param answer - Index of the correct option.
 * @param unavailable - Indexes that are already removed.
 * @returns Up to two option indexes to remove.
 */
export function pickFiftyFiftyRemovals(optionCount: number, answer: number, unavailable: readonly number[]): number[] {
  const wrong = optionIndexes(optionCount).filter((index) => index !== answer && !unavailable.includes(index))
  return shuffle(wrong).slice(0, 2)
}

/**
 * Builds the audience-vote tints. The correct option is tinted green, and each remaining option gets a
 * random tint from the three wrong-answer tints. Removed options are not tinted.
 * @param optionCount - Number of options on the question.
 * @param answer - Index of the correct option.
 * @param unavailable - Indexes that are removed and therefore not voted on.
 * @returns A tint per voted option index.
 */
export function audienceVoteTints(
  optionCount: number,
  answer: number,
  unavailable: readonly number[],
): Partial<Record<number, AudienceTint>> {
  const tints: Partial<Record<number, AudienceTint>> = {}
  if (!unavailable.includes(answer)) tints[answer] = 'audience-vote-correct'
  const wrong = optionIndexes(optionCount).filter((index) => index !== answer && !unavailable.includes(index))
  const order = shuffle(WRONG_TINTS)
  wrong.forEach((optionIndex, position) => {
    const tint = order[position % order.length]
    if (tint) tints[optionIndex] = tint
  })
  return tints
}

/**
 * Lists the indexes `0 .. count - 1`.
 * @param count - Number of indexes.
 * @returns The indexes in order.
 */
function optionIndexes(count: number): number[] {
  return Array.from({ length: count }, (_, index) => index)
}
