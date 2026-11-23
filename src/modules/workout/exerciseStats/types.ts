/**
 * Stored shapes of the `triviaExerciseStatsV1` payload. They mirror the JSON the legacy exercise stats screen writes, so
 * existing data keeps loading. Stored data is not trusted: `useExerciseStats` normalises it on read.
 */

/** Kind of a manual performance log: loaded lifts (`weights`) or bodyweight work (`calisthenics`). */
export type ExerciseLogType = 'weights' | 'calisthenics'

/** A manual performance entered on the training log (`logs` array). */
export interface ExerciseLog {
  /** Unique id, `<timestamp>-<random>`. */
  id: string
  /** Epoch milliseconds of when the log was saved. Used to order logs of the same day. */
  created: number
  /** Exercise name as typed. Logs are matched to exercises by a lower-case key. */
  name: string
  /** Weights or calisthenics. */
  type: ExerciseLogType
  /** Local calendar date as `YYYY-MM-DD`. */
  date: string
  /** Number of sets. */
  sets: number
  /** Repetitions per set. */
  reps: number
  /** Load in kilograms. `0` for bodyweight work. */
  weight: number
  /** Free text, trimmed. Empty when none. */
  notes: string
  /** Effort rating. Read by the history but never written by the screen. */
  rpe?: number
  /** Rest in seconds. Read by the history but never written by the screen. */
  rest?: number | string
}

/** A performance derived from a completed workout exercise (`completed` array). Rebuilt from the program on every save. */
export interface CompletedExerciseLog {
  /** `<date>:<exercise id>`. */
  id: string
  /** Exercise name. */
  name: string
  /** Local calendar date as `YYYY-MM-DD`. */
  date: string
  /** Calisthenics for bodyweight exercises, otherwise weights. */
  type: ExerciseLogType
  /** Number of sets. */
  sets: number
  /** Repetitions per set. */
  reps: number
  /** Load in kilograms. */
  weight: number
  /** Epoch milliseconds of noon on the day, so completed entries sort by day. */
  created: number
  /** Always `workout`. */
  source: 'workout'
}

/** One manually recorded 1RM test. */
export interface OneRepMaxTest {
  /** Load in kilograms. */
  weight: number
  /** Local calendar date as `YYYY-MM-DD`. */
  date: string
}

/** A lift tracked for its one-rep max (`maxes` array). */
export interface OneRepMaxTracker {
  /** Unique id, `<timestamp>-<random>`. */
  id: string
  /** Lift name as typed. */
  name: string
  /** Manually recorded tests. Always an array after normalisation. */
  tests: OneRepMaxTest[]
}

/** A logged run (`runs` array). */
export interface CardioRun {
  /** Unique id, `<timestamp>-<random>`. */
  id: string
  /** Epoch milliseconds of when the run was saved. */
  created: number
  /** Local calendar date as `YYYY-MM-DD`. */
  date: string
  /** Distance in kilometres. */
  distance: number
  /** Duration in seconds. */
  duration: number
  /** Run type: `easy`, `long`, `tempo`, `interval` or `race`. Empty is shown as `easy`. */
  type: string
  /** Elevation gain in metres. `0` when none. */
  elevation: number
  /** Average heart rate. `0` when none. */
  heartRate: number
  /** Cadence in steps per minute. `0` when none. */
  cadence: number
  /** Effort rating 1 to 10. `0` when none. */
  rpe: number
  /** Route or notes, trimmed. Empty when none. */
  notes: string
}

/** The whole `triviaExerciseStatsV1` payload. Legacy writes exactly these five fields. */
export interface ExerciseStatsData {
  /** Manual performances. */
  logs: ExerciseLog[]
  /** 1RM trackers. */
  maxes: OneRepMaxTracker[]
  /** Cardio runs. */
  runs: CardioRun[]
  /** Performances derived from completed workout exercises. */
  completed: CompletedExerciseLog[]
  /** Area assignments keyed by exercise name key. Each value is a list of area names. */
  areas: Record<string, string[]>
}
