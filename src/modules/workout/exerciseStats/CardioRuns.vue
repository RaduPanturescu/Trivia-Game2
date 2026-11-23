<script setup lang="ts">
/**
 * Cardio tracker card: log runs with distance, time and optional metrics, then see the totals, the fastest pace and
 * the run list.
 */
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import { useToast } from '@/shared/composables/useToast'
import { formatDisplayDate } from '@/shared/dates'
import { validateDateField } from './dateField'
import { cardioDurationSeconds, cardioFormatDuration, cardioFormatPace, describeCardioRun, sortCardioRuns, summarizeCardioRuns } from './cardio'
import { createRecordId } from './history'
import { formatStatNumber } from './format'
import { updateExerciseStats, useExerciseStats } from './useExerciseStats'
import type { CardioRun } from './types'

const toast = useToast()
const { state } = useExerciseStats()
const open = ref(false)
const date = ref(formatDisplayDate(new Date()))
const distance = ref('')
const duration = ref('')
const runType = ref('easy')
const elevation = ref('')
const heartRate = ref('')
const cadence = ref('')
const rpe = ref('')
const notes = ref('')
const distanceInput = useTemplateRef<HTMLInputElement>('distanceInput')
const dateInput = useTemplateRef<HTMLInputElement>('dateInput')
const runs = computed(() => sortCardioRuns(state.value.runs))
const summary = computed(() => summarizeCardioRuns(state.value.runs))
const rows = computed(() => runs.value.map((run) => ({ id: run.id, date: formatDisplayDate(run.date), notes: run.notes, ...describeCardioRun(run) })))

/**
 * Validates the typed date and sets the input's validity.
 * @param target - The date input.
 * @returns The ISO date, or `''` when invalid.
 */
function checkDate(target: EventTarget | null): string {
  return validateDateField(target, date.value)
}

/** Clears the form back to its defaults and hides it. */
function resetRun(): void {
  open.value = false
  date.value = formatDisplayDate(new Date())
  distance.value = ''
  duration.value = ''
  runType.value = 'easy'
  elevation.value = ''
  heartRate.value = ''
  cadence.value = ''
  rpe.value = ''
  notes.value = ''
  checkDate(dateInput.value)
}

/** Shows the form and focuses the distance. */
async function openRun(): Promise<void> {
  open.value = true
  await nextTick()
  distanceInput.value?.focus()
}

/**
 * Saves a run. Distance and time must be valid, otherwise the user is told and nothing is saved.
 * @param event - The submit event.
 */
async function submitRun(event: Event): Promise<void> {
  event.preventDefault()
  const isoDay = checkDate(dateInput.value)
  if (!isoDay) return
  const kilometres = Number(distance.value)
  const seconds = cardioDurationSeconds(duration.value)
  if (!kilometres || !seconds) {
    window.alert('Enter a valid distance and run time.')
    return
  }
  const run: CardioRun = {
    id: createRecordId(),
    created: Date.now(),
    date: isoDay,
    distance: kilometres,
    duration: seconds,
    type: runType.value,
    elevation: Number(elevation.value) || 0,
    heartRate: Number(heartRate.value) || 0,
    cadence: Number(cadence.value) || 0,
    rpe: Number(rpe.value) || 0,
    notes: notes.value.trim(),
  }
  const saved = await updateExerciseStats((data) => {
    data.runs.push(run)
  })
  if (!saved) {
    window.alert('Could not save exercise stats. Check your browser storage and try again.')
    return
  }
  resetRun()
  toast.show({ title: 'Run logged', message: `${formatStatNumber(kilometres)} km was added to your cardio log.`, icon: { emoji: '🏃' } })
}

/**
 * Deletes one run after confirmation.
 * @param runId - Id of the run.
 */
async function deleteRun(runId: string): Promise<void> {
  if (!window.confirm('Delete this run?')) return
  const saved = await updateExerciseStats((data) => {
    data.runs = data.runs.filter((run) => run.id !== runId)
  })
  if (!saved) window.alert('Could not save exercise stats. Check your browser storage and try again.')
}
</script>

