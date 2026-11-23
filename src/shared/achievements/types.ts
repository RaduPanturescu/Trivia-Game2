/** One achievement, built-in or user-created. Rendering uses `image`, `imageData` or `emoji`; `icon` is legacy storage only. */
export interface Achievement {
  /** Unique id, used as the key in the stored map. */
  id: string
  /** Title shown when unlocked. */
  name: string
  /** Description shown on the card. */
  desc: string
  /** Whether the achievement is unlocked. */
  unlocked: boolean
  /** Built-in image path, e.g. `/assets/eu_flag.png`. */
  image?: string
  /** User-supplied image as a data URL. */
  imageData?: string
  /** Emoji shown instead of an image. */
  emoji?: string
  /** Stat threshold that unlocks the achievement automatically. */
  trigger?: { stat: string; target: number }
  /** True for achievements created in the workout module. */
  customWorkoutAchievement?: boolean
  /** Legacy HTML icon, written only so older builds can still read the stored data. */
  icon?: string
}

/** The `triviaAchievements` payload: every listed achievement keyed by id. */
export type StoredAchievementMap = Record<string, Achievement>
