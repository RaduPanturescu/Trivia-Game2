import { computed, ref, type ComputedRef, type Ref } from 'vue'
import { formatDisplayDate } from '@/shared/dates'
import { useDevMode } from '@/shared/devMode'
import { defineRepository, STORAGE_KEYS, type Codec } from '@/shared/persistence'
import { WORDLE_WORDS } from './data/words'
import type {
  BoardTile,
  KeyStates,
  TileResult,
  WordleDailyState,
  WordleDevState,
  WordleGuess,
  WordleState,
} from './types'

/** Letters per word. */
export const WORD_LENGTH = 5

/** Guesses allowed per puzzle. */
export const MAX_GUESSES = 6

/** Five lower-case letters: the only words the legacy app accepts. */
const WORD_PATTERN = /^[a-z]{5}$/

/** Priority used when several guesses colour the same key. The strongest score wins. */
const KEY_PRIORITY: Record<TileResult, number> = { absent: 1, present: 2, correct: 3 }

/**
 * Normalises a raw word list as the legacy app does: trims and lower-cases each entry, keeps only five-letter
 * a-z words and drops duplicates while keeping the first occurrence.
 * @param words - Raw word list.
 * @returns The cleaned list in its original order.
 */
export function normaliseWords(words: readonly string[]): string[] {
  const cleaned = words.map((word) => word.trim().toLowerCase()).filter((word) => WORD_PATTERN.test(word))
  return [...new Set(cleaned)]
}

/** Answer list in legacy order. The daily answer is an index into this list, so its order must not change. */
export const WORDLE_ANSWERS: readonly string[] = normaliseWords(WORDLE_WORDS)

/** Every word a guess may use. Same content as {@link WORDLE_ANSWERS}. */
export const WORDLE_WORD_SET: ReadonlySet<string> = new Set(WORDLE_ANSWERS)

/**
 * Returns the UTC calendar date of an instant as `YYYY-MM-DD`.
 * @param date - Instant to format.
 * @returns The UTC date string.
 */
export function utcDateString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/**
 * Picks the daily answer: FNV-1a hash of the date string, modulo the answer list length. Matches the legacy app
 * so every player sees the same word on the same UTC day.
 * @param date - UTC date as `YYYY-MM-DD`.
 * @param answers - Answer list. Defaults to {@link WORDLE_ANSWERS}.
 * @returns The answer for that date.
 */
export function getDailyAnswer(date: string, answers: readonly string[] = WORDLE_ANSWERS): string {
  let hash = 2166136261
  for (const character of date) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return answers[(hash >>> 0) % answers.length] ?? ''
}

/**
 * Scores a guess against the answer. Correct letters are marked first, so a repeated letter only turns
 * `present` as many times as it appears in the answer outside the correct positions.
 * @param guess - Guessed word, lower case.
 * @param answer - Secret word, lower case.
 * @returns The score of each letter, in order.
 */
export function evaluateGuess(guess: string, answer: string): TileResult[] {
  const result: TileResult[] = Array.from({ length: WORD_LENGTH }, () => 'absent')
  const remaining: Partial<Record<string, number>> = {}
  for (let i = 0; i < WORD_LENGTH; i += 1) {
    const letter = answer.charAt(i)
    if (guess.charAt(i) === letter) result[i] = 'correct'
    else remaining[letter] = (remaining[letter] ?? 0) + 1
  }
  for (let i = 0; i < WORD_LENGTH; i += 1) {
    if (result[i] === 'correct') continue
    const letter = guess.charAt(i)
    if ((remaining[letter] ?? 0) > 0) {
      result[i] = 'present'
      remaining[letter] = (remaining[letter] ?? 0) - 1
    }
  }
  return result
}

/**
 * Colours each on-screen key from the guesses so far. A key keeps the strongest score it has earned.
 * @param guesses - Submitted guesses.
 * @returns The colour of every key that has been used, keyed by upper-case letter.
 */
export function keyStatesFor(guesses: readonly WordleGuess[]): KeyStates {
  const keys: KeyStates = {}
  for (const guess of guesses) {
    for (let column = 0; column < WORD_LENGTH; column += 1) {
      const label = guess.word.charAt(column).toUpperCase()
      const color = guess.result[column]
      const previous = keys[label]
      if (color && (!previous || KEY_PRIORITY[color] > KEY_PRIORITY[previous])) keys[label] = color
    }
  }
  return keys
}

/**
 * Whether a state is a developer puzzle.
 * @param state - Game state to check.
 * @returns True for a developer puzzle.
 */
export function isDevState(state: WordleState): state is WordleDevState {
  return 'dev' in state
}

/**
 * Returns the secret word of a state: the dev puzzle's own answer, or the daily answer for its date.
 * @param state - Game state.
 * @returns The lower-case answer.
 */
export function answerFor(state: WordleState): string {
  return isDevState(state) ? state.answer : getDailyAnswer(state.date)
}

