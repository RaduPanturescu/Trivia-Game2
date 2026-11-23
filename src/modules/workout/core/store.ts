import { computed, ref, type ComputedRef, type Ref, type WritableComputedRef } from 'vue'
import { useAchievements, WORKOUT_MILESTONE_ACHIEVEMENTS } from '@/shared/achievements'
import { isoDate } from '@/shared/dates'
import { defineRepository, getStorageAdapter, jsonCodec, numberCodec, STORAGE_KEYS, stringCodec } from '@/shared/persistence'
import { useProgress } from '@/shared/progress'
import { addBodyWeightEntry, normalizeBodyWeightEntries } from './bodyWeight'
import { getWorkoutExerciseCatalog } from './catalog'
import { addWorkoutCategory, getWorkoutCategories, isRemovableWorkoutCategory, removeWorkoutCategory } from './categories'
import { removeCustomExercise as withoutCustomExercise, updateLibraryExerciseCopies as pushLibraryEdit } from './exercises'
import { watchCompletedExerciseLogs } from '../exerciseStats/sync'
import { applyWorkoutImport, buildWorkoutExport } from './importExport'
import { moveWorkoutDay, type WorkoutDayMoveResult } from './moveDay'
import { createWorkoutPlanSnapshot, deleteSavedPlan, listSavedPlans, loadWorkoutPlan, renameSavedPlan } from './plans'
import {
  createDefaultWorkoutWeek,
  ensureProgram,
  getMonday,
  getTodayWorkoutDay,
  getWorkoutDayForDate,
  getWorkoutDayIndex,
  getWorkoutMenuDayStatus,
  getWorkoutProgramStartDate,
  getWorkoutWeekForCurrentView,
  isIsoDateString,
  type WorkoutMenuDayStatus,
} from './schedule'
import { createRestWeeklyTemplates, ensureWeeklyTemplates, repairPreStartWorkoutTemplates, saveWorkoutDayTemplate } from './templates'
import { calculateWorkoutStreak, getFirstWorkoutDate as firstWorkoutDateOf, getWorkoutMetricBaseline, getWorkoutStatsSnapshot, snapshotWorkoutMetricBaseline } from './stats'
import type {
  BodyWeightEntry,
  StoredMetricBaseline,
  WorkoutBmiInputs,
  WorkoutDay,
  WorkoutExerciseDetails,
  WorkoutExerciseOverrides,
  WorkoutExportPayload,
  WorkoutLibraryExercise,
  WorkoutMetricBaseline,
  WorkoutProgram,
  WorkoutSavedPlan,
  WorkoutScheduleContext,
  WorkoutStatsSnapshot,
  WorkoutWeek,
  WorkoutWeeklyTemplates,
} from './types'
import { defineSingleton } from '@/shared/singleton'

/** Exercise list height in pixels when none is stored (legacy default). */
const DEFAULT_EXERCISE_LIST_HEIGHT = 380

/** Stored program: `{ currentWeekStart, weeks }`. Malformed values are repaired by {@link ensureProgram}. */
const useProgramRepository = defineRepository({
  key: STORAGE_KEYS.triviaWorkoutProgram,
  codec: jsonCodec<WorkoutProgram>(),
  defaults: () => ({ currentWeekStart: '', weeks: [] }),
})

/** Weekly templates keyed by weekday index. */
const useWeeklyTemplatesRepository = defineRepository({
  key: STORAGE_KEYS.triviaWorkoutWeeklyTemplate,
  codec: jsonCodec<WorkoutWeeklyTemplates>(),
  defaults: () => ({}),
})

/** Stored category keys. Built-ins are added on read by {@link getWorkoutCategories}. */
const useCategoriesRepository = defineRepository({
  key: STORAGE_KEYS.triviaWorkoutCategories,
  codec: jsonCodec<string[]>(),
  defaults: () => [],
})

/** Custom library exercises. */
const useCustomExercisesRepository = defineRepository({
  key: STORAGE_KEYS.triviaWorkoutCustomExercises,
  codec: jsonCodec<WorkoutLibraryExercise[]>(),
  defaults: () => [],
})

