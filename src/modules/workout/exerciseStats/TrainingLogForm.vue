<script setup lang="ts">
/**
 * Training log card: log a performance by exercise name, then its date, sets, reps and load. Choosing a library exercise
 * pre-selects weights or calisthenics, as the legacy form did.
 */
import { nextTick, ref, useTemplateRef } from 'vue'
import { useToast } from '@/shared/composables/useToast'
import { formatDisplayDate } from '@/shared/dates'
import { isBodyweightExercise } from '../core/catalog'
import { exerciseKey } from './areas'
import { createExerciseLog, createRecordId } from './history'
import ExerciseNameField from './ExerciseNameField.vue'
import { validateDateField } from './dateField'
import { useExerciseLibrary } from './useExerciseLibrary'
import { updateExerciseStats } from './useExerciseStats'
import type { ExerciseLogType } from './types'

/** Form steps: closed (button only), typing the name, or filling the details. */
type LogStep = 'closed' | 'name' | 'details'

const toast = useToast()
const { library } = useExerciseLibrary()
const step = ref<LogStep>('closed')
const name = ref('')
const type = ref<ExerciseLogType>('weights')
const date = ref(formatDateToday())
const sets = ref('1')
const reps = ref('')
const weight = ref('0')
const notes = ref('')
const nameField = useTemplateRef<InstanceType<typeof ExerciseNameField>>('nameField')
const dateInput = useTemplateRef<HTMLInputElement>('dateInput')

/**
 * Today as `DD/MM/YYYY`.
 * @returns The formatted date.
 */
function formatDateToday(): string {
  return formatDisplayDate(new Date())
}

/**
 * Validates the typed date and sets the input's validity.
 * @param target - The date input.
 * @returns The ISO date, or `''` when invalid.
 */
function checkDate(target: EventTarget | null): string {
  return validateDateField(target, date.value)
}

/** Clears the form back to its defaults and hides the details. */
function resetLog(): void {
  step.value = 'closed'
  name.value = ''
  type.value = 'weights'
  date.value = formatDateToday()
  sets.value = '1'
  reps.value = ''
  weight.value = '0'
  notes.value = ''
  checkDate(dateInput.value)
}

/** Opens the form and focuses the name. */
async function openLog(): Promise<void> {
  step.value = 'name'
  await nextTick()
  nameField.value?.focus()
}

/**
 * Typing a name returns to the name step, as the legacy form did.
 * @param value - The typed name.
 */
function onNameInput(value: string): void {
  name.value = value
  step.value = 'name'
}

/** Moves to the details step once a name is typed. Pre-selects the type when the name is a library exercise. */
function chooseExercise(): void {
  if (!name.value.trim()) return
  const exercise = library.value.find((item) => exerciseKey(item.name) === exerciseKey(name.value))
  if (exercise) type.value = isBodyweightExercise(exercise) ? 'calisthenics' : 'weights'
  step.value = 'details'
}

/**
 * Enter in the name field moves on to the details instead of submitting the form.
 * @param event - The keydown event.
 */
function onNameEnter(event: KeyboardEvent): void {
  if (step.value === 'details') return
  event.preventDefault()
  chooseExercise()
}

/** Saves the performance, then resets the form and shows a toast. */
async function submitLog(event: Event): Promise<void> {
  event.preventDefault()
  const trimmed = name.value.trim()
  const isoDay = checkDate(dateInput.value)
  if (!trimmed || !isoDay) return
  const log = createExerciseLog({
    name: trimmed,
    type: type.value,
    date: isoDay,
    sets: Number(sets.value),
    reps: Number(reps.value),
    weight: Number(weight.value),
    notes: notes.value.trim(),
  }, createRecordId(), Date.now())
  const saved = await updateExerciseStats((data) => {
    data.logs.push(log)
  })
  if (!saved) {
    window.alert('Could not save exercise stats. Check your browser storage and try again.')
    return
  }
  resetLog()
  toast.show({ title: 'Performance saved', message: `${trimmed} was added to your training log.`, icon: { emoji: '💪' } })
}
</script>

<template>
  <section class="exercise-stats-card">
    <span class="exercise-stats-kicker">TRAINING LOG</span>
    <div class="exercise-log-start">
      <button
        v-if="step === 'closed'"
        class="mini-btn exercise-stats-primary"
        type="button"
        @click="openLog"
      >
        ＋ Log Exercise
      </button>
    </div>
    <form
      id="exercise-log-form"
      class="exercise-stats-form"
      :hidden="step === 'closed'"
      @submit="submitLog"
    >
      <label>Exercise
        <ExerciseNameField
          ref="nameField"
          :model-value="name"
          input-id="exercise-log-name"
          list-id="exercise-log-suggestions"
          placeholder="e.g. Bench Press"
          @update:model-value="onNameInput"
          @change="chooseExercise"
          @enter="onNameEnter"
        />
      </label>
      <div
        id="exercise-log-name-actions"
        class="exercise-log-name-actions"
        :hidden="step === 'details'"
      >
        <button
          id="exercise-log-continue"
          class="mini-btn exercise-stats-primary"
          type="button"
          :disabled="!name.trim()"
          @click="chooseExercise"
        >
          Continue
        </button>
        <button
          id="exercise-log-cancel"
          class="mini-btn"
          type="button"
          @click="resetLog"
        >
          Cancel
        </button>
      </div>
      <fieldset
        id="exercise-log-details"
        class="exercise-log-details exercise-stats-wide"
        :hidden="step !== 'details'"
        :disabled="step !== 'details'"
      >
        <label>Type
          <select
            id="exercise-log-type"
            v-model="type"
          >
            <option value="weights">Weight exercises</option>
            <option value="calisthenics">Calisthenics</option>
          </select>
        </label>
        <label>Date
          <input
            ref="dateInput"
            v-model="date"
            type="text"
            inputmode="numeric"
            placeholder="DD/MM/YYYY"
            maxlength="10"
            required
            @input="checkDate($event.target)"
          >
        </label>
        <label>Sets
          <input
            id="exercise-log-sets"
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
            id="exercise-log-reps"
            v-model="reps"
            type="number"
            min="1"
            max="1000"
            step="1"
            required
          >
        </label>
        <label>Load (kg)
          <input
            id="exercise-log-weight"
            v-model="weight"
            type="number"
            min="0"
            max="2000"
            step="any"
            required
          >
        </label>
        <label class="exercise-stats-wide">Notes / variation (optional)
          <input
            id="exercise-log-notes"
            v-model="notes"
            maxlength="200"
            placeholder="Range of motion, tempo, assistance…"
          >
        </label>
        <div class="exercise-stats-wide exercise-area-actions">
          <button
            class="mini-btn exercise-stats-primary"
            type="submit"
          >
            ＋ Save performance
          </button>
          <button
            id="exercise-log-cancel-details"
            class="mini-btn"
            type="button"
            @click="resetLog"
          >
            Cancel
          </button>
        </div>
      </fieldset>
    </form>
  </section>
</template>
