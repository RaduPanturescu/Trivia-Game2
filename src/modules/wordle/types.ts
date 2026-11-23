/** Score of one letter after a guess: right letter and place, right letter elsewhere, or not in the answer. */
export type TileResult = 'correct' | 'present' | 'absent'

/**
 * Game status. `playing` while guesses remain, `won` or `lost` on a finished puzzle, and `revealed` when a
 * developer reveals the word of a dev puzzle.
 */
export type WordleResult = 'playing' | 'won' | 'lost' | 'revealed'

/** One submitted guess: the five letters in lower case and the score of each letter. */
export interface WordleGuess {
  /** The guessed word, lower case. */
  word: string
  /** Score of each letter, in the same order as `word`. */
  result: TileResult[]
}

/** Today's daily puzzle. This is the shape stored under `biankaDailyWordleState`. */
export interface WordleDailyState {
  /** UTC calendar date of the puzzle as `YYYY-MM-DD`. */
  date: string
  /** Submitted guesses, oldest first. */
  guesses: WordleGuess[]
  /** Game status. */
  result: WordleResult
}

/** Developer puzzle with a random answer. Lives in memory only and is never stored. */
export interface WordleDevState extends WordleDailyState {
  /** Always `true`, marks the state as a developer puzzle. */
  dev: true
  /** The secret word, lower case. */
  answer: string
}

/** Any game state the board can show. */
export type WordleState = WordleDailyState | WordleDevState

/** One cell of the board as the view renders it. */
export interface BoardTile {
  /** Upper-case letter, or `''` for an empty cell. */
  letter: string
  /** Score of the letter once its guess is submitted. */
  result?: TileResult
  /** Whether the cell belongs to a submitted guess (plays the flip animation). */
  revealed: boolean
  /** Whether the cell holds a letter typed into the current row (plays the pop animation). */
  filled: boolean
}

/** Colour of each on-screen key, keyed by upper-case key label. */
export type KeyStates = Partial<Record<string, TileResult>>
