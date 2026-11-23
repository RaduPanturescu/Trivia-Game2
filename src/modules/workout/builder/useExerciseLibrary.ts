import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import { useToast } from '@/shared/composables/useToast'
import { isoDate } from '@/shared/dates'
import { formatWorkoutCategoryLabel } from '../core/categories'
import { isWorkoutDayCompleted } from '../core/schedule'
import { useWorkoutStore } from '../core/store'
import type { WorkoutLibraryExercise } from '../core/types'
import { clampExerciseListHeight, filterExercises, listCategoryChips, resolveExerciseListHeight } from './library'
import { getSelectedDay } from './selectedDay'
import type { ExerciseTypeFilter } from './types'
import { defineSingleton } from '@/shared/singleton'

/** A category filter chip: its key and its label. */
export interface CategoryChip {
  /** Category key, or `all`. */
  value: string
  /** Text on the chip. */
  label: string
}

/** Public surface of the exercise library shared by the builder components. */
export interface ExerciseLibraryApi {
  /** Type filter in effect. */
  typeFilter: Ref<ExerciseTypeFilter>
  /** Category filter in effect: a category key, or `all`. */
  category: Ref<string>
  /** Category chips, starting with `All`. */
  categoryChips: ComputedRef<CategoryChip[]>
  /** The category whose chip shows the remove button, or `null`. */
  removableCategory: ComputedRef<string | null>
  /** Built-in exercises that pass the filters. */
  visibleDefaults: ComputedRef<WorkoutLibraryExercise[]>
  /** Custom exercises that pass the filters. */
  visibleCustom: ComputedRef<WorkoutLibraryExercise[]>
  /** `true` when no exercise passes the filters. */
  isEmpty: ComputedRef<boolean>
  /** Exercise list height in pixels, kept within the allowed range. */
  listHeight: ComputedRef<number>
  /** Toggles a type filter: the same type again clears it. */
  toggleTypeFilter(type: 'bodyweight' | 'weighted'): void
  /** Selects a category filter. */
  selectCategory(category: string): void
  /** Removes the selected category when it is empty and custom, after a confirm. */
  removeCategory(category: string): void
  /** Adds a library exercise to the selected day, changing the day to a workout if it was not one. */
  addToSelectedDay(exercise: WorkoutLibraryExercise): void
  /** Removes one exercise from the selected day. */
  removeFromSelectedDay(exerciseId: string): void
  /** Deletes a custom exercise from the library and from every scheduled day. */
  removeCustomExercise(exerciseId: string): void
  /**
   * Saves the list height whenever the element is resized, as the legacy resize handle did.
   * @param element - The exercise list element.
   * @returns A function that stops saving.
   */
  observeListHeight(element: HTMLElement): () => void
}

/**
 * Builds the library controller. Called once by {@link useExerciseLibrary}.
 * @returns The controller.
 */
function createExerciseLibrary(): ExerciseLibraryApi {
  const store = useWorkoutStore()
  const toast = useToast()
  const typeFilter = ref<ExerciseTypeFilter>('all')
  const category = ref('all')

  const categoryChips = computed<CategoryChip[]>(() => {
    const library = [...store.exerciseCatalog.value, ...store.customExercises.value]
    const keys = listCategoryChips(library, store.categories.value, typeFilter.value)
    return [{ value: 'all', label: 'All' }, ...keys.map((key) => ({ value: key, label: formatWorkoutCategoryLabel(key) }))]
  })

  // Legacy reset the category filter to All whenever the active category stopped being offered.
  watch(categoryChips, (chips) => {
    if (category.value !== 'all' && !chips.some((chip) => chip.value === category.value)) category.value = 'all'
  }, { flush: 'sync' })

  const removableCategory = computed(() => {
    const active = category.value
    return active !== 'all' && store.isCategoryRemovable(active) ? active : null
  })

  const visibleDefaults = computed(() => filterExercises(store.exerciseCatalog.value, typeFilter.value, category.value))
  const visibleCustom = computed(() => filterExercises(store.customExercises.value, typeFilter.value, category.value))
  const isEmpty = computed(() => visibleDefaults.value.length === 0 && visibleCustom.value.length === 0)
  const listHeight = computed(() => resolveExerciseListHeight(store.exerciseListHeight.value))

  /**
   * Stores the list height after a resize.
   * @param height - The measured height in pixels.
   */
  function saveListHeight(height: number): void {
    store.exerciseListHeight.value = clampExerciseListHeight(height)
  }

  return {
    typeFilter,
    category,
    categoryChips,
    removableCategory,
    visibleDefaults,
    visibleCustom,
    isEmpty,
    listHeight,

    toggleTypeFilter(type) {
      typeFilter.value = typeFilter.value === type ? 'all' : type
    },

    selectCategory(next) {
      category.value = next
    },

    removeCategory(target) {
      if (!store.isCategoryRemovable(target)) return
      if (!confirm(`Remove the empty ${formatWorkoutCategoryLabel(target)} category?`)) return
      store.removeCategory(target)
      if (category.value === target) category.value = 'all'
    },

    addToSelectedDay(exercise) {
      const day = getSelectedDay(store)
      if (!day) return
      if (day.type !== 'workout') {
        day.type = 'workout'
        day.untrackedWorkout = day.date < isoDate(new Date())
      }
      day.exercises.push({
        ...exercise,
        id: `${exercise.id}-${Date.now()}`,
        completed: false,
        currentSet: 1,
      })
      day.manualCompleted = false
      day.manualMissed = false
      day.completed = isWorkoutDayCompleted(day)
      store.saveDayTemplate(day, store.selectedDayIndex.value)
      toast.show({ title: 'Exercise added', message: `${exercise.name} was added to ${day.dayLabel}.`, icon: { emoji: '💪' } })
    },

    removeFromSelectedDay(exerciseId) {
      const day = getSelectedDay(store)
      if (!day) return
      day.exercises = day.exercises.filter((exercise) => exercise.id !== exerciseId)
      day.completed = isWorkoutDayCompleted(day)
      store.saveDayTemplate(day, store.selectedDayIndex.value)
    },

    removeCustomExercise(exerciseId) {
      store.removeCustomExercise(exerciseId)
    },

    observeListHeight(element) {
      const save = (): void => saveListHeight(element.getBoundingClientRect().height)
      if (window.ResizeObserver) {
        const observer = new ResizeObserver(save)
        observer.observe(element)
        return () => observer.disconnect()
      }
      element.addEventListener('pointerup', save)
      element.addEventListener('touchend', save)
      return () => {
        element.removeEventListener('pointerup', save)
        element.removeEventListener('touchend', save)
      }
    },
  }
}

/**
 * Returns the shared exercise library controller, creating it on first call. Components of the program builder use the
 * same instance so filters, the list and the editor stay in step.
 * @returns The controller.
 */
export const useExerciseLibrary: () => ExerciseLibraryApi = defineSingleton(createExerciseLibrary)
