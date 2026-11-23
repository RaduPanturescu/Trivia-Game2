<script setup lang="ts">
/**
 * Edits the planned exercises of one day of the shown week, or adds one. Changes go through the store, which also
 * updates the recurring template. Past days, manually marked days and started or completed exercises are locked.
 */
import { computed, ref, watch } from 'vue'
import { useToast } from '@/shared/composables/useToast'
import { formatDisplayDate, isoDate } from '@/shared/dates'
import { isBodyweightExercise } from '../core/catalog'
import { getWorkoutDayIndex, isWorkoutDayCompleted } from '../core/schedule'
import { useWorkoutStore } from '../core/store'
import { useWorkoutTimer } from '../timer/useWorkoutTimer'
import { exerciseKey } from './areas'
import { findCurrentWeek } from './coverage'
import ExerciseNameField from './ExerciseNameField.vue'
import { useExerciseLibrary } from './useExerciseLibrary'

const store = useWorkoutStore()
const toast = useToast()
const timer = useWorkoutTimer()
const { library } = useExerciseLibrary()

const days = computed(() => findCurrentWeek(store.program.value)?.days ?? [])
const pickedDate = ref('')
const selectedDate = computed(() => (days.value.some((day) => day.date === pickedDate.value) ? pickedDate.value : (days.value[0]?.date ?? '')))
const day = computed(() => (selectedDate.value ? store.getDayForDate(selectedDate.value) : null))
const dayChoice = computed({
  get: () => selectedDate.value,
  set: (value: string) => {
    pickedDate.value = value
    existingIndex.value = ''
  },
})

/** Index of the exercise being edited, as text. Empty means "add a new exercise". */
const existingIndex = ref('')
const existing = computed(() => {
  if (!day.value || existingIndex.value === '') return null
  return day.value.exercises[Number(existingIndex.value)] ?? null
})

const name = ref('')
const sets = ref('3')
const reps = ref('10')
const failure = ref(false)
const weight = ref('0')
const kind = ref<'bodyweight' | 'weighted'>('bodyweight')

/** Fills the form from the exercise being edited, or from the defaults for a new one. */
function populate(): void {
  const exercise = existing.value
  name.value = exercise?.name ?? ''
  sets.value = String(exercise?.sets || 3)
  reps.value = String(exercise?.reps || 10)
  failure.value = Boolean(exercise?.repsTillFailure)
  weight.value = String(exercise?.weight ?? 0)
  kind.value = exercise && !isBodyweightExercise(exercise) ? 'weighted' : 'bodyweight'
}

watch([selectedDate, existingIndex], populate, { immediate: true })

/** Whether the selected day or exercise is locked against edits. */
const blocked = computed(() => {
  const current = day.value
  if (!current) return true
  const exercise = existing.value
  const isTimed = exercise !== null && timer.activeDayDate.value === current.date && timer.activeExerciseIndex.value === Number(existingIndex.value)
  return current.date < isoDate(new Date())
    || current.manualCompleted === true
    || current.manualMissed === true
    || exercise?.completed === true
    || Number(exercise?.currentSet || 1) > 1
    || isTimed
})

const message = computed(() => (blocked.value
  ? 'Past days and completed or active exercises cannot be changed here.'
  : 'Changes apply to this day and its recurring plan; logs are not renamed.'))
const saveLabel = computed(() => (existing.value ? 'Save exercise' : '＋ Add to day'))

/**
 * Saves the form: updates the chosen exercise, or adds a new one to the day. Then saves the day as its weekday template.
 * @param event - The submit event.
 */
function submitReview(event: Event): void {
  event.preventDefault()
  const current = day.value
  if (!current || blocked.value) return
  const found = existing.value
  if (existingIndex.value !== '' && !found) return
  const trimmed = name.value.trim()
  if (!trimmed) return
  const libraryMatch = library.value.find((item) => exerciseKey(item.name) === exerciseKey(trimmed))
  const values = {
    name: trimmed,
    sets: Number(sets.value),
    reps: failure.value ? 0 : Number(reps.value),
    repsTillFailure: failure.value,
    weight: Number(weight.value),
    bodyWeight: kind.value === 'bodyweight',
  }
  if (found) {
    Object.assign(found, values)
  } else {
    current.type = 'workout'
    current.exercises.push({
      category: 'other',
      duration: 45,
      rest: 60,
      description: '',
      ...libraryMatch,
      ...values,
      id: `review-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      completed: false,
      currentSet: 1,
    })
  }
  current.manualCompleted = false
  current.manualMissed = false
  current.completed = isWorkoutDayCompleted(current)
  store.saveDayTemplate(current, getWorkoutDayIndex(current.date))
  existingIndex.value = ''
  populate()
  toast.show({ title: found ? 'Exercise updated' : 'Exercise added', message: '', icon: { emoji: '💪' } })
}
</script>

<template>
  <form
    id="exercise-review-form"
    class="exercise-stats-form exercise-review-form"
    @submit="submitReview"
  >
    <div class="exercise-stats-wide">
      <h4>Manage planned exercises</h4>
      <p class="exercise-stats-help">
        Add or edit a day’s exercise. Future changes update its recurring plan.
      </p>
    </div>
    <label>Day
      <select
        id="exercise-review-day"
        v-model="dayChoice"
        required
      >
        <option
          v-for="item in days"
          :key="item.date"
          :value="item.date"
        >{{ item.dayLabel }} · {{ formatDisplayDate(item.date) }}</option>
      </select>
    </label>
    <label>Exercise to edit
      <select
        id="exercise-review-existing"
        v-model="existingIndex"
      >
        <option value="">＋ Add new exercise</option>
        <option
          v-for="(exercise, index) in day?.exercises ?? []"
          :key="`${index}-${exercise.id}`"
          :value="String(index)"
        >{{ exercise.name }}{{ exercise.completed ? ' (completed)' : '' }}</option>
      </select>
    </label>
    <label>Exercise name
      <ExerciseNameField
        :model-value="name"
        input-id="exercise-review-name"
        list-id="exercise-review-suggestions"
        placeholder="e.g. Squat"
        @update:model-value="name = $event"
      />
    </label>
    <label>Sets
      <input
        id="exercise-review-sets"
        v-model="sets"
        type="number"
        min="1"
        max="100"
        step="1"
        required
      >
    </label>
    <label>Reps
      <input
        id="exercise-review-reps"
        v-model="reps"
        type="number"
        min="1"
        max="1000"
        step="1"
        required
        :disabled="failure"
      >
    </label>
    <label class="exercise-review-check">
      <input
        id="exercise-review-failure"
        v-model="failure"
        type="checkbox"
      > Reps until failure
    </label>
    <label>Load (kg)
      <input
        id="exercise-review-weight"
        v-model="weight"
        type="number"
        min="0"
        max="2000"
        step="any"
        required
      >
    </label>
    <label>Type
      <select
        id="exercise-review-type"
        v-model="kind"
      >
        <option value="bodyweight">Bodyweight</option>
        <option value="weighted">Weighted</option>
      </select>
    </label>
    <div class="exercise-stats-wide">
      <p
        id="exercise-review-message"
        class="exercise-stats-help"
        aria-live="polite"
      >
        {{ message }}
      </p>
      <button
        id="exercise-review-save"
        class="mini-btn exercise-stats-primary"
        type="submit"
        :disabled="blocked"
      >
        {{ saveLabel }}
      </button>
    </div>
  </form>
</template>
