/**
 * State and actions of the dashboard's "Today's Exercises" panel for the selected day: the exercise rows, the
 * rest/workout toggle, start, complete or undo, edit, remove and reorder. Ports `renderWorkoutDayDetail`,
 * `reorderWorkoutExercise` and the handlers of the legacy day list.
 */
import { computed, type ComputedRef } from 'vue'
import { parseLocalDate } from '@/shared/dates'
import { setSelectedDayType } from '../builder/selectedDayType'
import { useExerciseEditor } from '../builder/useExerciseEditor'
import { useExerciseLibrary } from '../builder/useExerciseLibrary'
import { formatWorkoutCategoryLabel } from '../core/categories'
import { isBodyweightExercise } from '../core/catalog'
import { getWorkoutDayIndex } from '../core/schedule'
import * as session from '../core/session'
import { useWorkoutStore } from '../core/store'
import type { WorkoutDay, WorkoutDayExercise } from '../core/types'
import { getExerciseRowControls, type ExerciseRowControls } from '../timer/exerciseRows'
import { useWorkoutTimer } from '../timer/useWorkoutTimer'

/** One exercise row of the panel, with its texts and button state worked out. */
export interface DayDetailRow {
  /** The scheduled exercise. */
  exercise: WorkoutDayExercise
  /** Position in the day, zero-based. */
  index: number
  /** Category label. */
  category: string
  /** Load text: `Body Weight` or the weight in kilograms. */
  load: string
  /** Rep text: `'Till Failure` or the rep count. */
  reps: string
  /** Rest text, e.g. `60s rest`. */
  rest: string
  /** Button labels and flags from the timer. */
  controls: ExerciseRowControls
}

/** Message shown in place of the rows: a heading and an optional hint. */
export interface DayDetailMessage {
  /** Main line. */
  heading: string
  /** Smaller line under it. */
  hint?: string
}

/** Public surface of the day detail panel. */
export interface DayDetailApi {
  /** Heading of the panel, e.g. `Monday Workout`. Empty without a day. */
  title: ComputedRef<string>
  /** `true` when the toggle button sets a workout day (the day is a rest or no-plan day). */
  settingWorkoutDay: ComputedRef<boolean>
  /** `null` when rows show; otherwise the text to show instead (rest, no program, no exercises). */
  message: ComputedRef<DayDetailMessage | null>
  /** Exercise rows of a workout day. Empty otherwise. */
  rows: ComputedRef<DayDetailRow[]>
  /** Turns the day into a rest day or a workout day. */
  toggleType(): void
  /** Starts the phase timer for an exercise. */
  start(index: number): void
  /** Completes an exercise, or after confirmation clears its completion. */
  complete(index: number): void
  /** Stops the phase timer during an exercise. */
  skipPhase(): void
  /** Opens the editor for this day's exercise. */
  edit(index: number): void
  /** Removes an exercise from the day. */
  remove(exerciseId: string): void
  /** Moves an exercise to another position in the day and saves the weekday template. */
  reorder(fromIndex: number, toIndex: number): void
}

/**
 * Builds the panel's controller for the given selected day.
 * @param day - The selected day of the dashboard.
 * @returns The controller.
 */
export function useDayDetail(day: ComputedRef<WorkoutDay | null>): DayDetailApi {
  const store = useWorkoutStore()
  const timer = useWorkoutTimer()
  const editor = useExerciseEditor()
  const library = useExerciseLibrary()

  const title = computed(() => {
    const current = day.value
    if (!current) return ''
    return `${parseLocalDate(current.date).toLocaleDateString(undefined, { weekday: 'long' })} Workout`
  })
  const settingWorkoutDay = computed(() => day.value?.type !== 'workout')

  const message = computed<DayDetailMessage | null>(() => {
    const current = day.value
    if (!current) return null
    if (current.type === null) return { heading: 'No program scheduled for this day.' }
    if (current.type === 'rest') return { heading: 'Rest day, take it chill.' }
    if (current.exercises.length === 0) return { heading: 'No exercises added yet.', hint: 'Use the exercise builder to add drills for this day.' }
    return null
  })

  const rows = computed<DayDetailRow[]>(() => {
    const current = day.value
    if (current?.type !== 'workout') return []
    return current.exercises.map((exercise, index) => ({
      exercise,
      index,
      category: formatWorkoutCategoryLabel(exercise.category),
      load: isBodyweightExercise(exercise) ? 'Body Weight' : `${exercise.weight || 0}kg`,
      reps: exercise.repsTillFailure ? "'Till Failure" : `${exercise.reps} reps`,
      rest: `${exercise.rest || 60}s rest`,
      controls: getExerciseRowControls(exercise, timer.exerciseTimerState(current, index)),
    }))
  })

  return {
    title,
    settingWorkoutDay,
    message,
    rows,

    toggleType() {
      const current = day.value
      if (!current) return
      setSelectedDayType(current.type === 'workout' ? 'rest' : 'workout')
    },

    start(index) {
      const current = day.value
      if (current) timer.startExercise(current, index)
    },

    complete(index) {
      const current = day.value
      const exercise = current?.exercises[index]
      if (!current || !exercise) return
      if (!exercise.completed) {
        timer.completeExercise(current, index)
        return
      }
      if (!confirm(`Undo completion of “${exercise.name}”? Its reps, sets, and weight contribution will be removed from your stats.`)) return
      session.undoExercise(store, current, index)
    },

    skipPhase: timer.skipPhase,

    edit(index) {
      const exercise = day.value?.exercises[index]
      if (exercise) editor.openDayExercise(exercise)
    },

    remove(exerciseId) {
      library.removeFromSelectedDay(exerciseId)
    },

    reorder(fromIndex, toIndex) {
      const current = day.value
      if (!current || !session.reorderExercise(current, fromIndex, toIndex)) return
      timer.followExerciseMove(current.date, fromIndex, toIndex)
      store.saveDayTemplate(current, getWorkoutDayIndex(current.date))
    },
  }
}
