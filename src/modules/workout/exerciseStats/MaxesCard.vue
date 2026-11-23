<script setup lang="ts">
/**
 * One-rep max card: track a lift, record manual 1RM tests, and show the best tested and estimated loads.
 */
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import { formatDisplayDate } from '@/shared/dates'
import { validateDateField } from './dateField'
import { createRecordId } from './history'
import ExerciseNameField from './ExerciseNameField.vue'
import { buildOneRepMaxViews, recordOneRepMax, removeOneRepMaxTest } from './maxes'
import { useExerciseStats, updateExerciseStats } from './useExerciseStats'

/** Form steps: closed (button only), typing the lift, or filling the test details. */
type MaxStep = 'closed' | 'name' | 'details'

const { state } = useExerciseStats()
const step = ref<MaxStep>('closed')
const name = ref('')
const weight = ref('')
const date = ref(formatDisplayDate(new Date()))
const nameField = useTemplateRef<InstanceType<typeof ExerciseNameField>>('nameField')
const dateInput = useTemplateRef<HTMLInputElement>('dateInput')
const views = computed(() => buildOneRepMaxViews(state.value.maxes, state.value.logs))

/**
 * Validates the typed date and sets the input's validity.
 * @param target - The date input.
 * @returns The ISO date, or `''` when invalid.
 */
function checkDate(target: EventTarget | null): string {
  return validateDateField(target, date.value)
}

/** Clears the form back to its defaults and hides the details. */
function resetMax(): void {
  step.value = 'closed'
  name.value = ''
  weight.value = ''
  date.value = formatDisplayDate(new Date())
  checkDate(dateInput.value)
}

/** Opens the form and focuses the lift name. */
async function openMax(): Promise<void> {
  step.value = 'name'
  await nextTick()
  nameField.value?.focus()
}

/**
 * Typing a lift returns to the name step.
 * @param value - The typed lift name.
 */
function onNameInput(value: string): void {
  name.value = value
  step.value = 'name'
}

/** Moves to the details step once a lift name is typed. */
function chooseLift(): void {
  if (!name.value.trim()) return
  step.value = 'details'
}

/**
 * Enter in the lift field moves on to the details instead of submitting the form.
 * @param event - The keydown event.
 */
function onNameEnter(event: KeyboardEvent): void {
  if (step.value === 'details') return
  event.preventDefault()
  chooseLift()
}

/**
 * Records the test (creating the tracker when the lift is new), then resets the form.
 * @param event - The submit event.
 */
async function submitMax(event: Event): Promise<void> {
  event.preventDefault()
  const trimmed = name.value.trim()
  const isoDay = checkDate(dateInput.value)
  if (!trimmed || !isoDay) return
  const typedWeight = weight.value
  const saved = await updateExerciseStats((data) => {
    recordOneRepMax(data.maxes, { id: createRecordId(), name: trimmed, weight: typedWeight, date: isoDay })
  })
  if (!saved) {
    window.alert('Could not save exercise stats. Check your browser storage and try again.')
    return
  }
  resetMax()
}

/**
 * Removes a tracker and its manual tests. Performance logs stay.
 * @param trackerId - Tracker id.
 */
async function removeTracker(trackerId: string): Promise<void> {
  if (!window.confirm('Remove this 1RM tracker and its manually recorded tests? Performance logs will remain.')) return
  const saved = await updateExerciseStats((data) => {
    data.maxes = data.maxes.filter((item) => item.id !== trackerId)
  })
  if (!saved) window.alert('Could not save exercise stats. Check your browser storage and try again.')
}

/**
 * Removes one manual test from a tracker.
 * @param trackerId - Tracker id.
 * @param index - Position of the test.
 */
async function removeTest(trackerId: string, index: number): Promise<void> {
  if (!window.confirm('Delete this manual 1RM test?')) return
  const saved = await updateExerciseStats((data) => {
    removeOneRepMaxTest(data.maxes, trackerId, index)
  })
  if (!saved) window.alert('Could not save exercise stats. Check your browser storage and try again.')
}