/**
 * Builds the six rows of tiles for the board. Submitted guesses show their scores, the current row shows the
 * letters typed so far, and the rest are empty.
 * @param state - Game state.
 * @param currentGuess - Letters typed into the open row.
 * @returns Six rows of five tiles.
 */
export function boardRows(state: WordleState, currentGuess: string): BoardTile[][] {
  const typingRow = state.result === 'playing' ? state.guesses.length : -1
  return Array.from({ length: MAX_GUESSES }, (_, row) => {
    const guess = state.guesses[row]
    const letters = guess ? guess.word : row === typingRow ? currentGuess : ''
    return Array.from({ length: WORD_LENGTH }, (_unused, column): BoardTile => {
      const letter = letters.charAt(column).toUpperCase()
      if (guess) return { letter, result: guess.result[column], revealed: true, filled: false }
      return { letter, revealed: false, filled: letter !== '' }
    })
  })
}

/**
 * Text under the title: the puzzle date in daily mode, or the dev mode label.
 * @param state - Game state.
 * @returns The status line.
 */
export function dailyStatus(state: WordleState): string {
  const dev = isDevState(state)
  if (state.result === 'playing') {
    return dev ? 'Developer Mode · unlimited puzzles' : `Daily puzzle · ${formatDisplayDate(state.date)} (UTC)`
  }
  if (state.result === 'won') return dev ? 'Developer puzzle complete' : 'Completed for today ✓'
  return dev ? 'Developer answer revealed' : 'Puzzle complete — come back tomorrow'
}

/**
 * Message under the board for the current state. Error messages from submitting take priority over this.
 * @param state - Game state.
 * @returns The message text.
 */
export function statusMessage(state: WordleState): string {
  const dev = isDevState(state)
  if (state.result === 'playing') return 'Type a five-letter word and press Enter.'
  const answer = answerFor(state).toUpperCase()
  if (state.result === 'won') {
    return dev
      ? 'Correct! Start another dev puzzle whenever you want.'
      : 'Excellent! The next word is available at midnight UTC.'
  }
  return dev
    ? `The word was ${answer}. Start another dev puzzle whenever you want.`
    : `The word was ${answer}. The next puzzle starts at midnight UTC.`
}

/**
 * Countdown to the next UTC midnight, as shown under the daily bar.
 * @param now - Current instant.
 * @returns Text such as `Next word in 05:12:09 UTC`.
 */
export function formatCountdown(now: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0')
  const nextUtcDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  const seconds = Math.max(0, Math.floor((nextUtcDay - now.getTime()) / 1000))
  const hours = pad(Math.floor(seconds / 3600))
  const minutes = pad(Math.floor((seconds % 3600) / 60))
  return `Next word in ${hours}:${minutes}:${pad(seconds % 60)} UTC`
}

/** Codec for the stored daily state. Keeps the legacy JSON layout and rejects values that are not objects. */
export const dailyStateCodec: Codec<WordleDailyState> = {
  decode(raw) {
    const value: unknown = JSON.parse(raw)
    if (typeof value !== 'object' || value === null) throw new Error('Wordle state is not an object')
    return value as WordleDailyState
  },
  encode: (value) => JSON.stringify(value),
}

/** Stored daily game under `biankaDailyWordleState`. Dev puzzles never go through this repository. */
export const useWordleStore = defineRepository<WordleDailyState>({
  key: STORAGE_KEYS.biankaDailyWordleState,
  codec: dailyStateCodec,
  defaults: () => ({ date: '', guesses: [], result: 'playing' }),
})

/** Public surface of the Wordle game returned by {@link useWordle}. */
export interface WordleApi {
  /** Whether stored data and dev mode have loaded and the board can be shown. */
  loaded: Readonly<Ref<boolean>>
  /** Whether developer mode is on. */
  isDev: Readonly<Ref<boolean>>
  /** Board rows for the current puzzle. */
  rows: ComputedRef<BoardTile[][]>
  /** Colour of each used key. */
  keyStates: ComputedRef<KeyStates>
  /** Whether the puzzle has ended (won, lost or revealed). */
  isComplete: ComputedRef<boolean>
  /** Message under the board. */
  message: ComputedRef<string>
  /** Status line above the board. */
  status: ComputedRef<string>
  /** Countdown to the next UTC day. */
  countdown: ComputedRef<string>
  /** Increases on every rejected word so the board can shake. */
  shake: Readonly<Ref<number>>
  /** Loads stored data and dev mode, then shows today's puzzle. Call once on mount. */
  start: () => Promise<void>
  /** Refreshes the countdown and starts a new puzzle when the UTC day has changed. Call every second. */
  tick: () => void
  /** Applies an on-screen key or physical key label: `ENTER`, `⌫`, `BACKSPACE` or a letter. */
  handleKey: (key: string) => void
  /** Handles a physical keydown: Enter, Backspace and letters. Ignores Ctrl, Alt and Meta combinations. */
  onPhysicalKey: (event: KeyboardEvent) => void
  /** Developer action: reveals the answer of the current dev puzzle. */
  reveal: () => void
  /** Developer action: starts a new dev puzzle with a random answer. */
  newDevPuzzle: () => void
}

