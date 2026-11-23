<script setup lang="ts">
/** "Log your weight" dialog. Without developer mode the entry is dated today; developer mode can pick a past date. */
import { ref, watch } from 'vue'
import { AppModal } from '@/shared/components'
import { useToast } from '@/shared/composables/useToast'
import { displayDateError, formatDisplayDate, isoDate, parseDisplayDate } from '@/shared/dates'
import { useDevMode } from '@/shared/devMode'
import { useWorkoutStore } from '../core/store'
import type { BodyWeightEntry } from '../core/types'
import { validateWeightEntry, WEIGHT_RANGE_MESSAGE } from './weightEntry'

const props = defineProps<{ open: boolean }>()

const emit = defineEmits<{ close: []; saved: [entry: BodyWeightEntry] }>()

const store = useWorkoutStore()
const toast = useToast()
const { isDev } = useDevMode()

const weightText = ref('')
const dateText = ref('')
const dateError = ref('')

/**
 * Resets the form for a new entry: today's date, and today's weight when one is logged, else the latest weight.
 */
function prepare(): void {
  const today = isoDate(new Date())
  dateText.value = formatDisplayDate(today)
  dateError.value = ''
  const entries = store.bodyWeightEntries.value
  const entryForToday = entries.find((entry) => entry.date === today)
  const latest = entries.at(-1)
  weightText.value = entryForToday ? String(entryForToday.weight) : latest ? String(latest.weight) : ''
}

watch(
  () => props.open,
  (open) => {
    if (open) prepare()
  },
  { immediate: true },
)

/** Fills the weight with the logged value for the chosen date (developer mode), or clears it when none is logged. */
function onDateChange(): void {
  const selected = parseDisplayDate(dateText.value)
  const existing = store.bodyWeightEntries.value.find((entry) => entry.date === selected)
  weightText.value = existing ? String(existing.weight) : ''
}

/** Validates the form and saves the entry, replacing any entry already logged for the same date. */
function submit(): void {
  const result = validateWeightEntry({
    weightText: weightText.value,
    dateText: dateText.value,
    editableDate: isDev.value,
    today: isoDate(new Date()),
  })
  if (!result.ok) {
    if (result.field === 'weight') alert(WEIGHT_RANGE_MESSAGE)
    else dateError.value = result.message
    return
  }
  store.addBodyWeight(result.entry)
  toast.show({
    title: 'Weight saved',
    message: `${result.entry.weight} kg recorded for today.`,
    icon: { emoji: '⚖️' },
  })
  emit('saved', result.entry)
  emit('close')
}
</script>

<template>
  <AppModal
    :open="open"
    title="Log your weight"
    @close="emit('close')"
  >
    <form
      class="weight-entry-form"
      @submit.prevent="submit"
    >
      <p class="weight-entry-hint">
        {{ isDev ? 'Choose a date to add or update a historical entry.' : 'Your entry will be saved with today’s date.' }}
      </p>
      <label for="workout-weight-input">Weight (kg)</label>
      <input
        id="workout-weight-input"
        v-model="weightText"
        type="number"
        min="1"
        max="500"
        step="0.1"
        inputmode="decimal"
        required
      >
      <div
        v-if="isDev"
        class="weight-entry-date"
      >
        <label for="workout-weight-date">Entry date</label>
        <input
          id="workout-weight-date"
          v-model="dateText"
          type="text"
          inputmode="numeric"
          placeholder="DD/MM/YYYY"
          maxlength="10"
          :aria-invalid="dateError ? 'true' : undefined"
          @change="onDateChange"
          @input="dateError = displayDateError(dateText, { maxDate: isoDate(new Date()) })"
        >
        <p
          v-if="dateError"
          class="weight-entry-error"
          role="alert"
        >
          {{ dateError }}
        </p>
      </div>
      <div class="weight-entry-actions">
        <button
          class="weight-entry-save"
          type="submit"
        >
          Save weight
        </button>
        <button
          class="weight-entry-cancel"
          type="button"
          @click="emit('close')"
        >
          Cancel
        </button>
      </div>
    </form>
  </AppModal>
</template>

<style scoped>
.weight-entry-form {
  display: grid;
  gap: 12px;
}

.weight-entry-form label,
.weight-entry-hint {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.weight-entry-form input {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--glass-border);
  border-radius: 11px;
  outline: none;
  background: rgba(0, 0, 0, 0.25);
  color: var(--text-main);
  font: inherit;
}

.weight-entry-form input:focus {
  border-color: var(--secondary);
  box-shadow: 0 0 0 3px rgba(0, 206, 201, 0.1);
}

.weight-entry-date {
  display: grid;
  gap: 7px;
}

.weight-entry-error {
  color: #e85d75;
  font-size: 0.8rem;
}

.weight-entry-actions {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  margin-top: 4px;
}

.weight-entry-save,
.weight-entry-cancel {
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-main);
}

.weight-entry-save {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  box-shadow: var(--shadow-neon);
}

.weight-entry-cancel {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--glass-border);
}

.weight-entry-cancel:hover {
  background: rgba(255, 255, 255, 0.12);
}
</style>