</script>

<template>
  <section class="exercise-stats-card">
    <span class="exercise-stats-kicker">STRENGTH BENCHMARKS</span>
    <h4 class="exercise-max-subheading">
      1 REP MAX
    </h4>
    <div class="exercise-log-start">
      <button
        v-if="step === 'closed'"
        class="mini-btn exercise-stats-primary"
        type="button"
        @click="openMax"
      >
        ＋ Log 1 Rep Max
      </button>
    </div>
    <form
      id="exercise-max-form"
      class="exercise-stats-form"
      :hidden="step === 'closed'"
      @submit="submitMax"
    >
      <label>Lift
        <ExerciseNameField
          ref="nameField"
          :model-value="name"
          input-id="exercise-max-name"
          list-id="exercise-max-suggestions"
          placeholder="e.g. Squat"
          @update:model-value="onNameInput"
          @change="chooseLift"
          @enter="onNameEnter"
        />
      </label>
      <div
        id="exercise-max-name-actions"
        class="exercise-log-name-actions"
        :hidden="step === 'details'"
      >
        <button
          id="exercise-max-continue"
          class="mini-btn exercise-stats-primary"
          type="button"
          :disabled="!name.trim()"
          @click="chooseLift"
        >
          Continue
        </button>
        <button
          id="exercise-max-cancel"
          class="mini-btn"
          type="button"
          @click="resetMax"
        >
          Cancel
        </button>
      </div>
      <fieldset
        id="exercise-max-details"
        class="exercise-log-details exercise-stats-wide"
        :hidden="step !== 'details'"
        :disabled="step !== 'details'"
      >
        <label>1RM kg
          <input
            id="exercise-max-weight"
            v-model="weight"
            type="number"
            min="0.01"
            max="2000"
            step="any"
          >
        </label>
        <label>Test date
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
        <div class="exercise-stats-wide exercise-area-actions">
          <button
            class="mini-btn exercise-stats-primary"
            type="submit"
          >
            ＋ Add / record lift
          </button>
          <button
            id="exercise-max-cancel-details"
            class="mini-btn"
            type="button"
            @click="resetMax"
          >
            Cancel
          </button>
        </div>
      </fieldset>
    </form>
    <div
      id="exercise-max-list"
      class="exercise-max-list"
    >
      <p
        v-if="!views.length"
        class="exercise-stats-empty"
      >
        Add a lift to start tracking its 1RM.
      </p>
      <article
        v-for="item in views"
        :key="item.id"
        class="exercise-max-item"
      >
        <div>
          <h5>{{ item.name }}</h5>
          <p>
            Tested: <strong>{{ item.tested ? `${item.tested.weight} kg` : '—' }}</strong>
            <span v-if="item.tested"> ({{ item.tested.date }})</span>
            · Estimated: <strong>{{ item.estimate ? `${item.estimate.value} kg` : '—' }}</strong>
            <span v-if="item.estimate"> ({{ item.estimate.weight }} kg × {{ item.estimate.reps }})</span>
          </p>
          <details
            v-if="item.manualTests.length"
            class="exercise-max-tests"
          >
            <summary>Manual test history ({{ item.manualTests.length }})</summary>
            <div
              v-for="test in item.manualTests"
              :key="test.index"
              class="exercise-log-row"
            >
              <span>{{ test.date }} · {{ test.weight }} kg</span>
              <button
                type="button"
                class="exercise-delete"
                :aria-label="`Delete ${item.name} test from ${test.date}`"
                @click="removeTest(item.id, test.index)"
              >
                ×
              </button>
            </div>
          </details>
        </div>
        <button
          type="button"
          class="exercise-delete"
          :aria-label="`Remove ${item.name} 1RM tracker`"
          @click="removeTracker(item.id)"
        >
          ×
        </button>
      </article>
    </div>
  </section>
</template>
