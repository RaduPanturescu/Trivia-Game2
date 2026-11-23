import { computed, ref, type ComputedRef, type Ref } from 'vue'
import { useToast } from '@/shared/composables/useToast'
import { formatWorkoutCategoryLabel } from '../core/categories'
import { WORKOUT_EXERCISE_CATALOG } from '../core/catalog'
import { isWorkoutDayCompleted } from '../core/schedule'
import { useWorkoutStore } from '../core/store'
import type { WorkoutDayExercise, WorkoutExerciseDetails, WorkoutLibraryExercise } from '../core/types'
import {
  createEmptyDraft,
  draftFromExercise,
  draftToExerciseDetails,
  EDITOR_BOUNDS,
  EDITOR_COPY,
  isDraftFieldLocked,
  isDraftValid,
  setDraftOption,
  snapToStep,
  stepDraftNumber,
} from './editor'
import { useExerciseLibrary, type CategoryChip } from './useExerciseLibrary'
import { getSelectedDay } from './selectedDay'
import type { ExerciseDraft, ExerciseDraftNumberField, ExerciseDraftTextField, ExerciseEditorMode } from './types'
import { defineSingleton } from '@/shared/singleton'

/** Public surface of the exercise editor modal's controller. */
export interface ExerciseEditorApi {
  /** Whether the modal is open. */
  isOpen: Ref<boolean>
  /** What the open editor changes. */
  mode: Ref<ExerciseEditorMode>
  /** The form. */
  draft: Ref<ExerciseDraft>
  /** Text typed in "Create a category". */
  newCategory: Ref<string>
  /** Heading, description and save button text for the current mode. */
  copy: ComputedRef<{ title: string; description: string; saveLabel: string }>
  /** Categories offered by the category select. */
  categoryOptions: ComputedRef<CategoryChip[]>
  /** Opens an empty form to create a library exercise. */
  openNew(): void
  /** Opens the form filled from a library exercise. */
  openLibrary(exercise: WorkoutLibraryExercise): void
  /** Opens the form filled from one exercise of the selected day. */
  openDayExercise(exercise: WorkoutDayExercise): void
  /** Closes the modal and clears the form. */
  close(): void
  /** Validates the form and saves it in the current mode. Shows a toast on failure or success. */
  save(): void
  /** Adds the typed category and selects it in the form. */
  addCategory(): void
  /** Copies a text or number input into the form. */
  setField(field: ExerciseDraftTextField | ExerciseDraftNumberField, event: Event): void
  /** Switches "'Till Failure" or "Body Weight" on or off. */
  toggleOption(field: 'reps' | 'weight'): void
  /** Moves a number input one step up or down. */
  stepField(field: ExerciseDraftNumberField, direction: 1 | -1): void
  /** Snaps a timer input to its step when the user commits the value. */
  snapField(field: 'duration' | 'rest'): void
  /** Copies a timer slider into the form. */
  slideField(field: 'duration' | 'rest', event: Event): void
  /** The value a timer slider shows: the timer snapped to its step, as text. */
  sliderValue(field: 'duration' | 'rest'): string
  /** Whether a number input is locked by its option. */
  isLocked(field: ExerciseDraftNumberField): boolean
}

/** Shown when the form is incomplete. */
const REQUIRED_MESSAGE = 'Name, category, sets, reps, timer, and rest are required.'

/**
 * Builds the editor controller. Called once by {@link useExerciseEditor}.
 * @returns The controller.
 */
