import { computed, shallowRef, type ComputedRef, type Ref } from 'vue'
import { parseLocalDate } from './dates'
import { useAchievements } from './achievements'
import { defineRepository, getStorageAdapter, STORAGE_KEYS, stringCodec, type Codec, type Repository } from './persistence'

/** Default countdown target shown until the user sets one. */
export const DEFAULT_DAYS_LEFT_TARGET_DATE = '2026-11-27'

/** Clicks on Maya that unlock the Maya Overload achievement. */
const MAYA_OVERLOAD_CLICKS = 100

/** Integer codec for the Maya click counter: anything unparseable reads as 0 (legacy behaviour). */
const intCodec: Codec<number> = {
  decode(raw) {
    const value = parseInt(raw, 10)
    return Number.isNaN(value) ? 0 : value
  },
  encode: (value) => String(value),
}

/** Number of times Maya has been clicked. Stored under `mayaClickCount`. */
const useMayaClickCount = defineRepository({
  key: STORAGE_KEYS.mayaClickCount,
  codec: intCodec,
  defaults: () => 0,
})

/** Countdown target date as a string. Stored under `daysLeftTargetDate`. */
const useDaysLeftTargetDate = defineRepository({
  key: STORAGE_KEYS.daysLeftTargetDate,
  codec: stringCodec,
  defaults: () => '',
})

/** Public surface of the welcome-screen stats. */
export interface WelcomeStatsApi {
  /** Resolves once the countdown target has loaded (after the default-date migration). */
  ready: Promise<void>
  /** Maya click count. */
  mayaClicks: Ref<number>
  /** Increments the Maya click count, unlocking Maya Overload at 100. @returns The new count. */
  clickMaya(): number
  /** Overwrites the Maya click count. */
  setMayaClicks(count: number): void
  /** Stored countdown target as `YYYY-MM-DD`, or `''` when the default applies. Read-only. */
  targetDate: ComputedRef<string>
  /** Calendar days from today to the target date (default target when unset or invalid). */
  daysLeft: ComputedRef<number>
  /** Sets the countdown target to an ISO `YYYY-MM-DD` date, or `''` to use the default. */
  setTargetDate(isoOrEmpty: string): Promise<void>
}

/**
 * One-time migration: once per install, clear any saved countdown target so the new default applies.
 * Runs before the target repository loads, so the stale value is never read.
 */
async function migrateDefaultTargetDate(): Promise<void> {
  const adapter = getStorageAdapter()
  const flag = STORAGE_KEYS.daysLeftDefaultMigration
  if (!(await adapter.getItem(flag))) {
    await adapter.removeItem(STORAGE_KEYS.daysLeftTargetDate)
    await adapter.setItem(flag, 'true')
  }
}

/** Builds the welcome-screen stats. Called once by {@link useWelcomeStats}. */
function createWelcomeStats(): WelcomeStatsApi {
  const maya = useMayaClickCount()
  const achievements = useAchievements()
  const targetRepo = shallowRef<Repository<string>>()

  const targetLoaded = migrateDefaultTargetDate().then(async () => {
    const repo = useDaysLeftTargetDate()
    targetRepo.value = repo
    await repo.ready
  })

  const ready = Promise.all([maya.ready, targetLoaded]).then(() => undefined)

  const targetDate = computed(() => targetRepo.value?.state.value ?? '')

  const daysLeft = computed(() => {
    const stored = targetDate.value
    let target = parseLocalDate(stored || DEFAULT_DAYS_LEFT_TARGET_DATE)
    if (Number.isNaN(target.getTime())) target = parseLocalDate(DEFAULT_DAYS_LEFT_TARGET_DATE)
    const now = new Date()
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate())
    return Math.round((targetMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24))
  })

  function clickMaya(): number {
    const count = maya.state.value + 1
    maya.state.value = count
    if (count === MAYA_OVERLOAD_CLICKS) achievements.unlock('mayaOverload')
    return count
  }

  function setMayaClicks(count: number): void {
    maya.state.value = Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0
  }

  async function setTargetDate(isoOrEmpty: string): Promise<void> {
    await ready
    if (targetRepo.value) targetRepo.value.state.value = isoOrEmpty
  }

  return { ready, mayaClicks: maya.state, clickMaya, setMayaClicks, targetDate, daysLeft, setTargetDate }
}

let instance: WelcomeStatsApi | undefined

/**
 * Returns the shared welcome-screen stats (Maya clicks and countdown), creating them on first call.
 * @returns The welcome stats API.
 */
export function useWelcomeStats(): WelcomeStatsApi {
  instance ??= createWelcomeStats()
  return instance
}