<template>
  <section class="exercise-stats-card">
    <span class="exercise-stats-kicker">CARDIO TRACKER</span>
    <h4 class="exercise-max-subheading">
      Running
    </h4>
    <div class="exercise-log-start">
      <button
        v-if="!open"
        id="cardio-run-open"
        class="mini-btn exercise-stats-primary"
        type="button"
        @click="openRun"
      >
        ＋ Log a run
      </button>
    </div>
    <form
      id="cardio-run-form"
      class="exercise-stats-form"
      :hidden="!open"
      @submit="submitRun"
    >
      <label>Run date
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
      <label>Distance (km)
        <input
          id="cardio-run-distance"
          ref="distanceInput"
          v-model="distance"
          type="number"
          min="0.01"
          max="1000"
          step="0.01"
          required
        >
      </label>
      <label>Run time (HH:MM:SS)
        <input
          id="cardio-run-duration"
          v-model="duration"
          type="text"
          placeholder="00:45:30"
          maxlength="9"
          required
        >
      </label>
      <label>Run type
        <select
          id="cardio-run-type"
          v-model="runType"
        >
          <option value="easy">Easy</option>
          <option value="long">Long run</option>
          <option value="tempo">Tempo</option>
          <option value="interval">Intervals</option>
          <option value="race">Race</option>
        </select>
      </label>
      <label>Elevation gain (m)
        <input
          id="cardio-run-elevation"
          v-model="elevation"
          type="number"
          min="0"
          max="100000"
          step="1"
        >
      </label>
      <label>Average heart rate
        <input
          id="cardio-run-hr"
          v-model="heartRate"
          type="number"
          min="30"
          max="250"
          step="1"
        >
      </label>
      <label>Cadence (spm)
        <input
          id="cardio-run-cadence"
          v-model="cadence"
          type="number"
          min="1"
          max="300"
          step="1"
        >
      </label>
      <label>Effort / RPE (1–10)
        <input
          id="cardio-run-rpe"
          v-model="rpe"
          type="number"
          min="1"
          max="10"
          step="1"
        >
      </label>
      <label class="exercise-stats-wide">Route / notes (optional)
        <input
          id="cardio-run-notes"
          v-model="notes"
          maxlength="240"
          placeholder="Route, weather, shoe, how it felt…"
        >
      </label>
      <div class="exercise-stats-wide exercise-area-actions">
        <button
          class="mini-btn exercise-stats-primary"
          type="submit"
        >
          ＋ Save run
        </button>
        <button
          id="cardio-run-cancel"
          class="mini-btn"
          type="button"
          @click="resetRun"
        >
          Cancel
        </button>
      </div>
    </form>
    <div
      id="cardio-run-summary"
      class="cardio-run-summary"
    >
      <template v-if="runs.length">
        <div><span>Total distance</span><strong>{{ formatStatNumber(summary.totalKm) }} km</strong></div>
        <div><span>Total run time</span><strong>{{ cardioFormatDuration(summary.totalSeconds) }}</strong></div>
        <div>
          <span>Best pace</span>
          <strong>{{ summary.bestPaceRun ? cardioFormatPace(summary.bestPaceRun.duration, summary.bestPaceRun.distance) : '—' }}</strong>
        </div>
        <div><span>Runs</span><strong>{{ runs.length }}</strong></div>
      </template>
    </div>
    <div
      id="cardio-run-list"
      class="cardio-run-list"
    >
      <p
        v-if="!rows.length"
        class="exercise-stats-empty"
      >
        No runs logged yet.
      </p>
      <template v-else>
        <article
          v-for="row in rows"
          :key="row.id"
          class="cardio-run-row"
        >
          <div>
            <strong>{{ row.title }}</strong>
            <span class="exercise-log-meta">{{ row.meta }}</span>
            <span
              v-if="row.notes"
              class="exercise-log-meta"
            >{{ row.notes }}</span>
          </div>
          <button
            type="button"
            class="exercise-delete"
            :aria-label="`Delete run from ${row.date}`"
            @click="deleteRun(row.id)"
          >
            ×
          </button>
        </article>
      </template>
    </div>
  </section>
</template>