/** Edits to built-in catalog entries, keyed by id. */
const useOverridesRepository = defineRepository({
  key: STORAGE_KEYS.triviaWorkoutExerciseOverrides,
  codec: jsonCodec<WorkoutExerciseOverrides>(),
  defaults: () => ({}),
})

/** Named program snapshots. */
const useSavedPlansRepository = defineRepository({
  key: STORAGE_KEYS.triviaWorkoutSavedPlans,
  codec: jsonCodec<WorkoutSavedPlan[]>(),
  defaults: () => [],
})

/** Program start date as a plain `YYYY-MM-DD` string, or `''` when not stored. */
const useProgramStartRepository = defineRepository({
  key: STORAGE_KEYS.triviaWorkoutProgramStartDate,
  codec: stringCodec,
  defaults: () => '',
})

/** Archived totals from before the last reset or program change. */
const useMetricBaselineRepository = defineRepository({
  key: STORAGE_KEYS.triviaWorkoutMetricBaseline,
  codec: jsonCodec<StoredMetricBaseline>(),
  defaults: () => ({}),
})

/** BMI calculator inputs. */
const useBmiInputsRepository = defineRepository({
  key: STORAGE_KEYS.triviaWorkoutBmiInputs,
  codec: jsonCodec<WorkoutBmiInputs>(),
  defaults: () => ({}),
})

/** Height of the exercise list in pixels. */
const useExerciseListHeightRepository = defineRepository({
  key: STORAGE_KEYS.triviaWorkoutExerciseListHeight,
  codec: numberCodec,
  defaults: () => DEFAULT_EXERCISE_LIST_HEIGHT,
})

/** Body weight log. */
const useBodyWeightRepository = defineRepository({
  key: STORAGE_KEYS.triviaBodyWeightEntries,
  codec: jsonCodec<BodyWeightEntry[]>(),
  defaults: () => [],
})

/** Options accepted by {@link WorkoutStore.moveDay}. */
export interface WorkoutMoveOptions {
  /** Date of the workout in progress, which must not move. */
  activeDayDate?: string | null
  /** `true` once the user accepted replacing an existing workout. */
  confirmed?: boolean
  /** The current time. */
  now?: Date
}

/**
 * Public surface of the workout store. Each method that changes data writes through the persistence repositories,
 * so the change is saved. Await {@link WorkoutStore.ready} before reading or changing anything.
 */
export interface WorkoutStore {
  /** Resolves once every workout key has loaded, the program is ensured and the one-time migration has run. */
  ready: Promise<void>
  /** The live program: `currentWeekStart` and `weeks`. */
  program: Ref<WorkoutProgram>
  /** The week the dashboard shows. Setting it persists the program. */
  viewWeekStart: WritableComputedRef<string>
  /** Selected weekday index, Monday = 0. Not persisted. */
  selectedDayIndex: Ref<number>
  /** Weekly templates keyed by weekday index. */
  weeklyTemplates: Ref<WorkoutWeeklyTemplates>
  /** Full category list: built-ins plus custom ones. */
  categories: ComputedRef<string[]>
  /** Built-in library with overrides applied. */
  exerciseCatalog: ComputedRef<WorkoutLibraryExercise[]>
  /** Custom library exercises. */
  customExercises: Ref<WorkoutLibraryExercise[]>
  /** Catalog overrides, keyed by catalog id. */
  exerciseOverrides: Ref<WorkoutExerciseOverrides>
  /** Named program snapshots. */
  savedPlans: ComputedRef<WorkoutSavedPlan[]>
  /** Body weight entries, normalised and sorted oldest first. */
  bodyWeightEntries: ComputedRef<BodyWeightEntry[]>
  /** Archived totals, normalised. Version 2 only; anything else reads as zero. */
  metricBaseline: ComputedRef<WorkoutMetricBaseline>
  /** BMI calculator inputs as stored. */
  bmiInputs: Ref<WorkoutBmiInputs>
  /** Exercise list height in pixels. */
  exerciseListHeight: Ref<number>
  /** Stored program start date, or `''` when none is stored. Use {@link WorkoutStore.getProgramStartDate} for the effective value. */
  storedProgramStartDate: Ref<string>