/**
 * Creates a random developer puzzle for the given UTC date.
 * @param date - UTC date of the puzzle.
 * @returns A fresh dev state with no guesses.
 */
function createDevState(date: string): WordleDevState {
  const answer = WORDLE_ANSWERS[Math.floor(Math.random() * WORDLE_ANSWERS.length)] ?? ''
  return { date, guesses: [], result: 'playing', dev: true, answer }
}

/**
 * Builds the Wordle game for one mounted screen. Daily progress is stored through {@link useWordleStore};
 * developer puzzles stay in memory.
 * @returns The {@link WordleApi} the view binds to.
 */
export function useWordle(): WordleApi {
  const store = useWordleStore()
  const devMode = useDevMode()
  const devGame = ref<WordleDevState | null>(null)
  const loaded = ref(false)
  const currentGuess = ref('')
  const errorMessage = ref<string | null>(null)
  const shake = ref(0)
  const now = ref(new Date())

  const game = computed<WordleState>(() => devGame.value ?? store.state.value)
  const rows = computed(() => boardRows(game.value, currentGuess.value))
  const keyStates = computed(() => keyStatesFor(game.value.guesses))
  const isComplete = computed(() => game.value.result !== 'playing')
  const message = computed(() => errorMessage.value ?? statusMessage(game.value))
  const status = computed(() => dailyStatus(game.value))
  const countdown = computed(() => formatCountdown(now.value))

  /** Shows today's puzzle: a fresh dev puzzle in dev mode, otherwise the stored daily game if it is from today. */
  function load(): void {
    const today = utcDateString(new Date())
    currentGuess.value = ''
    errorMessage.value = null
    if (devMode.isDev.value) {
      devGame.value = createDevState(today)
      return
    }
    devGame.value = null
    const saved = store.state.value
    if (saved.date !== today || !Array.isArray(saved.guesses)) {
      store.state.value = { date: today, guesses: [], result: 'playing' }
    }
  }

  /** Scores the typed word and records it, or shows the reason it was rejected. */
  function submit(): void {
    const current = game.value
    if (current.result !== 'playing') return
    if (currentGuess.value.length !== WORD_LENGTH) {
      errorMessage.value = 'Your guess needs five letters.'
      return
    }
    if (!WORDLE_WORD_SET.has(currentGuess.value)) {
      errorMessage.value = 'That word is not in this game’s word list.'
      shake.value += 1
      return
    }
    const result = evaluateGuess(currentGuess.value, answerFor(current))
    current.guesses.push({ word: currentGuess.value, result })
    currentGuess.value = ''
    errorMessage.value = null
    if (result.every((color) => color === 'correct')) current.result = 'won'
    else if (current.guesses.length >= MAX_GUESSES) current.result = 'lost'
  }

  /**
   * Starts the game: waits for stored data and dev mode, then loads today's puzzle.
   * @returns Resolves once the first puzzle is shown.
   */
  async function start(): Promise<void> {
    await Promise.all([store.ready, devMode.ready])
    load()
    loaded.value = true
  }

  /** Updates the clock and reloads when the UTC date has moved on. */
  function tick(): void {
    now.value = new Date()
    if (loaded.value && game.value.date !== utcDateString(now.value)) load()
  }

  function handleKey(key: string): void {
    if (game.value.result !== 'playing') return
    if (key === 'ENTER') submit()
    else if (key === '⌫' || key === 'BACKSPACE') currentGuess.value = currentGuess.value.slice(0, -1)
    else if (/^[a-z]$/i.test(key) && currentGuess.value.length < WORD_LENGTH) {
      currentGuess.value += key.toLowerCase()
    }
  }

  function onPhysicalKey(event: KeyboardEvent): void {
    if (event.ctrlKey || event.altKey || event.metaKey) return
    if (event.key === 'Enter') {
      event.preventDefault()
      handleKey('ENTER')
    } else if (event.key === 'Backspace') {
      event.preventDefault()
      handleKey('BACKSPACE')
    } else if (/^[a-z]$/i.test(event.key)) {
      event.preventDefault()
      handleKey(event.key)
    }
  }

  function reveal(): void {
    const dev = devGame.value
    if (!devMode.isDev.value || !dev || dev.result !== 'playing') return
    dev.result = 'revealed'
    errorMessage.value = null
  }

  function newDevPuzzle(): void {
    if (!devMode.isDev.value) return
    devGame.value = createDevState(utcDateString(new Date()))
    currentGuess.value = ''
    errorMessage.value = null
  }

  return {
    loaded,
    isDev: devMode.isDev,
    rows,
    keyStates,
    isComplete,
    message,
    status,
    countdown,
    shake,
    start,
    tick,
    handleKey,
    onPhysicalKey,
    reveal,
    newDevPuzzle,
  }
}