function createExerciseEditor(): ExerciseEditorApi {
  const store = useWorkoutStore()
  const library = useExerciseLibrary()
  const toast = useToast()
  const isOpen = ref(false)
  const mode = ref<ExerciseEditorMode>('new')
  const draft = ref<ExerciseDraft>(createEmptyDraft())
  const newCategory = ref('')
  /** Id of the exercise being edited, in library or day mode. */
  let editingId: string | null = null

  const copy = computed(() => EDITOR_COPY[mode.value])
  const categoryOptions = computed<CategoryChip[]>(() => store.categories.value.map((key) => ({ value: key, label: formatWorkoutCategoryLabel(key) })))

  /** Empties the form and returns to create mode. */
  function reset(): void {
    draft.value = createEmptyDraft()
    mode.value = 'new'
    editingId = null
  }

  /**
   * Saves a day exercise: the same id, progress kept, the day's completion refreshed.
   * @param details - The validated form.
   */
  function saveDayExercise(details: WorkoutExerciseDetails): void {
    const day = getSelectedDay(store)
    if (!day) return
    if (day.type !== 'workout') day.type = 'workout'
    const existing = day.exercises.find((item) => item.id === editingId)
    if (!existing) {
      toast.show({ title: 'Exercise no longer exists', message: 'Select the exercise again and retry.', icon: { emoji: '⚠️' } })
      return
    }
    Object.assign(existing, {
      ...details,
      id: existing.id,
      completed: existing.completed || false,
      currentSet: existing.currentSet || 1,
    })
    day.completed = isWorkoutDayCompleted(day)
    close()
    toast.show({ title: 'Today’s exercise updated', message: `${details.name} was changed for this day only.`, icon: { emoji: '✅' } })
  }

  /**
   * Saves a library exercise. A custom one is edited in place; a built-in one gets an override, so no custom copy is made.
   * Scheduled copies and weekly templates follow.
   * @param details - The validated form.
   */
  function saveLibraryExercise(details: WorkoutExerciseDetails): void {
    const id = editingId
    if (id === null) return
    const custom = store.customExercises.value
    const customIndex = custom.findIndex((exercise) => exercise.id === id)
    if (customIndex >= 0) {
      const previous = custom[customIndex]
      if (!previous) return
      store.customExercises.value = custom.map((exercise, index) => (index === customIndex ? { ...exercise, ...details, id } : exercise))
      store.updateLibraryExerciseCopies(id, details, previous)
      close()
      toast.show({ title: 'Exercise updated', message: `${details.name} is in your exercise list.`, icon: { emoji: '✅' } })
      return
    }
    const original = WORKOUT_EXERCISE_CATALOG.find((exercise) => exercise.id === id)
    if (!original) {
      toast.show({ title: 'Exercise not found', message: 'This library exercise could not be updated.', icon: { emoji: '⚠️' } })
      return
    }
    store.exerciseOverrides.value = { ...store.exerciseOverrides.value, [original.id]: { ...original, ...details, id: original.id } }
    store.updateLibraryExerciseCopies(original.id, details, original)
    close()
    toast.show({ title: 'Exercise updated', message: `${details.name} was updated without creating a custom copy.`, icon: { emoji: '✅' } })
  }

  /**
   * Adds a new custom exercise to the library.
   * @param details - The validated form.
   */
  function addCustomExercise(details: WorkoutExerciseDetails): void {
    store.customExercises.value = [...store.customExercises.value, { ...details, id: `custom-${Date.now()}` }]
    close()
    toast.show({ title: 'Exercise added', message: `${details.name} is in your exercise list.`, icon: { emoji: '✅' } })
  }

  function openNew(): void {
    reset()
    isOpen.value = true
  }

  function openLibrary(exercise: WorkoutLibraryExercise): void {
    draft.value = draftFromExercise(exercise)
    mode.value = 'library'
    editingId = exercise.id
    isOpen.value = true
  }

  function openDayExercise(exercise: WorkoutDayExercise): void {
    draft.value = draftFromExercise(exercise)
    mode.value = 'day'
    editingId = exercise.id
    isOpen.value = true
  }

  function close(): void {
    isOpen.value = false
    reset()
  }

  return {
    isOpen,
    mode,
    draft,
    newCategory,
    copy,
    categoryOptions,
    openNew,
    openLibrary,
    openDayExercise,
    close,

    save() {
      const form = draft.value
      if (!isDraftValid(form)) {
        toast.show({ title: 'Exercise details required', message: REQUIRED_MESSAGE, icon: { emoji: '⚠️' } })
        return
      }
      const details = draftToExerciseDetails(form)
      if (mode.value === 'day') saveDayExercise(details)
      else if (mode.value === 'library') saveLibraryExercise(details)
      else addCustomExercise(details)
    },

    addCategory() {
      const key = store.addCategory(newCategory.value)
      if (key === null) return
      newCategory.value = ''
      draft.value.category = key
      library.selectCategory('all')
    },

    setField(field, event) {
      draft.value[field] = (event.target as HTMLInputElement | HTMLSelectElement).value
    },

    toggleOption(field) {
      setDraftOption(draft.value, field, field === 'reps' ? !draft.value.repsTillFailure : !draft.value.bodyWeight)
    },

    stepField(field, direction) {
      stepDraftNumber(draft.value, field, direction)
    },

    snapField(field) {
      draft.value[field] = snapToStep(draft.value[field], EDITOR_BOUNDS[field])
    },

    slideField(field, event) {
      draft.value[field] = (event.target as HTMLInputElement).value
    },

    sliderValue(field) {
      return snapToStep(draft.value[field], EDITOR_BOUNDS[field])
    },

    isLocked: (field) => isDraftFieldLocked(draft.value, field),
  }
}

/**
 * Returns the shared exercise editor controller, creating it on first call. The modal is mounted once by the program
 * builder panel; any component can open it through this controller.
 * @returns The controller.
 */
export const useExerciseEditor: () => ExerciseEditorApi = defineSingleton(createExerciseEditor)
