/**
 * Readable names for every legacy localStorage key. Values must never change: they are the on-disk key names.
 * Each entry notes what it stores (inferred from the legacy code where the name is not obvious).
 */
export const STORAGE_KEYS = {
  /** Countdown target date as a plain date string (days-left widget). */
  daysLeftTargetDate: 'daysLeftTargetDate',
  /** Flag set once the default 2026-11-27 countdown target has been applied. */
  daysLeftDefaultMigration: 'daysLeftDefault20261127Applied',
  /** `'true'` when developer mode is on. */
  devMode: 'devMode',
  /** Click counter for the Maya easter-egg image. */
  mayaClickCount: 'mayaClickCount',
  /** Minesweeper leaderboard entries (JSON array). */
  minesweeperLeaderboard: 'minesweeperLeaderboard',
  /** Minesweeper best times per difficulty (JSON object). */
  minesweeperPersonalBests: 'minesweeperPersonalBests',
  /** Player profile picture as a base64 data URL. */
  playerProfileImage: 'playerProfileImage',
  /** Date string on which the question of the day was last completed. */
  qotdCompletedDate: 'qotdCompletedDate',
  /** Date string for which `qotdRandomIndex` was chosen. */
  qotdDate: 'qotdDate',
  /** Index of the question of the day in the question list. */
  qotdRandomIndex: 'qotdRandomIndex',
  /** Sudoku leaderboard entries (JSON array). */
  sudokuLeaderboard: 'sudokuLeaderboard',
  /** Sudoku best times per difficulty (JSON object). */
  sudokuPersonalBests: 'sudokuPersonalBests',
  /** Sudoku colour theme: `'dark'` or `'light'`. */
  sudokuTheme: 'sudokuTheme',
  /** Unlocked trivia achievements (JSON object keyed by achievement id). */
  triviaAchievements: 'triviaAchievements',
  /** Achievement ids the user deleted (JSON array). */
  triviaDeletedAchievements: 'triviaDeletedAchievements',
  /** Completed trivia difficulties per category (JSON object). */
  triviaDifficulties: 'triviaDifficulties',
  /** Exercise statistics history (JSON). */
  triviaExerciseStatsV1: 'triviaExerciseStatsV1',
  /** Mail letters (JSON array). */
  triviaMailLetters: 'triviaMailLetters',
  /** Background music on/off: `'true'` or `'false'`. */
  triviaMusicPref: 'triviaMusicPref',
  /** Background music volume as a decimal string, e.g. `'0.45'`. */
  triviaMusicVolume: 'triviaMusicVolume',
  /** Total trivia points as a number string. */
  triviaPoints: 'triviaPoints',
  /** Selected trivia season: `'1'` or `'2'`. */
  triviaSeason: 'triviaSeason',
  /** Sound-effects volume as a decimal string. */
  triviaSfxVolume: 'triviaSfxVolume',
  /** Sound effects on/off: `'true'` or `'false'`. */
  triviaSoundPref: 'triviaSoundPref',
  /** Body weight log entries (JSON array). */
  triviaBodyWeightEntries: 'triviaBodyWeightEntries',
  /** Workout BMI calculator inputs `{ height, age }` (JSON). */
  triviaWorkoutBmiInputs: 'triviaWorkoutBmiInputs',
  /** Workout categories (JSON). */
  triviaWorkoutCategories: 'triviaWorkoutCategories',
  /** User-created workout achievement definitions (JSON). */
  triviaWorkoutCustomAchievements: 'triviaWorkoutCustomAchievements',
  /** User-created workout exercises (JSON array). */
  triviaWorkoutCustomExercises: 'triviaWorkoutCustomExercises',
  /** Saved height of the workout exercise list in pixels. */
  triviaWorkoutExerciseListHeight: 'triviaWorkoutExerciseListHeight',
  /** Edits made to built-in workout exercises (JSON object). */
  triviaWorkoutExerciseOverrides: 'triviaWorkoutExerciseOverrides',
  /** Baseline values for workout metrics (JSON object). */
  triviaWorkoutMetricBaseline: 'triviaWorkoutMetricBaseline',
  /** Active workout program (JSON). */
  triviaWorkoutProgram: 'triviaWorkoutProgram',
  /** Workout program start date as a date string. */
  triviaWorkoutProgramStartDate: 'triviaWorkoutProgramStartDate',
  /** Saved workout plans (JSON array). */
  triviaWorkoutSavedPlans: 'triviaWorkoutSavedPlans',
  /** Weekly workout template (JSON). */
  triviaWorkoutWeeklyTemplate: 'triviaWorkoutWeeklyTemplate',
  /** Flag: one-time repair of the weekly template before program start has run. */
  triviaWorkoutPreStartTemplateRepairV1: 'triviaWorkoutPreStartTemplateRepairV1',
  /** Puzzle of the day: completed date string. */
  puzzleDailyCompletedDate: 'puzzleDailyCompletedDate',
  /** Puzzle of the day: generated puzzle sequence (JSON). */
  puzzleDailySequence: 'puzzleDailySequence',
  /** Daily Wordle game state (JSON). */
  biankaDailyWordleState: 'biankaDailyWordleState',
} as const