  /** Today's day. Creates the current week when it is missing. @returns The day, or `null`. */
  getTodayDay(now?: Date): WorkoutDay | null
  /** Status line for the workout menu. */
  getMenuDayStatus(now?: Date): WorkoutMenuDayStatus
  /** Finds a day by date across all weeks. */
  getDayForDate(date: string): WorkoutDay | null
  /** The week the dashboard shows, created when missing. */
  getViewWeek(now?: Date): WorkoutWeek
  /** Effective program start: the stored value, or the inferred earliest scheduled day (stored once inferred). */
  getProgramStartDate(now?: Date): string
  /** Records a day's shape as its weekday template and applies it to future days without progress. */
  saveDayTemplate(day: WorkoutDay, dayIndex: number, now?: Date): void
  /** Saves a template for each weekday of the current week that has none. */
  ensureWeeklyTemplates(now?: Date): void
  /** Moves a workout between two weekdays of the current week. See {@link WorkoutDayMoveResult}. */
  moveDay(fromIndex: number, toIndex: number, options?: WorkoutMoveOptions): WorkoutDayMoveResult
  /** Adds a category. Returns its normalised key, or `null` when the name is blank. */
  addCategory(name: string): string | null
  /** Whether a category is custom and unused. */
  isCategoryRemovable(category: string): boolean
  /** Removes a category when it is removable. @returns `true` when removed. */
  removeCategory(category: string): boolean
  /** Deletes a custom exercise from the library and from every scheduled day. */
  removeCustomExercise(exerciseId: string): void
  /** Pushes an edit of a library exercise into its weekly-template and scheduled copies. */
  updateLibraryExerciseCopies(exerciseId: string, updates: Partial<WorkoutExerciseDetails>, previous: Pick<WorkoutExerciseDetails, 'name' | 'category'>, now?: Date): void
  /** Saves the current program under a name. @returns `false` when the name is blank. */
  saveNamedPlan(name: string, now?: Date): boolean
  /** Replaces the program with a saved plan. @returns `false` when the plan does not exist. */
  switchPlan(planId: string, now?: Date): boolean
  /** Renames a saved plan. @returns `false` when the name is blank. */
  renamePlan(planId: string, name: string): boolean
  /** Deletes a saved plan. */
  deletePlan(planId: string): void
  /** Clears the schedule, drops the baseline, and resets custom achievements and the exercise log. */
  resetStats(now?: Date): void
  /** Starts a new program: archives the current one, sets seven rest days and a new start date. */
  resetProgram(now?: Date): void
  /** Builds the export payload. The caller turns it into a file. */
  buildExport(now?: Date): WorkoutExportPayload
  /** Replaces the schedule with an imported (already validated) export and saves it as a plan named after the file. */
  importProgram(payload: WorkoutExportPayload, fileName: string, now?: Date): void
  /** Logs a body weight. Replaces an entry already logged for the same date. */
  addBodyWeight(entry: BodyWeightEntry): void
  /** Headline stats: baseline plus the live program plus trivia points. */
  getStatsSnapshot(now?: Date): WorkoutStatsSnapshot
  /** Archives completed work into the baseline. Call before the program is replaced. */
  snapshotMetricBaseline(): void
  /** Current streak of completed workout days. */
  getStreak(now?: Date): number
  /** Date of the first completed workout, or `null`. */
  getFirstWorkoutDate(): string | null
  /** Passes the current stats to the achievements store, which unlocks any that reached their trigger. */
  evaluateAchievements(now?: Date): void
}

/**
 * Returns the stored start date when it is a valid date, otherwise `null`. Matches the legacy raw reads.
 * @param value - The stored `triviaWorkoutProgramStartDate` value.
 * @returns The date, or `null`.
 */
function storedStart(value: string): string | null {
  return isIsoDateString(value) ? value : null
}

/**
 * Builds the workout store and starts loading it. Called once by {@link useWorkoutStore}.
 * @returns The store.
 */
function createWorkoutStore(): WorkoutStore {
  const programRepo = useProgramRepository()
  const templatesRepo = useWeeklyTemplatesRepository()
  const categoriesRepo = useCategoriesRepository()
  const customRepo = useCustomExercisesRepository()
  const overridesRepo = useOverridesRepository()
  const plansRepo = useSavedPlansRepository()
  const startRepo = useProgramStartRepository()
  const baselineRepo = useMetricBaselineRepository()
  const bmiRepo = useBmiInputsRepository()
  const heightRepo = useExerciseListHeightRepository()
  const bodyWeightRepo = useBodyWeightRepository()

  const program = programRepo.state
  watchCompletedExerciseLogs(program)
  const templates = templatesRepo.state
  const customExercises = customRepo.state
  const overrides = overridesRepo.state
  const storedStartRef = startRepo.state
  const selectedDayIndex = ref(getWorkoutDayIndex(new Date()))
  const viewWeekStart = computed({
    get: () => program.value.currentWeekStart,
    set: (value: string) => {
      program.value.currentWeekStart = value
    },
  })

  const categories = computed(() => getWorkoutCategories(categoriesRepo.state.value))
  const exerciseCatalog = computed(() => getWorkoutExerciseCatalog(overrides.value))
  const savedPlans = computed(() => listSavedPlans(plansRepo.state.value))
  const bodyWeightEntries = computed(() => normalizeBodyWeightEntries(bodyWeightRepo.state.value))
  const metricBaseline = computed(() => getWorkoutMetricBaseline(baselineRepo.state.value))

  /** Current schedule inputs. Reactive proxies, so mutations through them are tracked and saved. */
  const ctx = (): WorkoutScheduleContext => ({ templates: templates.value, overrides: overrides.value })
  /** Stored start date as a valid date, or `null`. */
  const rawStart = (): string | null => storedStart(storedStartRef.value)
  /** Current library-category usage, used by the removal check. */
  const usage = () => ({
    overrides: overrides.value,
    customExercises: customExercises.value,
    program: program.value,
    savedPlans: savedPlans.value,
    templates: templates.value,
  })

  /** Loads everything, repairs malformed top-level values, ensures the program and runs the one-time migration. */
  const ready = (async () => {
    await Promise.all([
      programRepo.ready,
      templatesRepo.ready,
      categoriesRepo.ready,
      customRepo.ready,
      overridesRepo.ready,
      plansRepo.ready,
      startRepo.ready,
      baselineRepo.ready,
      bmiRepo.ready,
      heightRepo.ready,
      bodyWeightRepo.ready,
    ])
    const now = new Date()
    program.value = ensureProgram(program.value, ctx(), now)
    selectedDayIndex.value = getWorkoutDayIndex(now)
    // A stored JSON `null` loads as null. Replace it so the rest of the store can assume the shape.
    if (templates.value == null) templates.value = {}
    if (categoriesRepo.state.value == null) categoriesRepo.state.value = []
    if (customExercises.value == null) customExercises.value = []
    if (overrides.value == null) overrides.value = {}
    if (plansRepo.state.value == null) plansRepo.state.value = []
    if (baselineRepo.state.value == null) baselineRepo.state.value = {}
    if (bmiRepo.state.value == null) bmiRepo.state.value = {}
    if (bodyWeightRepo.state.value == null) bodyWeightRepo.state.value = []

    const currentWeekStart = isoDate(getMonday(now))
    const week = program.value.weeks.find((item) => item.weekStart === currentWeekStart) ?? getWorkoutWeekForCurrentView(program.value, ctx(), now)
    ensureWeeklyTemplates(templates.value, week)

    // One-time migration, run through the raw adapter with its own flag, exactly once per browser.
    const adapter = getStorageAdapter()
    if (!(await adapter.getItem(STORAGE_KEYS.triviaWorkoutPreStartTemplateRepairV1))) {
      repairPreStartWorkoutTemplates(templates.value, program.value, rawStart(), now)
      await adapter.setItem(STORAGE_KEYS.triviaWorkoutPreStartTemplateRepairV1, '1')
    }
  })()

  /**
   * Current headline stats, reading trivia points from the progress store.
   * @param now - The current time.
   * @returns The snapshot.
   */
  const statsSnapshot = (now: Date): WorkoutStatsSnapshot => getWorkoutStatsSnapshot({
    program: program.value,
    ctx: ctx(),
    programStartDate: getWorkoutProgramStartDate(rawStart(), program.value, now),
    baseline: baselineRepo.state.value,
    points: useProgress().points.value,
  }, now)

  const store: WorkoutStore = {
    ready,
    program,
    viewWeekStart,
    selectedDayIndex,
    weeklyTemplates: templates,
    categories,
    exerciseCatalog,
    customExercises,
    exerciseOverrides: overrides,
    savedPlans,
    bodyWeightEntries,
    metricBaseline,
    bmiInputs: bmiRepo.state,
    exerciseListHeight: heightRepo.state,
    storedProgramStartDate: storedStartRef,

    getTodayDay: (now = new Date()) => getTodayWorkoutDay(program.value, ctx(), now),
    getMenuDayStatus: (now = new Date()) => getWorkoutMenuDayStatus(program.value, ctx(), now),
    getDayForDate: (date) => getWorkoutDayForDate(program.value, date),
    getViewWeek: (now = new Date()) => getWorkoutWeekForCurrentView(program.value, ctx(), now),
    getProgramStartDate(now = new Date()) {
      const date = getWorkoutProgramStartDate(rawStart(), program.value, now)
      if (date !== storedStartRef.value) storedStartRef.value = date
      return date
    },
    saveDayTemplate(day, dayIndex, now = new Date()) {
      saveWorkoutDayTemplate(templates.value, program.value, rawStart(), day, dayIndex, now)
    },
    ensureWeeklyTemplates(now = new Date()) {
      ensureWeeklyTemplates(templates.value, getWorkoutWeekForCurrentView(program.value, ctx(), now))
    },
    moveDay(fromIndex, toIndex, options = {}) {
      const result = moveWorkoutDay(program.value, ctx(), fromIndex, toIndex, {
        programStartDate: rawStart(),
        activeDayDate: options.activeDayDate ?? null,
        confirmed: options.confirmed,
        now: options.now,
      })
      if (result.status === 'moved') selectedDayIndex.value = result.selectedIndex
      return result
    },
    addCategory(name) {
      const result = addWorkoutCategory(categoriesRepo.state.value, name)
      if (!result) return null
      categoriesRepo.state.value = result.categories
      return result.category
    },
    isCategoryRemovable: (category) => isRemovableWorkoutCategory(category, usage()),
    removeCategory(category) {
      if (!isRemovableWorkoutCategory(category, usage())) return false
      categoriesRepo.state.value = removeWorkoutCategory(categoriesRepo.state.value, category)
      return true
    },
    removeCustomExercise(exerciseId) {
      customExercises.value = withoutCustomExercise(customExercises.value, program.value, exerciseId)
    },
    updateLibraryExerciseCopies(exerciseId, updates, previous, now = new Date()) {
      pushLibraryEdit(templates.value, program.value, exerciseId, updates, previous, now)
    },
    saveNamedPlan(name, now = new Date()) {
      const trimmed = name.trim()
      if (!trimmed) return false
      const plan = createWorkoutPlanSnapshot({
        name: trimmed,
        program: program.value,
        templates: templates.value,
        categories: categories.value,
        customExercises: customExercises.value,
      }, now)
      plansRepo.state.value = [...listSavedPlans(plansRepo.state.value), plan]
      return true
    },
    switchPlan(planId, now = new Date()) {
      const plan = listSavedPlans(plansRepo.state.value).find((item) => item.id === planId)
      if (!plan) return false
      const loaded = loadWorkoutPlan(plan, categories.value)
      program.value = loaded.program
      templates.value = loaded.templates
      categoriesRepo.state.value = loaded.categories
      customExercises.value = loaded.customExercises
      selectedDayIndex.value = getWorkoutDayIndex(now)
      return true
    },
    renamePlan(planId, name) {
      const trimmed = name.trim()
      if (!trimmed) return false
      plansRepo.state.value = renameSavedPlan(listSavedPlans(plansRepo.state.value), planId, trimmed)
      return true
    },
    deletePlan(planId) {
      plansRepo.state.value = deleteSavedPlan(listSavedPlans(plansRepo.state.value), planId)
    },
    resetStats(now = new Date()) {
      baselineRepo.state.value = {}
      const achievements = useAchievements()
      for (const achievement of achievements.list.value) {
        if (achievement.customWorkoutAchievement) achievements.saveCustom({ ...achievement, unlocked: false })
      }
      for (const milestone of WORKOUT_MILESTONE_ACHIEVEMENTS) achievements.relock(milestone.id)
      templates.value = createRestWeeklyTemplates()
      storedStartRef.value = isoDate(now)
      program.value = ensureProgram({}, ctx(), now)
      void getStorageAdapter().removeItem(STORAGE_KEYS.triviaExerciseStatsV1)
      selectedDayIndex.value = getWorkoutDayIndex(now)
    },
    resetProgram(now = new Date()) {
      baselineRepo.state.value = snapshotWorkoutMetricBaseline(baselineRepo.state.value, program.value)
      templates.value = createRestWeeklyTemplates()
      storedStartRef.value = isoDate(now)
      const weekStart = getMonday(now)
      program.value = { currentWeekStart: isoDate(weekStart), weeks: [createDefaultWorkoutWeek(weekStart, ctx())] }
      selectedDayIndex.value = getWorkoutDayIndex(now)
    },
    buildExport(now = new Date()) {
      return buildWorkoutExport({
        program: program.value,
        templates: templates.value,
        categories: categories.value,
        customExercises: customExercises.value,
        overrides: overrides.value,
        programStartDate: rawStart() ?? '',
      }, now)
    },
    importProgram(payload, fileName, now = new Date()) {
      const state = applyWorkoutImport(payload, { categories: categories.value, overrides: overrides.value }, now)
      program.value = state.program
      templates.value = state.templates
      categoriesRepo.state.value = state.categories
      customExercises.value = state.customExercises
      overrides.value = state.overrides
      storedStartRef.value = state.programStartDate
      selectedDayIndex.value = getWorkoutDayIndex(now)
      const name = fileName.trim() || 'Imported Workout Plan'
      plansRepo.state.value = [...listSavedPlans(plansRepo.state.value), createWorkoutPlanSnapshot({
        name,
        program: program.value,
        templates: templates.value,
        categories: categories.value,
        customExercises: customExercises.value,
      }, now)]
    },
    addBodyWeight(entry) {
      bodyWeightRepo.state.value = addBodyWeightEntry(bodyWeightRepo.state.value, entry)
    },
    getStatsSnapshot: statsSnapshot,
    snapshotMetricBaseline() {
      baselineRepo.state.value = snapshotWorkoutMetricBaseline(baselineRepo.state.value, program.value)
    },
    getStreak: (now = new Date()) => calculateWorkoutStreak(program.value, templates.value, getWorkoutProgramStartDate(rawStart(), program.value, now), now),
    getFirstWorkoutDate: () => firstWorkoutDateOf(program.value, baselineRepo.state.value),
    evaluateAchievements(now = new Date()) {
      useAchievements().evaluateTriggers(statsSnapshot(now))
    },
  }
  return store
}

/**
 * Returns the shared workout store, creating it on first call. Await `ready` before use.
 * @returns The workout store.
 */
export const useWorkoutStore: () => WorkoutStore = defineSingleton(createWorkoutStore)
